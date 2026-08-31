import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, MoreVertical, Search, X, Paperclip,
  Reply, CheckCheck, Check, Pin, Archive, Shield, Phone,
  Video, Star, Wifi, WifiOff, Loader2, Edit2, Trash2, Flag, Forward
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useWebSocket, WSMessage } from '../../hooks/useWebSocket'
import { TypingIndicator } from '../../components/TypingIndicator'
import { MessageBubble, MessageBubbleData } from '../../components/MessageBubble'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

interface ReplyContext {
  id: string
  senderName: string
  content: string
}

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
    if (!token) return localStorage.getItem('user_id')
    const payload = JSON.parse(atob(token.split('.')[1]))
    return String(payload.user_id || payload.id || payload.uuid || localStorage.getItem('user_id') || '')
  } catch {
    return localStorage.getItem('user_id')
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  let token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  try {
    let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    if (res.status === 401) {
      const refresh = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          })
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json()
            if (refreshData.access) {
              localStorage.setItem('accessToken', refreshData.access)
              headers['Authorization'] = `Bearer ${refreshData.access}`
              res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
            }
          }
        } catch {}
      }
    }
    return res
  } catch (err) {
    throw err
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 60) return "À l'instant"
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

export interface ConversationViewProps {
  conversationId?: string | number | null
  partnerId?: string | number | null
  partnerUsername?: string | null
  partnerAvatar?: string | null
  initialMessage?: string | null
  onClose?: () => void
}

