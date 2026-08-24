import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Users, 
  Inbox, 
  Check, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Handshake,
  ArrowLeft,
  Loader2,
  Star,
  UserX,
  X,
  Shield
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
  ? API_BASE_URL.replace('/api', '/api/v1') 
  : API_BASE_URL

interface Request {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  senderProfession: string
  receiverId: string
  receiverName: string
  receiverAvatar: string | null
  receiverProfession: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  createdAt: string
  respondedAt?: string
}

interface ImportantMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  isImportant: boolean
  read: boolean
  createdAt: string
  sender: {
    id: string
    fullName: string
    username: string
    avatarUrl?: string
  }
}

interface BlockedUser {
  id: string
  blockerId: string
  blockedId: string
  blocked: {
    id: string
    username: string
    fullName: string
    avatarUrl?: string
    professionalProfile?: {
      profession: string
    }
  }
  createdAt: string
}

export const Requests = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent' | 'accepted' | 'important' | 'blocked'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [importantMessages, setImportantMessages] = useState<ImportantMessage[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [toast, setToast] = useState('')

  // Fonction de navigation conditionnelle
  const handleBack = () => {
    const previousPage = localStorage.getItem('exile_previous_page')
    if (previousPage === '/pro/profile') {
      // On vient de Mon compte → retour vers Mon compte
      navigate('/pro/profile')
    } else {
      // On vient du prosidebar → retour vers accueil
      navigate('/pro')
    }
  }

  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'sent') {
      setActiveTab('sent')
    }
  }, [searchParams])

  const [loading, setLoading] = useState(true)
  const [loadingImportant, setLoadingImportant] = useState(false)
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Load requests from backend API
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current user ID from token
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }
        
        // Decode token to get user ID
        const tokenPayload = JSON.parse(atob(token.split('.')[1]))
        const userId = tokenPayload.user_id
        setCurrentUserId(userId)
        
        // Fetch all requests from backend (no type filtering)
        const response = await fetch(`${FINAL_API_BASE_URL}/demandes/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch requests')
        }
        
        const data = await response.json()
        
        // Transform backend data to frontend format
        const transformedRequests: Request[] = data.map((item: any) => ({
          id: item.id,
          senderId: item.sender_id || (item.sender?.id),
          senderName: item.sender?.username || item.sender,
          senderAvatar: null,
          senderProfession: 'Professionnel',
          receiverId: item.receiver_id || (item.receiver?.id),
          receiverName: item.receiver?.username || item.receiver,
          receiverAvatar: null,
          receiverProfession: 'Professionnel',
          message: item.message,
          status: item.status === 'envoye' ? 'pending' : 
                 item.status === 'accepte' ? 'accepted' : 
                 item.status === 'refuse' ? 'rejected' : 
                 item.status === 'annule' ? 'cancelled' :
                 item.status === 'bloque' ? 'expired' : 'pending',
          createdAt: item.created_at,
          respondedAt: undefined
        }))
        
        setRequests(transformedRequests)
      } catch (err) {
        console.error('Error loading requests:', err)
        setError('Erreur lors du chargement des demandes')
      } finally {
        setLoading(false)
      }
    }
    
    loadRequests()
  }, [navigate])

  // Load important messages when tab changes
  useEffect(() => {
    if (activeTab === 'important') {
      const loadImportantMessages = async () => {
        try {
          setLoadingImportant(true)
          const token = localStorage.getItem('accessToken')
          if (!token) return

          const response = await fetch(`${FINAL_API_BASE_URL}/conversations/messages/important/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (response.ok) {
            const data = await response.json()
            setImportantMessages(data.results || data)
          }
        } catch (err) {
          console.error('Error loading important messages:', err)
        } finally {
          setLoadingImportant(false)
        }
      }
      loadImportantMessages()
    }
  }, [activeTab])

  const loadBlockedUsers = useCallback(async () => {
    try {
      setLoadingBlocked(true)
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`${FINAL_API_BASE_URL}/blocked/blocked-users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setBlockedUsers(data.results || data)
      }
    } catch (err) {
      console.error('Error loading blocked users:', err)
    } finally {
      setLoadingBlocked(false)
    }
  }, [])

  // Load blocked users when tab changes
  useEffect(() => {
    if (activeTab === 'blocked') {
      loadBlockedUsers()
    }
  }, [activeTab, loadBlockedUsers])

  const handleUnblock = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setToast('Token non trouvé')
        setTimeout(() => setToast(''), 3000)
        return
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/blocked/blocked-users/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blocked_user: userId })
      })

      if (response.ok) {
        setToast('Utilisateur débloqué avec succès')
        setTimeout(() => setToast(''), 3000)
        loadBlockedUsers()
      } else {
        throw new Error('Erreur lors du déblocage')
      }
    } catch (err) {
      console.error('Error unblocking user:', err)
      setToast('Erreur lors du déblocage')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleMessageClick = (conversationId: string) => {
    navigate(`/pro/conversation/${conversationId}`)
  }

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }
      
      const endpoint = action === 'accept' ? 'accept' : 'reject'
      
      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/${requestId}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.detail || 'Failed to respond to request')
      }
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'accept' ? 'accepted' : 'rejected' } 
          : req
      ))
      
      setToast(action === 'accept' ? 'Demande acceptée' : 'Demande refusée')
      setTimeout(() => setToast(''), 3000)
      
      // Reload requests to get updated data
      const reloadResponse = await fetch(`${FINAL_API_BASE_URL}/demandes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        const transformedRequests: Request[] = data.map((item: any) => ({
          id: item.id,
          senderId: item.sender_id || (item.sender?.id),
          senderName: item.sender?.username || item.sender,
          senderAvatar: null,
          senderProfession: 'Professionnel',
          receiverId: item.receiver_id || (item.receiver?.id),
          receiverName: item.receiver?.username || item.receiver,
          receiverAvatar: null,
          receiverProfession: 'Professionnel',
          message: item.message,
          status: item.status === 'envoye' ? 'pending' : 
                 item.status === 'accepte' ? 'accepted' : 
                 item.status === 'refuse' ? 'rejected' : 
                 item.status === 'bloque' ? 'expired' : 'pending',
          createdAt: item.created_at,
          respondedAt: undefined
        }))
        setRequests(transformedRequests)
      }
    } catch (err) {
      console.error('Error responding to request:', err)
      setToast(err instanceof Error ? err.message : 'Erreur lors de la réponse')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }
      
      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/${requestId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.detail || 'Failed to cancel request')
      }
      
      // Update local state - change status to cancelled
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'cancelled' as any } 
          : req
      ))
      
      setToast('Demande annulée')
      setTimeout(() => setToast(''), 3000)
      
      // Reload requests to get updated data
      const reloadResponse = await fetch(`${FINAL_API_BASE_URL}/demandes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        const transformedRequests: Request[] = data.map((item: any) => ({
          id: item.id,
          senderId: item.sender_id || (item.sender?.id),
          senderName: item.sender?.username || item.sender,
          senderAvatar: null,
          senderProfession: 'Professionnel',
          receiverId: item.receiver_id || (item.receiver?.id),
          receiverName: item.receiver?.username || item.receiver,
          receiverAvatar: null,
          receiverProfession: 'Professionnel',
          message: item.message,
          status: item.status === 'envoye' ? 'pending' : 
                 item.status === 'accepte' ? 'accepted' : 
                 item.status === 'refuse' ? 'rejected' : 
                 item.status === 'annule' ? 'cancelled' :
                 item.status === 'bloque' ? 'expired' : 'pending',
          createdAt: item.created_at,
          respondedAt: undefined
        }))
        setRequests(transformedRequests)
      }
    } catch (err) {
      console.error('Error cancelling request:', err)
      setToast(err instanceof Error ? err.message : 'Erreur lors de l\'annulation')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleBlockFromRequest = async (_requestId: string, senderId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setToast('Token non trouvé')
        setTimeout(() => setToast(''), 3000)
        return
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/blocked/blocked-users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blocked_user: senderId })
      })

      if (response.ok) {
        setToast('Utilisateur bloqué avec succès')
        setTimeout(() => setToast(''), 3000)
        loadBlockedUsers()
      } else {
        throw new Error('Erreur lors du blocage')
      }
    } catch (err) {
      console.error('Error blocking user:', err)
      setToast('Erreur lors du blocage')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all'
      ? request.status !== 'cancelled' // Hide cancelled from all
      : activeTab === 'received'
      ? request.receiverId === currentUserId && request.status === 'pending'
      : activeTab === 'accepted'
      ? request.status === 'accepted'
      : activeTab === 'sent'
      ? request.senderId === currentUserId && request.status !== 'cancelled'
      : true
    
    const matchesSearch = searchQuery === '' || 
      (activeTab === 'all' || activeTab === 'received' || activeTab === 'accepted'
        ? request.senderName.toLowerCase().includes(searchQuery.toLowerCase()) || request.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
        : request.receiverName.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesTab && matchesSearch
  })

  const filteredImportantMessages = importantMessages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBlockedUsers = blockedUsers.filter(user => 
    user.blocked.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.blocked.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'all': return 'Rechercher une demande...'
      case 'received': return 'Rechercher un expéditeur...'
      case 'accepted': return 'Rechercher un expéditeur...'
      case 'sent': return 'Rechercher un destinataire...'
      case 'important': return 'Rechercher un message...'
      case 'blocked': return 'Rechercher un utilisateur...'
      default: return 'Rechercher...'
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      pending: { bg: resolvedTheme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100', text: resolvedTheme === 'dark' ? 'text-amber-300' : 'text-amber-700', icon: Clock, label: 'En attente' },
      accepted: { bg: resolvedTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100', text: resolvedTheme === 'dark' ? 'text-green-300' : 'text-green-700', icon: CheckCircle, label: 'Acceptée' },
      rejected: { bg: resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100', text: resolvedTheme === 'dark' ? 'text-red-300' : 'text-red-700', icon: XCircle, label: 'Refusée' },
      expired: { bg: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100', text: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700', icon: Clock, label: 'Expirée' },
      cancelled: { bg: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100', text: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700', icon: X, label: 'Annulée' }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg flex items-center gap-1.5 sm:gap-2">
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-[100] md:mt-0 w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-2`}>
        <div className="max-w-5xl mx-auto">
          {/* Mobile layout */}
          <div className="flex flex-col md:hidden gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBack}
                className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <Handshake className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Demandes</h1>
                  <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} hidden sm:block`}>Gérez vos demandes et conversations</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Tous ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Reçues ({requests.filter(r => r.receiverId === currentUserId && r.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'accepted'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Acceptées ({requests.filter(r => r.status === 'accepted').length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Envoyées ({requests.filter(r => r.senderId === currentUserId).length})
              </button>
              <button
                onClick={() => setActiveTab('important')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'important'
                    ? `${resolvedTheme === 'dark' ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Importants
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                  activeTab === 'blocked'
                    ? `${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Bloqués
              </button>
            </div>

            {/* Search */}
            <div>
              <div className="relative">
                <Search className={`absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-white bg-zinc-700' : 'border-gray-300 text-gray-900 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleBack}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <Handshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Demandes</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Tous ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'received'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Reçues ({requests.filter(r => r.receiverId === currentUserId && r.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'accepted'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Acceptées ({requests.filter(r => r.status === 'accepted').length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'sent'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Envoyées ({requests.filter(r => r.senderId === currentUserId).length})
              </button>
              <button
                onClick={() => setActiveTab('important')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'important'
                    ? `${resolvedTheme === 'dark' ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Importants
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  activeTab === 'blocked'
                    ? `${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Bloqués
              </button>
            </div>

            {/* Search */}
            <div className="relative w-32 sm:w-48 flex-shrink-0">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-1.5 text-xs sm:text-sm border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-white bg-zinc-700' : 'border-gray-300 text-gray-900 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>

            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pt-44 sm:pt-52 md:pt-20">
        {/* Requests tabs */}
        {(activeTab === 'all' || activeTab === 'received' || activeTab === 'accepted' || activeTab === 'sent') && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Inbox className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-2.5 sm:p-3 shadow-sm`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                            {activeTab === 'received' ? request.senderName : request.receiverName}
                          </h3>
                          <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>
                            {activeTab === 'received' ? request.senderProfession : request.receiverProfession}
                          </p>
                        </div>
                      </div>
                      <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} line-clamp-2`}>{request.message}</p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <StatusBadge status={request.status} />
                        <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    
                    {activeTab === 'received' && request.status === 'pending' && (
                      <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleRespond(request.id, 'accept')}
                          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRespond(request.id, 'reject')}
                          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => handleBlockFromRequest(request.id, request.senderId)}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-gray-700 transition-colors"
                          title="Bloquer l'utilisateur"
                        >
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}

                    {activeTab === 'sent' && request.status === 'pending' && (
                      <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Important messages tab */}
        {activeTab === 'important' && (
          <>
            {loadingImportant ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            ) : filteredImportantMessages.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Star className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Aucun message trouvé' : 'Aucun message important'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredImportantMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message.conversationId)}
                    className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl border p-3 sm:p-4 shadow-sm cursor-pointer transition-colors`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                        {message.sender.avatarUrl ? (
                          <img 
                            src={message.sender.avatarUrl} 
                            alt={message.sender.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                            {message.sender.fullName}
                          </h3>
                          <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0`} />
                          <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} flex-shrink-0`}>
                            {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} line-clamp-2 mb-1`}>
                          {message.content}
                        </p>
                        
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Blocked users tab */}
        {activeTab === 'blocked' && (
          <>
            {loadingBlocked ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            ) : filteredBlockedUsers.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <UserX className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur bloqué'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredBlockedUsers.map((blockedUser) => (
                  <div key={blockedUser.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-2.5 sm:p-3 shadow-sm`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                          {blockedUser.blocked.avatarUrl ? (
                            <img 
                              src={blockedUser.blocked.avatarUrl} 
                              alt={blockedUser.blocked.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                              {blockedUser.blocked.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                            {blockedUser.blocked.fullName}
                          </h3>
                          <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>
                            {blockedUser.blocked.professionalProfile?.profession || blockedUser.blocked.username}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                          Bloqué le {new Date(blockedUser.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUnblock(blockedUser.blockedId)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-emerald-700 transition-colors mt-1 sm:mt-2"
                      >
                        Débloquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Requests
