import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users, Inbox, Search, Clock, XCircle,
  ArrowLeft, Loader2, X, Shield, MessageSquare,
  Send, Check, Ban, CheckCheck, MessageCircle, UserX
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '../../hooks/useQuery'
import { notificationService } from '../../services/notificationService'
import { ConversationView } from './Conversation'

// ─── API Base ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

async function apiFetch(path: string, options?: RequestInit) {
  let token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  try {
    let res = await fetch(`${API}${path}`, { ...options, headers })
    if (res.status === 401) {
      const refresh = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const refreshRes = await fetch(`${API}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          })
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json()
            if (refreshData.access) {
              localStorage.setItem('accessToken', refreshData.access)
              headers['Authorization'] = `Bearer ${refreshData.access}`
              res = await fetch(`${API}${path}`, { ...options, headers })
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

// ─── Types ───────────────────────────────────────────────────────────────────
export type DemandeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'blocked'

interface LastMessageInfo {
  id?: string | number
  content?: string
  created_at?: string
  sender?: { id: number | string; username: string }
  read?: boolean
}

interface Demande {
  id: string
  conversationId?: string | number | null
  senderId: string
  senderName: string
  senderUsername: string
  senderAvatar: string | null
  receiverId: string
  receiverName: string
  receiverUsername: string
  receiverAvatar: string | null
  message: string
  status: DemandeStatus
  createdAt: string
  lastMessage?: LastMessageInfo | null
}

interface BlockedUser {
  id: string
  blocked: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  createdAt: string
}

// ─── Helper Functions ─────────────────────────────────────────────────────────
function normalizeStatus(s: string): DemandeStatus {
  switch (s) {
    case 'accepte':
    case 'accepted': return 'accepted'
    case 'refuse':
    case 'rejected': return 'rejected'
    case 'annule':
    case 'cancelled': return 'cancelled'
    case 'bloque':
    case 'blocked': return 'blocked'
    default: return 'pending'
  }
}

function normalizeDemande(item: any): Demande {
  return {
    id: String(item.id),
    conversationId: item.conversation_id || item.conversation?.id || null,
    senderId: String(item.sender?.id || item.sender_id || ''),
    senderName: item.sender?.full_name || item.sender?.username || 'Utilisateur',
    senderUsername: (item.sender?.username || '').replace(/^@/, ''),
    senderAvatar: item.sender?.avatar_url || item.sender?.photo || null,
    receiverId: String(item.receiver?.id || item.receiver_id || ''),
    receiverName: item.receiver?.full_name || item.receiver?.username || 'Utilisateur',
    receiverUsername: (item.receiver?.username || '').replace(/^@/, ''),
    receiverAvatar: item.receiver?.avatar_url || item.receiver?.photo || null,
    message: item.message || '',
    status: normalizeStatus(item.status),
    createdAt: item.created_at || new Date().toISOString(),
    lastMessage: item.last_message || null,
  }
}

function normalizeConversationToDemande(c: any, currentUserId: string | null): Demande {
  const parts: any[] = c.participants || []
  const partner = parts.find((p: any) => String(p.id) !== String(currentUserId)) || parts[0] || {}
  const lastMsg = c.last_message || (c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null)
  const isLastSenderMe = String(lastMsg?.sender_id || lastMsg?.sender?.id) === String(currentUserId)

  return {
    id: `conv-${c.id}`,
    conversationId: c.id,
    senderId: isLastSenderMe ? String(currentUserId || '') : String(partner.id || ''),
    senderName: isLastSenderMe ? 'Moi' : (partner.full_name || partner.username || 'Utilisateur'),
    senderUsername: (partner.username || '').replace(/^@/, ''),
    senderAvatar: partner.avatar_url || null,
    receiverId: isLastSenderMe ? String(partner.id || '') : String(currentUserId || ''),
    receiverName: partner.full_name || partner.username || 'Utilisateur',
    receiverUsername: (partner.username || '').replace(/^@/, ''),
    receiverAvatar: partner.avatar_url || null,
    message: lastMsg?.content || '',
    status: 'accepted' as DemandeStatus,
    createdAt: c.updated_at || c.created_at || (lastMsg?.created_at) || new Date().toISOString(),
    lastMessage: lastMsg ? {
      id: lastMsg.id,
      content: lastMsg.content,
      created_at: lastMsg.created_at,
      sender: lastMsg.sender || { id: lastMsg.sender_id, username: lastMsg.sender_username },
      read: lastMsg.read,
    } : null,
  }
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'À l\'instant'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`
    if (diff < 604800) return `${Math.floor(diff / 86400)} j`
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// ─── Avatar Dynamic Colors & Real Photo Resolution ────────────────────────────
const AVATAR_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-violet-700',
  'from-emerald-600 via-teal-600 to-cyan-700',
  'from-violet-600 via-purple-600 to-fuchsia-700',
  'from-amber-600 via-orange-600 to-rose-700',
  'from-rose-600 via-pink-600 to-purple-700',
  'from-teal-600 via-emerald-600 to-green-700',
  'from-cyan-600 via-blue-600 to-indigo-700',
  'from-fuchsia-600 via-pink-600 to-rose-700',
  'from-orange-600 via-amber-600 to-yellow-600',
  'from-indigo-600 via-blue-700 to-violet-800',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  const str = name || 'User'
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

import { resolveMediaUrl } from '../../utils/mediaUtils'

function formatAvatarUrl(url: string | null | undefined): string | null {
  const res = resolveMediaUrl(url)
  return res || null
}


function Avatar({ src, name, size = 44 }: { src: string | null; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const formatted = useMemo(() => formatAvatarUrl(src), [src])
  const letter = (name || 'U').replace(/^@/, '').charAt(0).toUpperCase()
  const gradient = useMemo(() => getAvatarGradient(name || 'U'), [name])

  if (formatted && !imgError) {
    return (
      <img
        src={formatted}
        alt={name}
        onError={() => setImgError(true)}
        className="rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md ring-2 ring-white/10`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DemandeStatus, { icon: any; labelKey: string; defaultLabel: string; cls: string }> = {
  pending: { icon: Clock, labelKey: 'pro.requests.pending', defaultLabel: 'En attente', cls: 'text-amber-400 bg-amber-400/10 border border-amber-400/20' },
  accepted: { icon: MessageCircle, labelKey: 'pro.requests.accepted', defaultLabel: 'Discussion', cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  rejected: { icon: XCircle, labelKey: 'pro.requests.rejected', defaultLabel: 'Refusée', cls: 'text-red-400 bg-red-400/10 border border-red-400/20' },
  cancelled: { icon: X, labelKey: 'pro.requests.cancelled', defaultLabel: 'Annulée', cls: 'text-slate-400 bg-slate-400/10 border border-slate-400/20' },
  blocked: { icon: Shield, labelKey: 'pro.requests.blocked', defaultLabel: 'Bloquée', cls: 'text-orange-400 bg-orange-400/10 border border-orange-400/20' },
}

function StatusBadge({ status }: { status: DemandeStatus }) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.cls}`}>
      <Icon size={12} /> {t(cfg.labelKey, cfg.defaultLabel)}
    </span>
  )
}

// ─── Main Unified Requests & WhatsApp Split Component ──────────────────────────
export const Requests = (): JSX.Element => {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { user } = useAuth()
  const currentUserId = useMemo(() => {
    if (user?.id) return String(user.id)
    return getCurrentUserId()
  }, [user])

  type Tab = 'all' | 'accepted' | 'received' | 'sent'
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    if (t === 'sent' || t === 'received' || t === 'accepted' || t === 'all') return t as Tab
    return 'all'
  })

  // Selected conversation ID and Demande for the Right Side Pane
  const [selectedConversationId, setSelectedConversationId] = useState<string | number | null>(() => {
    const convParam = searchParams.get('conv')
    return convParam || null
  })
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [showBlockedPanel, setShowBlockedPanel] = useState(false)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'sent' || t === 'received' || t === 'accepted' || t === 'all') {
      setActiveTab(t as Tab)
    }
  }, [searchParams])

  const handleTabChange = (t: Tab) => {
    setActiveTab(t)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (t === 'all') next.delete('tab')
      else next.set('tab', t)
      return next
    })
  }

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ─── Fetch All Unified Demandes & Conversations ─────────────────────────────
  const fetchAllUnifiedData = useCallback(async (): Promise<Demande[]> => {
    try {
      const [demandesRes, convsRes] = await Promise.all([
        apiFetch('/demandes/').catch(() => null),
        apiFetch('/conversations/').catch(() => null),
      ])

      let loadedDemandes: Demande[] = []
      if (demandesRes && demandesRes.ok) {
        const dData = await demandesRes.json()
        const rawD = Array.isArray(dData) ? dData : (dData.results || [])
        loadedDemandes = rawD.map(normalizeDemande)
      }

      let loadedConvs: any[] = []
      if (convsRes && convsRes.ok) {
        const cData = await convsRes.json()
        loadedConvs = Array.isArray(cData) ? cData : (cData.results || [])
      }

      // Convert conversations into Demande items
      const convDemandes: Demande[] = loadedConvs.map((c: any) =>
        normalizeConversationToDemande(c, currentUserId)
      )

      // Merge: Map existing demandes by conversationId and by partnerId
      const mapByConvId = new Map<string, Demande>()
      const mapByPartner = new Map<string, Demande>()

      for (const d of loadedDemandes) {
        if (d.conversationId) {
          mapByConvId.set(String(d.conversationId), d)
        }
        const partnerId = d.senderId === currentUserId ? d.receiverId : d.senderId
        if (partnerId) {
          mapByPartner.set(String(partnerId), d)
        }
      }

      const mergedList: Demande[] = [...loadedDemandes]

      for (const cd of convDemandes) {
        const convIdStr = String(cd.conversationId)
        const partnerIdStr = cd.senderId === currentUserId ? cd.receiverId : cd.senderId

        const existingByConv = mapByConvId.get(convIdStr)
        const existingByPartner = mapByPartner.get(partnerIdStr)

        if (existingByConv) {
          if (!existingByConv.lastMessage && cd.lastMessage) {
            existingByConv.lastMessage = cd.lastMessage
          }
          if (cd.lastMessage?.content && !existingByConv.message) {
            existingByConv.message = cd.lastMessage.content
          }
        } else if (existingByPartner) {
          existingByPartner.conversationId = cd.conversationId
          if (!existingByPartner.lastMessage && cd.lastMessage) {
            existingByPartner.lastMessage = cd.lastMessage
          }
        } else {
          mergedList.push(cd)
        }
      }

      return mergedList
    } catch (e) {
      console.error('Error fetching unified demandes/conversations:', e)
      return []
    }
  }, [currentUserId])

  const {
    data: allItems,
    isLoading,
    setData: setAllItems,
  } = useQuery<Demande[]>(
    fetchAllUnifiedData,
    { cacheKey: `pro:demandes_and_convs:user:${currentUserId || 'guest'}:v5`, cacheTime: 10_000, initialData: [] }
  )

  // ─── Real-time Auto-mount & 3s Polling ──────────────────────────────────────
  const refetchData = useCallback(async () => {
    try {
      const data = await fetchAllUnifiedData()
      if (data && data.length > 0) {
        setAllItems(data)
      }
    } catch {}
  }, [fetchAllUnifiedData, setAllItems])

  useEffect(() => {
    const handleDataChange = () => {
      refetchData()
    }

    window.addEventListener('exile_demande_created', handleDataChange)
    window.addEventListener('exile_demande_updated', handleDataChange)
    window.addEventListener('storage', handleDataChange)

    const interval = setInterval(() => {
      refetchData()
    }, 3000)

    return () => {
      window.removeEventListener('exile_demande_created', handleDataChange)
      window.removeEventListener('exile_demande_updated', handleDataChange)
      window.removeEventListener('storage', handleDataChange)
      clearInterval(interval)
    }
  }, [refetchData])

  // ─── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = useCallback((id: string, status: DemandeStatus, conversationId?: string | number) => {
    setAllItems((prev: Demande[]) => prev.map(d => d.id === id ? { ...d, status, conversationId: conversationId || d.conversationId } : d))
  }, [setAllItems])

  // Open Conversation on the Right Pane instantly
  const handleOpenConversation = useCallback(async (d: Demande) => {
    setSelectedDemande(d)
    setSelectedConversationId(d.conversationId || `demande-${d.id}`)

    const partnerId = d.senderId === currentUserId ? d.receiverId : d.senderId
    if (!partnerId) return

    if (!d.conversationId) {
      try {
        const startRes = await apiFetch('/conversations/start/', {
          method: 'POST',
          body: JSON.stringify({ participant_id: Number(partnerId) })
        })
        if (startRes.ok) {
          const startData = await startRes.json()
          if (startData.id) {
            updateStatus(d.id, d.status, startData.id)
            setSelectedConversationId(startData.id)
            setSelectedDemande(prev => prev ? { ...prev, conversationId: startData.id } : null)
          }
        }
      } catch {}
    }
  }, [currentUserId, updateStatus])

  // Accept Demande -> Opens discussion on the right immediately
  const handleAccept = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':accept')
    try {
      const res = await apiFetch(`/demandes/${d.id}/accept/`, { method: 'POST' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || 'Erreur lors de l\'acceptation')
      }
      const data = await res.json()
      const convId = data.conversation_id || data.conversation?.id

      updateStatus(d.id, 'accepted', convId)

      // Notify User A
      notificationService.notifyRequestAccepted(d.senderUsername || d.senderName, convId)

      // Dispatch real-time events
      window.dispatchEvent(new CustomEvent('exile_demande_updated', { detail: { id: d.id, status: 'accepted', convId } }))
      window.dispatchEvent(new Event('storage'))

      showToast(t('pro.requests.acceptedToast', '🎉 Demande acceptée ! Ouverture de la discussion...'))

      const updatedD: Demande = { ...d, status: 'accepted' as DemandeStatus, conversationId: convId || d.conversationId }
      setSelectedDemande(updatedD)
      setSelectedConversationId(convId || `demande-${d.id}`)

      if (!convId) {
        handleOpenConversation(updatedD)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('pro.requests.acceptError', 'Erreur lors de l\'acceptation'), 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [handleOpenConversation, showToast, updateStatus, t])

  // Reject Demande
  const handleReject = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':reject')
    try {
      const res = await apiFetch(`/demandes/${d.id}/reject/`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Erreur')
      updateStatus(d.id, 'rejected')
      setSelectedDemande(prev => prev && prev.id === d.id ? { ...prev, status: 'rejected' } : prev)
      showToast(t('pro.requests.rejectedToast', 'Demande refusée'))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [showToast, updateStatus, t])

  // Cancel Demande
  const handleCancel = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':cancel')
    try {
      const res = await apiFetch(`/demandes/${d.id}/cancel/`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Erreur')
      updateStatus(d.id, 'cancelled')
      setSelectedDemande(prev => prev && prev.id === d.id ? { ...prev, status: 'cancelled' } : prev)
      showToast(t('pro.requests.cancelledToast', 'Demande annulée'))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [showToast, updateStatus, t])

  // Block User
  const handleBlock = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':block')
    try {
      const targetUser = d.senderId === currentUserId ? d.receiverId : d.senderId
      const res = await apiFetch('/blocked/blocked-users/', {
        method: 'POST',
        body: JSON.stringify({ blocked_user: targetUser }),
      })
      if (!res.ok) throw new Error(t('pro.requests.blockError', 'Erreur lors du blocage'))
      updateStatus(d.id, 'blocked')
      setSelectedDemande(prev => prev && prev.id === d.id ? { ...prev, status: 'blocked' } : prev)
      showToast(t('pro.requests.blockedToast', '🚫 Utilisateur bloqué'))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [currentUserId, showToast, updateStatus, t])

  // Load Blocked Users
  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlocked(true)
    try {
      const res = await apiFetch('/blocked/blocked-users/')
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(data.results || data)
      }
    } catch {} finally {
      setLoadingBlocked(false)
    }
  }, [])

  const handleUnblock = useCallback(async (userId: string) => {
    try {
      const res = await apiFetch('/blocked/blocked-users/', {
        method: 'DELETE',
        body: JSON.stringify({ blocked_user: userId }),
      })
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(b => b.blocked.id !== userId))
        showToast('Utilisateur débloqué ✓')
      }
    } catch {
      showToast('Erreur lors du déblocage', 'error')
    }
  }, [showToast])

  // ─── Filtered, Deduplicated & Sorted Demandes ──────────────────────────────
  const deduplicatedDemandes = useMemo(() => {
    const threadMap = new Map<string, Demande>()
    for (const d of allItems || []) {
      const isSender = String(d.senderId) === String(currentUserId)
      const partnerKey = isSender ? String(d.receiverId || d.receiverUsername) : String(d.senderId || d.senderUsername)
      const existing = threadMap.get(partnerKey)

      if (!existing) {
        threadMap.set(partnerKey, d)
      } else {
        const isCurrentAccepted = d.status === 'accepted'
        const isExistingAccepted = existing.status === 'accepted'

        if (isCurrentAccepted && !isExistingAccepted) {
          threadMap.set(partnerKey, d)
        } else if (!isCurrentAccepted && isExistingAccepted) {
          // Keep existing accepted
        } else {
          const timeD = new Date(d.lastMessage?.created_at || d.createdAt).getTime()
          const timeEx = new Date(existing.lastMessage?.created_at || existing.createdAt).getTime()
          if (timeD > timeEx) {
            threadMap.set(partnerKey, d)
          }
        }
      }
    }
    return Array.from(threadMap.values())
  }, [allItems, currentUserId])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()

    let baseList: Demande[] = []
    if (activeTab === 'received') {
      // Tout reçues
      baseList = (allItems || []).filter(d => !d.id.startsWith('conv-') && String(d.receiverId) === String(currentUserId))
    } else if (activeTab === 'sent') {
      // Tout envoyées
      baseList = (allItems || []).filter(d => !d.id.startsWith('conv-') && String(d.senderId) === String(currentUserId))
    } else if (activeTab === 'accepted') {
      // Tout discussions
      baseList = deduplicatedDemandes.filter(d => d.status === 'accepted' || (Boolean(d.conversationId) && d.status !== 'rejected' && d.status !== 'cancelled'))
    } else {
      // Tous
      baseList = deduplicatedDemandes
    }

    const list = baseList.filter(d => {
      const isSender = String(d.senderId) === String(currentUserId)
      const username = (isSender ? d.receiverUsername : d.senderUsername).toLowerCase()
      const name = (isSender ? d.receiverName : d.senderName).toLowerCase()
      const msg = (d.message || d.lastMessage?.content || '').toLowerCase()
      return !q || username.includes(q) || name.includes(q) || msg.includes(q)
    })

    return list.sort((a, b) => {
      const timeA = new Date(a.lastMessage?.created_at || a.createdAt).getTime()
      const timeB = new Date(b.lastMessage?.created_at || b.createdAt).getTime()
      return timeB - timeA
    })
  }, [allItems, deduplicatedDemandes, activeTab, searchQuery, currentUserId])

  // Tab counts
  const counts = useMemo(() => {
    const rawList = allItems || []
    return {
      all: deduplicatedDemandes.length,
      accepted: deduplicatedDemandes.filter(d => d.status === 'accepted' || (Boolean(d.conversationId) && d.status !== 'rejected' && d.status !== 'cancelled')).length,
      received: rawList.filter(d => !d.id.startsWith('conv-') && String(d.receiverId) === String(currentUserId)).length,
      sent: rawList.filter(d => !d.id.startsWith('conv-') && String(d.senderId) === String(currentUserId)).length,
    }
  }, [deduplicatedDemandes, allItems, currentUserId])

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'all', label: t('pro.requests.all', 'Tous'), icon: Users },
    { id: 'accepted', label: t('pro.requests.discussions', 'Discussions'), icon: MessageCircle },
    { id: 'received', label: t('pro.requests.received', 'Reçues'), icon: Inbox },
    { id: 'sent', label: t('pro.requests.sent', 'Envoyées'), icon: Send },
  ]

  const base = isDark ? 'bg-[#0b0e14] text-white' : 'bg-slate-50 text-slate-900'
  const leftBg = isDark ? 'bg-[#0f131a] border-slate-800/80' : 'bg-white border-slate-200'
  const card = isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
  const subtle = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`flex-1 h-full min-h-0 flex overflow-hidden ${base}`}>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium
          ${toast.type === 'error'
            ? 'bg-red-600 text-white shadow-red-950/30'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-950/30'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── LEFT PANE : Requests & Discussions Hub (WhatsApp Style List) ── */}
      <div className={`flex flex-col border-r ${leftBg} ${selectedConversationId ? 'hidden lg:flex lg:w-[420px] xl:w-[460px]' : 'w-full lg:w-[420px] xl:w-[460px]'} flex-shrink-0 h-full overflow-hidden`}>
        
        {/* Top Header */}
        <div className={`flex-shrink-0 p-3.5 border-b backdrop-blur-xl ${isDark ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/80'}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  if (window.history.length > 1) navigate(-1)
                  else navigate('/pro')
                }}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Inbox size={18} />
              </div>
              <h1 className="font-bold text-base">{t('pro.requests.hubTitle', 'Demandes & Discussions')}</h1>
            </div>

            <button
              onClick={() => { setShowBlockedPanel(true); loadBlockedUsers() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              <Shield size={13} /> {t('pro.requests.blocked', 'Bloqués')}
            </button>
          </div>

          {/* Search bar */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
            <Search size={15} className={subtle} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('pro.requests.searchByUsername', 'Rechercher par @username...')}
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={13} className={subtle} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              const isDiscussions = tab.id === 'accepted'

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                    ${active
                      ? isDiscussions
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                        : 'bg-violet-600 text-white shadow-md shadow-violet-900/30 font-semibold'
                      : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <Icon size={13} />
                  {tab.label}
                  {counts[tab.id] > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ml-0.5
                      ${active ? 'bg-white/20 text-white' : isDiscussions ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`}>
                      {counts[tab.id]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
              <p className={`text-xs ${subtle}`}>{t('pro.requests.loading', 'Chargement des échanges...')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
              <MessageCircle size={40} className={subtle} />
              <p className={`text-xs text-center ${subtle}`}>
                {searchQuery ? t('pro.requests.noResults', 'Aucun résultat trouvé') : t('pro.requests.noRequests', 'Aucune demande pour le moment')}
              </p>
            </div>
          ) : filtered.map(d => {
            const isSender = String(d.senderId) === String(currentUserId)
            const otherUsername = (isSender ? d.receiverUsername : d.senderUsername) || (isSender ? d.receiverName : d.senderName)
            const otherAvatar = isSender ? d.receiverAvatar : d.senderAvatar
            const isAccepted = d.status === 'accepted'
            const isSelected = selectedDemande?.id === d.id || (Boolean(d.conversationId) && String(d.conversationId) === String(selectedConversationId))
            const isLoadingAction = loadingAction?.startsWith(d.id + ':')
            const isDiscussionTab = activeTab === 'accepted'
            const showAsDiscussionCard = isAccepted && (isDiscussionTab || activeTab === 'all')

            // ─── 1. WhatsApp Discussion Card (Accepted in Discussions or All) ──
            if (showAsDiscussionCard) {
              const previewMsg = d.lastMessage?.content || d.message || t('pro.requests.activeDiscussion', 'Discussion active')
              const msgTime = timeAgo(d.lastMessage?.created_at || d.createdAt)

              return (
                <div
                  key={d.id}
                  onClick={() => handleOpenConversation(d)}
                  className={`rounded-2xl border p-3.5 cursor-pointer transition-all duration-150 ${card}
                    ${isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                      : 'hover:border-emerald-500/50 hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={otherAvatar} name={otherUsername} size={46} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate text-emerald-400">
                          @{otherUsername.replace(/^@/, '')}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                          {msgTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 text-xs text-slate-300">
                          <CheckCheck size={14} className="text-emerald-400 flex-shrink-0" />
                          <p className="truncate text-xs">
                            {previewMsg}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                          <MessageSquare size={10} /> {t('pro.requests.open', 'Ouvrir')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            // ─── 2. Request Card (Pending / Reçues / Envoyées) ───────────────
            return (
              <div
                key={d.id}
                onClick={() => handleOpenConversation(d)}
                className={`rounded-2xl border p-3.5 cursor-pointer transition-all duration-150 ${card}
                  ${isSelected
                    ? 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/10'
                    : 'hover:border-violet-500/40 hover:shadow-md'}
                  ${isLoadingAction ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar src={otherAvatar} name={otherUsername} size={42} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">@{otherUsername.replace(/^@/, '')}</span>
                      <span className={`text-[11px] ml-auto ${subtle}`}>{timeAgo(d.createdAt)}</span>
                    </div>

                    <p className={`text-xs mt-0.5 ${subtle}`}>
                      {isSender ? `→ ${t('pro.requests.requestSent', 'Demande envoyée')}` : `← ${t('pro.requests.requestReceived', 'Demande reçue')}`}
                    </p>

                    {d.message && (
                      <p className={`text-xs mt-2 px-3 py-1.5 rounded-xl leading-relaxed
                        ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        "{d.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      <StatusBadge status={d.status} />

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {!isSender && d.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReject(d)}
                              disabled={!!loadingAction}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              {t('pro.requests.reject', 'Refuser')}
                            </button>
                            <button
                              onClick={() => handleBlock(d)}
                              disabled={!!loadingAction}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                              {t('pro.requests.block', 'Bloquer')}
                            </button>
                            <button
                              onClick={() => handleAccept(d)}
                              disabled={!!loadingAction}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:scale-105 transition-all flex items-center gap-1"
                            >
                              <Check size={12} /> {t('pro.requests.accept', 'Accepter')}
                            </button>
                          </>
                        )}

                        {isSender && d.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(d)}
                            disabled={!!loadingAction}
                            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                          >
                            {t('pro.requests.cancel', 'Annuler')}
                          </button>
                        )}

                        {d.status === 'accepted' && (
                          <button
                            onClick={() => handleOpenConversation(d)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                          >
                            <MessageSquare size={12} /> Ouvrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANE : WhatsApp Active Conversation View ── */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${selectedConversationId || selectedDemande ? 'flex' : 'hidden lg:flex'}`}>
        {selectedDemande ? (
          <ConversationView
            key={`demande-${selectedDemande.id}-${selectedDemande.conversationId || 'none'}`}
            conversationId={selectedDemande.conversationId}
            partnerId={String(selectedDemande.senderId) === String(currentUserId) ? selectedDemande.receiverId : selectedDemande.senderId}
            partnerUsername={String(selectedDemande.senderId) === String(currentUserId) ? selectedDemande.receiverUsername : selectedDemande.senderUsername}
            partnerAvatar={String(selectedDemande.senderId) === String(currentUserId) ? selectedDemande.receiverAvatar : selectedDemande.senderAvatar}
            initialMessage={selectedDemande.message}
            demandeStatus={selectedDemande.status}
            isDemandeSender={String(selectedDemande.senderId) === String(currentUserId)}
            onAcceptDemande={() => handleAccept(selectedDemande)}
            onRejectDemande={() => handleReject(selectedDemande)}
            onBlockUser={() => handleBlock(selectedDemande)}
            onClose={() => {
              setSelectedConversationId(null)
              setSelectedDemande(null)
            }}
          />
        ) : selectedConversationId ? (
          <ConversationView
            key={`conv-${selectedConversationId}`}
            conversationId={selectedConversationId}
            onClose={() => {
              setSelectedConversationId(null)
              setSelectedDemande(null)
            }}
          />
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center select-none ${isDark ? 'bg-[#090c10] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
              <MessageCircle size={38} />
            </div>
            <h2 className={`text-lg font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pro.requests.emptyTitle', 'Messagerie Professionnelle Instantanée')}</h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t('pro.requests.emptyDesc', 'Sélectionnez une discussion ou cliquez sur une demande à gauche pour ouvrir et commencer la conversation instantanément ici à droite.')}
            </p>
          </div>
        )}
      </div>

      {/* ── Blocked Users Modal Panel ── */}
      {showBlockedPanel && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBlockedPanel(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className="font-bold flex items-center gap-2 text-sm">
                <Shield size={18} className="text-orange-400" /> {t('pro.modals.blockedUsers', 'Utilisateurs bloqués')}
              </h2>
              <button onClick={() => setShowBlockedPanel(false)}>
                <X size={18} className={subtle} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-2">
              {loadingBlocked ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
                  <UserX size={32} className={subtle} />
                  <p className={`text-sm ${subtle}`}>{t('pro.modals.noBlockedUsers', 'Aucun utilisateur bloqué')}</p>
                </div>
              ) : blockedUsers.map(b => (
                <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <Avatar src={b.blocked.avatar_url || null} name={b.blocked.full_name || b.blocked.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.blocked.full_name || b.blocked.username}</p>
                    <p className={`text-xs ${subtle}`}>@{b.blocked.username}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(b.blocked.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-orange-50 text-orange-500 hover:bg-orange-100'}`}
                  >
                    {t('pro.modals.unblock', 'Débloquer')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Requests
