import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users, Inbox, Search, Clock, XCircle,
  ArrowLeft, Loader2, X, Shield, MessageSquare,
  Send, Check, Ban, CheckCheck, MessageCircle
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from '../../hooks/useQuery'
import { notificationService } from '../../services/notificationService'
import { ConversationView } from './Conversation'

// ─── API Base ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

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
    if (!res.ok && API.includes('onrender.com')) {
      try {
        const localRes = await fetch(`http://localhost:8000/api/v1${path}`, { ...options, headers })
        if (localRes.ok) return localRes
      } catch {}
    }
    return res
  } catch (err) {
    if (API.includes('onrender.com')) {
      try {
        return await fetch(`http://localhost:8000/api/v1${path}`, { ...options, headers })
      } catch {}
    }
    throw err
  }
}

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return String(payload.user_id || payload.id || '')
  } catch {
    return null
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

function formatAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  if (trimmed.startsWith('/media/') || trimmed.startsWith('media/')) {
    const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')
    return `${base}${clean}`
  }

  const supabaseBase = import.meta.env.VITE_SUPABASE_URL || 'https://phjpbbcymhtppfkyoegk.supabase.co'
  return `${supabaseBase}/storage/v1/object/public/Exile_images/${trimmed.replace(/^\/+/, '')}`
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
const STATUS_CONFIG: Record<DemandeStatus, { icon: any; label: string; cls: string }> = {
  pending: { icon: Clock, label: 'En attente', cls: 'text-amber-400 bg-amber-400/10 border border-amber-400/20' },
  accepted: { icon: MessageCircle, label: 'Discussion', cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  rejected: { icon: XCircle, label: 'Refusée', cls: 'text-red-400 bg-red-400/10 border border-red-400/20' },
  cancelled: { icon: X, label: 'Annulée', cls: 'text-slate-400 bg-slate-400/10 border border-slate-400/20' },
  blocked: { icon: Shield, label: 'Bloquée', cls: 'text-orange-400 bg-orange-400/10 border border-orange-400/20' },
}

function StatusBadge({ status }: { status: DemandeStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

// ─── Main Unified Requests & WhatsApp Split Component ──────────────────────────
export const Requests = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentUserId = useMemo(() => getCurrentUserId(), [])

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

  // ─── Load demandes & conversations ──────────────────────────────────────────
  const {
    data: cachedDemandes,
    isLoading,
    setData: setDemandes,
  } = useQuery<Demande[]>(
    async () => {
      const res = await apiFetch('/demandes/')
      if (!res.ok) throw new Error('Erreur chargement demandes')
      const data = await res.json()
      const raw = Array.isArray(data) ? data : (data.results || [])
      return raw.map(normalizeDemande)
    },
    { cacheKey: `pro:demandes:user:${currentUserId || 'guest'}:v4`, cacheTime: 10_000, initialData: [] }
  )

  const demandes = useMemo(() => {
    if (!currentUserId) return []
    return (cachedDemandes || []).filter(
      d => String(d.senderId) === String(currentUserId) || String(d.receiverId) === String(currentUserId)
    )
  }, [cachedDemandes, currentUserId])

  // ─── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = useCallback((id: string, status: DemandeStatus, conversationId?: string | number) => {
    setDemandes((prev: Demande[]) => prev.map(d => d.id === id ? { ...d, status, conversationId: conversationId || d.conversationId } : d))
  }, [setDemandes])

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
            updateStatus(d.id, 'accepted', startData.id)
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
      notificationService.notifyRequestAccepted(d.senderUsername || d.senderName, convId)
      showToast('🎉 Demande acceptée ! Ouverture...')

      const updatedD = { ...d, status: 'accepted' as DemandeStatus, conversationId: convId || d.conversationId }
      setSelectedDemande(updatedD)
      setSelectedConversationId(convId || `demande-${d.id}`)

      if (!convId) {
        handleOpenConversation(updatedD)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'acceptation', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [handleOpenConversation, showToast, updateStatus])

  // Reject Demande
  const handleReject = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':reject')
    try {
      const res = await apiFetch(`/demandes/${d.id}/reject/`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Erreur')
      updateStatus(d.id, 'rejected')
      showToast('Demande refusée')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [showToast, updateStatus])

  // Cancel Demande
  const handleCancel = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':cancel')
    try {
      const res = await apiFetch(`/demandes/${d.id}/cancel/`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Erreur')
      updateStatus(d.id, 'cancelled')
      showToast('Demande annulée')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [showToast, updateStatus])

  // Block User
  const handleBlock = useCallback(async (d: Demande) => {
    setLoadingAction(d.id + ':block')
    try {
      const targetUser = d.senderId === currentUserId ? d.receiverId : d.senderId
      const res = await apiFetch('/blocked/blocked-users/', {
        method: 'POST',
        body: JSON.stringify({ blocked_user: targetUser }),
      })
      if (!res.ok) throw new Error('Erreur lors du blocage')
      updateStatus(d.id, 'blocked')
      showToast('🚫 Utilisateur bloqué')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setLoadingAction(null)
    }
  }, [currentUserId, showToast, updateStatus])

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
    for (const d of demandes) {
      const isSender = d.senderId === currentUserId
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
  }, [demandes, currentUserId])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const list = deduplicatedDemandes.filter(d => {
      const isSender = d.senderId === currentUserId
      const username = (isSender ? d.receiverUsername : d.senderUsername).toLowerCase()
      const name = (isSender ? d.receiverName : d.senderName).toLowerCase()
      const msg = d.message.toLowerCase()
      const matchesSearch = !q || username.includes(q) || name.includes(q) || msg.includes(q)

      switch (activeTab) {
        case 'accepted': return d.status === 'accepted' && matchesSearch
        case 'received': return !isSender && d.status === 'pending' && matchesSearch
        case 'sent': return isSender && d.status === 'pending' && matchesSearch
        default: return matchesSearch
      }
    })

    return list.sort((a, b) => {
      const timeA = new Date(a.lastMessage?.created_at || a.createdAt).getTime()
      const timeB = new Date(b.lastMessage?.created_at || b.createdAt).getTime()
      return timeB - timeA
    })
  }, [deduplicatedDemandes, activeTab, searchQuery, currentUserId])

  // Tab counts
  const counts = useMemo(() => ({
    all: deduplicatedDemandes.length,
    accepted: deduplicatedDemandes.filter(d => d.status === 'accepted').length,
    received: deduplicatedDemandes.filter(d => d.senderId !== currentUserId && d.status === 'pending').length,
    sent: deduplicatedDemandes.filter(d => d.senderId === currentUserId && d.status === 'pending').length,
  }), [deduplicatedDemandes, currentUserId])

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'all', label: 'Tous', icon: Users },
    { id: 'accepted', label: 'Discussions', icon: MessageCircle },
    { id: 'received', label: 'Reçues', icon: Inbox },
    { id: 'sent', label: 'Envoyées', icon: Send },
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
              <h1 className="font-bold text-base">Demandes & Discussions</h1>
            </div>

            <button
              onClick={() => { setShowBlockedPanel(true); loadBlockedUsers() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              <Shield size={13} /> Bloqués
            </button>
          </div>

          {/* Search bar */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
            <Search size={15} className={subtle} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par @username..."
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
              <p className={`text-xs ${subtle}`}>Chargement des échanges...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
              <MessageCircle size={40} className={subtle} />
              <p className={`text-xs text-center ${subtle}`}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune demande pour le moment'}
              </p>
            </div>
          ) : filtered.map(d => {
            const isSender = d.senderId === currentUserId
            const otherUsername = (isSender ? d.receiverUsername : d.senderUsername) || (isSender ? d.receiverName : d.senderName)
            const otherAvatar = isSender ? d.receiverAvatar : d.senderAvatar
            const isAccepted = d.status === 'accepted'
            const isSelected = String(d.conversationId) === String(selectedConversationId)
            const isLoadingAction = loadingAction?.startsWith(d.id + ':')

            // ─── 1. WhatsApp Discussion Card (Accepted) ────────────────────────
            if (isAccepted) {
              const previewMsg = d.lastMessage?.content || d.message || 'Discussion active'
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
                          <MessageSquare size={10} /> Ouvrir
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            // ─── 2. Request Card (Pending / Rejected / Cancelled) ──────────────
            return (
              <div
                key={d.id}
                className={`rounded-2xl border p-3.5 transition-all duration-150 ${card}
                  ${isLoadingAction ? 'opacity-70 pointer-events-none' : 'hover:border-violet-500/30'}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar src={otherAvatar} name={otherUsername} size={42} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">@{otherUsername.replace(/^@/, '')}</span>
                      <span className={`text-[11px] ml-auto ${subtle}`}>{timeAgo(d.createdAt)}</span>
                    </div>

                    <p className={`text-xs mt-0.5 ${subtle}`}>
                      {isSender ? '→ Demande envoyée' : '← Demande reçue'}
                    </p>

                    {d.message && (
                      <p className={`text-xs mt-2 px-3 py-1.5 rounded-xl leading-relaxed
                        ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        "{d.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      <StatusBadge status={d.status} />

                      <div className="flex items-center gap-2">
                        {!isSender && d.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReject(d)}
                              disabled={!!loadingAction}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              Refuser
                            </button>
                            <button
                              onClick={() => handleBlock(d)}
                              disabled={!!loadingAction}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                              Bloquer
                            </button>
                            <button
                              onClick={() => handleAccept(d)}
                              disabled={!!loadingAction}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:scale-105 transition-all flex items-center gap-1"
                            >
                              <Check size={12} /> Accepter
                            </button>
                          </>
                        )}

                        {isSender && d.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(d)}
                            disabled={!!loadingAction}
                            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                          >
                            Annuler
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
            conversationId={selectedDemande.conversationId}
            partnerId={selectedDemande.senderId === currentUserId ? selectedDemande.receiverId : selectedDemande.senderId}
            partnerUsername={selectedDemande.senderId === currentUserId ? selectedDemande.receiverUsername : selectedDemande.senderUsername}
            partnerAvatar={selectedDemande.senderId === currentUserId ? selectedDemande.receiverAvatar : selectedDemande.senderAvatar}
            initialMessage={selectedDemande.message}
            onClose={() => {
              setSelectedConversationId(null)
              setSelectedDemande(null)
            }}
          />
        ) : selectedConversationId ? (
          <ConversationView
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
            <h2 className={`text-lg font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Messagerie Professionnelle Instantanée</h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Sélectionnez une discussion ou acceptez une demande à gauche pour ouvrir et commencer la conversation instantanément ici à droite.
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
                <Shield size={18} className="text-orange-400" /> Utilisateurs bloqués
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
                  <p className={`text-sm ${subtle}`}>Aucun utilisateur bloqué</p>
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
                    Débloquer
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
