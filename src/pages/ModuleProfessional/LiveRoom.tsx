import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, MessageSquare, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, ArrowLeft,
  Monitor, Hand, UserPlus, UserMinus, UserX, Star, Wifi, WifiOff, Loader2, Radio,
  Crown, Eye, Lock, Volume2, ThumbsUp, Heart, Flame, PartyPopper, RefreshCw,
  Pin, PinOff, Trash2, Clock, ShieldCheck, BarChart2, HelpCircle, Reply, Search,
  Copy, Check, SlidersHorizontal, AlertCircle, AlertTriangle, Download, DollarSign, Flag, Pause, Play, Type,
  Smile, RotateCw, ShieldAlert, ListFilter, UserCheck, FileText, AtSign, EyeOff,
  Gift, Target, Award, ShoppingBag, Swords, CheckCircle2, Film, Layers, Coins, MoreVertical, Sparkles, ExternalLink
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useLiveWebRTC, LiveChatMessage } from '../../hooks/useLiveWebRTC'
import ConfirmModal from '../../components/common/ConfirmModal'
import TicketModal from '../../components/modals/TicketModal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const BANNED_PATTERNS = [
  /\bspam\b/i, /\bphishing\b/i, /\bhack\b/i, /\bsalope\b/i, /\bconnard\b/i,
  /\bmerde\b/i, /\bbitch\b/i, /\bchenpanzou\b/i, /\bidiot\b/i
]

// 30. Filtre AI / Toxicity Shield
const TOXIC_PATTERNS = [
  /\b(te tuer|va mourir|crève|suicide-toi|sale race|sale juif|sale arabe|sale noir|sale blanc)\b/i,
  /\b(fdp|fils de pute|nique ta mère|enculé|connasse|bâtard)\b/i,
  /\b(chenpanzou|konyen manmanw|kokorat)\b/i,
]
function checkToxicity(text: string): boolean {
  return TOXIC_PATTERNS.some(regex => regex.test(text))
}

// 37. Filtre Anti-Obfuscation (Z-algo & Tèks Kache)
function cleanObfuscation(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '') // Zéro-width chars
    .replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]{3,}/g, '') // Zalgo marks
}

// Netwayaj non itilizatè pou evite double @ (eg: @@exileflaendy -> @exileflaendy)
function formatHandle(name?: string): string {
  if (!name) return ''
  const clean = name.trim().replace(/^@+/, '')
  return clean ? `@${clean}` : ''
}

// 18. Limite d'émojis par message (Anti-Emoji Flood)
function countEmojis(text: string): number {
  const matches = text.match(/\p{Extended_Pictographic}/gu)
  return matches ? matches.length : 0
}

// 40. Limit Maksimòm Mansyone (@)
function countMentions(text: string): number {
  const matches = text.match(/@\w+/g)
  return matches ? matches.length : 0
}

// 28. Lis Nwa Mo Entèdi Pèsonalize pa Hôte la
function sanitizeWithCustomWords(text: string, customWords: string[]): string {
  let cleaned = text
  BANNED_PATTERNS.forEach(regex => {
    cleaned = cleaned.replace(regex, '***')
  })
  if (Array.isArray(customWords)) {
    customWords.forEach(word => {
      const cleanWord = word.trim()
      if (cleanWord) {
        try {
          const reg = new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
          cleaned = cleaned.replace(reg, '***')
        } catch {}
      }
    })
  }
  return cleaned
}

// 34. Lis Blanch Sit Web Otorize (Whitelisted Domains)
const WHITELISTED_DOMAINS = [
  'exile.com', 'exile-stage.com', 'youtube.com', 'youtu.be', 'wikipedia.org', 'github.com', 'google.com'
]
function filterLinksWithWhitelist(text: string, isPrivileged: boolean): string {
  if (isPrivileged) return text
  const linkRegex = /(https?:\/\/([^\s/]+)(?:\/[^\s]*)?|www\.([^\s/]+)(?:\/[^\s]*)?)/gi
  return text.replace(linkRegex, (match, url, d1, d2) => {
    const domain = (d1 || d2 || '').toLowerCase()
    const isAllowed = WHITELISTED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed))
    return isAllowed ? match : '[lien masqué]'
  })
}

function sanitizeChatMessage(text: string): string {
  let cleaned = text
  BANNED_PATTERNS.forEach(regex => {
    cleaned = cleaned.replace(regex, '***')
  })
  return cleaned
}

const USER_COLORS = [
  'text-sky-400',
  'text-emerald-400',
  'text-amber-400',
  'text-violet-400',
  'text-rose-400',
  'text-teal-400',
  'text-indigo-400',
  'text-orange-400',
]
function getUserColor(str: string): string {
  if (!str) return 'text-zinc-200'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

function maskSensitiveData(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email masqué]')
    .replace(/(\+?[0-9]{2,4}[\s.-]?)?([0-9]{3,4}[\s.-]?){2,3}[0-9]{2,4}/g, (match) => {
      return match.length >= 8 ? '[numéro masqué]' : match
    })
    .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[carte masquée]')
}

function normalizeCapsLock(text: string): string {
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 8) {
    const uppers = text.replace(/[^A-Z]/g, '').length
    if (uppers / letters.length > 0.7) {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }
  }
  return text
}

function filterUnauthorizedLinks(text: string, isAllowed: boolean): string {
  if (isAllowed) return text
  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  return text.replace(linkRegex, '[lien masqué]')
}

const STANDARD_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋',
  '😎', '🤩', '🥳', '😏', '🤔', '🤫', '🤗', '🤭',
  '🔥', '👏', '🎉', '💯', '🙏', '👍', '❤️', '✨',
  '💪', '🚀', '⭐', '💎', '👑', '🎙️', '🇭🇹', '✌️'
]

const EXILE_STICKERS = [
  { label: 'Ayiti 🇭🇹', text: '🇭🇹 #Ayiti' },
  { label: 'EXILE Pro ⭐', text: '⭐ #EXILEPro' },
  { label: 'Super Fan 🔥', text: '🔥 #SuperFan' },
  { label: 'VIP Crown 👑', text: '👑 #VIP' },
  { label: 'En Direct 🎙️', text: '🎙️ #EnDirect' },
  { label: 'Éclair ⚡', text: '⚡ #Power' },
  { label: 'Diamant 💎', text: '💎 #EXILEDiamond' },
  { label: 'Bravo 👏', text: '👏 #Félicitations' },
]