export const ConversationView = ({
  conversationId,
  partnerId,
  partnerUsername,
  partnerAvatar,
  initialMessage,
  onClose,
}: ConversationViewProps): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const params = useParams<{ id: string }>()
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    if (conversationId) return String(conversationId)
    if (params.id) return String(params.id)
    return null
  })

  const id = activeConvId || (conversationId ? String(conversationId) : params.id)
  const navigate = useNavigate()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentUserId = useRef<string | null>(getCurrentUserId()).current

  // ─── State ──────────────────────────────────────────────────────────────────
  const [conversation, setConversation] = useState<any>(() => {
    if (partnerUsername || partnerId) {
      return {
        id: conversationId || 'temp',
        participants: [
          { id: partnerId || 'other', username: partnerUsername || 'Utilisateur', avatar_url: partnerAvatar }
        ]
      }
    }
    return null
  })
  const [messages, setMessages] = useState<MessageBubbleData[]>(() => {
    try {
      const convKey = conversationId || partnerId || 'temp'
      const stored = localStorage.getItem(`exile_chat_messages_${convKey}`)
      if (stored) return JSON.parse(stored)
    } catch {}

    if (initialMessage) {
      return [{
        id: 'init-msg',
        content: initialMessage,
        senderId: String(partnerId || ''),
        senderName: partnerUsername || 'Utilisateur',
        senderUsername: partnerUsername || '',
        senderAvatar: partnerAvatar || undefined,
        createdAt: new Date().toISOString(),
        read: true,
        isImportant: false,
        isEdited: false
      }]
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  // UI state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirm, setShowConfirm] = useState<{ type: 'block' | 'delete' | null }>({ type: null })
  const [toast, setToast] = useState<string | null>(null)

  // Messaging features
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null)
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [forwardModal, setForwardModal] = useState<MessageBubbleData | null>(null)
  const [reportModal, setReportModal] = useState<{ id: string } | null>(null)
  const [reportReason, setReportReason] = useState('Contenu inapproprié ou spam')

  // WebSocket state
  const [typingUser, setTypingUser] = useState<{ userId: string; username: string } | null>(null)
  const [onlineUserId, setOnlineUserId] = useState<string | null>(null)
  const [wsError, setWsError] = useState(false)

  // ─── Show toast ─────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ─── Draft auto-save ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const saved = localStorage.getItem(`draft_${id}`)
    if (saved) { setNewMessage(saved); setHasDraft(true) }
  }, [id])

  useEffect(() => {
    if (!id) return
    if (newMessage.trim()) {
      localStorage.setItem(`draft_${id}`, newMessage)
      setHasDraft(true)
    } else {
      localStorage.removeItem(`draft_${id}`)
      setHasDraft(false)
    }
  }, [newMessage, id])

  // ─── Load conversation (REST) ────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)

      // 1. If we have a conversation ID, try to fetch it
      if (id && id !== 'temp' && !id.startsWith('demande-')) {
        try {
          const res = await apiFetch(`/conversations/${id}/`)
          if (res.ok && isMounted) {
            const data = await res.json()
            setConversation(data)
            const normalized: MessageBubbleData[] = (data.messages || []).map((m: any) => ({
              id: String(m.id),
              content: m.content || '',
              senderId: String(m.sender?.id || ''),
              senderName: m.sender?.full_name || m.sender?.username || 'Utilisateur',
              senderAvatar: m.sender?.avatar_url || undefined,
              senderUsername: m.sender?.username || '',
              createdAt: m.created_at || new Date().toISOString(),
              read: m.read || false,
              isImportant: m.is_important || false,
              isEdited: false,
              replyToId: undefined,
              replyPreview: undefined,
            }))
            setMessages(normalized)
            apiFetch(`/conversations/${id}/mark_read/`, { method: 'POST' }).catch(() => {})
            setIsLoading(false)
            return
          }
        } catch {}
      }

      // 2. If no valid conversation or fetch failed, but we have partnerId: find/start conversation
      if (partnerId) {
        try {
          const startRes = await apiFetch('/conversations/start/', {
            method: 'POST',
            body: JSON.stringify({ participant_id: Number(partnerId) })
          })
          if (startRes.ok && isMounted) {
            const startData = await startRes.json()
            if (startData.id) {
              setActiveConvId(String(startData.id))
              setConversation(startData)
              if (startData.messages && startData.messages.length > 0) {
                const normalized: MessageBubbleData[] = startData.messages.map((m: any) => ({
                  id: String(m.id),
                  content: m.content || '',
                  senderId: String(m.sender?.id || m.sender_id || ''),
                  senderName: m.sender?.full_name || m.sender?.username || m.sender_name || 'Utilisateur',
                  senderAvatar: m.sender?.avatar_url || m.sender_avatar || undefined,
                  senderUsername: m.sender?.username || m.sender_username || '',
                  createdAt: m.created_at || new Date().toISOString(),
                  read: m.read || false,
                  isImportant: m.is_important || false,
                  isEdited: false,
                }))
                setMessages(normalized)
              }
              setIsLoading(false)
              return
            }
          }
        } catch {}
      }

      // 3. Fallback: Keep UI active with partner information
      if (isMounted) {
        if (partnerUsername || partnerId) {
          setConversation((prev: any) => prev || {
            id: id || 'temp',
            participants: [{ id: partnerId || 'other', username: partnerUsername || 'Utilisateur', avatar_url: partnerAvatar }]
          })
          setIsLoading(false)
        } else {
          setError('Impossible de charger la conversation')
          setIsLoading(false)
        }
      }
    }

    load()
    return () => { isMounted = false }
  }, [id, partnerId, partnerUsername, partnerAvatar, initialMessage])

  // ─── Real-time LocalStorage Backup & 2s Polling ─────────────────────────────
  useEffect(() => {
    const targetKey = activeConvId || conversationId || partnerId || id
    if (!targetKey) return
    try {
      localStorage.setItem(`exile_chat_messages_${targetKey}`, JSON.stringify(messages))
    } catch {}
  }, [messages, activeConvId, conversationId, partnerId, id])

  useEffect(() => {
    const targetConvId = activeConvId || (conversationId && /^\d+$/.test(String(conversationId)) ? String(conversationId) : (id && /^\d+$/.test(String(id)) ? String(id) : null))
    if (!targetConvId || targetConvId === 'temp') return

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiFetch(`/conversations/${targetConvId}/`)
        if (res.ok) {
          const data = await res.json()
          if (data.messages && Array.isArray(data.messages)) {
            const normalized: MessageBubbleData[] = data.messages.map((m: any) => ({
              id: String(m.id),
              content: m.content || '',
              senderId: String(m.sender?.id || m.sender_id || ''),
              senderName: m.sender?.full_name || m.sender?.username || m.sender_name || 'Utilisateur',
              senderAvatar: m.sender?.avatar_url || m.sender_avatar || undefined,
              senderUsername: m.sender?.username || m.sender_username || '',
              createdAt: m.created_at || new Date().toISOString(),
              read: m.read || false,
              isImportant: m.is_important || false,
              isEdited: false,
            }))

            setMessages(prev => {
              const map = new Map<string, MessageBubbleData>()
              prev.forEach(m => map.set(String(m.id), m))
              normalized.forEach(m => map.set(String(m.id), m))
              return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            })
          }
        }
      } catch {}
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [activeConvId, conversationId, id])

  // ─── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isLoading, searchQuery])

  // ─── WebSocket message handler ───────────────────────────────────────────────
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {

      case 'chat.message': {
        const incoming: MessageBubbleData = {
          id: String(msg.message_id as string),
          content: msg.content as string,
          senderId: String(msg.sender_id as string),
          senderName: msg.sender_name as string || 'Utilisateur',
          senderAvatar: msg.sender_avatar as string || undefined,
          senderUsername: msg.sender_username as string || '',
          createdAt: msg.created_at as string || new Date().toISOString(),
          read: false,
          isImportant: false,
          isEdited: false,
          replyToId: msg.reply_to_id as string | undefined,
        }
        setMessages(prev => {
          // Remove optimistic duplicate if exists
          const filtered = prev.filter(m => !m.id.startsWith('temp_'))
          if (filtered.some(m => m.id === incoming.id)) return prev
          return [...filtered, incoming]
        })
        // If the sender is the other user, mark as read via WS
        if (String(msg.sender_id) !== currentUserId) {
          wsSend({ type: 'chat.read' })
        }
        break
      }

      case 'chat.typing': {
        const uid = String(msg.user_id)
        if (uid !== currentUserId) {
          if (msg.is_typing) {
            setTypingUser({ userId: uid, username: msg.username as string })
          } else {
            setTypingUser(prev => (prev?.userId === uid ? null : prev))
          }
        }
        break
      }

      case 'chat.read': {
        const readerId = String(msg.user_id)
        if (readerId !== currentUserId) {
          // Mark all my sent messages as read
          setMessages(prev => prev.map(m =>
            m.senderId === currentUserId ? { ...m, read: true } : m
          ))
        }
        break
      }

      case 'chat.edit': {
        const { message_id, content } = msg as { message_id: string; content: string }
        setMessages(prev => prev.map(m =>
          String(m.id) === String(message_id)
            ? { ...m, content, isEdited: true }
            : m
        ))
        break
      }

      case 'chat.delete': {
        const { message_id, delete_for_all } = msg as { message_id: string; delete_for_all: boolean }
        if (delete_for_all) {
          setMessages(prev => prev.filter(m => String(m.id) !== String(message_id)))
        }
        break
      }

      case 'user.presence': {
        const uid = String(msg.user_id)
        if (uid !== currentUserId) {
          setOnlineUserId(msg.status === 'online' ? uid : null)
        }
        break
      }

      case 'chat.request_accepted': {
        showToast(`🎉 Demande acceptée ! Conversation débloquée.`)
        break
      }
    }
  }, [currentUserId, showToast])

  const { send: wsSend, connectionState, isConnected } = useWebSocket({
    conversationId: id || '',
    onMessage: handleWSMessage,
    enabled: !!id && !isLoading,
  })

  // WS error tracking
  useEffect(() => {
    setWsError(connectionState === 'error')
  }, [connectionState])

  // ─── Pro Modal & File Upload States ──────────────────────────────────────────
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showProOfferModal, setShowProOfferModal] = useState(false)
  const [offerTitle, setOfferTitle] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [offerCurrency, setOfferCurrency] = useState('$ USD')
  const [offerDuration, setOfferDuration] = useState('3 jours')
  const [offerPaymentTerms, setOfferPaymentTerms] = useState('100% à la livraison')
  const [offerDesc, setOfferDesc] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  // ─── Typing indicator ────────────────────────────────────────────────────────
  const handleInputChange = (val: string) => {
    setNewMessage(val)
    wsSend({ type: 'chat.typing', is_typing: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      wsSend({ type: 'chat.typing', is_typing: false })
    }, 2000)
  }

  // ─── Send message (Direct or from input) ──────────────────────────────────────
  const sendDirectMessage = useCallback(async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : newMessage).trim()
    if (!content) return

    // Stop typing indicator
    wsSend({ type: 'chat.typing', is_typing: false })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // Optimistic UI
    const optimisticId = `temp_${Date.now()}`
    const optimisticMsg: MessageBubbleData = {
      id: optimisticId,
      content,
      senderId: currentUserId || '',
      senderName: 'Moi',
      createdAt: new Date().toISOString(),
      read: false,
      isImportant: false,
      isEdited: false,
      replyToId: replyingTo?.id,
      replyPreview: replyingTo
        ? { senderName: replyingTo.senderName, content: replyingTo.content }
        : undefined,
    }
    setMessages(prev => [...prev, optimisticMsg])
    if (textToSend === undefined) {
      setNewMessage('')
      if (id) localStorage.removeItem(`draft_${id}`)
      setHasDraft(false)
    }
    setReplyingTo(null)

    // Check if we have a real numeric ID or need to create conversation
    let realConvId = activeConvId || (id && /^\d+$/.test(String(id)) ? id : null)

    if (!realConvId && partnerId) {
      try {
        const startRes = await apiFetch('/conversations/start/', {
          method: 'POST',
          body: JSON.stringify({ participant_id: Number(partnerId) }),
        })
        if (startRes.ok) {
          const startData = await startRes.json()
          if (startData.id) {
            realConvId = String(startData.id)
            setActiveConvId(realConvId)
          }
        }
      } catch {}
    }

    // Persist via REST to guarantee DB storage
    if (realConvId) {
      try {
        const postRes = await apiFetch('/conversations/messages/', {
          method: 'POST',
          body: JSON.stringify({ content, conversation: Number(realConvId) }),
        })
        if (postRes.ok) {
          const savedMsg = await postRes.json()
          setMessages(prev => prev.map(m => m.id === optimisticId ? {
            ...m,
            id: String(savedMsg.id),
            createdAt: savedMsg.created_at || m.createdAt
          } : m))
        }
      } catch {
        if (!isConnected) {
          showToast('Erreur lors de l\'envoi. Vérifiez votre connexion.')
        }
      }
    }

    // Send via WebSocket for instant live broadcast
    if (isConnected) {
      wsSend({
        type: 'chat.message',
        content,
        reply_to_id: replyingTo?.id || null,
      })
    }
  }, [newMessage, id, activeConvId, partnerId, replyingTo, isConnected, currentUserId, wsSend, showToast])

  const sendMessage = () => sendDirectMessage()

  // ─── Image Upload Handler ─────────────────────────────────────────────────────
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image trop volumineuse (max 8 Mo)', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (dataUrl) {
        sendDirectMessage(`[image:${dataUrl}]`)
        showToast('Image envoyée !')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── Document Upload Handler ──────────────────────────────────────────────────
  const handleDocSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 25 * 1024 * 1024) {
      showToast('Document trop volumineux (max 25 Mo)', 'error')
      return
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
      : `${(file.size / 1024).toFixed(0)} Ko`

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (dataUrl) {
        sendDirectMessage(`[document:${file.name}|${sizeStr}|${dataUrl}]`)
        showToast('Document envoyé !')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── Submit Pro Proposal ──────────────────────────────────────────────────────
  const handleSendProProposal = () => {
    if (!offerTitle.trim() || !offerAmount.trim()) {
      showToast('Veuillez remplir au moins le titre et le montant', 'error')
      return
    }
    const amountFormatted = `${offerAmount.trim()} ${offerCurrency}`
    const payload = `[pro_proposal:${offerTitle.trim()}|${amountFormatted}|${offerDuration.trim()}|${offerPaymentTerms.trim()}|${(offerDesc.trim() || 'Prestation professionnelle validée')}]`
    sendDirectMessage(payload)
    setShowProOfferModal(false)
    setOfferTitle('')
    setOfferAmount('')
    setOfferDesc('')
    showToast('💼 Proposition & Devis Pro envoyé !')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Edit message ─────────────────────────────────────────────────────────────
  const submitEdit = useCallback(async () => {
    if (!editingMessage || !editingMessage.content.trim()) return
    const { id: msgId, content } = editingMessage

    if (isConnected) {
      wsSend({ type: 'chat.edit', message_id: msgId, content })
    } else {
      await apiFetch(`/conversations/messages/${msgId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      })
    }
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content, isEdited: true } : m
    ))
    setEditingMessage(null)
    showToast('Message modifié')
  }, [editingMessage, isConnected, wsSend, showToast])

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const deleteForMe = useCallback((msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }, [])

  const deleteForAll = useCallback(async (msgId: string) => {
    if (isConnected) {
      wsSend({ type: 'chat.delete', message_id: msgId, delete_for_all: true })
    } else {
      await apiFetch(`/conversations/messages/${msgId}/`, { method: 'DELETE' })
    }
    setMessages(prev => prev.filter(m => m.id !== msgId))
    showToast('Message supprimé pour tous')
  }, [isConnected, wsSend, showToast])

  // ─── Toggle important ─────────────────────────────────────────────────────────
  const toggleImportant = useCallback(async (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, isImportant: !m.isImportant } : m
    ))
    await apiFetch(`/conversations/messages/${msgId}/mark_important/`, { method: 'POST' })
    showToast('Marqué comme important ⭐')
  }, [showToast])

  // ─── Copy ────────────────────────────────────────────────────────────────────
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => showToast('Copié !')).catch(() => {})
  }, [showToast])

  // ─── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((msgId: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev)
      next.has(msgId) ? next.delete(msgId) : next.add(msgId)
      return next
    })
  }, [])

  const batchDelete = useCallback(() => {
    selectedMessageIds.forEach(msgId => deleteForAll(msgId))
    setSelectedMessageIds(new Set())
    setIsSelectionMode(false)
  }, [selectedMessageIds, deleteForAll])

  const batchCopy = useCallback(() => {
    const text = messages
      .filter(m => selectedMessageIds.has(m.id))
      .map(m => m.content).join('\n')
    navigator.clipboard.writeText(text).then(() => showToast('Messages copiés !')).catch(() => {})
    setIsSelectionMode(false)
  }, [messages, selectedMessageIds, showToast])

  // ─── Derived data ─────────────────────────────────────────────────────────────
  const otherParticipant = useMemo(() => {
    if (!conversation) return null
    // ConversationSerializer returns:
    // participants: [{id, username, full_name, avatar_url}]
    // participant_info: [{id, user: {id, username, full_name, avatar_url}, last_read_at}]
    const parts: any[] = conversation.participants || []
    return parts.find((p: any) => String(p.id) !== currentUserId) || null
  }, [conversation, currentUserId])

  const isOtherOnline = useMemo(() => {
    if (!otherParticipant) return true
    if (onlineUserId === String(otherParticipant.id)) return true
    if (otherParticipant.is_online !== undefined) return Boolean(otherParticipant.is_online)
    if (otherParticipant.isOnline !== undefined) return Boolean(otherParticipant.isOnline)
    return true
  }, [onlineUserId, otherParticipant])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    return messages.filter(m =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [messages, searchQuery])

  // ─── Render ────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0f13]' : 'bg-slate-50'}`}>
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">💬</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{error}</p>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/pro/conversations')
              }
            }}
            className="px-6 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen max-h-screen overflow-hidden ${isDark ? 'bg-[#0f0f13]' : 'bg-[#f0f4f8]'}`}>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium
          bg-gradient-to-r from-violet-700 to-purple-700 text-white
          animate-[slideUp_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className={`flex-shrink-0 flex items-center gap-3 px-3 sm:px-5 py-3
        backdrop-blur-xl border-b z-30
        ${isDark
          ? 'bg-black/60 border-white/5 text-white'
          : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'}`}>

        <button
          onClick={() => {
            if (onClose) {
              onClose()
            } else if (window.history.length > 1) {
              navigate(-1)
            } else {
              navigate('/pro/conversations')
            }
          }}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {otherParticipant?.avatar_url ? (
              <img
                src={otherParticipant.avatar_url.startsWith('http') || otherParticipant.avatar_url.startsWith('data:')
                  ? otherParticipant.avatar_url
                  : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')}${otherParticipant.avatar_url.startsWith('/') ? '' : '/'}${otherParticipant.avatar_url}`}
                alt=""
                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold">
                {((otherParticipant?.username || otherParticipant?.full_name || 'U')).replace(/^@/, '').charAt(0).toUpperCase()}
              </div>
            )}
            {/* Online dot */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 transition-colors
              ${isDark ? 'border-black' : 'border-white'}
              ${isOtherOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">
              @{((otherParticipant?.username || otherParticipant?.full_name || 'Utilisateur')).replace(/^@/, '')}
            </h2>
            <p className={`text-xs truncate ${isOtherOnline ? 'text-emerald-400' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
              {isOtherOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* WS connection indicator */}
          <div title={isConnected ? 'Temps réel actif' : connectionState}>
            {isConnected
              ? <Wifi size={15} className="text-emerald-400" />
              : <WifiOff size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />}
          </div>

          <button
            onClick={() => { setShowSearch(v => !v); setSearchQuery('') }}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            title="Rechercher"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => setShowMenu(v => !v)}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Header dropdown */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className={`absolute top-16 right-3 z-50 w-52 rounded-2xl shadow-2xl border overflow-hidden
              ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              {[
                { icon: Pin, label: 'Épingler', action: () => { apiFetch(`/conversations/${id}/toggle_pin/`, { method: 'POST' }); setShowMenu(false) } },
                { icon: Archive, label: 'Archiver', action: () => { setShowMenu(false) } },
                { icon: CheckCheck, label: 'Sélection multiple', action: () => { setIsSelectionMode(true); setShowMenu(false) } },
                { icon: Shield, label: 'Bloquer', action: () => { setShowConfirm({ type: 'block' }); setShowMenu(false) }, danger: true },
                { icon: Trash2, label: 'Supprimer la conv.', action: () => { setShowConfirm({ type: 'delete' }); setShowMenu(false) }, danger: true },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                    ${'danger' in item && item.danger
                      ? isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'
                      : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Search Bar ── */}
      {showSearch && (
        <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b
          ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/90 border-slate-200'}`}>
          <Search size={16} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans la conversation..."
            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
          {searchQuery && (
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {filteredMessages.length} résultat{filteredMessages.length !== 1 ? 's' : ''}
            </span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery('') }}>
            <X size={16} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
          </button>
        </div>
      )}

      {/* ── Selection Mode Bar ── */}
      {isSelectionMode && (
        <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2 border-b
          ${isDark ? 'bg-violet-900/30 border-violet-800' : 'bg-violet-50 border-violet-200'}`}>
          <span className="text-sm font-medium text-violet-400">
            {selectedMessageIds.size} sélectionné{selectedMessageIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={batchCopy} className="px-3 py-1 rounded-lg bg-violet-600/20 text-violet-400 text-xs hover:bg-violet-600/30">Copier</button>
            <button onClick={batchDelete} className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30">Supprimer</button>
            <button onClick={() => { setIsSelectionMode(false); setSelectedMessageIds(new Set()) }} className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-0.5 scroll-smooth" id="messages-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-violet-500" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <div className="text-5xl">💬</div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchQuery ? 'Aucun message trouvé' : 'Aucun message. Soyez le premier !'}
            </p>
          </div>
        ) : (
          <>
            {filteredMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === currentUserId}
                theme={resolvedTheme as 'dark' | 'light'}
                isSelected={selectedMessageIds.has(msg.id)}
                isSelectionMode={isSelectionMode}
                searchQuery={searchQuery}
                onReply={(m) => setReplyingTo({ id: m.id, senderName: m.senderName, content: m.content })}
                onCopy={copyMessage}
                onEdit={(m) => setEditingMessage({ id: m.id, content: m.content })}
                onDeleteForMe={deleteForMe}
                onDeleteForAll={deleteForAll}
                onToggleImportant={toggleImportant}
                onForward={(m) => setForwardModal(m)}
                onReport={(msgId) => setReportModal({ id: msgId })}
                onSelect={toggleSelect}
              />
            ))}
            {/* Typing indicator */}
            {typingUser && (
              <TypingIndicator
                username={typingUser.username}
                theme={resolvedTheme as 'dark' | 'light'}
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Reply Banner ── */}
      {replyingTo && (
        <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-l-4 border-l-violet-500
          ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-violet-50 border-violet-100'}`}>
          <Reply size={14} className="text-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-violet-400">{replyingTo.senderName}</span>
            <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {replyingTo.content.substring(0, 80)}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)}>
            <X size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          </button>
        </div>
      )}

      {/* ── Draft indicator ── */}
      {hasDraft && !newMessage && (
        <div className={`flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t text-xs
          ${isDark ? 'bg-amber-900/20 border-amber-800/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
          <span>📝 Brouillon enregistré</span>
          <button
            onClick={() => { localStorage.removeItem(`draft_${id}`); setHasDraft(false) }}
            className="underline hover:no-underline"
          >Effacer</button>
        </div>
      )}

      {/* ── Input Area ── */}
      <div className={`flex-shrink-0 px-3 py-2.5 border-t relative
        ${isDark ? 'bg-black/50 border-white/5 backdrop-blur-xl' : 'bg-white/80 border-slate-200 backdrop-blur-xl shadow-lg'}`}>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          className="hidden"
          onChange={handleDocSelected}
        />

        {/* Attachment Options Popover */}
        {showAttachMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
            <div
              ref={attachMenuRef}
              className={`absolute bottom-full left-4 mb-2 z-50 w-56 rounded-2xl shadow-2xl border p-1.5 animate-[slideUp_0.15s_ease-out]
                ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            >
              <button
                onClick={() => {
                  setShowAttachMenu(false)
                  fileInputRef.current?.click()
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors
                  ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  🖼️
                </div>
                <div className="text-left">
                  <p>Photo / Image</p>
                  <p className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(false)
                  docInputRef.current?.click()
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors
                  ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                  📄
                </div>
                <div className="text-left">
                  <p>Document / Fichier</p>
                  <p className="text-[10px] text-slate-400 font-normal">PDF, DOCX, ZIP</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(false)
                  setShowProOfferModal(true)
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors
                  ${isDark ? 'hover:bg-slate-800 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  💼
                </div>
                <div className="text-left">
                  <p>Devis / Proposition Pro</p>
                  <p className="text-[10px] text-slate-400 font-normal">Offre & contrat chiffré</p>
                </div>
              </button>
            </div>
          </>
        )}

        <div className={`flex items-end gap-1.5 sm:gap-2 rounded-2xl px-3 py-1.5
          ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>

          {/* Attachment button */}
          <button
            onClick={() => setShowAttachMenu(v => !v)}
            title="Partager un fichier, image ou devis pro"
            className={`p-1.5 rounded-xl transition-colors mb-0.5 ${showAttachMenu ? 'bg-emerald-500/20 text-emerald-400' : isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-200'}`}
          >
            <Paperclip size={18} />
          </button>

          {/* Quick Devis Pro button */}
          <button
            onClick={() => setShowProOfferModal(true)}
            title="Créer un Devis / Proposition Professionnelle"
            className="p-1.5 rounded-xl transition-colors mb-0.5 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 font-bold text-xs"
          >
            <span>💼</span>
            <span className="hidden sm:inline text-[11px]">Devis Pro</span>
          </button>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message..."
            rows={1}
            style={{ resize: 'none', minHeight: 36, maxHeight: 120 }}
            className={`flex-1 bg-transparent outline-none text-sm leading-relaxed py-1
              ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-xl transition-all mb-0.5 flex-shrink-0
              ${newMessage.trim()
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 hover:scale-105'
                : isDark ? 'text-slate-600' : 'text-slate-300'}`}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Hint */}
        <p className={`text-center text-[10px] mt-1 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>

      {/* ── Modal Proposition Professionnelle (Devis Pro) ── */}
      {showProOfferModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowProOfferModal(false)}>
          <div
            className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-white/10">
              <h3 className="font-bold text-sm flex items-center gap-2">
                💼 Créer une Proposition & Devis Pro
              </h3>
              <button onClick={() => setShowProOfferModal(false)}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Intitulé de la prestation / projet</label>
                <input
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  placeholder="ex: Développement site web e-commerce"
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Montant chiffré</label>
                  <input
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="ex: 450"
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Devise</label>
                  <select
                    value={offerCurrency}
                    onChange={e => setOfferCurrency(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="$ USD">$ USD</option>
                    <option value="€ EUR">€ EUR</option>
                    <option value="HTG">HTG (Gourdes)</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Délai estimé</label>
                  <select
                    value={offerDuration}
                    onChange={e => setOfferDuration(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="24 heures">24 heures</option>
                    <option value="3 jours">3 jours</option>
                    <option value="1 semaine">1 semaine</option>
                    <option value="15 jours">15 jours</option>
                    <option value="1 mois">1 mois</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Conditions de paiement</label>
                  <select
                    value={offerPaymentTerms}
                    onChange={e => setOfferPaymentTerms(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="100% à la livraison">100% à la livraison</option>
                    <option value="50% acompte + 50% solde">50% acompte + solde</option>
                    <option value="30% acompte + 70% solde">30% acompte + solde</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Détails et livrables inclus</label>
                <textarea
                  value={offerDesc}
                  onChange={e => setOfferDesc(e.target.value)}
                  rows={3}
                  placeholder="Décrivez les livrables clés inclus dans cette offre (ex: Code source, Design Figma, 3 révisions)..."
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowProOfferModal(false)} className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700">Annuler</button>
                <button
                  onClick={handleSendProProposal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:scale-105 transition-all"
                >
                  Envoyer la proposition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingMessage && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl p-5 shadow-2xl
            ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Modifier le message</h3>
            <textarea
              autoFocus
              value={editingMessage.content}
              onChange={e => setEditingMessage(prev => prev ? { ...prev, content: e.target.value } : null)}
              rows={3}
              className={`w-full rounded-xl p-3 text-sm outline-none resize-none border
                ${isDark ? 'bg-slate-800 text-white border-slate-600 focus:border-violet-500' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-violet-500'}`}
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setEditingMessage(null)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Annuler</button>
              <button onClick={submitEdit} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forward Modal ── */}
      {forwardModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl
            ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Transférer le message</h3>
            <div className={`p-3 rounded-xl text-sm mb-4 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              {forwardModal.content}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setForwardModal(null)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Fermer</button>
              <button
                onClick={() => { copyMessage(forwardModal.content); setForwardModal(null); showToast('Contenu copié — collez dans une autre conversation') }}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700"
              >Copier & Transférer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl
            ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>🚩 Signaler le message</h3>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className={`w-full rounded-xl p-3 text-sm outline-none border mb-4
                ${isDark ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
            >
              {['Contenu inapproprié ou spam', 'Harcèlement ou intimidation', 'Discours haineux', 'Informations fausses', 'Autre raison'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setReportModal(null)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Annuler</button>
              <button
                onClick={() => { showToast('Signalement envoyé. Merci.'); setReportModal(null) }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
              >Signaler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {showConfirm.type && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl
            ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {showConfirm.type === 'block' ? '🛡️ Bloquer cet utilisateur ?' : '🗑️ Supprimer la conversation ?'}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {showConfirm.type === 'block'
                ? 'Vous ne pourrez plus vous envoyer de messages.'
                : 'Cette action est irréversible. Tous les messages seront supprimés.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirm({ type: null })} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Annuler</button>
              <button
                onClick={async () => {
                  if (showConfirm.type === 'delete') {
                    await apiFetch(`/conversations/${id}/`, { method: 'DELETE' })
                    navigate('/pro/conversations')
                  }
                  setShowConfirm({ type: null })
                  showToast(showConfirm.type === 'block' ? 'Utilisateur bloqué' : 'Conversation supprimée')
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
              >Confirmer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export const ConversationPage = (): JSX.Element => {
  return <ConversationView />
}

export default ConversationPage
