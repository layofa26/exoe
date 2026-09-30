import { useState, useEffect, useRef, useCallback } from 'react'

// 89. Chifreman & Sekirite Transpò Fòse (Strict WSS / TLS Enforcement)
const getWsBase = () => {
  let base = import.meta.env.VITE_WS_URL
  if (base) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('ws://')) {
      base = base.replace(/^ws:\/\//, 'wss://')
    }
    return base
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}`
  }
  return 'ws://localhost:8000'
}
const WS_BASE = getWsBase()

export interface Participant {
  id: string
  name: string
  username: string
  avatar?: string | null
  isHost?: boolean
  isSpeaker?: boolean
  isHandRaised?: boolean
  channel_name?: string
}

export interface LivePollOption {
  text: string
  votes: number
}

export interface LivePoll {
  id: string | number
  question: string
  options: LivePollOption[]
  totalVotes: number
  hasVoted?: number | null
  active: boolean
}

export interface LiveChatMessage {
  id: string | number
  clientId?: string
  user_id?: string
  user: string
  username: string
  avatar?: string | null
  text: string
  isHost: boolean
  isSpeaker: boolean
  role?: 'host' | 'moderator' | 'vip' | 'subscriber' | 'viewer'
  replyTo?: {
    id: string | number
    user: string
    text: string
  }
  isPinned?: boolean
  isQuestion?: boolean
  isAnswered?: boolean
  isWhisper?: boolean
  whisperTarget?: string
  isSuperChat?: boolean
  superChatAmount?: number
  superChatCurrency?: string
  superChatTier?: 'bronze' | 'silver' | 'gold' | 'diamond'
  isSystem?: boolean
  time: string
  status?: 'sending' | 'sent' | 'failed'
  isPendingApproval?: boolean
  isVerified?: boolean
  loyaltyMonths?: number
  voiceAudio?: string
  voiceDuration?: number
  upvotes?: number
  isGiftSub?: boolean
  isSubAlert?: boolean
  customTitle?: string
  serverTimeMs?: number
}

export interface AuditLogEntry {
  action: string
  by: string
  target?: string
  timestamp: string
}

export interface ChatReport {
  messageId: string | number
  reportedUsername: string
  reporterUsername: string
  reason: string
  timestamp: string
}

export interface ReactionItem {
  id: number
  emoji: string
  x: number
}

interface UseLiveWebRTCOptions {
  eventId: string | number
  initialIsHost?: boolean
  onStreamEnded?: () => void
  onKicked?: (name: string) => void
  onToast?: (msg: string) => void
  onAccessDenied?: (reason: string, isPaid: boolean) => void
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useLiveWebRTC({
  eventId,
  initialIsHost = false,
  onStreamEnded,
  onKicked,
  onToast,
  onAccessDenied,
}: UseLiveWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [accessDenied, setAccessDenied] = useState<{ isDenied: boolean; reason: string; isPaid: boolean }>({
    isDenied: false,
    reason: '',
    isPaid: false,
  })
  const [isHost, setIsHost] = useState(initialIsHost)
  const [isSpeaker, setIsSpeaker] = useState(initialIsHost)

  useEffect(() => {
    setIsHost(Boolean(initialIsHost))
    setIsSpeaker(Boolean(initialIsHost))
  }, [initialIsHost])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myChannel, setMyChannel] = useState<string | null>(null)

  const [viewerCount, setViewerCount] = useState(1)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'welcome',
      user: 'Système',
      username: 'system',
      text: 'Bienvenue dans le direct ! Posez vos questions et interagissez en temps réel.',
      isHost: true,
      isSpeaker: false,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    },
  ])
  const [reactions, setReactions] = useState<ReactionItem[]>([])
  const [isHandRaised, setIsHandRaised] = useState(false)

  // ─── Live Chat Advanced Features State ───
  const [reconnectKey, setReconnectKey] = useState(0)
  const reconnect = useCallback(() => {
    setReconnectKey(k => k + 1)
  }, [])
  const [pinnedMessage, setPinnedMessage] = useState<LiveChatMessage | null>(null)
  const [slowModeSeconds, setSlowModeSeconds] = useState<number>(0)
  const [membersOnly, setMembersOnly] = useState<boolean>(false)
  const [followersOnly, setFollowersOnly] = useState<boolean>(false)
  const [emotesOnly, setEmotesOnly] = useState<boolean>(false)
  const [preModeration, setPreModeration] = useState<boolean>(false)
  const [accountAgeGate, setAccountAgeGate] = useState<boolean>(false)
  const [customBannedWords, setCustomBannedWords] = useState<string[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [pendingApprovalMessages, setPendingApprovalMessages] = useState<LiveChatMessage[]>([])
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null)
  const [userRoles, setUserRoles] = useState<Record<string, 'moderator' | 'mod_senior' | 'mod_junior' | 'vip' | 'viewer'>>({})
  const [isMutedUntil, setIsMutedUntil] = useState<number | null>(null)
  const [isBanned, setIsBanned] = useState<boolean>(false)
  const [myUsername, setMyUsername] = useState<string | null>(null)
  const myUsernameRef = useRef<string | null>(null)
  const [isChatPaused, setIsChatPaused] = useState<boolean>(false)
  const [bannedUserIds, setBannedUserIds] = useState<string[]>([])
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<(string | number)[]>([])
  const [chatReports, setChatReports] = useState<ChatReport[]>([])
  const [warningNotice, setWarningNotice] = useState<{ message: string; by: string } | null>(null)

  // 67. Upvotes per question: id -> count
  const [questionUpvotes, setQuestionUpvotes] = useState<Record<string, number>>({})
  const [upvotedQuestionIds, setUpvotedQuestionIds] = useState<string[]>([])

  // 71. Crowdfunding goal
  const [crowdfundingGoal, setCrowdfundingGoal] = useState<{
    title: string
    target: number
    current: number
    active: boolean
  }>({ title: 'Objectif du direct', target: 500, current: 0, active: false })

  // 72. Top Donors leaderboard
  const [topDonors, setTopDonors] = useState<Array<{ username: string; amount: number; avatar?: string }>>([])

  // 75. Giveaway
  const [giveawayState, setGiveawayState] = useState<{
    active: boolean
    keyword: string
    participants: string[]
    winner: string | null
  }>({ active: false, keyword: '!cadeau', participants: [], winner: null })

  // 76. Trivia / Quiz
  const [triviaState, setTriviaState] = useState<{
    active: boolean
    question: string
    answer?: string
    winner: string | null
  }>({ active: false, question: '', winner: null })

  // 79. Pinned Product
  const [pinnedProduct, setPinnedProduct] = useState<{
    title: string
    price: number | string
    image?: string
    link?: string
  } | null>(null)

  // 82. Visual Duel (A vs B)
  const [activeDuel, setActiveDuel] = useState<{
    active: boolean
    question: string
    optionA: string
    optionB: string
    votesA: number
    votesB: number
    userVoted?: 'A' | 'B'
  } | null>(null)

  // 83. Sub alert banner
  const [subAlert, setSubAlert] = useState<{
    username: string
    tier: string
    giftedBy?: string
  } | null>(null)

  // 69. Celebration burst
  const [celebrationBurst, setCelebrationBurst] = useState<{ donor: string; amount: number } | null>(null)

  // 70. TTS & 81. Sound alerts toggles
  const [isTtsEnabled, setIsTtsEnabled] = useState(true)
  const [isSoundAlertsEnabled, setIsSoundAlertsEnabled] = useState(true)

  // 87. Server Timestamp Sync (Clock drift)
  const serverTimeOffsetRef = useRef<number>(0)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)

  // 88. Chat Sharding (Segmented channel)
  const [shardId, setShardId] = useState<number | null>(null)

  // 91. Stream Delay Buffer (ms)
  const [streamDelayMs, setStreamDelayMs] = useState<number>(0)

  // 7. Custom Community Titles (userId -> customTitle)
  const [communityTitles, setCommunityTitles] = useState<Record<string, string>>({})
  const communityTitlesRef = useRef<Record<string, string>>({})
  communityTitlesRef.current = communityTitles

  // 96. Overlay Chat Mode
  const [isChatOverlayMode, setIsChatOverlayMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('exile_chat_overlay') === 'true'
    } catch {
      return false
    }
  })

  // 63. Prediksyon & Paryaj sou Stream la (Live Predictions)
  const [predictionState, setPredictionState] = useState<{
    id?: string
    question?: string
    optionA?: string
    optionB?: string
    votesA: number
    votesB: number
    totalPointsA: number
    totalPointsB: number
    endsAt?: number
    status: 'idle' | 'active' | 'resolved'
    winner?: 'a' | 'b' | 'cancel'
    myVote?: { choice: 'a' | 'b'; points: number }
  }>({
    votesA: 0,
    votesB: 0,
    totalPointsA: 0,
    totalPointsB: 0,
    status: 'idle',
  })

  // 64 & 65. Sistèm Pwen Fidelite Espektatè (Channel Points & Rewards)
  const [channelPoints, setChannelPoints] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('exile_user_channel_points')
      return stored ? parseInt(stored, 10) : 120
    } catch {
      return 120
    }
  })

  // 84. File Datant Mesaj Lè Rezo Koupe (Offline Message Queue / Buffer)
  const offlineMessageQueueRef = useRef<Array<{ type: string; [key: string]: any }>>([])

  // Local media stream (Camera / Mic)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  // Remote stream (Viewer receives Host's or Speakers' stream)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Device management & camera switching (Front vs Back camera)
  const [availableDevices, setAvailableDevices] = useState<{
    videoDevices: MediaDeviceInfo[]
    audioDevices: MediaDeviceInfo[]
  }>({ videoDevices: [], audioDevices: [] })
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null)
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const facingModeRef = useRef<'user' | 'environment'>('user')

  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const viewerPeerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const isHostRef = useRef(initialIsHost)
  const isSpeakerRef = useRef(initialIsHost)
  const myChannelRef = useRef<string | null>(null)

  const onToastRef = useRef(onToast)
  onToastRef.current = onToast

  const onStreamEndedRef = useRef(onStreamEnded)
  onStreamEndedRef.current = onStreamEnded

  const onKickedRef = useRef(onKicked)
  onKickedRef.current = onKicked

  const onAccessDeniedRef = useRef(onAccessDenied)
  onAccessDeniedRef.current = onAccessDenied

  const loadChatHistory = useCallback((history: LiveChatMessage[]) => {
    if (!history || history.length === 0) return
    setChatMessages(prev => {
      const existingIds = new Set(prev.map(m => String(m.id)))
      const newItems = history.filter(m => !existingIds.has(String(m.id)))
      return [...newItems, ...prev]
    })
  }, [])

  useEffect(() => {
    isHostRef.current = isHost
  }, [isHost])

  useEffect(() => {
    isSpeakerRef.current = isSpeaker
  }, [isSpeaker])

  // ─── Helper: Send WebSocket payload (84. Offline Buffer) ───
  const sendWS = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      // 84. File Datant Mesaj Lè Rezo Koupe (Offline Message Queue / Buffer)
      offlineMessageQueueRef.current.push(data)
    }
  }, [])

  // 64 & 65. Channel Points Watch Timer (+10 pts every 5 min)
  useEffect(() => {
    const timer = setInterval(() => {
      setChannelPoints(prev => {
        const next = prev + 10
        try {
          localStorage.setItem('exile_user_channel_points', String(next))
        } catch {}
        onToastRef.current?.('+10 points de fidélité gagnés ! 🪙')
        return next
      })
    }, 300000)
    return () => clearInterval(timer)
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const video = devices.filter(d => d.kind === 'videoinput')
      const audio = devices.filter(d => d.kind === 'audioinput')
      setAvailableDevices({ videoDevices: video, audioDevices: audio })
    } catch (err) {
      console.warn('Could not enumerate devices:', err)
    }
  }, [])

  // ─── 1. Initialize Local Media (Camera & Mic) with progressive fallback ───
  const startLocalMedia = useCallback(async (opts?: {
    videoDeviceId?: string
    audioDeviceId?: string
    facingMode?: 'user' | 'environment'
  }) => {
    if (localStreamRef.current && !opts) {
      return localStreamRef.current
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('NotSupported')
      onToastRef.current?.('Votre navigateur ne supporte pas l’accès caméra/micro (utiliser HTTPS ou localhost).')
      return null
    }

    const targetFacing = opts?.facingMode || facingModeRef.current || 'user'
    setFacingMode(targetFacing)
    facingModeRef.current = targetFacing

    const markGranted = () => {
      try {
        localStorage.setItem('exoe_media_permissions_granted', 'true')
      } catch {}
    }

    const videoConstraint: MediaTrackConstraints | boolean = opts?.videoDeviceId
      ? { deviceId: { exact: opts.videoDeviceId } }
      : {
          facingMode: targetFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }

    const audioConstraint: MediaTrackConstraints | boolean = opts?.audioDeviceId
      ? {
          deviceId: { exact: opts.audioDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }

    // Attempt 1: Full Camera + Microphone with ideal constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: audioConstraint,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      setMediaError(null)
      markGranted()
      refreshDevices().catch(() => {})
      return stream
    } catch (bothErr) {
      console.warn('Could not get optimal video + audio, trying relaxed constraints:', bothErr)

      // Attempt 2: Relaxed video + standard audio
      try {
        const stream2 = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: true,
        })
        localStreamRef.current = stream2
        setLocalStream(stream2)
        setMediaError(null)
        markGranted()
        refreshDevices().catch(() => {})
        return stream2
      } catch (relaxedErr) {
        console.warn('Could not get relaxed video + audio, trying video only:', relaxedErr)

        // Attempt 3: Video only (if microphone is missing or in use)
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: false,
          })
          localStreamRef.current = videoOnly
          setLocalStream(videoOnly)
          setIsMuted(true)
          setMediaError(null)
          markGranted()
          refreshDevices().catch(() => {})
          return videoOnly
        } catch (videoErr) {
          console.warn('Could not get video, trying audio only:', videoErr)

          // Attempt 4: Audio only (if camera is missing or in use)
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            })
            localStreamRef.current = audioOnly
            setLocalStream(audioOnly)
            setIsVideoOff(true)
            setMediaError(null)
            markGranted()
            refreshDevices().catch(() => {})
            return audioOnly
          } catch (err: any) {
            console.warn('All getUserMedia attempts failed:', err)
            const errName = err?.name || 'PermissionDenied'
            setMediaError(errName)
            // No disruptive duplicate toasts - clean in-canvas UI handles it smoothly
            return null
          }
        }
      }
    }
  }, [refreshDevices])

  // ─── Flip Camera (Front vs Back) seamlessly with WebRTC replaceTrack ───
  const switchCamera = useCallback(async () => {
    const nextFacing = facingModeRef.current === 'user' ? 'environment' : 'user'
    facingModeRef.current = nextFacing
    setFacingMode(nextFacing)

    if (!localStreamRef.current) {
      return
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
        },
        audio: false,
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      if (!newVideoTrack) return

      // Stop old video track
      const oldTracks = localStreamRef.current.getVideoTracks()
      oldTracks.forEach(t => {
        t.stop()
        localStreamRef.current?.removeTrack(t)
      })

      localStreamRef.current.addTrack(newVideoTrack)

      // Replace track on all active peer senders without renegotiation
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) {
          sender.replaceTrack(newVideoTrack).catch(e => console.warn('replaceTrack error:', e))
        }
      })

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
      onToastRef.current?.(nextFacing === 'user' ? 'Caméra avant activée' : 'Caméra arrière activée')
    } catch (err) {
      console.warn('Switch camera error:', err)
      onToastRef.current?.('Impossible de basculer la caméra sur cet appareil.')
    }
  }, [])

  // ─── Select specific video device (Webcam 1, Webcam 2...) ───
  const selectVideoDevice = useCallback(async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId)
    if (!localStreamRef.current) return
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      })
      const newVideoTrack = newStream.getVideoTracks()[0]
      if (!newVideoTrack) return

      localStreamRef.current.getVideoTracks().forEach(t => {
        t.stop()
        localStreamRef.current?.removeTrack(t)
      })
      localStreamRef.current.addTrack(newVideoTrack)

      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) {
          sender.replaceTrack(newVideoTrack).catch(e => console.warn('replaceTrack error:', e))
        }
      })

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
      onToastRef.current?.('Périphérique vidéo modifié.')
    } catch (err) {
      console.warn('Select video device error:', err)
    }
  }, [])

  // ─── Select specific audio device (Microphone 1, Microphone 2...) ───
  const selectAudioDevice = useCallback(async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId)
    if (!localStreamRef.current) return
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: deviceId } },
      })
      const newAudioTrack = newStream.getAudioTracks()[0]
      if (!newAudioTrack) return

      localStreamRef.current.getAudioTracks().forEach(t => {
        t.stop()
        localStreamRef.current?.removeTrack(t)
      })
      localStreamRef.current.addTrack(newAudioTrack)

      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio')
        if (sender) {
          sender.replaceTrack(newAudioTrack).catch(e => console.warn('replaceTrack error:', e))
        }
      })

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
      onToastRef.current?.('Microphone modifié.')
    } catch (err) {
      console.warn('Select audio device error:', err)
    }
  }, [])

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
      setIsScreenSharing(false)
    }
  }, [])

  // ─── 2. Host: Create Peer Connection for incoming viewer ───
  const handleHostCreateOfferForViewer = useCallback(async (viewerChannel: string) => {
    if (!localStreamRef.current) {
      await startLocalMedia()
    }
    const stream = localStreamRef.current
    if (!stream) return

    // Close existing connection to this viewer if any
    if (peersRef.current.has(viewerChannel)) {
      peersRef.current.get(viewerChannel)?.close()
      peersRef.current.delete(viewerChannel)
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    peersRef.current.set(viewerChannel, pc)

    // Add local tracks (camera or screen share) with optimized bitrate for mesh
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream)
      if (track.kind === 'video' && sender && sender.getParameters) {
        try {
          const params = sender.getParameters()
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}]
          }
          params.encodings[0].maxBitrate = 900000 // 900 kbps max per viewer
          sender.setParameters(params).catch(() => {})
        } catch {}
      }
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWS({
          type: 'webrtc.signal',
          signal_type: 'candidate',
          payload: event.candidate,
          target_channel: viewerChannel,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(viewerChannel)
      }
    }

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendWS({
        type: 'webrtc.signal',
        signal_type: 'offer',
        payload: offer,
        target_channel: viewerChannel,
      })
    } catch (e) {
      console.error('Error creating offer for viewer:', e)
    }
  }, [sendWS, startLocalMedia])

  // ─── 3. Viewer: Handle incoming offer from Host ───
  const handleViewerReceiveOffer = useCallback(async (offer: RTCSessionDescriptionInit, senderChannel: string) => {
    if (viewerPeerRef.current) {
      viewerPeerRef.current.close()
      viewerPeerRef.current = null
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    viewerPeerRef.current = pc

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWS({
          type: 'webrtc.signal',
          signal_type: 'candidate',
          payload: event.candidate,
          target_channel: senderChannel,
        })
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendWS({
        type: 'webrtc.signal',
        signal_type: 'answer',
        payload: answer,
        target_channel: senderChannel,
      })
    } catch (e) {
      console.error('Error handling offer on viewer:', e)
    }
  }, [sendWS])

  const handleHostCreateOfferForViewerRef = useRef(handleHostCreateOfferForViewer)
  handleHostCreateOfferForViewerRef.current = handleHostCreateOfferForViewer

  const handleViewerReceiveOfferRef = useRef(handleViewerReceiveOffer)
  handleViewerReceiveOfferRef.current = handleViewerReceiveOffer

  const startLocalMediaRef = useRef(startLocalMedia)
  startLocalMediaRef.current = startLocalMedia

  // ─── 4. Main WebSocket Connection ───
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || ''
    const cleanEventId = String(eventId).replace('exile-', '').replace('evt_', '')
    if (!cleanEventId) return

    const wsUrl = `${WS_BASE}/ws/live/${cleanEventId}/?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // 84. File Datant Mesaj Lè Rezo Koupe (Offline Message Queue / Buffer)
      if (offlineMessageQueueRef.current.length > 0) {
        const queued = [...offlineMessageQueueRef.current]
        offlineMessageQueueRef.current = []
        queued.forEach(payload => {
          try {
            ws.send(JSON.stringify(payload))
          } catch {}
        })
        onToastRef.current?.(`${queued.length} message(s) hors-ligne envoyé(s) !`)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = (e) => {
      console.error('Live WebSocket error:', e)
      setIsConnected(false)
    }

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'live.welcome': {
            setMyUserId(msg.user_id)
            setMyUsername(msg.username || null)
            myUsernameRef.current = msg.username || null
            setMyChannel(msg.my_channel)
            myChannelRef.current = msg.my_channel
            const hostFlag = Boolean(msg.is_host)
            setIsHost(hostFlag)
            isHostRef.current = hostFlag
            setIsSpeaker(Boolean(msg.is_speaker))
            isSpeakerRef.current = Boolean(msg.is_speaker)
            if (msg.roster) {
              setParticipants(msg.roster)
            }
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }
            // 87. Server Timestamp Sync (Clock drift) & 88. Chat Sharding
            if (typeof msg.server_time_ms === 'number') {
              const drift = msg.server_time_ms - Date.now()
              serverTimeOffsetRef.current = drift
              setServerTimeOffset(drift)
            }
            if (typeof msg.shard_id === 'number') {
              setShardId(msg.shard_id)
            }

            // If Host, start local camera stream automatically
            if (hostFlag) {
              await startLocalMediaRef.current()
            } else {
              // Viewer asks Host for WebRTC stream
              sendWS({
                type: 'webrtc.signal',
                signal_type: 'request_stream',
              })
            }
            break
          }

          case 'live.user_joined': {
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }
            if (msg.participant) {
              setParticipants(prev => {
                const exists = prev.some(p => p.channel_name === msg.participant.channel_name || p.id === msg.participant.id)
                if (exists) return prev
                return [...prev, msg.participant]
              })
              // If we are Host, create WebRTC offer for this new viewer!
              if (isHostRef.current && msg.participant.channel_name) {
                handleHostCreateOfferForViewerRef.current(msg.participant.channel_name)
              }
              if (msg.participant && msg.participant.name) {
                setChatMessages(prev => [
                  ...prev,
                  {
                    id: `sys_join_${Date.now()}_${Math.random()}`,
                    user: 'Système',
                    username: 'system',
                    text: `${msg.participant.name} a rejoint le direct`,
                    isHost: false,
                    isSpeaker: false,
                    isSystem: true,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    status: 'sent',
                  },
                ])
              }
            }
            break
          }

          case 'live.user_left': {
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }
            if (msg.channel_name) {
              setParticipants(prev => prev.filter(p => p.channel_name !== msg.channel_name))
              if (peersRef.current.has(msg.channel_name)) {
                peersRef.current.get(msg.channel_name)?.close()
                peersRef.current.delete(msg.channel_name)
              }
            }
            if (msg.is_host) {
              onToastRef.current?.("L'hôte a quitté le direct.")
              setRemoteStream(null)
            }
            break
          }

          case 'webrtc.signal': {
            const { signal_type, payload, sender_channel } = msg

            if (signal_type === 'request_stream') {
              // Only Host responds to stream requests
              if (isHostRef.current && sender_channel) {
                handleHostCreateOfferForViewerRef.current(sender_channel)
              }
            } else if (signal_type === 'offer') {
              // Viewer receives Host's offer
              if (!isHostRef.current && payload && sender_channel) {
                handleViewerReceiveOfferRef.current(payload, sender_channel)
              }
            } else if (signal_type === 'answer') {
              // Host receives viewer's answer
              if (isHostRef.current && sender_channel && peersRef.current.has(sender_channel)) {
                const pc = peersRef.current.get(sender_channel)
                if (pc) {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload))
                }
              }
            } else if (signal_type === 'candidate') {
              // Add ICE Candidate
              if (isHostRef.current && sender_channel && peersRef.current.has(sender_channel)) {
                const pc = peersRef.current.get(sender_channel)
                if (pc && payload) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload))
                  } catch {}
                }
              } else if (!isHostRef.current && viewerPeerRef.current && payload) {
                try {
                  await viewerPeerRef.current.addIceCandidate(new RTCIceCandidate(payload))
                } catch {}
              }
            }
            break
          }

          case 'live.chat_message': {
            setChatMessages(prev => {
              const customTitle = msg.custom_title || (msg.user_id ? communityTitlesRef.current[String(msg.user_id)] : undefined)
              const msgTime = msg.time || new Date(Date.now() + serverTimeOffsetRef.current).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

              if (msg.client_id) {
                const idx = prev.findIndex(m => m.clientId === msg.client_id || String(m.id) === String(msg.client_id))
                if (idx !== -1) {
                  const copy = [...prev]
                  copy[idx] = {
                    ...copy[idx],
                    id: msg.id || copy[idx].id,
                    role: msg.role || copy[idx].role,
                    replyTo: msg.reply_to || copy[idx].replyTo,
                    isQuestion: msg.is_question !== undefined ? msg.is_question : copy[idx].isQuestion,
                    customTitle: customTitle || copy[idx].customTitle,
                    serverTimeMs: msg.server_time_ms || copy[idx].serverTimeMs,
                    status: 'sent',
                    time: msgTime || copy[idx].time
                  }
                  return copy
                }
              }
              // Avoid duplicates
              if (msg.id && prev.some(m => String(m.id) === String(msg.id))) {
                return prev
              }

              const newMsg: LiveChatMessage = {
                id: msg.id || Date.now(),
                clientId: msg.client_id,
                user_id: msg.user_id,
                user: msg.user || msg.username || 'Utilisateur',
                username: msg.username || '',
                avatar: msg.avatar,
                text: msg.text,
                isHost: Boolean(msg.is_host),
                isSpeaker: Boolean(msg.is_speaker),
                role: msg.role || (msg.is_host ? 'host' : msg.is_speaker ? 'speaker' : 'viewer'),
                replyTo: msg.reply_to,
                isQuestion: Boolean(msg.is_question),
                customTitle,
                serverTimeMs: msg.server_time_ms || (Date.now() + serverTimeOffsetRef.current),
                time: msgTime,
                status: 'sent',
              }

              // 92. Netwayaj Memwa Otomatik (Memory Garbage Collection) : Max 500 messages in memory
              const updated = [...prev, newMsg]
              return updated.length > 500 ? updated.slice(-500) : updated
            })
            break
          }

          case 'live.chat_deleted': {
            setChatMessages(prev => prev.filter(m => String(m.id) !== String(msg.message_id) && String(m.clientId) !== String(msg.message_id)))
            setPinnedMessage(prev => prev && (String(prev.id) === String(msg.message_id) || String(prev.clientId) === String(msg.message_id)) ? null : prev)
            break
          }

          case 'live.chat_pinned': {
            if (msg.message) {
              setPinnedMessage(msg.message)
            }
            break
          }

          case 'live.chat_unpinned': {
            setPinnedMessage(null)
            break
          }

          case 'live.chat_cleared': {
            setChatMessages([
              {
                id: 'cleared_' + Date.now(),
                user: 'Système',
                username: 'system',
                text: 'Le chat a été effacé par les modérateurs.',
                isHost: true,
                isSpeaker: false,
                role: 'host',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              }
            ])
            break
          }

          case 'live.chat_timeout': {
            if (String(msg.target_user_id) === String(myUserId)) {
              const until = Date.now() + (Number(msg.duration_seconds) || 300) * 1000
              setIsMutedUntil(until)
              onToastRef.current?.(`Vous avez été mis en sourdine pour ${Math.round((Number(msg.duration_seconds) || 300) / 60)} min.`)
            } else {
              onToastRef.current?.(`@${msg.target_username || 'Un utilisateur'} a été mis en sourdine.`)
            }
            break
          }

          case 'live.chat_banned': {
            if (String(msg.target_user_id) === String(myUserId)) {
              setIsBanned(true)
              onToastRef.current?.('Vous avez été banni du chat en direct.')
            }
            if (msg.target_user_id) {
              setBannedUserIds(prev => [...new Set([...prev, String(msg.target_user_id)])])
            }
            break
          }

          case 'live.chat_unbanned': {
            if (String(msg.target_user_id) === String(myUserId)) {
              setIsBanned(false)
              setIsMutedUntil(null)
              onToastRef.current?.('Vous avez été réadmis au chat.')
            }
            if (msg.target_user_id) {
              setBannedUserIds(prev => prev.filter(id => id !== String(msg.target_user_id)))
            }
            break
          }

          case 'live.chat_warned': {
            const isMe = String(msg.target_user_id) === String(myUserId) ||
              (msg.target_username && msg.target_username.toLowerCase() === myUsernameRef.current?.toLowerCase())
            if (isMe) {
              setWarningNotice({
                message: msg.reason || 'Avertissement officiel de la modération',
                by: msg.by_username || 'Modérateur',
              })
              onToastRef.current?.(`⚠️ Avertissement: ${msg.reason || 'Respectez les règles'}`)
            }
            break
          }

          case 'live.chat_pause_updated': {
            setIsChatPaused(Boolean(msg.paused))
            onToastRef.current?.(msg.paused ? 'Le chat a été suspendu par l’hôte.' : 'Le chat a été réactivé.')
            break
          }

          case 'live.chat_question_answered': {
            const qId = msg.question_id
            setAnsweredQuestionIds(prev => [...new Set([...prev, qId])])
            setChatMessages(prev => prev.map(m => (String(m.id) === String(qId) ? { ...m, isAnswered: true } : m)))
            break
          }

          case 'live.chat_whisper': {
            setChatMessages(prev => [
              ...prev,
              {
                id: `wh_${Date.now()}_${Math.random()}`,
                user: msg.sender_name || msg.sender_username,
                username: msg.sender_username,
                avatar: msg.sender_avatar,
                text: msg.text,
                isHost: false,
                isSpeaker: false,
                isWhisper: true,
                whisperTarget: msg.target_username,
                time: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              },
            ])
            break
          }

          case 'live.chat_report_received': {
            setChatReports(prev => [
              ...prev,
              {
                messageId: msg.message_id,
                reportedUsername: msg.reported_username,
                reporterUsername: msg.reporter_username,
                reason: msg.reason,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              },
            ])
            onToastRef.current?.(`🚨 Signalement reçu pour @${msg.reported_username}`)
            break
          }

          case 'live.super_chat_message': {
            setChatMessages(prev => [
              ...prev,
              {
                id: msg.id || `sc_${Date.now()}`,
                user: msg.name || msg.username,
                username: msg.username,
                avatar: msg.avatar,
                text: msg.text,
                isHost: false,
                isSpeaker: false,
                isSuperChat: true,
                superChatAmount: msg.amount,
                superChatCurrency: msg.currency,
                superChatTier: msg.tier,
                time: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              },
            ])
            break
          }

          case 'live.chat_role_updated': {
            if (msg.target_user_id) {
              setUserRoles(prev => ({
                ...prev,
                [String(msg.target_user_id)]: msg.role,
              }))
              if (String(msg.target_user_id) === String(myUserId)) {
                onToastRef.current?.(`Votre rôle a été mis à jour: ${msg.role}`)
              }
            }
            break
          }

          case 'live.chat_mode_updated': {
            setSlowModeSeconds(Number(msg.slow_mode_seconds) || 0)
            setMembersOnly(Boolean(msg.members_only))
            setFollowersOnly(Boolean(msg.followers_only))
            setEmotesOnly(Boolean(msg.emotes_only))
            setPreModeration(Boolean(msg.pre_moderation))
            setAccountAgeGate(Boolean(msg.account_age_gate))
            break
          }

          case 'live.chat_purged_user': {
            setChatMessages(prev => prev.filter(m => String(m.user_id) !== String(msg.target_user_id)))
            setPinnedMessage(prev => prev && String(prev.user_id) === String(msg.target_user_id) ? null : prev)
            onToastRef.current?.("Les messages d'un participant ont été purgés.")
            break
          }

          case 'live.chat_audit_entry': {
            setAuditLog(prev => [
              {
                action: msg.action,
                by: msg.by_username || 'Modérateur',
                target: msg.target_username,
                timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              },
              ...prev.slice(0, 49),
            ])
            break
          }

          case 'live.chat_custom_banned_words_updated': {
            setCustomBannedWords(msg.words || [])
            break
          }

          case 'live.poll_created': {
            setActivePoll(msg.poll)
            break
          }

          case 'live.poll_voted': {
            setActivePoll(prev => {
              if (!prev || String(prev.id) !== String(msg.poll_id)) return prev
              const newOptions = prev.options.map((opt, idx) => {
                if (idx === msg.option_index) {
                  return { ...opt, votes: opt.votes + 1 }
                }
                return opt
              })
              const hasVoted = String(msg.user_id) === String(myUserId) ? msg.option_index : prev.hasVoted
              return {
                ...prev,
                options: newOptions,
                totalVotes: prev.totalVotes + 1,
                hasVoted,
              }
            })
            break
          }

          case 'live.poll_ended': {
            setActivePoll(prev => (prev && String(prev.id) === String(msg.poll_id) ? { ...prev, active: false } : prev))
            break
          }

          case 'live.reaction': {
            const rId = msg.id || Date.now()
            setReactions(prev => [...prev, { id: rId, emoji: msg.emoji, x: Math.random() * 80 + 10 }])
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== rId))
            }, 3000)
            break
          }

          case 'live.hand_raise': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.user_id) ? { ...p, isHandRaised: msg.raised } : p))
            )
            if (msg.raised) {
              setChatMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  user: 'Système',
                  username: 'system',
                  text: `✋ @${msg.username || msg.name} a levé la main pour demander la parole.`,
                  isHost: true,
                  isSpeaker: false,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            break
          }

          case 'live.speaker_promoted': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.target_user_id) ? { ...p, isSpeaker: true, isHandRaised: false } : p))
            )
            if (String(msg.target_user_id) === String(myUserId) || msg.target_channel === myChannelRef.current) {
              setIsSpeaker(true)
              isSpeakerRef.current = true
              onToastRef.current?.('🎙️ Vous êtes invité(e) sur scène ! Vous pouvez activer votre micro.')
              await startLocalMediaRef.current()
            }
            break
          }

          case 'live.speaker_demoted': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.target_user_id) ? { ...p, isSpeaker: false } : p))
            )
            if (String(msg.target_user_id) === String(myUserId)) {
              setIsSpeaker(false)
              isSpeakerRef.current = false
              onToastRef.current?.('Vous avez quitté la scène.')
            }
            break
          }

          case 'live.user_kicked': {
            setParticipants(prev => prev.filter(p => String(p.id) !== String(msg.target_user_id)))
            if (String(msg.target_user_id) === String(myUserId)) {
              onKickedRef.current?.(msg.target_name || 'Vous')
            }
            break
          }

          case 'live.stream_ended': {
            onToastRef.current?.('Le direct est terminé par l’organisateur.')
            setRemoteStream(null)
            onStreamEndedRef.current?.()
            break
          }

          case 'live.host_transferred': {
            const isMeNewHost = String(msg.new_host_id) === String(myUserId)
            const wasMeOldHost = String(msg.previous_host_id) === String(myUserId)
            if (isMeNewHost) {
              setIsHost(true)
              isHostRef.current = true
              onToastRef.current?.("Vous êtes désormais l'hôte principal du direct !")
            } else if (wasMeOldHost) {
              setIsHost(false)
              isHostRef.current = false
              onToastRef.current?.("Le rôle d'hôte a été transféré.")
            }
            setParticipants(prev => prev.map(p => {
              if (String(p.id) === String(msg.new_host_id)) return { ...p, isHost: true }
              if (String(p.id) === String(msg.previous_host_id)) return { ...p, isHost: false }
              return p
            }))
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys_th_${Date.now()}`,
                user: 'Système',
                username: 'system',
                text: `👑 Le rôle d'hôte a été transféré à @${msg.new_host_username || 'un participant'}.`,
                isHost: true,
                isSpeaker: false,
                isSystem: true,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              }
            ])
            break
          }

          case 'live.question_upvoted': {
            const qId = String(msg.question_id)
            setQuestionUpvotes(prev => ({
              ...prev,
              [qId]: (prev[qId] || 0) + 1,
            }))
            setChatMessages(prev => prev.map(m => {
              if (String(m.id) === qId) {
                return { ...m, upvotes: (m.upvotes || 0) + 1 }
              }
              return m
            }))
            break
          }

          case 'live.virtual_gift_received': {
            const amt = Number(msg.amount) || 1
            const sender = msg.sender_username || 'Anonyme'

            // Update crowdfunding goal
            setCrowdfundingGoal(prev => prev.active ? { ...prev, current: prev.current + amt } : prev)

            // Update Top Donors Leaderboard
            setTopDonors(prev => {
              const existingIdx = prev.findIndex(d => d.username === sender)
              let updated: Array<{ username: string; amount: number; avatar?: string }>
              if (existingIdx !== -1) {
                updated = [...prev]
                updated[existingIdx] = { ...updated[existingIdx], amount: updated[existingIdx].amount + amt }
              } else {
                updated = [...prev, { username: sender, amount: amt, avatar: msg.sender_avatar }]
              }
              return updated.sort((a, b) => b.amount - a.amount).slice(0, 5)
            })

            // Big gift celebration burst (>= 10$)
            if (amt >= 10) {
              setCelebrationBurst({ donor: sender, amount: amt })
              setTimeout(() => setCelebrationBurst(null), 5000)
            }

            // Text-to-Speech
            if (typeof window !== 'undefined' && 'speechSynthesis' in window && isTtsEnabled) {
              try {
                const text = `Donation de ${amt} dollars par ${sender}`
                const utter = new SpeechSynthesisUtterance(text)
                utter.lang = 'fr-FR'
                utter.rate = 1.0
                window.speechSynthesis.speak(utter)
              } catch {}
            }

            // Sound alert
            if (isSoundAlertsEnabled && typeof window !== 'undefined') {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = 'sine'
                osc.frequency.setValueAtTime(587.33, ctx.currentTime)
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
                gain.gain.setValueAtTime(0.15, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.start()
                osc.stop(ctx.currentTime + 0.3)
              } catch {}
            }

            const giftEmoji = msg.gift_type === 'micro' ? '🎙️' : msg.gift_type === 'diamant' ? '💎' : msg.gift_type === 'couronne' ? '👑' : '🌹'
            setReactions(prev => [...prev, { id: Date.now(), emoji: giftEmoji, x: Math.random() * 80 + 10 }])

            setChatMessages(prev => [
              ...prev,
              {
                id: `gift_${Date.now()}`,
                user: sender,
                username: sender,
                avatar: msg.sender_avatar,
                text: `${giftEmoji} a envoyé un ${msg.gift_type} ($${amt}) !`,
                isHost: false,
                isSpeaker: false,
                isSuperChat: true,
                superChatAmount: amt,
                superChatCurrency: 'USD',
                superChatTier: amt >= 20 ? 'diamond' : amt >= 10 ? 'gold' : amt >= 5 ? 'silver' : 'bronze',
                time: msg.timestamp || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              },
            ])
            break
          }

          case 'live.goal_updated': {
            setCrowdfundingGoal({
              title: msg.title || 'Objectif du direct',
              target: Number(msg.target) || 100,
              current: Number(msg.current) || 0,
              active: Boolean(msg.active),
            })
            break
          }

          case 'live.giveaway_updated': {
            if (msg.action === 'start') {
              setGiveawayState({
                active: true,
                keyword: msg.keyword || '!cadeau',
                participants: [],
                winner: null,
              })
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys_ga_${Date.now()}`,
                  user: 'Système',
                  username: 'system',
                  text: `🎁 Tirage au sort lancé ! Tapez "${msg.keyword || '!cadeau'}" dans le chat pour participer !`,
                  isHost: true,
                  isSpeaker: false,
                  isSystem: true,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'sent',
                },
              ])
            } else if (msg.action === 'winner') {
              setGiveawayState(prev => ({ ...prev, active: false, winner: msg.winner }))
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys_ga_win_${Date.now()}`,
                  user: 'Système',
                  username: 'system',
                  text: `🎉 FÉLICITATIONS à @${msg.winner || 'inconnu'}, grand gagnant du tirage au sort ! 🏆`,
                  isHost: true,
                  isSpeaker: false,
                  isSystem: true,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'sent',
                },
              ])
            } else if (msg.action === 'end') {
              setGiveawayState(prev => ({ ...prev, active: false }))
            }
            break
          }

          case 'live.trivia_updated': {
            if (msg.action === 'start') {
              setTriviaState({
                active: true,
                question: msg.question,
                winner: null,
              })
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys_triv_${Date.now()}`,
                  user: 'Système',
                  username: 'system',
                  text: `❓ QUIZ EN DIRECT : ${msg.question} (Répondez dans le chat !)`,
                  isHost: true,
                  isSpeaker: false,
                  isSystem: true,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'sent',
                },
              ])
            } else if (msg.action === 'winner') {
              setTriviaState(prev => ({ ...prev, active: false, winner: msg.winner }))
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys_triv_win_${Date.now()}`,
                  user: 'Système',
                  username: 'system',
                  text: `🧠 BRAVO à @${msg.winner || 'inconnu'} qui a trouvé la bonne réponse en premier ! 👏`,
                  isHost: true,
                  isSpeaker: false,
                  isSystem: true,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'sent',
                },
              ])
            } else if (msg.action === 'end') {
              setTriviaState(prev => ({ ...prev, active: false }))
            }
            break
          }

          case 'live.product_pinned': {
            setPinnedProduct(msg.product || null)
            break
          }

          case 'live.duel_updated': {
            if (msg.action === 'start') {
              setActiveDuel({
                active: true,
                question: msg.question,
                optionA: msg.option_a,
                optionB: msg.option_b,
                votesA: 0,
                votesB: 0,
              })
            } else if (msg.action === 'vote') {
              setActiveDuel(prev => {
                if (!prev) return null
                const isA = msg.vote === 'A'
                return {
                  ...prev,
                  votesA: isA ? prev.votesA + 1 : prev.votesA,
                  votesB: !isA ? prev.votesB + 1 : prev.votesB,
                  userVoted: String(msg.user_id) === String(myUserId) ? msg.vote : prev.userVoted,
                }
              })
            } else if (msg.action === 'end') {
              setActiveDuel(prev => prev ? { ...prev, active: false } : null)
            }
            break
          }

          case 'live.sub_alert_received': {
            setSubAlert({ username: msg.username, tier: msg.tier, giftedBy: msg.gifted_by })
            setTimeout(() => setSubAlert(null), 6000)
            const textNotice = msg.gifted_by
              ? `⭐ @${msg.gifted_by} a offert un abonnement à @${msg.username} !`
              : `⭐ @${msg.username} s'est abonné(e) au salon en direct !`
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys_sub_${Date.now()}`,
                user: 'Système',
                username: 'system',
                text: textNotice,
                isHost: true,
                isSpeaker: false,
                isSystem: true,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              },
            ])
            break
          }

          case 'live.voice_note_received': {
            setChatMessages(prev => [
              ...prev,
              {
                id: msg.id || `vn_${Date.now()}`,
                user_id: msg.user_id,
                user: msg.username,
                username: msg.username,
                avatar: msg.avatar,
                text: '🎙️ Note vocale',
                voiceAudio: msg.audio,
                voiceDuration: msg.duration || 5,
                time: msg.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              },
            ])
            break
          }

          case 'live.community_title_broadcast': {
            const targetUserId = msg.target_user_id
            const customTitle = msg.custom_title
            if (targetUserId) {
              setCommunityTitles(prev => ({
                ...prev,
                [String(targetUserId)]: customTitle || '',
              }))
              setChatMessages(prev =>
                prev.map(m =>
                  String(m.user_id) === String(targetUserId)
                    ? { ...m, customTitle: customTitle || undefined }
                    : m
                )
              )
            }
            break
          }

          case 'live.sync_time_response': {
            if (msg.server_time_ms) {
              const now = Date.now()
              const drift = msg.server_time_ms - now
              serverTimeOffsetRef.current = drift
              setServerTimeOffset(drift)
            }
            break
          }

          case 'live.prediction_updated': {
            const { action, prediction_id, question, option_a, option_b, duration_sec, choice, points, winner } = msg
            if (action === 'start') {
              setPredictionState({
                id: prediction_id,
                question,
                optionA: option_a,
                optionB: option_b,
                votesA: 0,
                votesB: 0,
                totalPointsA: 0,
                totalPointsB: 0,
                endsAt: Date.now() + (duration_sec || 120) * 1000,
                status: 'active',
              })
              setChatMessages(prev => [
                ...prev,
                {
                  id: `pred_${Date.now()}`,
                  user_id: 'system',
                  user: 'Système',
                  username: 'system',
                  text: `🔮 Nouvelle Prédiction : "${question}" (${option_a} vs ${option_b})`,
                  isHost: true,
                  isSpeaker: false,
                  isSystem: true,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'sent',
                },
              ])
            } else if (action === 'vote') {
              setPredictionState(prev => {
                if (!prev || prev.status !== 'active') return prev
                const pts = Number(points) || 10
                return {
                  ...prev,
                  votesA: choice === 'a' ? prev.votesA + 1 : prev.votesA,
                  votesB: choice === 'b' ? prev.votesB + 1 : prev.votesB,
                  totalPointsA: choice === 'a' ? prev.totalPointsA + pts : prev.totalPointsA,
                  totalPointsB: choice === 'b' ? prev.totalPointsB + pts : prev.totalPointsB,
                }
              })
            } else if (action === 'resolve') {
              setPredictionState(prev => {
                const optA = prev?.optionA || 'Option A'
                const optB = prev?.optionB || 'Option B'
                const winText = winner === 'cancel'
                  ? '🔮 La prédiction a été annulée.'
                  : `🔮 Prédiction terminée ! Option gagnante : ${winner === 'a' ? optA : optB} 🏆`
                setChatMessages(msgPrev => [
                  ...msgPrev,
                  {
                    id: `pred_res_${Date.now()}`,
                    user_id: 'system',
                    user: 'Système',
                    username: 'system',
                    text: winText,
                    isHost: true,
                    isSpeaker: false,
                    isSystem: true,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    status: 'sent',
                  },
                ])
                return {
                  ...prev,
                  status: 'resolved',
                  winner: winner || 'cancel',
                }
              })
            }
            break
          }

          case 'live.access_denied': {
            setAccessDenied({
              isDenied: true,
              reason: msg.reason || 'Accès refusé. Billet requis.',
              isPaid: Boolean(msg.is_paid),
            })
            onAccessDeniedRef.current?.(msg.reason || 'Accès refusé', Boolean(msg.is_paid))
            break
          }
        }
      } catch (err) {
        console.error('Error handling live ws packet:', err)
      }
    }

    return () => {
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.close(1000, 'Component unmounted') } catch {}
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => {
          try { ws.close(1000, 'Clean close after unmount') } catch {}
        }
      }
      stopLocalMedia()
      peersRef.current.forEach(pc => pc.close())
      peersRef.current.clear()
      if (viewerPeerRef.current) {
        viewerPeerRef.current.close()
        viewerPeerRef.current = null
      }
    }
  }, [eventId, sendWS, stopLocalMedia, reconnectKey])

  // ─── 5. Actions ───

  const sendChatMessage = useCallback((
    textOrPayload: string | { text: string; role?: string; [key: string]: any },
    currentUserName?: string,
    currentAvatar?: string,
    replyTo?: { id: string | number; user: string; text: string },
    forceQuestion?: boolean
  ) => {
    let rawText = ''
    let roleOverride: string | undefined
    if (typeof textOrPayload === 'string') {
      rawText = textOrPayload
    } else if (textOrPayload && typeof textOrPayload === 'object') {
      rawText = String(textOrPayload.text || '')
      roleOverride = textOrPayload.role
    }
    const trimmed = rawText.trim()
    if (!trimmed) return

    // Vérifier si l'utilisateur est banni ou temporairement en sourdine
    if (isBanned) {
      onToastRef.current?.("Vous êtes banni du chat de ce direct.")
      return
    }
    if (isMutedUntil && Date.now() < isMutedUntil) {
      const remainingSec = Math.ceil((isMutedUntil - Date.now()) / 1000)
      onToastRef.current?.(`Vous êtes en sourdine (${remainingSec}s restantes).`)
      return
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const isWsOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN

    const myRole = roleOverride || (isHostRef.current
      ? 'host'
      : isSpeakerRef.current
      ? 'speaker'
      : userRoles[String(myUserId)] || 'viewer')

    const isQuestion = Boolean(forceQuestion) || trimmed.startsWith('/q ') || trimmed.endsWith('?')
    const cleanText = trimmed.startsWith('/q ') ? trimmed.slice(3).trim() : trimmed

    const customTitle = (myUserId && communityTitlesRef.current[String(myUserId)]) || undefined
    const serverTimeMs = Date.now() + serverTimeOffsetRef.current
    const msgTime = new Date(serverTimeMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    // Optimistic UI: display immediately in local state
    const optimisticMsg: LiveChatMessage = {
      id: clientId,
      clientId,
      user_id: String(myUserId || 'me'),
      user: currentUserName || 'Moi',
      username: '',
      avatar: currentAvatar || null,
      text: cleanText,
      isHost: Boolean(isHostRef.current),
      isSpeaker: Boolean(isSpeakerRef.current),
      role: myRole,
      replyTo,
      isQuestion,
      customTitle,
      serverTimeMs,
      time: msgTime,
      status: isWsOpen ? 'sending' : 'failed',
    }

    setChatMessages(prev => {
      const updated = [...prev, optimisticMsg]
      return updated.length > 500 ? updated.slice(-500) : updated
    })

    if (isWsOpen) {
      sendWS({
        type: 'live.chat',
        client_id: clientId,
        text: cleanText,
        role: myRole,
        reply_to: replyTo,
        is_question: isQuestion,
      })
    } else {
      onToastRef.current?.('Connexion en cours... Le message partira dès que la connexion sera rétablie.')
    }
  }, [sendWS, myUserId, isBanned, isMutedUntil, userRoles])

  const deleteChatMessage = useCallback((messageId: string | number) => {
    setChatMessages(prev => prev.filter(m => String(m.id) !== String(messageId) && String(m.clientId) !== String(messageId)))
    setPinnedMessage(prev => prev && (String(prev.id) === String(messageId) || String(prev.clientId) === String(messageId)) ? null : prev)
    sendWS({
      type: 'live.chat_delete',
      message_id: messageId,
    })
    onToastRef.current?.('Message supprimé')
  }, [sendWS])

  const pinChatMessage = useCallback((message: LiveChatMessage) => {
    setPinnedMessage(message)
    sendWS({
      type: 'live.chat_pin',
      message,
    })
    onToastRef.current?.('Message épinglé')
  }, [sendWS])

  const unpinChatMessage = useCallback(() => {
    setPinnedMessage(null)
    sendWS({
      type: 'live.chat_unpin',
    })
    onToastRef.current?.('Message désepinglé')
  }, [sendWS])

  const clearChat = useCallback(() => {
    setChatMessages([
      {
        id: 'cleared_' + Date.now(),
        user: 'Système',
        username: 'system',
        text: 'Le chat a été effacé par les modérateurs.',
        isHost: true,
        isSpeaker: false,
        role: 'host',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      }
    ])
    sendWS({
      type: 'live.chat_clear',
    })
    onToastRef.current?.('Chat effacé pour tous les participants')
  }, [sendWS])

  const timeoutUser = useCallback((targetUserId: string, targetUsername: string, durationSeconds: number = 300) => {
    sendWS({
      type: 'live.chat_timeout',
      target_user_id: targetUserId,
      target_username: targetUsername,
      duration_seconds: durationSeconds,
    })
    onToastRef.current?.(`@${targetUsername} mis en sourdine pour ${Math.round(durationSeconds / 60)} min`)
  }, [sendWS])

  const banUser = useCallback((targetUserId: string, targetUsername: string) => {
    sendWS({
      type: 'live.chat_ban',
      target_user_id: targetUserId,
      target_username: targetUsername,
    })
    setBannedUserIds(prev => [...new Set([...prev, targetUserId])])
    onToastRef.current?.(`@${targetUsername} banni du chat`)
  }, [sendWS])

  const unbanUser = useCallback((targetUserId: string, targetUsername: string) => {
    sendWS({
      type: 'live.chat_unban',
      target_user_id: targetUserId,
      target_username: targetUsername,
    })
    setBannedUserIds(prev => prev.filter(id => id !== targetUserId))
    onToastRef.current?.(`@${targetUsername} débanni du chat`)
  }, [sendWS])

  const warnUser = useCallback((targetUserId: string, targetUsername: string, reason: string) => {
    sendWS({
      type: 'live.chat_warn',
      target_user_id: targetUserId,
      target_username: targetUsername,
      reason,
    })
    onToastRef.current?.(`Avertissement officiel envoyé à @${targetUsername}`)
  }, [sendWS])

  const toggleChatPause = useCallback((paused: boolean) => {
    setIsChatPaused(paused)
    sendWS({
      type: 'live.chat_pause',
      paused,
    })
    onToastRef.current?.(paused ? 'Chat suspendu' : 'Chat déverrouillé')
  }, [sendWS])

  const markQuestionAnswered = useCallback((questionId: string | number) => {
    setAnsweredQuestionIds(prev => [...new Set([...prev, questionId])])
    setChatMessages(prev => prev.map(m => (String(m.id) === String(questionId) ? { ...m, isAnswered: true } : m)))
    sendWS({
      type: 'live.chat_question_answered',
      question_id: questionId,
    })
    onToastRef.current?.('Question marquée comme répondue')
  }, [sendWS])

  const sendWhisper = useCallback((targetUsername: string, text: string) => {
    sendWS({
      type: 'live.chat_whisper',
      target_username: targetUsername,
      text,
    })
  }, [sendWS])

  const reportMessage = useCallback((messageId: string | number, reportedUsername: string, reason: string) => {
    sendWS({
      type: 'live.chat_report',
      message_id: messageId,
      reported_username: reportedUsername,
      reason,
    })
    onToastRef.current?.('Message signalé à la modération')
  }, [sendWS])

  const sendSuperChat = useCallback((amount: number, text: string, currency = 'USD', tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze') => {
    sendWS({
      type: 'live.super_chat',
      amount,
      currency,
      text,
      tier,
    })
    onToastRef.current?.(`Super Chat (${amount} ${currency}) envoyé !`)
  }, [sendWS])

  const clearWarningNotice = useCallback(() => {
    setWarningNotice(null)
  }, [])

  const dismissReport = useCallback((idx: number) => {
    setChatReports(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const setUserRole = useCallback((targetUserId: string, role: 'moderator' | 'mod_senior' | 'mod_junior' | 'vip' | 'viewer') => {
    setUserRoles(prev => ({ ...prev, [targetUserId]: role }))
    sendWS({
      type: 'live.chat_role',
      target_user_id: targetUserId,
      role,
    })
    sendWS({
      type: 'live.chat_audit',
      action: `Attribution de rôle: ${role}`,
      by_username: myUsername || 'Hôte',
      target_username: targetUserId,
    })
    onToastRef.current?.(`Rôle mis à jour (${role})`)
  }, [sendWS, myUsername])

  const setChatMode = useCallback((
    slowOrOptions: number | {
      slow_mode_seconds?: number
      members_only?: boolean
      followers_only?: boolean
      emotes_only?: boolean
      pre_moderation?: boolean
      account_age_gate?: boolean
    },
    membersOnlyArg?: boolean
  ) => {
    let slow = slowModeSeconds
    let members = membersOnly
    let followers = followersOnly
    let emotes = emotesOnly
    let preMod = preModeration
    let ageGate = accountAgeGate

    if (typeof slowOrOptions === 'number') {
      slow = slowOrOptions
      if (membersOnlyArg !== undefined) members = membersOnlyArg
    } else if (typeof slowOrOptions === 'object') {
      if (slowOrOptions.slow_mode_seconds !== undefined) slow = slowOrOptions.slow_mode_seconds
      if (slowOrOptions.members_only !== undefined) members = slowOrOptions.members_only
      if (slowOrOptions.followers_only !== undefined) followers = slowOrOptions.followers_only
      if (slowOrOptions.emotes_only !== undefined) emotes = slowOrOptions.emotes_only
      if (slowOrOptions.pre_moderation !== undefined) preMod = slowOrOptions.pre_moderation
      if (slowOrOptions.account_age_gate !== undefined) ageGate = slowOrOptions.account_age_gate
    }

    setSlowModeSeconds(slow)
    setMembersOnly(members)
    setFollowersOnly(followers)
    setEmotesOnly(emotes)
    setPreModeration(preMod)
    setAccountAgeGate(ageGate)

    sendWS({
      type: 'live.chat_mode',
      slow_mode_seconds: slow,
      members_only: members,
      followers_only: followers,
      emotes_only: emotes,
      pre_moderation: preMod,
      account_age_gate: ageGate,
    })
    onToastRef.current?.('Modes du chat mis à jour')
  }, [sendWS, slowModeSeconds, membersOnly, followersOnly, emotesOnly, preModeration, accountAgeGate])

  const purgeUserMessages = useCallback((targetUserId: string, targetUsername?: string) => {
    setChatMessages(prev => prev.filter(m => String(m.user_id) !== String(targetUserId)))
    setPinnedMessage(prev => prev && String(prev.user_id) === String(targetUserId) ? null : prev)
    sendWS({
      type: 'live.chat_purge_user',
      target_user_id: targetUserId,
    })
    sendWS({
      type: 'live.chat_audit',
      action: 'Purger les messages',
      by_username: myUsername || 'Modérateur',
      target_username: targetUsername || targetUserId,
    })
    onToastRef.current?.(`Messages de @${targetUsername || targetUserId} purgés`)
  }, [sendWS, myUsername])

  const updateCustomBannedWords = useCallback((words: string[]) => {
    setCustomBannedWords(words)
    sendWS({
      type: 'live.chat_custom_banned_words',
      words,
    })
    onToastRef.current?.('Mots interdits mis à jour')
  }, [sendWS])

  const addAuditLogEntry = useCallback((action: string, byUsername: string, targetUsername?: string) => {
    sendWS({
      type: 'live.chat_audit',
      action,
      by_username: byUsername,
      target_username: targetUsername,
    })
  }, [sendWS])

  const approvePendingMessage = useCallback((msg: LiveChatMessage) => {
    setPendingApprovalMessages(prev => prev.filter(m => m.id !== msg.id))
    sendWS({
      type: 'live.chat',
      client_id: msg.clientId,
      text: msg.text,
      role: msg.role,
      reply_to: msg.replyTo,
      is_question: msg.isQuestion,
    })
    onToastRef.current?.('Message approuvé et publié')
  }, [sendWS])

  const rejectPendingMessage = useCallback((msgId: string | number) => {
    setPendingApprovalMessages(prev => prev.filter(m => m.id !== msgId))
    onToastRef.current?.('Message rejeté')
  }, [])

  const createPoll = useCallback((question: string, options: string[]) => {
    const newPoll: LivePoll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: options.filter(o => o.trim()).map(text => ({ text: text.trim(), votes: 0 })),
      totalVotes: 0,
      active: true,
    }
    setActivePoll(newPoll)
    sendWS({
      type: 'live.poll_create',
      poll: newPoll,
    })
    onToastRef.current?.('Sondage créé en direct')
  }, [sendWS])

  const votePoll = useCallback((pollId: string | number, optionIndex: number) => {
    setActivePoll(prev => {
      if (!prev || String(prev.id) !== String(pollId) || prev.hasVoted !== undefined) return prev
      const newOptions = prev.options.map((opt, idx) => (idx === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt))
      return {
        ...prev,
        options: newOptions,
        totalVotes: prev.totalVotes + 1,
        hasVoted: optionIndex,
      }
    })
    sendWS({
      type: 'live.poll_vote',
      poll_id: pollId,
      option_index: optionIndex,
    })
  }, [sendWS])

  const endPoll = useCallback((pollId: string | number) => {
    setActivePoll(prev => (prev && String(prev.id) === String(pollId) ? { ...prev, active: false } : prev))
    sendWS({
      type: 'live.poll_end',
      poll_id: pollId,
    })
    onToastRef.current?.('Sondage clôturé')
  }, [sendWS])

  // 8. Transfer Host
  const transferHost = useCallback((targetUserId: string, targetUsername: string) => {
    sendWS({
      type: 'live.transfer_host',
      target_user_id: targetUserId,
      target_username: targetUsername,
    })
    addAuditLogEntry(`Transfert du rôle d'hôte`, myUsername || 'Hôte', targetUsername)
    onToastRef.current?.(`Rôle d'hôte transféré à @${targetUsername}`)
  }, [sendWS, myUsername, addAuditLogEntry])

  // 67. Upvote Question
  const upvoteQuestion = useCallback((questionId: string | number) => {
    const qStr = String(questionId)
    if (upvotedQuestionIds.includes(qStr)) return
    setUpvotedQuestionIds(prev => [...prev, qStr])
    setQuestionUpvotes(prev => ({ ...prev, [qStr]: (prev[qStr] || 0) + 1 }))
    setChatMessages(prev => prev.map(m => String(m.id) === qStr ? { ...m, upvotes: (m.upvotes || 0) + 1 } : m))
    sendWS({
      type: 'live.question_upvote',
      question_id: questionId,
    })
  }, [sendWS, upvotedQuestionIds])

  // 68 & 74. Virtual Gift & Super Stickers
  const sendVirtualGift = useCallback((giftType: string, amount: number, isSuperSticker = false, stickerUrl?: string) => {
    sendWS({
      type: 'live.virtual_gift',
      gift_type: giftType,
      amount,
      is_super_sticker: isSuperSticker,
      sticker_url: stickerUrl,
    })
    onToastRef.current?.(`Cadeau ${giftType} ($${amount}) envoyé !`)
  }, [sendWS])

  // 71. Crowdfunding Goal
  const updateCrowdfundingGoal = useCallback((title: string, target: number, current = 0, active = true) => {
    setCrowdfundingGoal({ title, target, current, active })
    sendWS({
      type: 'live.goal_update',
      title,
      target,
      current,
      active,
    })
    onToastRef.current?.('Objectif de financement mis à jour')
  }, [sendWS])

  // 75. Giveaway
  const startGiveaway = useCallback((keyword = '!cadeau') => {
    setGiveawayState({ active: true, keyword, participants: [], winner: null })
    sendWS({
      type: 'live.giveaway',
      action: 'start',
      keyword,
    })
    onToastRef.current?.(`Tirage au sort lancé avec le mot-clé ${keyword}`)
  }, [sendWS])

  const drawGiveawayWinner = useCallback(() => {
    const pool = giveawayState.participants.length > 0
      ? giveawayState.participants
      : participants.map(p => p.username).filter(Boolean)
    if (pool.length === 0) {
      onToastRef.current?.('Aucun participant pour le tirage au sort.')
      return
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    setGiveawayState(prev => ({ ...prev, active: false, winner: chosen }))
    sendWS({
      type: 'live.giveaway',
      action: 'winner',
      winner: chosen,
    })
  }, [sendWS, giveawayState.participants, participants])

  const endGiveaway = useCallback(() => {
    setGiveawayState(prev => ({ ...prev, active: false }))
    sendWS({
      type: 'live.giveaway',
      action: 'end',
    })
  }, [sendWS])

  // 76. Trivia / Quiz
  const startTrivia = useCallback((question: string, answer: string) => {
    setTriviaState({ active: true, question, answer, winner: null })
    sendWS({
      type: 'live.trivia',
      action: 'start',
      question,
    })
    onToastRef.current?.('Quiz lancé !')
  }, [sendWS])

  const endTrivia = useCallback(() => {
    setTriviaState(prev => ({ ...prev, active: false }))
    sendWS({
      type: 'live.trivia',
      action: 'end',
    })
  }, [sendWS])

  // 79. Pinned Product
  const pinProduct = useCallback((product: { title: string; price: number | string; image?: string; link?: string }) => {
    setPinnedProduct(product)
    sendWS({
      type: 'live.product_pin',
      product,
    })
    onToastRef.current?.('Produit épinglé au direct')
  }, [sendWS])

  const unpinProduct = useCallback(() => {
    setPinnedProduct(null)
    sendWS({
      type: 'live.product_pin',
      product: null,
    })
  }, [sendWS])

  // 82. Visual Duel (A vs B)
  const startDuel = useCallback((question: string, optionA: string, optionB: string) => {
    setActiveDuel({ active: true, question, optionA, optionB, votesA: 0, votesB: 0 })
    sendWS({
      type: 'live.duel',
      action: 'start',
      question,
      option_a: optionA,
      option_b: optionB,
    })
    onToastRef.current?.('Duel de vote lancé')
  }, [sendWS])

  const voteDuel = useCallback((option: 'A' | 'B') => {
    if (activeDuel?.userVoted) return
    setActiveDuel(prev => prev ? {
      ...prev,
      votesA: option === 'A' ? prev.votesA + 1 : prev.votesA,
      votesB: option === 'B' ? prev.votesB + 1 : prev.votesB,
      userVoted: option,
    } : null)
    sendWS({
      type: 'live.duel',
      action: 'vote',
      vote: option,
    })
  }, [sendWS, activeDuel])

  const endDuel = useCallback(() => {
    setActiveDuel(prev => prev ? { ...prev, active: false } : null)
    sendWS({
      type: 'live.duel',
      action: 'end',
    })
  }, [sendWS])

  // 84. Gift Subscription
  const sendGiftSub = useCallback((targetUserId: string, targetUsername: string) => {
    sendWS({
      type: 'live.sub_alert',
      username: targetUsername,
      tier: 'standard',
      gifted_by: myUsername || 'Un généreux membre',
    })
    onToastRef.current?.(`Abonnement offert à @${targetUsername} !`)
  }, [sendWS, myUsername])

  // 85. Voice Note
  const sendVoiceNote = useCallback((audioBase64: string, duration = 5) => {
    sendWS({
      type: 'live.voice_note',
      audio: audioBase64,
      duration,
    })
    onToastRef.current?.('Message vocal envoyé !')
  }, [sendWS])

  // 70. TTS & 81. Sound alerts toggles
  const toggleTts = useCallback(() => {
    setIsTtsEnabled(prev => {
      const next = !prev
      onToastRef.current?.(next ? 'Synthèse vocale des dons activée' : 'Synthèse vocale des dons désactivée')
      return next
    })
  }, [])

  const toggleSoundAlerts = useCallback(() => {
    setIsSoundAlertsEnabled(prev => {
      const next = !prev
      onToastRef.current?.(next ? 'Alertes sonores activées' : 'Alertes sonores coupées')
      return next
    })
  }, [])

  const sendReaction = useCallback((emoji: string) => {
    sendWS({
      type: 'live.reaction',
      emoji,
    })
  }, [sendWS])

  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised
    setIsHandRaised(nextState)
    sendWS({
      type: 'live.hand_raise',
      raised: nextState,
    })
    onToastRef.current?.(nextState ? '✋ Vous avez levé la main' : 'Main baissée')
  }, [isHandRaised, sendWS])

  const promoteToSpeaker = useCallback((userId: string, channelName?: string) => {
    sendWS({
      type: 'live.promote_speaker',
      target_user_id: userId,
      target_channel: channelName,
    })
    onToastRef.current?.('🎙️ Invitation envoyée pour monter sur scène')
  }, [sendWS])

  const demoteSpeaker = useCallback((userId: string) => {
    sendWS({
      type: 'live.demote_speaker',
      target_user_id: userId,
    })
    onToastRef.current?.('Participant retiré de la scène')
  }, [sendWS])

  const kickParticipant = useCallback((userId: string, name: string) => {
    sendWS({
      type: 'live.kick_user',
      target_user_id: userId,
      target_name: name,
    })
    onToastRef.current?.(`🚫 ${name} a été expulsé(e) du direct`)
  }, [sendWS])

  const endLive = useCallback(() => {
    sendWS({
      type: 'live.end_stream',
    })
  }, [sendWS])

  // ─── 6. Controls: Mic, Camera, Screen Share ───

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(t => {
        t.enabled = !t.enabled
      })
      const isNowMuted = audioTracks.length > 0 ? !audioTracks[0].enabled : true
      setIsMuted(isNowMuted)
      onToastRef.current?.(isNowMuted ? 'Micro désactivé' : 'Micro activé')
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(t => {
        t.enabled = !t.enabled
      })
      const isNowOff = videoTracks.length > 0 ? !videoTracks[0].enabled : true
      setIsVideoOff(isNowOff)
      onToastRef.current?.(isNowOff ? 'Caméra désactivée' : 'Caméra activée')
    }
  }, [])

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream
        setIsScreenSharing(true)
        const screenVideoTrack = screenStream.getVideoTracks()[0]

        // Replace video track across all active viewer peer connections
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenVideoTrack)
          }
        })

        screenVideoTrack.onended = () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
          // Restore original camera track
          if (localStreamRef.current) {
            const camVideoTrack = localStreamRef.current.getVideoTracks()[0]
            peersRef.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
              if (sender && camVideoTrack) {
                sender.replaceTrack(camVideoTrack)
              }
            })
          }
          onToastRef.current?.("Partage d'écran arrêté")
        }

        onToastRef.current?.("🖥️ Partage d'écran activé")
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop())
          screenStreamRef.current = null
        }
        setIsScreenSharing(false)

        if (localStreamRef.current) {
          const camVideoTrack = localStreamRef.current.getVideoTracks()[0]
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
            if (sender && camVideoTrack) {
              sender.replaceTrack(camVideoTrack)
            }
          })
        }
        onToastRef.current?.("Partage d'écran arrêté")
      }
    } catch (err) {
      console.warn('Screen share error or canceled:', err)
    }
  }, [isScreenSharing])

  const setCommunityTitle = useCallback((targetUserId: string | number, customTitle: string) => {
    setCommunityTitles(prev => ({
      ...prev,
      [String(targetUserId)]: customTitle,
    }))
    setChatMessages(prev =>
      prev.map(m =>
        String(m.user_id) === String(targetUserId)
          ? { ...m, customTitle: customTitle || undefined }
          : m
      )
    )
    sendWS({
      type: 'live.set_community_title',
      target_user_id: targetUserId,
      custom_title: customTitle,
    })
    onToastRef.current?.('Titre communautaire mis à jour')
  }, [sendWS])

  const syncServerTime = useCallback(() => {
    sendWS({
      type: 'live.sync_time',
      client_time_ms: Date.now(),
    })
  }, [sendWS])

  const toggleChatOverlayMode = useCallback(() => {
    setIsChatOverlayMode(prev => {
      const next = !prev
      try {
        localStorage.setItem('exile_chat_overlay', String(next))
      } catch {}
      return next
    })
  }, [])

  // 63. Prediksyon & Paryaj sou Stream la (Live Predictions)
  const startPrediction = useCallback((question: string, optionA: string, optionB: string, durationSec: number = 120) => {
    const predictionId = `pred_${Date.now()}`
    sendWS({
      type: 'live.prediction',
      action: 'start',
      prediction_id: predictionId,
      question,
      option_a: optionA,
      option_b: optionB,
      duration_sec: durationSec,
    })
    onToastRef.current?.('Prédiction lancée !')
  }, [sendWS])

  const votePrediction = useCallback((choice: 'a' | 'b', points: number = 10) => {
    if (channelPoints < points) {
      onToastRef.current?.(`Solde insuffisant (${channelPoints} pts)`)
      return
    }
    setChannelPoints(prev => {
      const next = prev - points
      try {
        localStorage.setItem('exile_user_channel_points', String(next))
      } catch {}
      return next
    })
    setPredictionState(prev => ({
      ...prev,
      myVote: { choice, points },
    }))
    sendWS({
      type: 'live.prediction',
      action: 'vote',
      prediction_id: predictionState.id,
      choice,
      points,
    })
    onToastRef.current?.(`Mise de ${points} pts enregistrée !`)
  }, [channelPoints, predictionState.id, sendWS])

  const resolvePrediction = useCallback((winner: 'a' | 'b' | 'cancel') => {
    sendWS({
      type: 'live.prediction',
      action: 'resolve',
      prediction_id: predictionState.id,
      winner,
    })
  }, [predictionState.id, sendWS])

  // 64 & 65. Echanj Pwen Fidelite (Redeem Rewards)
  const redeemReward = useCallback((cost: number, title: string) => {
    if (channelPoints < cost) {
      onToastRef.current?.(`Il vous faut ${cost} points pour "${title}"`)
      return false
    }
    setChannelPoints(prev => {
      const next = prev - cost
      try {
        localStorage.setItem('exile_user_channel_points', String(next))
      } catch {}
      return next
    })
    sendWS({
      type: 'live.chat',
      client_id: `reward_${Date.now()}`,
      text: `🪙 Récompense débloquée : ${title} (-${cost} pts)`,
      role: 'viewer',
    })
    onToastRef.current?.(`Récompense "${title}" débloquée !`)
    return true
  }, [channelPoints, sendWS])

  // 94. Chat Detache sou Dezyèm Ekran (Popout Chat Window)
  const openPopoutChat = useCallback(() => {
    const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
    const url = `/pro/events/${cleanId}/live?popout=chat`
    window.open(url, `exile_chat_${cleanId}`, 'width=420,height=720,menubar=no,toolbar=no,location=no,status=no')
  }, [eventId])

  return {
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
    screenStream: screenStreamRef.current,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    availableDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    facingMode,
    switchCamera,
    selectVideoDevice,
    selectAudioDevice,
    refreshDevices,
    sendChatMessage,
    sendReaction,
    toggleHandRaise,
    promoteToSpeaker,
    demoteSpeaker,
    kickParticipant,
    endLive,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startLocalMedia,
    mediaError,
    accessDenied,
    loadChatHistory,
    setChatMessages,
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
    followersOnly,
    emotesOnly,
    preModeration,
    accountAgeGate,
    customBannedWords,
    auditLog,
    pendingApprovalMessages,
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
    setChannelPoints,
    redeemReward,
    openPopoutChat,
  }
}