export default function LiveRoom() {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const roomNameParam = searchParams.get('room')
  const { user } = useAuth()

  const [eventData, setEventData] = useState<any>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [showParticipantsTab, setShowParticipantsTab] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAudioBlocked, setIsAudioBlocked] = useState(false)

  // Paywall & Billets pour Live Payant
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Enregistrement du direct (Host Recording)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<any>(null)

  // Modals de fin de live
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [showEndLiveConfirm, setShowEndLiveConfirm] = useState(false)
  const [showKickedModal, setShowKickedModal] = useState(false)

  // Chat Advanced States (20 fonctionnalités clés)
  const [replyingTo, setReplyingTo] = useState<LiveChatMessage | null>(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [chatTabFilter, setChatTabFilter] = useState<'all' | 'questions'>('all')
  const [showModSettings, setShowModSettings] = useState(false)
  const [showCreatePollModal, setShowCreatePollModal] = useState(false)
  const [pollQuestionInput, setPollQuestionInput] = useState('')
  const [pollOptionInputs, setPollOptionInputs] = useState<string[]>(['', ''])
  const [slowModeCooldown, setSlowModeCooldown] = useState(0)
  const [lastMessageSentTime, setLastMessageSentTime] = useState(0)
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  // Chat Extension States (20 fonctionnalités supplémentaires)
  const [selectedProfileUser, setSelectedProfileUser] = useState<{
    id?: string
    name: string
    username: string
    avatar?: string | null
    role?: string
  } | null>(null)
  const [chatDensity, setChatDensity] = useState<'normal' | 'large'>(() => {
    try {
      return (localStorage.getItem('exile_chat_density') as 'normal' | 'large') || 'normal'
    } catch {
      return 'normal'
    }
  })
  const [isQuestionMode, setIsQuestionMode] = useState(false)
  const [showSuperChatModal, setShowSuperChatModal] = useState(false)
  const [superChatAmount, setSuperChatAmount] = useState(5)
  const [superChatMessage, setSuperChatMessage] = useState('')
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [reportingMessage, setReportingMessage] = useState<{ id: string | number; username: string } | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [warningTarget, setWarningTarget] = useState<{ id: string; username: string } | null>(null)
  const [warningReason, setWarningReason] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiPickerTab, setEmojiPickerTab] = useState<'standard' | 'exile'>('standard')
  const [isShadowModMode, setIsShadowModMode] = useState(false)
  const [newCustomWordInput, setNewCustomWordInput] = useState('')
  const [activeModSettingsTab, setActiveModSettingsTab] = useState<'modes' | 'words' | 'premod' | 'audit' | 'users' | 'tools'>('modes')
  const [showGiftsModal, setShowGiftsModal] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | number | null>(null)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])
  const voiceTimerRef = useRef<any>(null)

  // Host Tool Inputs in ModSettings
  const [goalInputTitle, setGoalInputTitle] = useState('Objectif du direct')
  const [goalInputTarget, setGoalInputTarget] = useState('500')
  const [giveawayInputKeyword, setGiveawayInputKeyword] = useState('!cadeau')
  const [triviaInputQ, setTriviaInputQ] = useState('')
  const [triviaInputA, setTriviaInputA] = useState('')
  const [prodInputTitle, setProdInputTitle] = useState('')
  const [prodInputPrice, setProdInputPrice] = useState('19.99')
  const [prodInputLink, setProdInputLink] = useState('')
  const [duelInputQ, setDuelInputQ] = useState('Qui va remporter le match ?')
  const [duelInputA, setDuelInputA] = useState('Option A')
  const [duelInputB, setDuelInputB] = useState('Option B')
  const lastSentMessageRef = useRef<string>('')

  // 63. Live Predictions
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [predictionInputQ, setPredictionInputQ] = useState('')
  const [predictionInputA, setPredictionInputA] = useState('Oui')
  const [predictionInputB, setPredictionInputB] = useState('Non')
  const [predictionDuration, setPredictionDuration] = useState(120)

  // 64 & 65. Channel Points Rewards Modal
  const [showRewardsModal, setShowRewardsModal] = useState(false)

  // Mobile More Tools Sheet (TikTok / YouTube style)
  const [showMobileMoreTools, setShowMobileMoreTools] = useState(false)
  const [showMobileChatInput, setShowMobileChatInput] = useState(false)
  const mobileChatBottomRef = useRef<HTMLDivElement>(null)
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null)
  const [isMobileUserScrolledUp, setIsMobileUserScrolledUp] = useState(false)
  const [mobileUnreadCount, setMobileUnreadCount] = useState(0)

  // Post-Live Summary Screen (YouTube style)
  const [isPostLiveSummaryOpen, setIsPostLiveSummaryOpen] = useState(false)
  const [streamStartTime] = useState<number>(() => Date.now())
  const [peakViewers, setPeakViewers] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }, [])

  const handleStreamEnded = useCallback(() => {
    setShowRatingModal(true)
  }, [])

  const handleKicked = useCallback(() => {
    setShowKickedModal(true)
  }, [])

  // Fetch Event Details to check ownership
  useEffect(() => {
    if (!eventId) return
    const fetchEvent = async () => {
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`, { headers })
        if (res.ok) {
          const data = await res.json()
          setEventData(data)
        }
      } catch (e) {
        console.warn('Error fetching event data:', e)
      }
    }
    fetchEvent()
  }, [eventId])

  const isOwner = Boolean(
    user?.id && eventData?.owner_id && String(user.id) === String(eventData.owner_id)
  )

  // WebRTC & WebSocket Live Hook
  const {
    isConnected,
    isHost,
    isSpeaker,
    myUserId,
    viewerCount,
    participants,
    chatMessages,
    reactions,
    isHandRaised,
    localStream,
    screenStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    sendChatMessage,
    sendReaction,
    toggleHandRaise,
    promoteToSpeaker,
    demoteSpeaker,
    kickParticipant,
    endLive,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleScreenShare,
    startLocalMedia,
    mediaError,
    accessDenied,
    loadChatHistory,
    pinnedMessage,
    slowModeSeconds,
    membersOnly,
    activePoll,
    userRoles,
    isMutedUntil,
    isBanned,
    myUsername,
    isChatPaused,
    bannedUserIds,
    answeredQuestionIds,
    chatReports,
    warningNotice,
    deleteChatMessage,
    pinChatMessage,
    unpinChatMessage,
    clearChat,
    timeoutUser,
    banUser,
    unbanUser,
    warnUser,
    toggleChatPause,
    markQuestionAnswered,
    sendWhisper,
    reportMessage,
    sendSuperChat,
    clearWarningNotice,
    dismissReport,
    setUserRole,
    setChatMode,
    createPoll,
    votePoll,
    endPoll,
    reconnect,
    followersOnly,
    emotesOnly,
    preModeration,
    accountAgeGate,
    customBannedWords,
    auditLog,
    pendingApprovalMessages,
    purgeUserMessages,
    updateCustomBannedWords,
    addAuditLogEntry,
    approvePendingMessage,
    rejectPendingMessage,
    transferHost,
    questionUpvotes,
    upvotedQuestionIds,
    upvoteQuestion,
    sendVirtualGift,
    crowdfundingGoal,
    updateCrowdfundingGoal,
    topDonors,
    giveawayState,
    startGiveaway,
    drawGiveawayWinner,
    endGiveaway,
    triviaState,
    startTrivia,
    endTrivia,
    pinnedProduct,
    pinProduct,
    unpinProduct,
    activeDuel,
    startDuel,
    voteDuel,
    endDuel,
    subAlert,
    sendGiftSub,
    sendVoiceNote,
    celebrationBurst,
    isTtsEnabled,
    toggleTts,
    isSoundAlertsEnabled,
    toggleSoundAlerts,
    communityTitles,
    setCommunityTitle,
    serverTimeOffset,
    syncServerTime,
    shardId,
    streamDelayMs,
    setStreamDelayMs,
    isChatOverlayMode,
    toggleChatOverlayMode,
    predictionState,
    startPrediction,
    votePrediction,
    resolvePrediction,
    channelPoints,
    redeemReward,
    openPopoutChat,
  } = useLiveWebRTC({
    eventId: eventId || 'default',
    initialIsHost: isOwner,
    onToast: showToast,
    onStreamEnded: handleStreamEnded,
    onKicked: handleKicked,
    onAccessDenied: (reason) => {
      showToast(reason)
    },
  })

  // Sèlman si itilizatè a se vrè mèt evènman an li se vrè hôte k ap difize
  const isReallyHost = Boolean(
    isHost && (
      (eventData?.owner_id && user?.id)
        ? String(user.id) === String(eventData.owner_id)
        : isOwner
    )
  )

  // Senkronize estati Live la nan Backend (marquer is_live = true)
  useEffect(() => {
    if (!isReallyHost || !eventId) return
    const markLiveStarted = async () => {
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      if (!cleanId || isNaN(Number(cleanId))) return
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/start_live/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
      } catch (err) {
        console.warn('Error marking live started:', err)
      }
    }
    markLiveStarted()
  }, [isReallyHost, eventId])

  // Post-Live Duration & Peak Viewers Tracker
  useEffect(() => {
    if (viewerCount > peakViewers) {
      setPeakViewers(viewerCount)
    }
  }, [viewerCount, peakViewers])

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - streamStartTime) / 1000))
  const formatLiveDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`
  }

  // Charger l'historique complet des messages du chat en direct à l'arrivée
  useEffect(() => {
    if (!eventId) return
    const fetchChatHistory = async () => {
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      if (!cleanId || isNaN(Number(cleanId))) return
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/live_messages/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const rawMessages = await res.json()
          if (Array.isArray(rawMessages) && rawMessages.length > 0) {
            const formatted = rawMessages.map((m: any) => ({
              id: m.id,
              user_id: String(m.user_id),
              user: m.user_name || m.username || 'Utilisateur',
              username: m.username || '',
              avatar: m.user_avatar,
              text: m.text,
              isHost: Boolean(m.is_host),
              isSpeaker: Boolean(m.is_speaker),
              time: m.created_at ? new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
            }))
            loadChatHistory(formatted)
          }
        }
      } catch (err) {
        console.warn('Erreur chargement historique du chat:', err)
      }
    }
    fetchChatHistory()
  }, [eventId, loadChatHistory])

  // Persister la densité de texte du chat
  useEffect(() => {
    try {
      localStorage.setItem('exile_chat_density', chatDensity)
    } catch {}
  }, [chatDensity])

  // Bind Video Stream to video element
  useEffect(() => {
    if (!videoRef.current) return

    if (isReallyHost || isSpeaker) {
      const activeStream = isScreenSharing && screenStream ? screenStream : localStream
      if (activeStream) {
        videoRef.current.srcObject = activeStream
        videoRef.current.play().catch(() => {})
      }
    } else {
      if (remoteStream) {
        videoRef.current.srcObject = remoteStream
        videoRef.current.play().catch((err: any) => {
          if (err?.name === 'NotAllowedError') {
            if (videoRef.current) {
              videoRef.current.muted = true
              videoRef.current.play().catch(() => {})
            }
            setIsAudioBlocked(true)
          }
        })
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [isReallyHost, isSpeaker, isScreenSharing, screenStream, localStream, remoteStream])

  const myRole = isReallyHost
    ? 'host'
    : isSpeaker
    ? 'speaker'
    : (myUserId && userRoles[String(myUserId)]) || 'viewer'

  const myModRole = myUserId ? userRoles[String(myUserId)] : undefined
  const isSeniorMod = isReallyHost || myModRole === 'moderator' || myModRole === 'mod_senior'
  const isJuniorMod = myModRole === 'mod_junior'
  const canModerate = isSeniorMod || isJuniorMod

  // Détection du défilement Desktop pour suspendre l'auto-scroll et afficher le badge "Nouveaux messages"
  const handleChatScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setIsUserScrolledUp(!isAtBottom)
    if (isAtBottom) {
      setUnreadCount(0)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadCount(0)
    setIsUserScrolledUp(false)
  }, [])

  // Détection du défilement Mobile (Scroller / Descroller sans forcer l'auto-scroll)
  const handleMobileChatScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 45
    setIsMobileUserScrolledUp(!isAtBottom)
    if (isAtBottom) {
      setMobileUnreadCount(0)
    }
  }, [])

  const scrollToMobileBottom = useCallback(() => {
    mobileChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setMobileUnreadCount(0)
    setIsMobileUserScrolledUp(false)
  }, [])

  useEffect(() => {
    if (!isUserScrolledUp) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setUnreadCount(prev => prev + 1)
    }

    if (!isMobileUserScrolledUp) {
      mobileChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setMobileUnreadCount(prev => prev + 1)
    }
  }, [chatMessages.length, isUserScrolledUp, isMobileUserScrolledUp])

  // Compte à rebours du mode ralenti (Slow Mode)
  useEffect(() => {
    if (slowModeCooldown <= 0) return
    const timer = setInterval(() => {
      setSlowModeCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [slowModeCooldown])

  // Détection de frappe pour autocomplétion des mentions (@pseudo)
  const handleInputChange = (val: string) => {
    setNewMessage(val)
    const words = val.split(/\s+/)
    const lastWord = words[words.length - 1] || ''
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase())
      setShowMentionPicker(true)
    } else {
      setShowMentionPicker(false)
    }
  }

  const handleSelectMention = (pUsername: string) => {
    const cleanUser = pUsername.replace(/^@+/, '')
    const words = newMessage.split(/\s+/)
    words.pop()
    setNewMessage([...words, `@${cleanUser} `].join(' '))
    setShowMentionPicker(false)
  }

  // Copier le texte d'un message
  const handleCopyMessage = useCallback((text: string, id: string | number) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedMessageId(id)
      setTimeout(() => setCopiedMessageId(null), 2000)
    }).catch(() => {})
  }, [])

  // Exportation complète de l'historique du chat en fichier .txt
  const handleExportChat = useCallback(() => {
    const lines = chatMessages.map((m) => {
      const roleStr = m.isHost ? '[Hôte]' : m.isSpeaker ? '[Scène]' : ''
      return `[${m.time}] ${roleStr} ${m.user} (@${m.username || 'inconnu'}): ${m.text}`
    })
    const content = `=== TRANSCRIPTION DU DIRECT EXILE ===\nÉvénement: ${eventData?.titre || eventId}\nDate: ${new Date().toLocaleDateString('fr-FR')}\nTotal messages: ${chatMessages.length}\n\n` + lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat_transcript_${eventId || 'live'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Transcription du chat téléchargée.')
  }, [chatMessages, eventData, eventId, showToast])

  // 85. Enregistrement note vocale (max 5s)
  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Votre navigateur ne supporte pas l'enregistrement audio.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      voiceRecorderRef.current = mr
      voiceChunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          if (base64) {
            sendVoiceNote(base64, voiceRecordingSeconds || 3)
          }
        }
        reader.readAsDataURL(blob)
      }
      mr.start()
      setIsRecordingVoice(true)
      setVoiceRecordingSeconds(0)
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordingSeconds(sec => {
          if (sec >= 5) {
            stopVoiceRecording()
            return 5
          }
          return sec + 1
        })
      }, 1000)
    } catch {
      showToast("Impossible d'accéder au microphone.")
    }
  }

  const stopVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current)
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
      voiceRecorderRef.current.stop()
    }
    setIsRecordingVoice(false)
  }

  // 78. Annonces automatiques périodiques de l'hôte (toutes les 12 min)
  useEffect(() => {
    if (!isReallyHost) return
    const timer = setInterval(() => {
      sendChatMessage({
        text: "📢 Rappel officiel : N'hésitez pas à liker, commenter et vous abonner au direct !",
        role: 'host',
      })
    }, 12 * 60 * 1000)
    return () => clearInterval(timer)
  }, [isReallyHost, sendChatMessage])

  // Envoi d'un message avec contrôle anti-flood, filtre de mot et slow mode
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed) return

    // Contrôle longueur maximale 200 caractères (Estanda YouTube Live)
    if (trimmed.length > 200) {
      showToast("Le message ne peut pas dépasser 200 caractères.")
      return
    }

    // 0. Contrôle si le chat a été suspendu par l'hôte
    if (isChatPaused && !canModerate) {
      showToast("Le chat est temporairement suspendu par l'hôte.")
      return
    }

    // 1. Contrôle anti-flood (minimum 1.5s entre chaque message)
    const now = Date.now()
    if (now - lastMessageSentTime < 1500) {
      showToast("Veuillez patienter un instant entre deux messages.")
      return
    }

    // 2. Contrôle anti-répétition (message identique répété sous 15s)
    if (trimmed.toLowerCase() === lastSentMessageRef.current.toLowerCase() && now - lastMessageSentTime < 15000) {
      showToast("Message identique envoyé récemment. Évitez les répétitions.")
      return
    }

    // 3. Contrôle du mode ralenti
    if (slowModeCooldown > 0 && !canModerate) {
      showToast(`Mode ralenti actif : veuillez attendre encore ${slowModeCooldown}s.`)
      return
    }

    // 4. Contrôle chat réservé aux membres
    if (membersOnly && !canModerate && !user?.isPro) {
      showToast("Le chat est temporairement réservé aux membres de la communauté.")
      return
    }

    // 4b. Contrôle chat réservé aux followers (Item 14)
    if (followersOnly && !canModerate && !(user as any)?.isFollowing) {
      showToast("Le chat est réservé aux followers de la chaîne.")
      return
    }

    // 4c. Contrôle protection anti-trolls comptes récents < 24h (Item 42)
    if (accountAgeGate && !canModerate && (user as any)?.createdAt && (Date.now() - new Date((user as any).createdAt).getTime() < 86400000)) {
      showToast("Protection anti-trolls : votre compte doit avoir au moins 24h.")
      return
    }

    // 5. Commande directe de chuchotement (/w @pseudo message)
    if (trimmed.startsWith('/w ') || trimmed.startsWith('/whisper ')) {
      const parts = trimmed.split(' ')
      if (parts.length >= 3) {
        const target = parts[1].replace(/^@+/, '')
        const whisperContent = parts.slice(2).join(' ')
        sendWhisper(target, maskSensitiveData(whisperContent))
        setNewMessage('')
        lastSentMessageRef.current = trimmed
        setLastMessageSentTime(now)
        showToast(`Chuchotement envoyé à @${target}`)
        return
      }
    }

    // 5b. Commandes Bot personnalisées (Item 77)
    if (trimmed.toLowerCase() === '!regles' || trimmed.toLowerCase() === '!rules') {
      sendChatMessage({
        text: "📜 Règles : Courtoisie exigée, aucun propos haineux, aucun lien non autorisé ni spam.",
        role: 'system',
      })
      setNewMessage('')
      return
    }
    if (trimmed.toLowerCase() === '!liens' || trimmed.toLowerCase() === '!links') {
      sendChatMessage({
        text: "🔗 Liens officiels : Retrouvez tous nos contenus sur https://exile.com",
        role: 'system',
      })
      setNewMessage('')
      return
    }
    if (trimmed.toLowerCase() === '!boutique' || trimmed.toLowerCase() === '!shop') {
      sendChatMessage({
        text: pinnedProduct ? `🛍️ Produit vedette : ${pinnedProduct.title} ($${pinnedProduct.price}) !` : "🛍️ Boutique officielle du direct disponible sur https://exile.com/shop",
        role: 'system',
      })
      setNewMessage('')
      return
    }

    // 5c. Participation au tirage au sort (Item 75)
    if (giveawayState.active && trimmed.toLowerCase() === giveawayState.keyword.toLowerCase()) {
      if (!giveawayState.participants.includes(user?.username || myUsername || 'Anonyme')) {
        giveawayState.participants.push(user?.username || myUsername || 'Anonyme')
        showToast("Votre participation au tirage au sort est enregistrée ! 🎟️")
      }
    }

    // 5d. Réponse au quiz en direct (Item 76)
    if (triviaState.active && triviaState.answer && trimmed.toLowerCase() === triviaState.answer.toLowerCase()) {
      sendChatMessage({
        text: trimmed,
        role: myRole,
      })
      triviaState.active = false
      setTriviaState(prev => ({ ...prev, active: false, winner: user?.username || myUsername || 'Un participant' }))
      sendChatMessage({
        text: `🧠 BRAVO à @${user?.username || myUsername || 'inconnu'} qui a trouvé la bonne réponse au quiz ! 👏`,
        role: 'system',
      })
      setNewMessage('')
      return
    }

    // 6. Commande directe d'avertissement (/warn @pseudo raison)
    if ((trimmed.startsWith('/warn ') || trimmed.startsWith('/avertir ')) && canModerate) {
      const parts = trimmed.split(' ')
      if (parts.length >= 3) {
        const target = parts[1].replace(/^@+/, '')
        const reason = parts.slice(2).join(' ')
        const p = participants.find(part => (part.username || part.name).toLowerCase() === target.toLowerCase())
        warnUser(p?.id || target, target, reason)
        setNewMessage('')
        lastSentMessageRef.current = trimmed
        setLastMessageSentTime(now)
        showToast(`Avertissement envoyé à @${target}`)
        return
      }
    }

    // 7. Nettoyage anti-obfuscation / Zalgo (Item 37)
    const deobfuscated = cleanObfuscation(trimmed)

    // 8. Bouclier anti-toxicité & harcèlement (Item 30)
    if (checkToxicity(deobfuscated) && !canModerate) {
      showToast("⚠️ Message bloqué par le bouclier anti-toxicité.")
      return
    }

    // 9. Contrôle anti-flood émojis (Item 18 : max 6 émojis)
    if (countEmojis(deobfuscated) > 6 && !canModerate) {
      showToast("Trop d'émojis dans un seul message (maximum 6 autorisés).")
      return
    }

    // 10. Contrôle limite de mentions (Item 40 : max 3 mentions @)
    if (countMentions(deobfuscated) > 3 && !canModerate) {
      showToast("Maximum 3 mentions (@) par message autorisées.")
      return
    }

    // 11. Contrôle mode émojis uniquement (Item 15)
    if (emotesOnly && !canModerate && /[a-zA-ZÀ-ÿ0-9]/.test(deobfuscated.replace(/#\w+/g, ''))) {
      showToast("Mode Émojis uniquement : seuls les émojis et stickers sont autorisés.")
      return
    }

    // 12. Normalisation anti-cris (Anti-Caps Lock)
    const normalizedCaps = normalizeCapsLock(deobfuscated)

    // 13. Masquage automatique des données sensibles (RegEx Privacy Shield)
    const masked = maskSensitiveData(normalizedCaps)

    // 14. Filtrage des liens avec liste blanche de domaines (Item 34)
    const isLinkAllowed = Boolean(canModerate || (myUserId && userRoles[String(myUserId)] === 'vip'))
    const linkFiltered = filterLinksWithWhitelist(masked, isLinkAllowed)

    // 15. Assainissement du texte (Mots interdits système + personnalisés de l'hôte, Item 28)
    const sanitized = sanitizeWithCustomWords(linkFiltered, customBannedWords)

    // 16. Nom d'affichage avec support Shadow Mode anonyme (Item 43)
    const rawName = user?.fullName || (user?.username ? user.username.replace(/^@+/, '') : 'Moi')
    const displayName = (isShadowModMode && canModerate) ? 'Modérateur' : rawName

    // 17. Mode Pré-modération (Item 29)
    if (preModeration && !canModerate) {
      showToast("Votre message est en attente d'approbation par les modérateurs.")
    }

    sendChatMessage(
      sanitized,
      displayName,
      isShadowModMode && canModerate ? undefined : user?.avatar,
      replyingTo ? { id: replyingTo.id, user: replyingTo.user, text: replyingTo.text } : undefined,
      isQuestionMode
    )

    lastSentMessageRef.current = trimmed
    setNewMessage('')
    setReplyingTo(null)
    setIsQuestionMode(false)
    setShowMentionPicker(false)
    setLastMessageSentTime(now)

    // Déclencher le cooldown du slow mode si activé
    if (slowModeSeconds > 0 && !canModerate) {
      setSlowModeCooldown(slowModeSeconds)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = useCallback(() => {
    const activeStream = isScreenSharing && screenStream ? screenStream : localStream
    if (!activeStream || activeStream.getTracks().length === 0) {
      showToast('Flux vidéo introuvable pour enregistrer')
      return
    }

    try {
      recordedChunksRef.current = []
      let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options = { mimeType: 'video/webm' }
      }

      const recorder = new MediaRecorder(activeStream, options)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current)
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        if (blob.size > 0) {
          showToast("Sauvegarde de l'enregistrement en cours...")
          
          // Téléchargement local automatique pour l'hôte
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `live-recording-${eventId || Date.now()}.webm`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 200)

          // Upload automatique vers l'API backend pour la rediffusion
          const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
          const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
          if (token && cleanId && !isNaN(Number(cleanId))) {
            const formData = new FormData()
            formData.append('recording', blob, `live-${cleanId}.webm`)
            try {
              const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/upload_recording/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              })
              if (res.ok) {
                showToast("Rediffusion enregistrée et disponible sur la plateforme !")
              }
            } catch (err) {
              console.warn('Erreur téléversement enregistrement:', err)
            }
          }
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
      showToast('Enregistrement du direct commencé')
    } catch (e) {
      console.error('Erreur lancement enregistrement:', e)
      showToast("Impossible d'enregistrer sur ce navigateur")
    }
  }, [eventId, isScreenSharing, localStream, screenStream, showToast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    clearInterval(recordingTimerRef.current)
  }, [])

  const handleLeaveLive = () => {
    if (isRecording) {
      stopRecording()
    }
    if (isReallyHost) {
      setShowEndLiveConfirm(true)
    } else {
      setShowRatingModal(true)
    }
  }

  const executeEndLive = async () => {
    setShowEndLiveConfirm(false)
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      showToast("Arrêt de l'enregistrement et téléversement en cours...")
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
      await new Promise(r => setTimeout(r, 900))
    }
    endLive()
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/end_live/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch {}
    setShowRatingModal(true)
  }

  const handleRatingSubmit = async () => {
    setIsSubmittingRating(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      if (token) {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/rate/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ score: rating, feedback }),
        })
      }
      showToast('Merci pour votre avis !')
    } catch {
      showToast('Avis enregistré')
    } finally {
      setIsSubmittingRating(false)
      setShowRatingModal(false)
      navigate('/pro/events')
    }
  }

  const isPaidLive = Boolean(
    (eventData?.tickets && eventData.tickets.some((t: any) => Number(t.price) > 0)) ||
    (eventData?.price && Number(eventData.price) > 0)
  )
  const isRegistered = Boolean(eventData?.is_registered)
  const requiresPaywall = accessDenied.isDenied || (!isOwner && isPaidLive && !isRegistered && eventData !== null)
  const ticketPrice = eventData?.tickets?.find((t: any) => Number(t.price) > 0)?.price || eventData?.price || 10

  const rawRoomTitle = eventData?.title || eventData?.name || roomNameParam || `Direct #${eventId}`
  const roomTitle = rawRoomTitle.replace(/@@+/g, '@')
  const isPopoutMode = searchParams.get('popout') === 'chat'

  return (
    <div className={`fixed inset-0 z-50 ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-900'} flex flex-col lg:flex-row font-sans select-none`}>
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white border border-zinc-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* 69. CELEBRATION BURST OVERLAY (SUPER DON EN DIRECT) */}
      {celebrationBurst && (
        <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center animate-in zoom-in-75 fade-in duration-300">
          <div className="bg-zinc-950/95 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-sm mx-4 space-y-2 backdrop-blur-xl animate-bounce">
            <div className="text-4xl sm:text-5xl">🎉 💎 🚀</div>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Super Don en Direct !</p>
            <h3 className="text-lg sm:text-xl font-black text-white">{formatHandle(celebrationBurst.username)}</h3>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">${celebrationBurst.amount} USD</p>
            {celebrationBurst.giftName && (
              <p className="text-xs text-zinc-300 font-medium">Cadeau : {celebrationBurst.giftName}</p>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIDEO STAGE */}
      {!isPopoutMode && (
        <div className="flex-1 flex flex-col relative min-h-0">
        {/* TOP BAR / EN-TÊTE IMMERSIF (TikTok & YouTube Style) */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-2.5 sm:p-4 flex items-center justify-between pointer-events-auto">
          {/* GAUCHE : Compact Pill Avatar + Nom + Badge En direct */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              onClick={handleLeaveLive}
              className="p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors shrink-0"
              title="Quitter le live"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Pill Créateur / Événement (TikTok/YouTube Live Style) */}
            <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md border border-white/15 rounded-full pl-1.5 pr-3 py-1 text-white shadow-lg min-w-0 max-w-[210px] sm:max-w-xs">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-200 shrink-0 overflow-hidden border border-white/20">
                {eventData?.owner_avatar ? (
                  <img src={eventData.owner_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{roomTitle.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 pr-0.5">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] sm:text-xs font-bold truncate leading-tight text-white">
                    {roomTitle}
                  </p>
                  {isReallyHost && (
                    <Crown size={11} className="text-amber-400 shrink-0" title="Hôte du direct" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-300">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-red-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Reconnexion...
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-zinc-300 font-mono">
                    <Users size={9} />
                    {viewerCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DROITE : Actions discrètes */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 94. Popout Chat button */}
            <button
              type="button"
              onClick={openPopoutChat}
              className="hidden lg:flex p-2 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md rounded-full text-zinc-200 hover:text-white transition-colors"
              title="Ouvrir le chat dans une fenêtre séparée"
            >
              <Film size={15} />
            </button>

            {/* Chat button desktop */}
            <button
              onClick={() => {
                setIsChatOpen(!isChatOpen)
                if (!isChatOpen) setShowParticipantsTab(false)
              }}
              className={`hidden md:flex px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-colors ${
                isChatOpen && !showParticipantsTab ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageSquare size={14} />
              <span>{t('pro.live.liveChat', 'Chat Live')}</span>
            </button>

            {/* Participants */}
            <button
              onClick={() => {
                setShowParticipantsTab(!showParticipantsTab)
                if (!showParticipantsTab) setIsChatOpen(false)
              }}
              className={`p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md rounded-full text-white transition-colors relative`}
              title="Participants"
            >
              <Users size={15} />
              {participants.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold px-1 rounded-full">
                  {participants.length}
                </span>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md rounded-full text-white transition-colors"
              title="Plein écran"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Video Canvas / Player */}
        <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
          {(isReallyHost || isSpeaker) && !localStream && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl backdrop-blur-md m-4 shadow-2xl animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
                <VideoOff size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Caméra & Micro à autoriser
                </h2>
                <p className="text-xs text-zinc-400">
                  Votre navigateur a besoin de votre autorisation pour diffuser votre vidéo.
                </p>
              </div>

              <div className="w-full bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 text-left text-[11px] text-zinc-300 space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-400" /> Comment autoriser l'accès :
                </p>
                <p>1. Cliquez sur l'icône de cadenas dans la barre d'adresse de votre navigateur.</p>
                <p>2. Réglez <strong>Caméra</strong> et <strong>Microphone</strong> sur <strong>Autoriser</strong>.</p>
                <p>3. Cliquez sur le bouton « Réessayer » ci-dessous.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 w-full">
                <button
                  onClick={() => startLocalMedia()}
                  className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Video size={14} />
                  <span>Réessayer la caméra</span>
                </button>

                <button
                  onClick={toggleScreenShare}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Monitor size={14} />
                  <span>Partager mon écran</span>
                </button>
              </div>
            </div>
          ) : (isReallyHost || isSpeaker) && isVideoOff && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                <VideoOff size={36} className="text-zinc-500" />
              </div>
              <p className="text-sm font-semibold">{t('pro.live.cameraOff', 'Votre caméra est désactivée')}</p>
              <p className="text-xs text-zinc-500">
                {isMuted ? 'Votre microphone est également coupé' : 'Votre microphone est actif (les spectateurs vous entendent)'}
              </p>
            </div>
          ) : !isReallyHost && !isSpeaker && !remoteStream ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-2xl">
                  <Radio size={40} className="animate-pulse" />
                </div>
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 animate-ping" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t('pro.live.connectingTitle', 'Direct en cours de connexion')}</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('pro.live.connectingDesc', "Le flux vidéo WebRTC de l'organisateur se synchronise automatiquement. Vous pouvez déjà interagir dans le chat live et envoyer des réactions !")}
              </p>
            </div>
          ) : (
            <>
              {isScreenSharing && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-2xl bg-blue-950/90 border border-blue-500/50 text-white text-xs font-medium backdrop-blur-md shadow-2xl flex items-center gap-2 max-w-[92%] sm:max-w-md animate-in fade-in">
                  <Monitor size={15} className="text-blue-400 shrink-0 animate-pulse" />
                  <span className="flex-1 text-[11px] leading-snug">
                    Partage d'écran actif. Pour éviter l'effet miroir infini, basculez sur l'onglet ou l'application à présenter.
                  </span>
                  {isReallyHost && (
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold shrink-0 transition-colors"
                    >
                      Arrêter
                    </button>
                  )}
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isReallyHost || isSpeaker}
                className={`w-full h-full ${isScreenSharing ? 'object-contain bg-black' : 'object-cover'}`}
              />
            </>
          )}

          {isAudioBlocked && !isReallyHost && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = false
                  videoRef.current.play().catch(() => {})
                }
                setIsAudioBlocked(false)
              }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer active:scale-95 transition-all"
            >
              <Volume2 size={16} />
              <span>Cliquez ici pour activer le son en direct</span>
            </button>
          )}

          {isHandRaised && (
            <div className="absolute top-20 left-4 bg-amber-500 text-black px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xl animate-bounce">
              <Hand size={14} />
              {t('pro.live.handRaised', 'Main levée')}
            </div>
          )}

          {/* 63. Floating Live Prediction on Video Stage */}
          {predictionState && predictionState.status === 'active' && !isChatOpen && (
            <div className="absolute top-16 right-3 z-30 bg-black/80 backdrop-blur-md border border-amber-500/50 p-2.5 rounded-2xl max-w-[220px] text-white shadow-2xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> Prédiction
                </span>
                <span className="font-mono text-zinc-400">
                  {predictionState.totalPointsA + predictionState.totalPointsB} pts
                </span>
              </div>
              <p className="text-[11px] font-bold line-clamp-2 leading-tight">{predictionState.question}</p>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => votePrediction('a', 50)}
                  className={`py-1 px-1.5 rounded-lg border text-[10px] font-bold truncate transition-colors ${
                    predictionState.myVote?.choice === 'a'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-blue-600/30 hover:bg-blue-600/50 border-blue-500/40 text-blue-200'
                  }`}
                >
                  {predictionState.optionA || 'A'}
                </button>
                <button
                  type="button"
                  onClick={() => votePrediction('b', 50)}
                  className={`py-1 px-1.5 rounded-lg border text-[10px] font-bold truncate transition-colors ${
                    predictionState.myVote?.choice === 'b'
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : 'bg-rose-600/30 hover:bg-rose-600/50 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {predictionState.optionB || 'B'}
                </button>
              </div>
            </div>
          )}

          {/* Floating Font Icon Reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {reactions.map((r) => {
                const renderReactionIcon = (val: string) => {
                  if (val === 'like' || val === '\uD83D\uDC4D') return <ThumbsUp className="w-8 h-8 text-blue-400 drop-shadow-md fill-blue-400/30" />
                  if (val === 'heart' || val === '\u2764\uFE0F' || val === '\u2764') return <Heart className="w-8 h-8 text-rose-500 drop-shadow-md fill-rose-500" />
                  if (val === 'fire' || val === '\uD83D\uDD25') return <Flame className="w-8 h-8 text-amber-500 drop-shadow-md fill-amber-500" />
                  if (val === 'celebrate' || val === '\uD83C\uDF89' || val === '\uD83D\uDC4F') return <PartyPopper className="w-8 h-8 text-purple-400 drop-shadow-md" />
                  return <Star className="w-8 h-8 text-yellow-400 drop-shadow-md fill-yellow-400" />
                }
                return (
                  <motion.div
                    key={r.id}
                    initial={{ y: '100%', x: `${r.x}%`, opacity: 1, scale: 0.6 }}
                    animate={{ y: '-100%', opacity: 0, scale: 1.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.8, ease: 'easeOut' }}
                    className="absolute bottom-20 select-none pointer-events-none"
                  >
                    {renderReactionIcon(r.emoji)}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* ─── TIKTOK / YOUTUBE LIVE MOBILE CHAT STREAM (md:hidden) ─── */}
          <div
            ref={mobileScrollContainerRef}
            onScroll={handleMobileChatScroll}
            className="absolute bottom-3 left-3 right-16 max-h-[38vh] overflow-y-auto pointer-events-auto flex flex-col z-20 space-y-1.5 md:hidden overscroll-contain"
            style={{
              scrollbarWidth: 'none',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
              maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
            }}
          >
            {chatMessages.slice(-50).map((msg) => (
              <div
                key={msg.id}
                className={`pointer-events-auto max-w-[85%] px-3 py-1.5 rounded-2xl text-xs backdrop-blur-md shadow-lg border inline-flex items-start gap-1.5 animate-in fade-in slide-in-from-bottom-2 ${
                  msg.isSuperChat
                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-100'
                    : msg.isSystem
                    ? 'bg-zinc-900/60 border-zinc-700/50 text-zinc-300 text-[11px]'
                    : 'bg-black/55 border-white/10 text-white'
                }`}
              >
                <div className="leading-snug break-all min-w-0 [overflow-wrap:anywhere] line-clamp-4">
                  <span className="font-bold text-amber-400 mr-1 shrink-0">{formatHandle(msg.username || msg.user)}</span>
                  {msg.role === 'host' && <Crown size={11} className="inline text-amber-400 mr-1 shrink-0" />}
                  {msg.role === 'moderator' && <ShieldCheck size={11} className="inline text-emerald-400 mr-1 shrink-0" />}
                  {msg.customTitle && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-semibold mr-1 shrink-0">
                      {msg.customTitle}
                    </span>
                  )}
                  {msg.isSuperChat && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/40 text-amber-200 font-mono font-bold text-[10px] mr-1 shrink-0">
                      ${msg.superChatAmount} USD
                    </span>
                  )}
                  <span className="text-zinc-100 break-all">{msg.text}</span>
                </div>
              </div>
            ))}
            <div ref={mobileChatBottomRef} />
          </div>

          {/* Bouton Flottant "Nouveaux messages ↓" si l'utilisateur a scrollé vers le haut */}
          {isMobileUserScrolledUp && (
            <button
              onClick={scrollToMobileBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-blue-600/90 hover:bg-blue-600 text-white rounded-full text-[11px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-bounce md:hidden pointer-events-auto"
            >
              <span>↓ {mobileUnreadCount > 0 ? `${mobileUnreadCount} nouveaux messages` : 'Derniers messages'}</span>
            </button>
          )}
        </div>

        {/* Bottom Control Bar (Mobile Thumb Zone & Desktop Controls) */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800/80' : 'bg-gray-800 border-gray-700'} border-t p-2 sm:p-3.5 z-30`}>
          {/* ─── MOBILE THUMB ZONE (< sm) : INPUT CHAT ACTIF PERMANAN + KONTWÒL ─── */}
          <div className="flex sm:hidden flex-col w-full gap-2 py-0.5">
            {/* Input Chat Actif Toujou Disponib san modal */}
            <div className="flex items-center gap-2 w-full">
              <form
                onSubmit={handleSendMessage}
                className="flex-1 relative flex items-center min-w-0"
              >
                <input
                  type="text"
                  value={newMessage}
                  maxLength={200}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isReallyHost ? "Commenter en tant qu'hôte..." : "Commenter en direct..."}
                  className="w-full pl-3.5 pr-9 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-full text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-blue-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-blue-600 disabled:opacity-20 text-white transition-opacity"
                  title="Envoyer"
                >
                  <Send size={13} />
                </button>
              </form>

              {/* Reyaksyon Kè & Kado pou Spectateurs sou Mobil */}
              {!isReallyHost && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => sendReaction('heart')}
                    className="p-2 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-400 active:scale-125 transition-transform"
                    title="Envoyer un cœur"
                  >
                    <Heart size={16} className="fill-rose-500 text-rose-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGiftsModal(true)}
                    className="p-2 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-300"
                    title="Envoyer un cadeau"
                  >
                    <Gift size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Ranje Bouton Aksyon Mobil */}
            <div className="flex items-center justify-between w-full pt-0.5">
              {(isReallyHost || isSpeaker) ? (
                <div className="flex items-center justify-around w-full">
                  {/* Micro */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-2.5 rounded-full transition-all ${
                      isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white'
                    }`}
                    title="Micro"
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Caméra */}
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`p-2.5 rounded-full transition-all ${
                      isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white'
                    }`}
                    title="Caméra"
                  >
                    {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  {/* Flip Caméra */}
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2.5 rounded-full bg-white/10 text-white active:scale-90 transition-transform"
                    title="Changer de caméra"
                  >
                    <RefreshCw size={18} />
                  </button>

                  {/* Partage d'écran */}
                  <button
                    type="button"
                    onClick={toggleScreenShare}
                    className={`p-2.5 rounded-full transition-all ${
                      isScreenSharing ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'
                    }`}
                    title="Partager l'écran"
                  >
                    <Monitor size={18} />
                  </button>

                  {/* Plus d'outils */}
                  <button
                    type="button"
                    onClick={() => setShowMobileMoreTools(true)}
                    className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
                    title="Plus d'outils"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Fin du direct */}
                  <button
                    type="button"
                    onClick={handleLeaveLive}
                    className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
                    title={isReallyHost ? "Terminer le direct" : "Quitter"}
                  >
                    <PhoneOff size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  {/* Points de chaîne */}
                  <button
                    type="button"
                    onClick={() => setShowRewardsModal(true)}
                    className="px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 shrink-0"
                    title="Points de fidélité"
                  >
                    <Coins size={14} className="text-amber-400" />
                    <span className="text-[10px] font-mono">{channelPoints} pts</span>
                  </button>

                  {/* Demander la parole / Main levée */}
                  <button
                    type="button"
                    onClick={toggleHandRaise}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isHandRaised ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Hand size={14} />
                    <span>{isHandRaised ? 'Main levée' : 'Demander à parler'}</span>
                  </button>

                  {/* Quitter */}
                  <button
                    type="button"
                    onClick={handleLeaveLive}
                    className="p-2 rounded-full bg-red-950/40 border border-red-500/40 text-red-400 shrink-0"
                    title="Quitter"
                  >
                    <PhoneOff size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── DESKTOP CONTROLS (>= sm) ─── */}
          <div className="hidden sm:flex items-center justify-between max-w-4xl mx-auto gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {(isReallyHost || isSpeaker) ? (
                <>
                  <button
                    onClick={toggleMute}
                    title={isMuted ? t('pro.live.unmute', 'Activer le micro') : t('pro.live.mute', 'Couper le micro')}
                    className={`p-2.5 sm:p-3 rounded-full transition-all ${
                      isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    title={isVideoOff ? t('pro.live.startVideo', 'Activer la caméra') : t('pro.live.stopVideo', 'Couper la caméra')}
                    className={`p-2.5 sm:p-3 rounded-full transition-all ${
                      isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  <button
                    onClick={switchCamera}
                    title={t('pro.live.flipCamera', 'Changer de caméra (Avant / Arrière)')}
                    className="p-2.5 sm:p-3 rounded-full transition-all bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  >
                    <RefreshCw size={18} />
                  </button>

                  {isReallyHost && (
                    <>
                      <button
                        onClick={toggleScreenShare}
                        title={t('pro.live.shareScreen', "Partager l'écran")}
                        className={`p-2.5 sm:p-3 rounded-full transition-all ${
                          isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Monitor size={18} />
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        title={isRecording ? t('pro.live.stopRecording', "Arrêter l'enregistrement") : t('pro.live.startRecording', "Enregistrer le direct (Replay)")}
                        className={`p-2 sm:px-3.5 sm:py-2.5 rounded-full transition-all flex items-center gap-1.5 ${
                          isRecording
                            ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-bold">
                          {isRecording ? formatDuration(recordingDuration) : 'REC'}
                        </span>
                      </button>

                      {/* 63. Bouton Prédiction Desktop */}
                      <button
                        onClick={() => setShowPredictionModal(true)}
                        title="Lancer une prédiction"
                        className="p-2.5 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 transition-colors"
                      >
                        <Sparkles size={16} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleHandRaise}
                    title={isHandRaised ? t('pro.live.lowerHand', 'Baisser la main') : t('pro.live.raiseHand', 'Lever la main pour parler')}
                    className={`px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${
                      isHandRaised ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Hand size={15} />
                    <span>{isHandRaised ? t('pro.live.handRaised', 'Main levée') : t('pro.live.askToSpeak', 'Demander la parole')}</span>
                  </button>

                  {/* 64 & 65. Points de chaîne */}
                  <button
                    onClick={() => setShowRewardsModal(true)}
                    className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                    title="Boutique de points de fidélité"
                  >
                    <Coins size={14} className="text-amber-400" />
                    <span>{channelPoints} pts</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: 'like', icon: ThumbsUp, label: "J'aime", color: 'text-blue-400 hover:bg-blue-500/20' },
                { id: 'heart', icon: Heart, label: 'Cœur', color: 'text-rose-500 hover:bg-rose-500/20' },
                { id: 'fire', icon: Flame, label: 'Feu', color: 'text-amber-500 hover:bg-amber-500/20', hideOnSm: true },
                { id: 'celebrate', icon: PartyPopper, label: 'Bravo', color: 'text-purple-400 hover:bg-purple-500/20', hideOnSm: true },
                { id: 'star', icon: Star, label: 'Top', color: 'text-yellow-400 hover:bg-yellow-500/20', hideOnSm: true },
              ].map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => sendReaction(item.id)}
                    title={item.label}
                    className={`p-2 rounded-xl bg-white/5 transition-transform hover:scale-125 active:scale-95 flex items-center justify-center ${item.color} ${item.hideOnSm ? 'hidden xl:flex' : ''}`}
                  >
                    <IconComponent size={17} />
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsChatOpen(!isChatOpen)
                  if (!isChatOpen) setShowParticipantsTab(false)
                }}
                title={t('pro.live.liveChat', 'Chat Live')}
                className={`p-2 sm:px-3 sm:py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isChatOpen && !showParticipantsTab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <MessageSquare size={15} />
                <span className="hidden sm:inline">Chat</span>
              </button>

              <button
                onClick={handleLeaveLive}
                title={isReallyHost ? t('pro.live.endLive', 'Terminer le direct') : t('pro.live.leaveLive', 'Quitter le direct')}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-600/30 shrink-0"
              >
                <PhoneOff size={15} />
                <span className="hidden sm:inline">{isReallyHost ? t('pro.live.endLiveShort', 'Fin du direct') : t('common.leave', 'Quitter')}</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* CHAT & PARTICIPANTS SIDEBAR */}
      <AnimatePresence>
        {(isChatOpen || showParticipantsTab || isPopoutMode) && (
          <motion.div
            initial={{ x: isPopoutMode ? 0 : '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isPopoutMode ? 0 : '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={
              isPopoutMode
                ? `w-full h-full flex-1 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-900'} flex flex-col`
                : isChatOverlayMode && !showParticipantsTab
                ? 'hidden md:flex fixed bottom-16 right-6 w-[360px] h-[55vh] z-40 bg-zinc-950/70 backdrop-blur-md rounded-2xl border border-zinc-700/60 shadow-2xl flex-col overflow-hidden'
                : `hidden md:flex max-lg:fixed max-lg:top-14 max-lg:bottom-20 max-lg:right-3 max-lg:w-[350px] max-lg:z-40 max-lg:rounded-2xl max-lg:shadow-2xl max-lg:border lg:w-[360px] xl:w-[380px] ${
                    resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-gray-900 border-gray-700'
                  } border-l flex flex-col`
            }
          >
            <div className="flex items-center justify-between border-b border-white/10 p-2.5">
              <button
                onClick={() => {
                  setIsChatOpen(true)
                  setShowParticipantsTab(false)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  isChatOpen && !showParticipantsTab ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} />
                {t('pro.live.liveChat', 'Chat Live')}
              </button>

              <button
                onClick={() => {
                  setShowParticipantsTab(true)
                  setIsChatOpen(false)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  showParticipantsTab ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                {t('pro.live.participants', 'Participants')} ({participants.length})
              </button>

              <button
                onClick={() => {
                  setIsChatOpen(false)
                  setShowParticipantsTab(false)
                }}
                className="p-2 text-zinc-400 hover:text-white md:hidden"
              >
                <X size={16} />
              </button>
            </div>

            {!showParticipantsTab && (
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* ─── BARRE D'OUTILS ET FILTRES DU CHAT ─── */}
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-1.5 text-xs bg-zinc-900/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChatTabFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        chatTabFilter === 'all'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Tout
                    </button>
                    <button
                      onClick={() => setChatTabFilter('questions')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                        chatTabFilter === 'questions'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <HelpCircle size={11} className="text-amber-400" />
                      <span>Questions</span>
                      {chatMessages.filter(m => m.isQuestion || m.text.startsWith('?') || m.text.startsWith('/q')).length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                          {chatMessages.filter(m => m.isQuestion || m.text.startsWith('?') || m.text.startsWith('/q')).length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Statut de connexion */}
                    {isConnected ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10" title="Connecté en direct">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="hidden sm:inline">En direct</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={reconnect}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Déconnecté — Cliquez pour tenter de reconnecter"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="hidden sm:inline">Reconnecter</span>
                        <RotateCw size={9} className="ml-0.5" />
                      </button>
                    )}

                    {/* 88. Sipò Sal Segmante (Chat Sharding) */}
                    {shardId !== null && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono" title={`Salon distribué (Shard #${shardId + 1})`}>
                        S#{shardId + 1}
                      </span>
                    )}

                    {/* Indicateur pause */}
                    {isChatPaused && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Chat suspendu par l'hôte">
                        ⏸️ Pause
                      </span>
                    )}

                    {/* Indicateurs de mode actif */}
                    {slowModeSeconds > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700" title={`Slow mode actif : ${slowModeSeconds}s`}>
                        ⏱️ {slowModeSeconds}s
                      </span>
                    )}
                    {membersOnly && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30" title="Chat réservé aux abonnés">
                        ⭐ Membres
                      </span>
                    )}
                    {followersOnly && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30" title="Chat réservé aux followers">
                        👥 Followers
                      </span>
                    )}
                    {emotesOnly && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" title="Mode Émojis uniquement">
                        😄 Émojis
                      </span>
                    )}
                    {preModeration && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" title="Pré-modération active">
                        ⏳ Pré-mod
                      </span>
                    )}
                    {accountAgeGate && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30" title="Protection anti-trolls (>24h)">
                        🛡️ Anti-troll
                      </span>
                    )}

                    {/* Toggle taille police (Density) */}
                    <button
                      type="button"
                      onClick={() => setChatDensity(chatDensity === 'normal' ? 'large' : 'normal')}
                      className={`p-1.5 rounded-lg transition-colors ${chatDensity === 'large' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                      title={`Taille du texte : ${chatDensity === 'normal' ? 'Normale (Cliquer pour agrandir)' : 'Grande (Cliquer pour réduire)'}`}
                    >
                      <Type size={13} />
                    </button>

                    {/* Sondage direct pour Hôte / Modérateur */}
                    {canModerate && (
                      <button
                        type="button"
                        onClick={() => setShowCreatePollModal(true)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                        title="Lancer un sondage en direct"
                      >
                        <BarChart2 size={13} />
                      </button>
                    )}

                    {/* Exporter chat (.txt) */}
                    <button
                      type="button"
                      onClick={handleExportChat}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                      title="Télécharger la transcription du chat (.txt)"
                    >
                      <Download size={13} />
                    </button>

                    {/* Recherche inline */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(!isSearchOpen)
                        if (isSearchOpen) setChatSearchQuery('')
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSearchOpen || chatSearchQuery ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Rechercher dans le chat"
                    >
                      <Search size={13} />
                    </button>

                    {/* Modération / Paramètres du chat */}
                    {canModerate && (
                      <button
                        type="button"
                        onClick={() => setShowModSettings(true)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Paramètres et modération du chat"
                      >
                        <SlidersHorizontal size={13} />
                      </button>
                    )}
                    {/* 96. Chat Transparent sur Vidéo (Overlay Mode) */}
                    <button
                      type="button"
                      onClick={toggleChatOverlayMode}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isChatOverlayMode
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      title={isChatOverlayMode ? 'Désactiver le chat superposé (Mode normal)' : 'Activer le chat superposé transparent (Mode Overlay)'}
                    >
                      <Layers size={13} />
                    </button>

                    {/* Bouton masquer le chat (Focus mode) */}
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(false)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors hidden md:block"
                      title="Masquer le chat (Mode focus)"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Champ de recherche si ouvert */}
                {isSearchOpen && (
                  <div className="p-2 border-b border-white/10 bg-zinc-950 flex items-center gap-1.5">
                    <Search size={12} className="text-zinc-400 ml-1.5" />
                    <input
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Filtrer les messages par mot-clé ou auteur..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
                      autoFocus
                    />
                    {chatSearchQuery && (
                      <button onClick={() => setChatSearchQuery('')} className="p-1 text-zinc-400 hover:text-white">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* ─── BANNIÈRE AVERTISSEMENT OFFICIEL DE MODÉRATION ─── */}
                {warningNotice && (
                  <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-center justify-between text-xs animate-pulse">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                      <span className="truncate"><strong>Avertissement ({warningNotice.by}) :</strong> {warningNotice.message}</span>
                    </div>
                    <button onClick={clearWarningNotice} className="p-1 hover:text-white transition-colors" title="Fermer l'avertissement">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* ─── BANNIÈRE CHAT SUSPENDU / PAUSE ─── */}
                {isChatPaused && (
                  <div className="mx-3 mt-2 p-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Pause size={12} className="text-amber-400" />
                      Le chat est suspendu par l'hôte.
                    </span>
                    {canModerate && (
                      <button
                        onClick={() => toggleChatPause(false)}
                        className="text-[10px] text-blue-400 hover:underline font-semibold"
                      >
                        Reprendre
                      </button>
                    )}
                  </div>
                )}

                {/* ─── BANNIÈRE MESSAGE ÉPINGLÉ ─── */}
                {pinnedMessage && (
                  <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start justify-between gap-2 text-xs shadow-sm">
                    <div className="flex items-start gap-2 min-w-0">
                      <Pin size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-amber-300 block">Épinglé par {formatHandle(pinnedMessage.user)}</span>
                        <p className="line-clamp-2 text-[11px] leading-snug break-words">{pinnedMessage.text}</p>
                      </div>
                    </div>
                    {canModerate && (
                      <button
                        onClick={unpinChatMessage}
                        title="Désepingler ce message"
                        className="p-1 text-amber-400 hover:text-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* ─── BANNIÈRE DERNIER SUPER CHAT ÉPINGLÉ ─── */}
                {chatMessages.some(m => m.isSuperChat) && (() => {
                  const latestSc = [...chatMessages].reverse().find(m => m.isSuperChat)
                  if (!latestSc) return null
                  return (
                    <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-100 flex items-start justify-between gap-2 text-xs shadow-sm">
                      <div className="flex items-start gap-2 min-w-0">
                        <DollarSign size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-300 text-[11px]">{formatHandle(latestSc.username || latestSc.user)}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 text-[9px] font-mono font-bold">
                              ${latestSc.superChatAmount || 5} USD
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[11px] text-amber-100/90 leading-snug break-words mt-0.5">{latestSc.text}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ─── WIDGET SONDAGE EN DIRECT (POLL) ─── */}
                {activePoll && (
                  <div className="mx-3 mt-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white space-y-2 text-xs shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                        <BarChart2 size={13} className="text-blue-400" />
                        Sondage en direct
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {activePoll.totalVotes} vote{activePoll.totalVotes > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-zinc-100">{activePoll.question}</p>

                    <div className="space-y-1.5 pt-1">
                      {activePoll.options.map((opt, idx) => {
                        const pct = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0
                        const isSelected = activePoll.hasVoted === idx
                        return (
                          <button
                            key={idx}
                            disabled={!activePoll.active || activePoll.hasVoted !== undefined}
                            onClick={() => votePoll(activePoll.id, idx)}
                            className={`w-full text-left relative overflow-hidden rounded-xl border p-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800/80'
                            }`}
                          >
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-blue-600/20 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1 font-medium">
                                {opt.text}
                                {isSelected && <Check size={11} className="text-blue-400" />}
                              </span>
                              <span className="font-bold font-mono text-[10px] text-zinc-400">{pct}% ({opt.votes})</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {canModerate && activePoll.active && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => endPoll(activePoll.id)}
                          className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          Clôturer le sondage
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 63. BANNIÈRE PRÉDICTION EN DIRECT (LIVE PREDICTIONS) ─── */}
                {predictionState && predictionState.status === 'active' && (
                  <div className="mx-3 mt-2 p-3 rounded-2xl bg-zinc-900 border border-amber-500/50 text-white space-y-2 text-xs shadow-xl animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                        <Sparkles size={13} className="text-amber-400" />
                        Prédiction en Direct
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {predictionState.totalPointsA + predictionState.totalPointsB} pts en jeu
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-zinc-100">{predictionState.question}</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => votePrediction('a', 50)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          predictionState.myVote?.choice === 'a'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-400 truncate">{predictionState.optionA || 'Option A'}</span>
                          {predictionState.myVote?.choice === 'a' && <Check size={12} className="text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">
                          {predictionState.votesA} votes ({predictionState.totalPointsA} pts)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => votePrediction('b', 50)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          predictionState.myVote?.choice === 'b'
                            ? 'border-rose-500 bg-rose-500/20'
                            : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-400 truncate">{predictionState.optionB || 'Option B'}</span>
                          {predictionState.myVote?.choice === 'b' && <Check size={12} className="text-rose-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">
                          {predictionState.votesB} votes ({predictionState.totalPointsB} pts)
                        </p>
                      </button>
                    </div>

                    {canModerate && (
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-zinc-400 font-semibold">Résoudre :</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => resolvePrediction('a')}
                            className="px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold transition-colors"
                          >
                            A Gagne
                          </button>
                          <button
                            type="button"
                            onClick={() => resolvePrediction('b')}
                            className="px-2 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-bold transition-colors"
                          >
                            B Gagne
                          </button>
                          <button
                            type="button"
                            onClick={() => resolvePrediction('cancel')}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 83. BANNIÈRE NOUVEL ABONNEMENT EN DIRECT ─── */}
                {subAlert && (
                  <div className="mx-3 mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/50 text-purple-200 flex items-center justify-between text-xs animate-bounce shadow-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <Star size={14} className="text-purple-400 shrink-0" />
                      <span className="truncate"><strong>{formatHandle(subAlert.username)}</strong> vient de s'abonner ({subAlert.tier}) ! 🎉</span>
                    </div>
                  </div>
                )}

                {/* ─── 71. BARRE D'OBJECTIF DE FINANCEMENT (GOAL BAR) ─── */}
                {crowdfundingGoal && (
                  <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white space-y-1.5 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                        <Target size={13} className="text-amber-400" />
                        {crowdfundingGoal.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ${crowdfundingGoal.current} / ${crowdfundingGoal.target}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((crowdfundingGoal.current / (crowdfundingGoal.target || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* ─── 82. DUEL A vs B SPLIT BAR INTERACTIF ─── */}
                {activeDuel && activeDuel.active && (
                  <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white space-y-2 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                        <Swords size={13} className="text-red-400" />
                        {activeDuel.question}
                      </span>
                      {canModerate && (
                        <button onClick={() => endDuel(activeDuel.id)} className="text-[10px] text-zinc-500 hover:text-red-400">
                          Fin du duel
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => voteDuel(activeDuel.id, 'a')}
                        disabled={activeDuel.hasVoted !== undefined}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          activeDuel.hasVoted === 'a' ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                        }`}
                      >
                        <p className="font-bold text-blue-400 truncate">{activeDuel.optionA}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{activeDuel.votesA} votes</p>
                      </button>
                      <button
                        onClick={() => voteDuel(activeDuel.id, 'b')}
                        disabled={activeDuel.hasVoted !== undefined}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          activeDuel.hasVoted === 'b' ? 'border-red-500 bg-red-500/20' : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                        }`}
                      >
                        <p className="font-bold text-red-400 truncate">{activeDuel.optionB}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{activeDuel.votesB} votes</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── 79. PRODUIT VEDETTE ÉPINGLÉ (LIVE SHOPPING) ─── */}
                {pinnedProduct && (
                  <div className="mx-3 mt-2 p-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-white flex items-center justify-between gap-2 text-xs shadow-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                        <ShoppingBag size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{pinnedProduct.title}</p>
                        <p className="text-[10px] text-amber-300 font-mono font-semibold">${pinnedProduct.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={pinnedProduct.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition-colors"
                      >
                        Acheter
                      </a>
                      {canModerate && (
                        <button onClick={unpinProduct} className="p-1 text-zinc-500 hover:text-white" title="Retirer">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── 75. BANNIÈRE TIRAGE AU SORT (GIVEAWAY) ─── */}
                {giveawayState && giveawayState.active && (
                  <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-zinc-900 border border-purple-500/40 text-white space-y-1.5 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                        <Gift size={13} className="text-purple-400" />
                        Tirage au sort en cours !
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{giveawayState.participants.length} inscrits</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Tapez <strong className="text-amber-300 font-mono">{giveawayState.keyword}</strong> dans le chat pour participer !
                    </p>
                    {giveawayState.winner && (
                      <p className="text-xs font-bold text-emerald-400 pt-1 border-t border-zinc-800">
                        🎉 Gagnant : {formatHandle(giveawayState.winner)} !
                      </p>
                    )}
                    {canModerate && (
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                        <button onClick={drawGiveawayWinner} className="text-[10px] text-purple-400 hover:underline">
                          Tirer un gagnant
                        </button>
                        <button onClick={endGiveaway} className="text-[10px] text-zinc-500 hover:text-red-400">
                          Terminer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 76. BANNIÈRE TRIVIA / QUIZ EN DIRECT ─── */}
                {triviaState && triviaState.active && (
                  <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-zinc-900 border border-blue-500/40 text-white space-y-1.5 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-blue-300">
                        <Award size={13} className="text-blue-400" />
                        Quiz en Direct
                      </span>
                      {canModerate && (
                        <button onClick={endTrivia} className="text-[10px] text-zinc-500 hover:text-red-400">
                          Fermer
                        </button>
                      )}
                    </div>
                    <p className="font-semibold text-xs text-zinc-100">{triviaState.question}</p>
                    <p className="text-[10px] text-zinc-400 italic">Écrivez la bonne réponse dans le chat pour gagner !</p>
                  </div>
                )}

                {/* ─── LISTE DES MESSAGES ─── */}
                <div
                  ref={chatScrollContainerRef}
                  onScroll={handleChatScroll}
                  className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {/* 86. Virtualization Lis Chat la (DOM Windowing / Virtual List) */}
                  {chatMessages.length > 60 && (
                    <div className="flex justify-center my-1">
                      <span className="text-[10px] text-zinc-500 bg-zinc-800/40 border border-zinc-700/30 px-2 py-0.5 rounded-full">
                        Affichage optimisé (60 derniers messages sur {chatMessages.length})
                      </span>
                    </div>
                  )}

                  {chatMessages
                    .filter(msg => {
                      if (chatTabFilter === 'questions') {
                        const isQ = msg.isQuestion || msg.text.startsWith('?') || msg.text.startsWith('/q')
                        if (!isQ) return false
                      }
                      if (chatSearchQuery.trim()) {
                        const q = chatSearchQuery.toLowerCase()
                        const matchesText = msg.text.toLowerCase().includes(q)
                        const matchesUser = msg.user.toLowerCase().includes(q)
                        if (!matchesText && !matchesUser) return false
                      }
                      return true
                    })
                    .slice(-60)
                    .map((msg) => {
                      const isMe = String(msg.user_id) === String(myUserId)
                      const myUsernameClean = (user?.username || '').replace(/^@+/, '').toLowerCase()
                      const isMentioned = myUsernameClean && msg.text.toLowerCase().includes(`@${myUsernameClean}`)
                      const userRole = msg.role || (msg.isHost ? 'host' : msg.isSpeaker ? 'speaker' : (msg.user_id && userRoles[String(msg.user_id)]) || 'viewer')

                      if (msg.isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-1 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-[10px] text-zinc-400 font-medium text-center shadow-sm">
                              {msg.text}
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-opacity`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs shadow-sm transition-all relative ${
                              isMentioned
                                ? 'bg-blue-950/40 border border-blue-500/60 text-white'
                                : msg.isSuperChat
                                ? 'bg-amber-950/30 border border-amber-500/60 text-amber-100 shadow-md'
                                : msg.isWhisper
                                ? 'bg-purple-950/30 border border-purple-500/50 text-purple-100'
                                : msg.isHost
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100'
                                : userRole === 'moderator'
                                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-100'
                                : userRole === 'vip'
                                ? 'bg-purple-950/30 border border-purple-500/40 text-purple-100'
                                : msg.isSpeaker
                                ? 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                                : isMe
                                ? 'bg-zinc-800 text-white border border-zinc-700'
                                : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200'
                            }`}
                          >
                            {/* Chuchotement indicateur */}
                            {msg.isWhisper && (
                              <div className="mb-1 text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                                <Lock size={10} />
                                {isMe ? `Chuchotement à ${formatHandle(msg.whisperTarget)}` : `Chuchotement de ${formatHandle(msg.username || msg.user)}`}
                              </div>
                            )}

                            {/* Super Chat indicateur */}
                            {msg.isSuperChat && (
                              <div className="mb-1.5 p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 flex items-center justify-between text-xs">
                                <span className="font-bold flex items-center gap-1 text-amber-300">
                                  <DollarSign size={13} /> {msg.superChatAmount} {msg.superChatCurrency || 'USD'}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                                  Super Chat
                                </span>
                              </div>
                            )}

                            {/* Aperçu de la réponse citée */}
                            {msg.replyTo && (
                              <div className="mb-1.5 pl-2 border-l-2 border-zinc-500/60 text-[10px] text-zinc-400 line-clamp-1 italic">
                                ↳ Réponse à {formatHandle(msg.replyTo.user)}: {msg.replyTo.text}
                              </div>
                            )}

                            {/* En-tête auteur & Badges */}
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold opacity-90">
                              <button
                                type="button"
                                onClick={() => setSelectedProfileUser({
                                  id: msg.user_id ? String(msg.user_id) : undefined,
                                  name: msg.user,
                                  username: msg.username || msg.user,
                                  avatar: msg.avatar,
                                  role: userRole
                                })}
                                className="hover:underline flex items-center gap-1 text-left"
                                title="Voir profil participant"
                              >
                                <span className={`truncate font-bold ${getUserColor(msg.username || msg.user)}`}>
                                  {msg.user.replace(/@@+/g, '@')}
                                </span>
                              </button>

                              {/* 5. Badj Verifikasyon Kont (Verified Tick) */}
                              {(msg.isVerified || (userRole === 'host' && isReallyHost)) && (
                                <span className="inline-flex items-center text-blue-400" title="Compte vérifié">
                                  <CheckCircle2 size={11} className="text-blue-400" />
                                </span>
                              )}

                              {/* 6. Badj Ansyènte / Fidélité Manm (Loyalty Tiers) */}
                              {msg.loyaltyMonths && msg.loyaltyMonths > 0 && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-zinc-800 text-amber-300 border border-zinc-700 font-mono"
                                  title={`Manm fidèl depi ${msg.loyaltyMonths} mwa`}
                                >
                                  ⭐ {msg.loyaltyMonths >= 12 ? `${Math.floor(msg.loyaltyMonths / 12)}a` : `${msg.loyaltyMonths}m`}
                                </span>
                              )}

                              {/* 7. Tit Kominotè Pèsonalize (Custom Community Badges / Titles) */}
                              {(msg.customTitle || (msg.user_id && communityTitles[String(msg.user_id)])) && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700/80 font-medium"
                                  title="Titre communautaire personnalisé"
                                >
                                  🏷️ {msg.customTitle || communityTitles[String(msg.user_id)]}
                                </span>
                              )}

                              {msg.isHost && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300">
                                  <Crown size={9} /> Hôte
                                </span>
                              )}
                              {!msg.isHost && userRole === 'moderator' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300">
                                  <ShieldCheck size={9} /> Mod
                                </span>
                              )}
                              {!msg.isHost && userRole === 'vip' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300">
                                  <Star size={9} /> VIP
                                </span>
                              )}
                              {msg.isSpeaker && !msg.isHost && userRole !== 'moderator' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-zinc-700 text-zinc-300">
                                  <Mic size={9} /> Scène
                                </span>
                              )}
                              {/* 84. Badj Cadeau Abonnement */}
                              {msg.isGiftSub && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                                  🎁 Abonnement offert
                                </span>
                              )}
                              {/* 83. Badj Nouvel Abòne */}
                              {msg.isSubAlert && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                  ⭐ Nouvel Abonné
                                </span>
                              )}
                              {msg.isQuestion && (
                                (msg.isAnswered || answeredQuestionIds.includes(msg.id)) ? (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold">
                                    <Check size={9} /> Répondue
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-semibold">
                                    <HelpCircle size={9} /> Question
                                  </span>
                                )
                              )}
                              {/* 67. Upvote sur Questions Q&R */}
                              {msg.isQuestion && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    upvoteQuestion(msg.id)
                                  }}
                                  className={`ml-auto px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5 transition-colors ${
                                    upvotedQuestionIds.includes(msg.id)
                                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700'
                                  }`}
                                  title="Voter pour faire monter cette question"
                                >
                                  ▲ {questionUpvotes[msg.id] ?? msg.upvotes ?? 0}
                                </button>
                              )}
                            </div>

                            {/* Texte du message avec taille adaptable */}
                            <p className={`leading-relaxed break-words [overflow-wrap:anywhere] break-all ${chatDensity === 'large' ? 'text-sm' : 'text-xs'}`}>{msg.text}</p>

                            {/* 85. Note Vocale 5s (Audio player) */}
                            {msg.voiceAudio && (
                              <div className="mt-2 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (playingVoiceId === msg.id) {
                                      setPlayingVoiceId(null)
                                    } else {
                                      setPlayingVoiceId(msg.id)
                                      const audio = new Audio(msg.voiceAudio)
                                      audio.play().catch(() => {})
                                      audio.onended = () => setPlayingVoiceId(null)
                                    }
                                  }}
                                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-colors"
                                  title="Koute nòt vokal la"
                                >
                                  {playingVoiceId === msg.id ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                                </button>
                                <div className="flex-1">
                                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${
                                        playingVoiceId === msg.id ? 'w-full animate-pulse' : 'w-1/3'
                                      }`}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  0:0{msg.voiceDuration || 5}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Barre d'action discrète au survol / tap */}
                          <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-zinc-500">
                            <span>{msg.time}</span>

                            {isMe && msg.status === 'sending' && (
                              <span className="text-[9px] text-blue-400 flex items-center gap-0.5 animate-pulse font-medium">
                                <Loader2 size={9} className="animate-spin" /> Envoi...
                              </span>
                            )}
                            {isMe && msg.status === 'failed' && (
                              <span className="text-[9px] text-red-400 font-semibold">Échec</span>
                            )}

                            {/* Marquer question comme répondue */}
                            {msg.isQuestion && !msg.isAnswered && !answeredQuestionIds.includes(msg.id) && canModerate && (
                              <button
                                type="button"
                                onClick={() => markQuestionAnswered(msg.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-emerald-400 transition-opacity flex items-center gap-0.5"
                                title="Marquer comme répondue"
                              >
                                <Check size={10} className="text-emerald-400" />
                              </button>
                            )}

                            {/* Actions rapides */}
                            <button
                              type="button"
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-0.5"
                              title="Répondre"
                            >
                              <Reply size={10} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.text, msg.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-0.5"
                              title="Copier le texte"
                            >
                              {copiedMessageId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            </button>

                            {/* Signaler un message */}
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => setReportingMessage({ id: msg.id, username: msg.username || msg.user })}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity flex items-center gap-0.5"
                                title="Signaler ce message"
                              >
                                <Flag size={10} />
                              </button>
                            )}

                            {/* Outils de modération */}
                            {canModerate && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => pinChatMessage(msg)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-amber-400 transition-opacity"
                                  title="Épingler ce message"
                                >
                                  <Pin size={10} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteChatMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                  title="Supprimer ce message"
                                >
                                  <Trash2 size={10} />
                                </button>

                                {!isMe && msg.user_id && (
                                  <button
                                    type="button"
                                    onClick={() => timeoutUser(String(msg.user_id), msg.user, 300)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-amber-400 transition-opacity"
                                    title="Mettre en sourdine pour 5 minutes"
                                  >
                                    <Clock size={10} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  <div ref={chatBottomRef} />
                </div>

                {/* ─── BOUTON FLOTTANT NOUVEAUX MESSAGES ─── */}
                {isUserScrolledUp && unreadCount > 0 && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold shadow-lg border border-zinc-700 flex items-center gap-1.5 active:scale-95 transition-all z-20"
                  >
                    <span>↓ {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</span>
                  </button>
                )}

                {/* ─── BARRE DE RÉPONSE ACTIVE (ABOVE INPUT) ─── */}
                {replyingTo && (
                  <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                    <span className="truncate">
                      Réponse à <strong className="text-white">{formatHandle(replyingTo.user)}</strong> : <span className="text-zinc-400">{replyingTo.text.slice(0, 35)}...</span>
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:text-white text-zinc-400 transition-colors"
                      title="Annuler la réponse"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* ─── AUTOCOMPLÉTION DES MENTIONS @ ─── */}
                {showMentionPicker && (
                  <div className="absolute bottom-14 left-3 right-3 max-h-36 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl z-30">
                    {participants
                      .filter(p => (p.username || p.name).toLowerCase().includes(mentionQuery))
                      .slice(0, 5)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectMention(p.username || p.name)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-200 transition-colors"
                        >
                          <span className="font-semibold">{formatHandle(p.username || p.name)}</span>
                          <span className="text-[10px] text-zinc-500">{p.isHost ? 'Hôte' : 'Spectateur'}</span>
                        </button>
                      ))}
                  </div>
                )}

                {/* ─── PANÈL EMOJI ENTEGRE & STICKERS EXILE ─── */}
                {showEmojiPicker && (
                  <div className="absolute bottom-24 left-3 right-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 shadow-2xl z-30 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEmojiPickerTab('standard')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            emojiPickerTab === 'standard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          😀 Emojis
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmojiPickerTab('exile')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            emojiPickerTab === 'exile' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⭐ EXILE Exclusifs
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {emojiPickerTab === 'standard' ? (
                      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {STANDARD_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji)
                            }}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-sm transition-transform active:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {EXILE_STICKERS.map((st, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => (prev ? prev + ' ' : '') + st.text + ' ')
                              setShowEmojiPicker(false)
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-200 transition-colors"
                          >
                            <span className="font-semibold text-[11px]">{st.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── BARRE D'EMOJIS RAPIDES & SUPER CHAT ─── */}
                {!isBanned && (!isMutedUntil || Date.now() >= isMutedUntil) && (!isChatPaused || canModerate) && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-950/40 border-t border-white/5 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1 rounded-lg ${showEmojiPicker ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-white'} transition-colors flex-shrink-0`}
                      title="Ouvrir le panneau d'emojis et stickers EXILE"
                    >
                      <Smile size={14} />
                    </button>
                    {['👍', '❤️', '🔥', '👏', '🎉', '💯', '😂', '🙏'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewMessage(prev => prev + emoji)}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-xs transition-transform active:scale-125"
                        title={`Insérer ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowLeaderboardModal(true)}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-yellow-400 text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                      title="Classement des donateurs (Top Donateurs)"
                    >
                      <Award size={11} /> Top
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGiftsModal(true)}
                      className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                      title="Envoyer un cadeau ou sticker virtuel"
                    >
                      <Gift size={11} /> Cadeaux
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sendChatMessage({
                          text: "🎬 Moment Fort capturé en direct !",
                          role: myRole,
                        })
                        showToast("Moment fort partagé dans le chat !")
                      }}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                      title="Partager un moment fort / clip"
                    >
                      <Film size={11} /> Clip
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuestionMode(!isQuestionMode)}
                      className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0 ${
                        isQuestionMode
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 text-amber-300'
                      }`}
                      title={isQuestionMode ? 'Mode question actif (Cliquer pour désactiver)' : 'Poser une question'}
                    >
                      <HelpCircle size={11} /> Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSuperChatModal(true)}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                      title="Envoyer un Super Chat"
                    >
                      <DollarSign size={11} /> Super Chat
                    </button>
                  </div>
                )}

                {/* ─── BANNIÈRE MODE QUESTION ACTIF ─── */}
                {isQuestionMode && (
                  <div className="px-3 py-1.5 bg-amber-500/15 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <HelpCircle size={12} className="text-amber-400 flex-shrink-0" />
                      <span>Mode Question activé — Message prioritaire adressé à l’hôte.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuestionMode(false)}
                      className="p-0.5 hover:text-white text-amber-400 transition-colors"
                      title="Annuler le mode question"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* ─── FORMULAIRE DE SAISIE AVEC CONTRÔLES ─── */}
                {isBanned ? (
                  <div className="p-3 border-t border-red-500/30 bg-red-950/20 text-center text-xs text-red-400 font-semibold">
                    Vous avez été banni du chat en direct.
                  </div>
                ) : isMutedUntil && Date.now() < isMutedUntil ? (
                  <div className="p-3 border-t border-amber-500/30 bg-amber-950/20 text-center text-xs text-amber-400 font-semibold">
                    Vous êtes en sourdine ({Math.ceil((isMutedUntil - Date.now()) / 1000)}s restantes).
                  </div>
                ) : isChatPaused && !canModerate ? (
                  <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-center text-xs text-zinc-400 font-medium">
                    Le chat a été suspendu par l'hôte.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10">
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute left-2.5 p-1 text-zinc-400 hover:text-white transition-colors"
                        title="Emojis et Stickers EXILE"
                      >
                        <Smile size={14} />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        maxLength={200}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          slowModeCooldown > 0
                            ? `Mode ralenti actif : attendez ${slowModeCooldown}s...`
                            : isQuestionMode
                            ? "Posez votre question à l'hôte ou aux intervenants..."
                            : t('pro.live.typeMessage', 'Envoyer un message en direct... (/q pour question, /w pour chuchoter)')
                        }
                        disabled={slowModeCooldown > 0 && !canModerate}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                      />
                      <div className="absolute right-1.5 flex items-center gap-1.5">
                        {/* 85. Bouton Note Vocale 5s */}
                        {isRecordingVoice ? (
                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="px-2 py-1 bg-red-600 animate-pulse text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md"
                            title="Arrêter et envoyer la note vocale"
                          >
                            <Mic size={12} className="animate-spin" />
                            <span>0:0{voiceRecordingSeconds}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startVoiceRecording}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Enregistrer un message vocal (max 5 secondes)"
                          >
                            <Mic size={13} />
                          </button>
                        )}

                        <span className={`text-[9px] font-mono ${newMessage.length >= 180 ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                          {newMessage.length}/200
                        </span>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || (slowModeCooldown > 0 && !canModerate)}
                          className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          {slowModeCooldown > 0 && !canModerate ? (
                            <span className="text-[10px] font-mono text-zinc-400">{slowModeCooldown}s</span>
                          ) : (
                            <Send size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {showParticipantsTab && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {t('pro.live.membersOnline', 'Membres en direct')} ({participants.length})
                </p>
                {participants.map((p) => (
                  <div
                    key={p.channel_name || p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {p.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white truncate text-xs">{p.name}</p>
                          {p.isHandRaised && (
                            <span className="text-amber-400 text-xs animate-bounce" title="A levé la main">
                              <Hand size={13} />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {p.isHost ? (
                            <span className="inline-flex items-center gap-1"><Crown size={11} className="text-amber-400" /> {t('pro.live.host', 'Hôte')}</span>
                          ) : p.isSpeaker ? (
                            <span className="inline-flex items-center gap-1"><Mic size={11} className="text-purple-300" /> {t('pro.live.speaker', 'Sur scène')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Eye size={11} className="text-zinc-400" /> {t('pro.live.participant', 'Spectateur')}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {isReallyHost && !p.isHost && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Modérateur */}
                        <button
                          onClick={() => setUserRole(p.id, userRoles[String(p.id)] === 'moderator' ? 'viewer' : 'moderator')}
                          title={userRoles[String(p.id)] === 'moderator' ? 'Retirer rôle modérateur' : 'Nommer modérateur'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            userRoles[String(p.id)] === 'moderator'
                              ? 'bg-emerald-600/30 text-emerald-300'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <ShieldCheck size={13} />
                        </button>

                        {!p.isSpeaker ? (
                          <button
                            onClick={() => promoteToSpeaker(p.id, p.channel_name)}
                            title={t('pro.live.inviteToStage', 'Inviter à parler sur scène')}
                            className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                          >
                            <UserPlus size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => demoteSpeaker(p.id)}
                            title="Retirer de la scène"
                            className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 transition-colors"
                          >
                            <UserMinus size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => kickParticipant(p.id, p.name)}
                          title={t('pro.live.kickFromLive', 'Expulser du direct')}
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                        >
                          <UserX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL : REZIME FINISYON LIVE (POST-LIVE SUMMARY YOUTUBE STYLE) ─── */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-7 w-full max-w-md space-y-4 shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">Direct Terminé / Rezime Sesyon an</h2>
              <p className="text-xs text-zinc-400 truncate">{roomTitle}</p>
            </div>

            {/* YouTube Live Summary Stat Grid */}
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">⏱️ Durée du Direct</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {formatLiveDuration(elapsedSeconds)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">👥 Pic de Spectateurs</span>
                <span className="text-base font-extrabold text-blue-400 font-mono">
                  {Math.max(peakViewers, viewerCount)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">💬 Messages du Chat</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {chatMessages.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">💰 Dons & Super Chats</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  ${topDonors.reduce((acc, d) => acc + d.amount, 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* 98. Replay VOD Synchronisé avec le Chat */}
            <button
              type="button"
              onClick={() => {
                showToast("Synchronisation du Chat et du Replay activée !")
                navigate('/pro/events')
              }}
              className="w-full py-2.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Film size={14} />
              <span>Visionner le Replay VOD synchronisé</span>
            </button>

            {/* Évaluation & Feedback */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <p className="text-[11px] font-semibold text-zinc-300 text-center">
                Comment s'est passée votre expérience lors de ce direct ?
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star size={24} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                  </button>
                ))}
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Laissez un commentaire au créateur (optionnel)..."
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleRatingSubmit}
                disabled={isSubmittingRating}
                className="flex-1 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-50 font-bold text-xs text-white transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
              >
                {isSubmittingRating ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                <span>Envoyer l'évaluation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(false)
                  navigate('/pro/events')
                }}
                className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-bold text-xs text-zinc-300 transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: TERMINER LE DIRECT POUR TOUS */}
      <ConfirmModal
        isOpen={showEndLiveConfirm}
        title="Terminer la session en direct"
        message="Voulez-vous vraiment terminer le direct pour tous les participants ? Cette action coupera la diffusion et générera les statistiques."
        confirmText="Terminer le direct"
        cancelText="Continuer le direct"
        type="danger"
        onConfirm={executeEndLive}
        onCancel={() => setShowEndLiveConfirm(false)}
      />

      {/* ALERT MODAL: KICKED DU DIRECT */}
      <ConfirmModal
        isOpen={showKickedModal}
        title="Session interrompue"
        message="Vous avez été retiré(e) du direct par l'organisateur."
        confirmText="Retour aux événements"
        isAlert={true}
        type="warning"
        onConfirm={() => {
          setShowKickedModal(false)
          navigate('/pro/events')
        }}
      />

      {/* PAYWALL BARRIER POUR LES LIVES PAYANTS */}
      {requiresPaywall && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/30">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Direct Exclusif Payant
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-100">
                {eventData?.title || 'Accès Restreint au Live'}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {accessDenied.reason || "Ce direct est réservé aux participants munis d'un billet. Procurez-vous votre billet pour débloquer la diffusion vidéo et le chat interactif."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] text-zinc-400 font-medium">Tarif d'accès</span>
                <p className="text-base font-bold text-white">Billet d'entrée standard</p>
              </div>
              <span className="text-lg font-extrabold text-[#FF6B00]">
                {ticketPrice}$ USD
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Acheter un Billet ({ticketPrice}$)</span>
              </button>

              <button
                onClick={() => navigate('/pro/events')}
                className="w-full py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700/60 transition-colors"
              >
                Retourner aux événements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : PARAMÈTRES ET MODÉRATION DU CHAT ─── */}
      {showModSettings && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl">
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-zinc-400" />
                <h3 className="font-bold text-sm">Gestion et Modération du Chat</h3>
              </div>
              <button
                onClick={() => setShowModSettings(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Barre d'onglets */}
            <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 text-xs overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setActiveModSettingsTab('modes')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'modes'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Modes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModSettingsTab('words')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'words'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListFilter size={13} />
                <span>Mots interdits</span>
                {customBannedWords.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-700 text-zinc-300">
                    {customBannedWords.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModSettingsTab('premod')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'premod'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert size={13} />
                <span>File d'attente</span>
                {pendingApprovalMessages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pendingApprovalMessages.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModSettingsTab('audit')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'audit'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText size={13} />
                <span>Audit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModSettingsTab('users')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'users'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserCheck size={13} />
                <span>Sécurité</span>
                {chatReports.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                    {chatReports.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModSettingsTab('tools')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeModSettingsTab === 'tools'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Target size={13} />
                <span>Outils & Direct</span>
              </button>
            </div>

            {/* Corps du modal avec défilement */}
            <div className="max-h-[55vh] overflow-y-auto space-y-3.5 pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
              {/* ONGLET 1: MODES */}
              {activeModSettingsTab === 'modes' && (
                <div className="space-y-3">
                  {/* Mode Ralenti (Slow Mode) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      Mode Ralenti (Slow Mode)
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Intervalle obligatoire entre chaque message d'un participant.
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[0, 5, 15, 30, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setChatMode({ slow_mode_seconds: sec })}
                          className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            slowModeSeconds === sec
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sec === 0 ? 'Off' : `${sec}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Membres Uniquement */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Chat réservé aux membres</p>
                      <p className="text-[11px] text-zinc-400">Restreint les messages aux abonnés et modérateurs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatMode({ members_only: !membersOnly })}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        membersOnly ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          membersOnly ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 14. Followers-Only Mode */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Abonnés uniquement (Followers-Only)</p>
                      <p className="text-[11px] text-zinc-400">Seuls les abonnés du créateur peuvent envoyer des messages.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatMode({ followers_only: !followersOnly })}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        followersOnly ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          followersOnly ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 15. Emotes-Only Mode */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Émojis & Stickers uniquement</p>
                      <p className="text-[11px] text-zinc-400">Bloque le texte pur, n'autorise que les réactions et stickers EXILE.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatMode({ emotes_only: !emotesOnly })}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        emotesOnly ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          emotesOnly ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 29. Mode Pré-modération (Approval Queue) */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">File de pré-modération</p>
                      <p className="text-[11px] text-zinc-400">Chaque message doit être validé manuellement avant diffusion.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatMode({ pre_moderation: !preModeration })}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        preModeration ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          preModeration ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 42. Account Age Gate 24h */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Filtre anti-comptes récents (24h)</p>
                      <p className="text-[11px] text-zinc-400">Bloque les comptes créés il y a moins de 24 heures (anti-raid).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatMode({ account_age_gate: !accountAgeGate })}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        accountAgeGate ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          accountAgeGate ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 43. Mode Modérateur Furtif (Shadow Mode) */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Modération anonyme (Shadow Mode)</p>
                      <p className="text-[11px] text-zinc-400">Vos actions et messages s'affichent sous le nom « Modérateur ».</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsShadowModMode(!isShadowModMode)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        isShadowModMode ? 'bg-purple-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isShadowModMode ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Suspendre le chat (Pause / Freeze) - Hôte uniquement */}
                  {isReallyHost && (
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Suspendre le chat</p>
                        <p className="text-[11px] text-zinc-400">Verrouille temporairement l'envoi de messages.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleChatPause(!isChatPaused)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                          isChatPaused ? 'bg-amber-600' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            isChatPaused ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 2: MOTS INTERDITS PERSONNALISÉS */}
              {activeModSettingsTab === 'words' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">Ajouter un mot ou expression interdite</p>
                    <p className="text-[11px] text-zinc-400">
                      Les messages contenant ces termes seront automatiquement masqués par des étoiles.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomWordInput}
                      onChange={(e) => setNewCustomWordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const trimmed = newCustomWordInput.trim().toLowerCase()
                          if (trimmed && !customBannedWords.includes(trimmed)) {
                            updateCustomBannedWords([...customBannedWords, trimmed])
                            setNewCustomWordInput('')
                          }
                        }
                      }}
                      placeholder="Ex: arnaque, telegram, promo..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={!newCustomWordInput.trim()}
                      onClick={() => {
                        const trimmed = newCustomWordInput.trim().toLowerCase()
                        if (trimmed && !customBannedWords.includes(trimmed)) {
                          updateCustomBannedWords([...customBannedWords, trimmed])
                          setNewCustomWordInput('')
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <p className="text-[11px] font-semibold text-zinc-400">
                      Mots configurés pour ce live ({customBannedWords.length})
                    </p>
                    {customBannedWords.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic py-2">
                        Aucun mot personnalisé. Le dictionnaire standard et le filtre anti-toxicité restent actifs.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {customBannedWords.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => {
                                updateCustomBannedWords(customBannedWords.filter((_, i) => i !== idx))
                              }}
                              className="text-zinc-500 hover:text-red-400 transition-colors"
                              title="Supprimer ce mot"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ONGLET 3: PRÉ-MODÉRATION (APPROVAL QUEUE) */}
              {activeModSettingsTab === 'premod' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">File de messages en attente ({pendingApprovalMessages.length})</p>
                    <p className="text-[11px] text-zinc-400">
                      Validez ou rejetez les messages avant qu'ils n'apparaissent dans le chat public.
                    </p>
                  </div>

                  {pendingApprovalMessages.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 space-y-1">
                      <Check size={24} className="mx-auto text-emerald-500/60" />
                      <p className="text-xs">Aucun message en attente d'approbation.</p>
                      <p className="text-[10px] text-zinc-600">Activez le mode pré-modération dans l'onglet « Modes » pour filtrer.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingApprovalMessages.map((msg) => (
                        <div key={msg.id} className="p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-white">{formatHandle(msg.username || msg.user)}</span>
                            <span className="text-[10px] text-zinc-400">{msg.time}</span>
                          </div>
                          <p className="text-xs text-zinc-200 break-words">{msg.text}</p>
                          <div className="flex items-center gap-2 pt-1 border-t border-zinc-700/50">
                            <button
                              type="button"
                              onClick={() => approvePendingMessage(msg)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Check size={13} /> Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectPendingMessage(msg.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <X size={13} /> Rejeter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 4: JOURNAL D'AUDIT */}
              {activeModSettingsTab === 'audit' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">Journal d'audit de modération ({auditLog.length})</p>
                    <p className="text-[11px] text-zinc-400">
                      Historique en temps réel des actions de modération prises durant cette session.
                    </p>
                  </div>

                  {auditLog.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 space-y-1">
                      <FileText size={24} className="mx-auto text-zinc-600" />
                      <p className="text-xs">Aucune action de modération pour le moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {auditLog.slice().reverse().map((entry, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-zinc-200">{entry.action}</span>
                            <span className="text-[10px] text-zinc-500">{entry.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Par <span className="text-zinc-200 font-medium">{entry.by_username}</span>
                            {entry.target_username && (
                              <span> sur <span className="text-zinc-200 font-medium">{formatHandle(entry.target_username)}</span></span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 5: SÉCURITÉ & ACTIONS GLOBALES */}
              {activeModSettingsTab === 'users' && (
                <div className="space-y-3">
                  {/* Utilisateurs bannis */}
                  {bannedUserIds.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-zinc-200">Utilisateurs bannis ({bannedUserIds.length})</p>
                      <div className="max-h-24 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
                        {bannedUserIds.map((id) => (
                          <div key={id} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-800/80 text-xs">
                            <span className="text-zinc-300 font-mono text-[11px]">ID: {id}</span>
                            <button
                              type="button"
                              onClick={() => unbanUser(id, id)}
                              className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] transition-colors"
                            >
                              Débannir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File des signalements */}
                  {chatReports.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                      <p className="text-xs font-semibold text-red-300 flex items-center gap-1">
                        <Flag size={12} /> Signalements reçus ({chatReports.length})
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
                        {chatReports.map((rep, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-red-950/20 border border-red-800/30 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{formatHandle(rep.reportedUsername)}</span>
                              <span className="text-[10px] text-zinc-400">{rep.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 break-words">{rep.reason}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteChatMessage(rep.messageId)
                                  dismissReport(idx)
                                }}
                                className="px-2 py-0.5 rounded bg-red-800 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors"
                              >
                                Supprimer message
                              </button>
                              <button
                                type="button"
                                onClick={() => dismissReport(idx)}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition-colors"
                              >
                                Ignorer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Rapides */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-300">Actions et outils</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModSettings(false)
                          setShowAnalyticsModal(true)
                        }}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BarChart2 size={13} className="text-purple-400" />
                        <span>Statistiques</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportChat}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download size={13} className="text-emerald-400" />
                        <span>Exporter (.txt)</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowModSettings(false)
                        setShowCreatePollModal(true)
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <BarChart2 size={14} className="text-blue-400" />
                      <span>Créer un sondage en direct</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Voulez-vous vraiment effacer tous les messages du chat ?")) {
                          clearChat()
                          setShowModSettings(false)
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Effacer tout l'historique du chat</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ONGLET 6: OUTILS & DIRECT (INTERACTIVITÉ & MONÉTISATION) */}
              {activeModSettingsTab === 'tools' && (
                <div className="space-y-4">
                  {/* Item 70 & 81: Options Audio & Accessibilité */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Alertes Sonores & Accessibilité</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={toggleSoundAlerts}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                          isSoundAlertsEnabled ? 'bg-zinc-800 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800/40 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span>Effets sonores (Bips)</span>
                        <span className="text-[10px] font-bold font-mono">{isSoundAlertsEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleTts}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                          isTtsEnabled ? 'bg-zinc-800 border-blue-500/50 text-blue-300' : 'bg-zinc-800/40 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span>Lecture Vocale (TTS)</span>
                        <span className="text-[10px] font-bold font-mono">{isTtsEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 91. Jesyon Latans Odyo/Videyo vs Chat (Stream Delay Buffer) */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Tampon Anti-Spoil / Latence du Chat</p>
                      <p className="text-[11px] text-zinc-400">Synchronise l'affichage des messages du chat avec le décalage de transmission vidéo.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: 'Instantané', ms: 0 },
                        { label: '+2s', ms: 2000 },
                        { label: '+5s', ms: 5000 },
                        { label: '+10s', ms: 10000 },
                      ].map((item) => (
                        <button
                          key={item.ms}
                          type="button"
                          onClick={() => {
                            setStreamDelayMs(item.ms)
                            showToast(item.ms === 0 ? "Délai désactivé (instantané)" : `Délai du chat réglé sur ${item.ms / 1000}s`)
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                            streamDelayMs === item.ms
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item 71: Objectif de Financement (Goal Bar) */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Barre d'Objectif (Crowdfunding)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={goalInputTitle}
                        onChange={(e) => setGoalInputTitle(e.target.value)}
                        placeholder="Titre de l'objectif"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="number"
                        value={goalInputTarget}
                        onChange={(e) => setGoalInputTarget(e.target.value)}
                        placeholder="Montant cible ($)"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrowdfundingGoal(goalInputTitle, Number(goalInputTarget) || 100)
                        showToast("Objectif mis à jour !")
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
                    >
                      Définir l'Objectif
                    </button>
                  </div>

                  {/* Item 79: Épingler un Produit (Live Shopping) */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Produit Vedette (Live Shopping)</p>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={prodInputTitle}
                        onChange={(e) => setProdInputTitle(e.target.value)}
                        placeholder="Nom de l'article ou formation"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={prodInputPrice}
                          onChange={(e) => setProdInputPrice(e.target.value)}
                          placeholder="Prix ($)"
                          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={prodInputLink}
                          onChange={(e) => setProdInputLink(e.target.value)}
                          placeholder="Lien d'achat (URL)"
                          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!prodInputTitle.trim()}
                        onClick={() => {
                          pinProduct(prodInputTitle, prodInputPrice, prodInputLink)
                          showToast("Produit épinglé dans le direct !")
                        }}
                        className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                      >
                        Épingler ce Produit
                      </button>
                    </div>
                  </div>

                  {/* Item 75: Tirage au sort (Giveaway) */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Tirage au Sort (Giveaway)</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giveawayInputKeyword}
                        onChange={(e) => setGiveawayInputKeyword(e.target.value)}
                        placeholder="Mot-clé requis (ex: !cadeau)"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          startGiveaway(giveawayInputKeyword || '!cadeau')
                          showToast("Tirage au sort lancé !")
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0"
                      >
                        Lancer
                      </button>
                    </div>
                  </div>

                  {/* Item 76: Quiz / Trivia en direct */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Quiz / Trivia Éclair</p>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={triviaInputQ}
                        onChange={(e) => setTriviaInputQ(e.target.value)}
                        placeholder="Question du quiz"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={triviaInputA}
                          onChange={(e) => setTriviaInputA(e.target.value)}
                          placeholder="Réponse exacte attendue"
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="button"
                          disabled={!triviaInputQ.trim() || !triviaInputA.trim()}
                          onClick={() => {
                            startTrivia(triviaInputQ, triviaInputA)
                            showToast("Quiz lancé !")
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-40"
                        >
                          Démarrer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item 82: Duel A vs B */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">Duel A vs B (Vote Comparatif)</p>
                    <input
                      type="text"
                      value={duelInputQ}
                      onChange={(e) => setDuelInputQ(e.target.value)}
                      placeholder="Question du duel"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={duelInputA}
                        onChange={(e) => setDuelInputA(e.target.value)}
                        placeholder="Option A"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={duelInputB}
                        onChange={(e) => setDuelInputB(e.target.value)}
                        placeholder="Option B"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!duelInputQ.trim() || !duelInputA.trim() || !duelInputB.trim()}
                      onClick={() => {
                        startDuel(duelInputQ, duelInputA, duelInputB)
                        showToast("Duel interactif lancé !")
                      }}
                      className="w-full py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                    >
                      Lancer le Duel A vs B
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : CRÉER UN SONDAGE EN DIRECT ─── */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-400" />
                <h3 className="font-bold text-sm">Lancer un sondage en direct</h3>
              </div>
              <button
                onClick={() => setShowCreatePollModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Votre question</label>
                <input
                  type="text"
                  value={pollQuestionInput}
                  onChange={(e) => setPollQuestionInput(e.target.value)}
                  placeholder="Ex: Quel sujet souhaitez-vous approfondir ?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 block">Options de réponse (2 à 4)</label>
                {pollOptionInputs.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptionInputs]
                      updated[idx] = e.target.value
                      setPollOptionInputs(updated)
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                ))}

                {pollOptionInputs.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setPollOptionInputs([...pollOptionInputs, ''])}
                    className="text-[11px] text-blue-400 hover:underline pt-1 block"
                  >
                    + Ajouter une option
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreatePollModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={!pollQuestionInput.trim() || pollOptionInputs.filter(o => o.trim()).length < 2}
                onClick={() => {
                  createPoll(pollQuestionInput, pollOptionInputs)
                  setPollQuestionInput('')
                  setPollOptionInputs(['', ''])
                  setShowCreatePollModal(false)
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors"
              >
                Lancer le sondage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET MODAL */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false)
          const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
          if (cleanId) {
            fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`)
              .then(res => res.json())
              .then(data => setEventData(data))
              .catch(() => {})
          }
        }}
        eventId={String(eventId || '')}
        eventTitle={eventData?.title || eventData?.name || 'Direct EXILE'}
      />

      {/* ─── BOUTON FLOTTANT MODE FOCUS : ROUVRIR LE CHAT ─── */}
      {!isChatOpen && !showParticipantsTab && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="hidden md:flex fixed bottom-20 right-6 z-30 px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xl border border-zinc-700/80 backdrop-blur-md items-center gap-2 transition-all hover:scale-105 active:scale-95"
          title="Afficher le chat en direct"
        >
          <MessageSquare size={14} className="text-blue-400" />
          <span>Afficher le chat ({chatMessages.length})</span>
        </button>
      )}

      {/* ─── MODAL : FICHE PROFIL PARTICIPANT & MODÉRATION ─── */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Profil Participant</span>
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {selectedProfileUser.avatar ? (
                <img src={selectedProfileUser.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-200">
                  {selectedProfileUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">{selectedProfileUser.name}</p>
                <p className="text-xs text-zinc-400 truncate">{formatHandle(selectedProfileUser.username)}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {selectedProfileUser.role || 'Spectateur'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setNewMessage(`/w ${formatHandle(selectedProfileUser.username)} `)
                  setSelectedProfileUser(null)
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2 transition-colors font-medium"
              >
                <MessageSquare size={13} className="text-blue-400" /> Chuchoter en privé
              </button>

              {/* Voir le profil complet */}
              {selectedProfileUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(`/pro/profile/${selectedProfileUser.id}`, '_blank')
                    setSelectedProfileUser(null)
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2 transition-colors font-medium"
                >
                  <ExternalLink size={13} className="text-emerald-400" /> Voir le profil complet
                </button>
              )}

              {/* 84. Offrir un abonnement (Gift Sub) */}
              <button
                type="button"
                onClick={() => {
                  sendGiftSub(selectedProfileUser.username)
                  setSelectedProfileUser(null)
                  showToast(`Abonnement offert à @${selectedProfileUser.username} ! 🎁`)
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40 flex items-center gap-2 transition-colors font-medium"
              >
                <Gift size={13} /> Offrir un abonnement
              </button>

              {/* 8. Delege / Transfè Wòl Hôte pandan Live la */}
              {isReallyHost && selectedProfileUser.id && String(selectedProfileUser.id) !== String(myUserId) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Transférer les pleins pouvoirs d'hôte à ${formatHandle(selectedProfileUser.username)} ?`)) {
                      transferHost(selectedProfileUser.id!, selectedProfileUser.username)
                      setSelectedProfileUser(null)
                      showToast(`Rôle d'hôte transféré à ${formatHandle(selectedProfileUser.username)}`)
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/50 flex items-center gap-2 transition-colors font-medium"
                >
                  <Crown size={13} /> Transférer le rôle d'hôte
                </button>
              )}

              {canModerate && selectedProfileUser.id && String(selectedProfileUser.id) !== String(myUserId) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setWarningTarget({ id: selectedProfileUser.id!, username: selectedProfileUser.username })
                      setSelectedProfileUser(null)
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 flex items-center gap-2 transition-colors font-medium"
                  >
                    <AlertTriangle size={13} /> Envoyer un avertissement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      timeoutUser(selectedProfileUser.id!, selectedProfileUser.username, 300)
                      setSelectedProfileUser(null)
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-2 transition-colors font-medium"
                  >
                    <Clock size={13} /> Mettre en sourdine (5 min)
                  </button>

                  {/* 24. Purger tous les messages d'un utilisateur */}
                  {isSeniorMod && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Purger tous les messages envoyés par @${selectedProfileUser.username} ?`)) {
                          purgeUserMessages(selectedProfileUser.id!, selectedProfileUser.username)
                          setSelectedProfileUser(null)
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-900/30 text-red-300 border border-red-800/30 flex items-center gap-2 transition-colors font-medium"
                    >
                      <Trash2 size={13} /> Purger tous ses messages
                    </button>
                  )}

                  {/* Bannir du direct */}
                  {isSeniorMod && (
                    <button
                      type="button"
                      onClick={() => {
                        banUser(selectedProfileUser.id!, selectedProfileUser.username)
                        setSelectedProfileUser(null)
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 flex items-center gap-2 transition-colors font-medium"
                    >
                      <UserX size={13} /> Bannir du direct
                    </button>
                  )}

                  {/* 45. Gestion Niveaux Modération (Senior vs Junior vs VIP) */}
                  {isReallyHost && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Rôle dans le direct</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setUserRole(selectedProfileUser.id!, 'mod_senior')
                            setSelectedProfileUser(null)
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                            userRoles[selectedProfileUser.id!] === 'mod_senior' || userRoles[selectedProfileUser.id!] === 'moderator'
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                        >
                          🛡️ Mod Senior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserRole(selectedProfileUser.id!, 'mod_junior')
                            setSelectedProfileUser(null)
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                            userRoles[selectedProfileUser.id!] === 'mod_junior'
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                        >
                          🛡️ Mod Junior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserRole(selectedProfileUser.id!, 'vip')
                            setSelectedProfileUser(null)
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                            userRoles[selectedProfileUser.id!] === 'vip'
                              ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                        >
                          👑 VIP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserRole(selectedProfileUser.id!, 'viewer')
                            setSelectedProfileUser(null)
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                            !userRoles[selectedProfileUser.id!] || userRoles[selectedProfileUser.id!] === 'viewer'
                              ? 'bg-zinc-700/50 border-zinc-600 text-zinc-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Spectateur
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 7. Tit Kominotè Pèsonalize (Custom Community Badges / Titles) */}
                  {isReallyHost && selectedProfileUser.id && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Titre Communautaire Pèsonalize</p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="ex: Ekip Teknik, VIP Fondatè..."
                          defaultValue={communityTitles[String(selectedProfileUser.id)] || ''}
                          id={`custom-title-input-${selectedProfileUser.id}`}
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`custom-title-input-${selectedProfileUser.id}`) as HTMLInputElement
                            const val = el ? el.value.trim() : ''
                            setCommunityTitle(selectedProfileUser.id!, val)
                            setSelectedProfileUser(null)
                          }}
                          className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-semibold shrink-0"
                        >
                          Sauver
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : ENVOYER UN SUPER CHAT ─── */}
      {showSuperChatModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">Envoyer un Super Chat</h3>
              </div>
              <button
                onClick={() => setShowSuperChatModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[11px] text-zinc-400">
                Mettez en avant votre message et soutenez directement l'organisateur du live.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">Montant de la contribution</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 5, 10, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSuperChatAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        superChatAmount === amt
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Votre message mis en valeur</label>
                <textarea
                  value={superChatMessage}
                  maxLength={150}
                  onChange={(e) => setSuperChatMessage(e.target.value)}
                  placeholder="Écrivez votre message spécial pour le direct..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                />
                <span className="text-[9px] text-zinc-500 block text-right">{superChatMessage.length}/150</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSuperChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!superChatMessage.trim()}
                onClick={() => {
                  sendSuperChat(superChatAmount, superChatMessage.trim(), 'USD', superChatAmount >= 20 ? 'diamond' : superChatAmount >= 10 ? 'gold' : superChatAmount >= 5 ? 'silver' : 'bronze')
                  setSuperChatMessage('')
                  setShowSuperChatModal(false)
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <DollarSign size={13} />
                <span>Envoyer (${superChatAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : STATISTIQUES EN DIRECT DU CHAT ─── */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-purple-400" />
                <h3 className="font-bold text-sm">Statistiques du Chat en Direct</h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total Messages</span>
                <p className="text-xl font-bold text-white">{chatMessages.length}</p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Participants Actifs</span>
                <p className="text-xl font-bold text-blue-400">
                  {new Set(chatMessages.map(m => m.username || m.user)).size}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Questions Posées</span>
                <p className="text-xl font-bold text-amber-400">
                  {chatMessages.filter(m => m.isQuestion || m.text.startsWith('?') || m.text.startsWith('/q')).length}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Questions Répondues</span>
                <p className="text-xl font-bold text-emerald-400">
                  {answeredQuestionIds.length}
                </p>
              </div>

              {chatMessages.filter(m => m.isSuperChat).length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-0.5 col-span-2">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase">Total Super Chat Recueillis</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">
                    ${chatMessages.filter(m => m.isSuperChat).reduce((sum, m) => sum + (Number(m.superChatAmount) || 0), 0)} USD
                  </p>
                </div>
              )}
            </div>

            {activePoll && (
              <div className="p-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/60 space-y-1 text-xs">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Sondage Actif</span>
                <p className="font-semibold text-zinc-200 truncate">{activePoll.question}</p>
                <p className="text-[11px] text-zinc-400">{activePoll.totalVotes} votes enregistrés</p>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : SIGNALEMENT DE MESSAGE ─── */}
      {reportingMessage && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <Flag size={16} />
                <h3 className="font-bold text-sm">Signaler ce message</h3>
              </div>
              <button
                onClick={() => {
                  setReportingMessage(null)
                  setReportReason('')
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Signaler le message de <strong className="text-zinc-200">{formatHandle(reportingMessage.username)}</strong> aux modérateurs du direct.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 block">Motif du signalement</label>
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Propos haineux, spam, harcèlement..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setReportingMessage(null)
                  setReportReason('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!reportReason.trim()}
                onClick={() => {
                  reportMessage(reportingMessage.id, reportingMessage.username, reportReason.trim())
                  setReportingMessage(null)
                  setReportReason('')
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors"
              >
                Envoyer signalement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : ENVOYER UN AVERTISSEMENT ─── */}
      {warningTarget && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={16} />
                <h3 className="font-bold text-sm">Avertissement Officiel</h3>
              </div>
              <button
                onClick={() => {
                  setWarningTarget(null)
                  setWarningReason('')
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Envoyer un rappel officiel à l'ordre à <strong className="text-white">{formatHandle(warningTarget.username)}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 block">Raison de l'avertissement</label>
              <input
                type="text"
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                placeholder="Ex: Merci de respecter les règles du chat."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setWarningTarget(null)
                  setWarningReason('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!warningReason.trim()}
                onClick={() => {
                  warnUser(warningTarget.id, warningTarget.username, warningReason.trim())
                  setWarningTarget(null)
                  setWarningReason('')
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs shadow-md transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : CADEAUX VIRTUELS & SUPER STICKERS (ITEMS 68 & 74) ─── */}
      {showGiftsModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-purple-400" />
                <h3 className="font-bold text-sm">Cadeaux Virtuels & Super Stickers</h3>
              </div>
              <button
                onClick={() => setShowGiftsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">Micro-dons & Cadeaux Animés</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: '🎤', name: 'Micro', price: 0.50 },
                    { icon: '🌸', name: 'Fleur', price: 1.00 },
                    { icon: '❤️', name: 'Cœur Animé', price: 2.00 },
                    { icon: '👑', name: 'Couronne', price: 5.00 },
                    { icon: '🚀', name: 'Fusée', price: 10.00 },
                    { icon: '💎', name: 'Diamant', price: 20.00 },
                  ].map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sendVirtualGift(g.name, g.price, false)
                        setShowGiftsModal(false)
                        showToast(`Cadeau ${g.icon} ${g.name} envoyé avec succès !`)
                      }}
                      className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-[11px] font-semibold text-zinc-200">{g.name}</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">${g.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">Super Stickers Animés</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '🔥 SUPER HYPE', price: 1.50 },
                    { label: '👏 BRAVO CHAMPION', price: 2.50 },
                    { label: '🎉 AMBIANCE LIVE', price: 3.00 },
                    { label: '⭐ TOP LIVE', price: 5.00 },
                  ].map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sendVirtualGift(st.label, st.price, true)
                        setShowGiftsModal(false)
                        showToast(`Sticker ${st.label} envoyé !`)
                      }}
                      className="p-2 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/40 text-left transition-colors"
                    >
                      <span className="text-[11px] font-bold text-purple-200 block truncate">{st.label}</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">${st.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGiftsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : CLASSEMENT TOP DONATEURS (ITEM 72) ─── */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                <h3 className="font-bold text-sm">Classement des Meilleurs Donateurs</h3>
              </div>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2">
              {topDonors.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 space-y-1">
                  <Award size={28} className="mx-auto text-zinc-600" />
                  <p className="text-xs">Aucun donateur pour cette session pour le moment.</p>
                  <p className="text-[10px] text-zinc-600">Envoyez un Super Chat ou un cadeau pour apparaître sur le podium !</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {topDonors.map((d, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : idx === 1
                          ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200'
                          : idx === 2
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-zinc-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold truncate text-white">{formatHandle(d.username)}</span>
                      </div>
                      <span className="font-bold font-mono text-amber-300 shrink-0">
                        ${d.amount} USD
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SHEET : PLIS OUTIL MOBIL (TIKTOK / YOUTUBE STYLE) ─── */}
      {showMobileMoreTools && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-end justify-center p-0 animate-in fade-in sm:hidden">
          <div className="bg-zinc-900 border-t border-zinc-800 text-white rounded-t-3xl p-5 w-full space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-sm">Outils du Direct</h3>
              <button
                onClick={() => setShowMobileMoreTools(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Participants */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreTools(false)
                  setShowParticipantsTab(true)
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-300">Participants ({participants.length})</span>
              </button>

              {/* Partage d'écran */}
              {(isReallyHost || isSpeaker) && (
                <button
                  type="button"
                  onClick={() => {
                    toggleScreenShare()
                    setShowMobileMoreTools(false)
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Monitor size={18} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300">Écran</span>
                </button>
              )}

              {/* Lancer Prédiction */}
              {canModerate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreTools(false)
                    setShowPredictionModal(true)
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300">Prédictions</span>
                </button>
              )}

              {/* Lancer Sondage */}
              {canModerate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreTools(false)
                    setShowCreatePollModal(true)
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <BarChart2 size={18} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300">Sondages</span>
                </button>
              )}

              {/* Modération du chat */}
              {canModerate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreTools(false)
                    setShowModSettings(true)
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <SlidersHorizontal size={18} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300">Modération</span>
                </button>
              )}

              {/* Popout Chat */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreTools(false)
                  openPopoutChat()
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Film size={18} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-300">Popout</span>
              </button>

              {/* Top Donateurs */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreTools(false)
                  setShowLeaderboardModal(true)
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                  <Award size={18} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-300">Classement</span>
              </button>

              {/* Points Fidélité */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreTools(false)
                  setShowRewardsModal(true)
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Coins size={18} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-300">Points ({channelPoints})</span>
              </button>

              {/* Cadeaux */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreTools(false)
                  setShowGiftsModal(true)
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Gift size={18} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-300">Cadeaux</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowMobileMoreTools(false)}
                className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SHEET : PARTICIPANTS MOBILE (TIKTOK / YOUTUBE STYLE) ─── */}
      {showParticipantsTab && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-end justify-center p-0 animate-in fade-in md:hidden">
          <div className="bg-zinc-900 border-t border-zinc-800 text-white rounded-t-3xl p-5 w-full space-y-4 shadow-2xl max-h-[75vh] flex flex-col">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 mb-2" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users size={16} className="text-purple-400" />
                <span>Participants au direct ({participants.length})</span>
              </h3>
              <button
                onClick={() => setShowParticipantsTab(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
              {participants.map((p) => (
                <div
                  key={p.channel_name || p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-xs gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {p.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white truncate text-xs">{p.name}</p>
                        {p.isHandRaised && (
                          <span className="text-amber-400 text-xs animate-bounce" title="A levé la main">
                            <Hand size={13} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {p.isHost ? (
                          <span className="inline-flex items-center gap-1"><Crown size={11} className="text-amber-400" /> Hôte</span>
                        ) : p.isSpeaker ? (
                          <span className="inline-flex items-center gap-1"><Mic size={11} className="text-purple-300" /> Sur scène</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><Eye size={11} className="text-zinc-400" /> Spectateur</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isReallyHost && !p.isHost && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setUserRole(p.id, userRoles[String(p.id)] === 'moderator' ? 'viewer' : 'moderator')}
                        title={userRoles[String(p.id)] === 'moderator' ? 'Retirer rôle modérateur' : 'Nommer modérateur'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          userRoles[String(p.id)] === 'moderator'
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <ShieldCheck size={13} />
                      </button>

                      {!p.isSpeaker ? (
                        <button
                          onClick={() => promoteToSpeaker(p.id, p.channel_name)}
                          title="Inviter sur scène"
                          className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40"
                        >
                          <UserPlus size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => demoteSpeaker(p.id)}
                          title="Retirer de la scène"
                          className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/40"
                        >
                          <UserMinus size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => kickParticipant(p.id, p.name)}
                        title="Expulser"
                        className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40"
                      >
                        <UserX size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowParticipantsTab(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL INPUT CHAT MOBIL (YOUTUBE LIVE MOBILE STANDARD) ─── */}
      {showMobileChatInput && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-in fade-in">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowMobileChatInput(false)}
          />

          {/* Stable Bottom Bar pinned above keyboard */}
          <div className="relative z-10 bg-zinc-950/98 border-t border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
            <form
              onSubmit={(e) => {
                handleSendMessage(e)
                setShowMobileChatInput(false)
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newMessage}
                  maxLength={200}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Commenter en direct... (max 200)"
                  autoFocus
                  className="w-full pl-4 pr-16 py-2.5 bg-zinc-900 border border-zinc-700 rounded-full text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 shadow-inner"
                />
                {/* YouTube Live style Character Counter */}
                <span
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none ${
                    newMessage.length >= 180 ? 'text-amber-400 font-bold' : 'text-zinc-500'
                  }`}
                >
                  {newMessage.length}/200
                </span>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-md active:scale-95 transition-all shrink-0"
                title="Envoyer"
              >
                <Send size={15} />
              </button>
              <button
                type="button"
                onClick={() => setShowMobileChatInput(false)}
                className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shadow-md active:scale-95 transition-all shrink-0"
                title="Fermer"
              >
                <X size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL : CRÉER UNE PRÉDICTION (ITEM 63) ─── */}
      {showPredictionModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">Lancer une Prédiction en Direct</h3>
              </div>
              <button
                onClick={() => setShowPredictionModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Question de la prédiction</label>
                <input
                  type="text"
                  value={predictionInputQ}
                  onChange={(e) => setPredictionInputQ(e.target.value)}
                  placeholder="Ex : Est-ce que l'équipe bleue va remporter la manche ?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-blue-400 block mb-1">Option A</label>
                  <input
                    type="text"
                    value={predictionInputA}
                    onChange={(e) => setPredictionInputA(e.target.value)}
                    placeholder="Oui"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1">Option B</label>
                  <input
                    type="text"
                    value={predictionInputB}
                    onChange={(e) => setPredictionInputB(e.target.value)}
                    placeholder="Non"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Durée du vote</label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 120, 300].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setPredictionDuration(sec)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        predictionDuration === sec
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowPredictionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!predictionInputQ.trim() || !predictionInputA.trim() || !predictionInputB.trim()}
                onClick={() => {
                  startPrediction(predictionInputQ.trim(), predictionInputA.trim(), predictionInputB.trim(), predictionDuration)
                  setShowPredictionModal(false)
                  setPredictionInputQ('')
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs shadow-md transition-colors"
              >
                Lancer la prédiction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL : POINTS DE FIDÉLITÉ & RÉCOMPENSES (ITEMS 64 & 65) ─── */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">Boutique de Points de Fidélité</h3>
              </div>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Solde de points */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Votre Solde Actuel</span>
                <p className="text-xl font-black text-white font-mono">{channelPoints} <span className="text-xs font-normal text-amber-300">PTS</span></p>
              </div>
              <Coins size={28} className="text-amber-400" />
            </div>
            <p className="text-[10px] text-zinc-400">
              Vous recevez automatiquement +10 points toutes les 5 minutes de visionnage !
            </p>

            {/* Liste des Récompenses */}
            <div className="space-y-2">
              {[
                { title: 'Message mis en valeur (Highlight)', desc: 'Mettez votre message en surbrillance dorée pour tous', cost: 100, icon: '🌟' },
                { title: 'Débloquer un sticker exclusif', desc: 'Utilisez un sticker exclusif dans le chat', cost: 200, icon: '🎨' },
                { title: 'Badge VIP temporaire', desc: 'Obtenez un badge VIP pour toute la durée du live', cost: 500, icon: '👑' },
              ].map((reward, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{reward.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-xs">{reward.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{reward.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={channelPoints < reward.cost}
                    onClick={() => {
                      const success = redeemReward(reward.cost, reward.title)
                      if (success) setShowRewardsModal(false)
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-black font-bold text-[11px] font-mono shrink-0 transition-colors"
                  >
                    {reward.cost} pts
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRewardsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
