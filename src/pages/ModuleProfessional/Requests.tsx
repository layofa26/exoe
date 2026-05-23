import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Users, 
  Send, 
  Inbox, 
  Check, 
  X, 
  MessageSquare, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Handshake,
  ArrowLeft
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

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
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  respondedAt?: string
}

export const Requests = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [toast, setToast] = useState('')

  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'sent') {
      setActiveTab('sent')
    }
  }, [searchParams])

  // Load requests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('exile_requests')
    if (saved) {
      setRequests(JSON.parse(saved))
    } else {
      // Mock data for testing
      const mockRequests: Request[] = [
        {
          id: '1',
          senderId: 'user1',
          senderName: 'Jean Dupont',
          senderAvatar: null,
          senderProfession: 'Développeur',
          receiverId: 'current-user',
          receiverName: 'Vous',
          receiverAvatar: null,
          receiverProfession: 'Professionnel',
          message: 'Bonjour, je souhaiterais collaborer avec vous sur un projet.',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          senderId: 'current-user',
          senderName: 'Vous',
          senderAvatar: null,
          senderProfession: 'Professionnel',
          receiverId: 'user2',
          receiverName: 'Marie Curie',
          receiverAvatar: null,
          receiverProfession: 'Designer',
          message: 'Intéressé par votre profil, discutons-en ?',
          status: 'accepted',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          respondedAt: new Date(Date.now() - 43200000).toISOString()
        }
      ]
      setRequests(mockRequests)
      localStorage.setItem('exile_requests', JSON.stringify(mockRequests))
    }
  }, [])

  const handleRespond = (requestId: string, action: 'accept' | 'reject') => {
    const updated = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: action === 'accept' ? 'accepted' : 'rejected',
          respondedAt: new Date().toISOString()
        }
      }
      return r
    })
    setRequests(updated)
    localStorage.setItem('exile_requests', JSON.stringify(updated))
    setToast(action === 'accept' ? 'Demande acceptée' : 'Demande refusée')
    setTimeout(() => setToast(''), 3000)
  }

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'received' 
      ? request.receiverId === 'current-user'
      : request.senderId === 'current-user'
    
    const matchesSearch = searchQuery === '' || 
      (activeTab === 'received' 
        ? request.senderName.toLowerCase().includes(searchQuery.toLowerCase())
        : request.receiverName.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesTab && matchesSearch
  })

  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      pending: { bg: resolvedTheme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100', text: resolvedTheme === 'dark' ? 'text-amber-300' : 'text-amber-700', icon: Clock, label: 'En attente' },
      accepted: { bg: resolvedTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100', text: resolvedTheme === 'dark' ? 'text-green-300' : 'text-green-700', icon: CheckCircle, label: 'Acceptée' },
      rejected: { bg: resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100', text: resolvedTheme === 'dark' ? 'text-red-300' : 'text-red-700', icon: XCircle, label: 'Refusée' },
      expired: { bg: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100', text: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700', icon: Clock, label: 'Expirée' }
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
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 md:mt-0`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro')}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <Handshake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Demandes de contact</h1>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez vos demandes et conversations</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Reçues ({requests.filter(r => r.receiverId === 'current-user').length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'} border`
                    : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Envoyées ({requests.filter(r => r.senderId === 'current-user').length})
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Rechercher ${activeTab === 'received' ? 'un expéditeur' : 'un destinataire'}...`}
                  className={`w-full pl-10 pr-4 py-2 border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-white bg-zinc-700' : 'border-gray-300 text-gray-900 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className={`w-12 h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-4`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                        <Users className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {activeTab === 'received' ? request.senderName : request.receiverName}
                        </h3>
                        <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {activeTab === 'received' ? request.senderProfession : request.receiverProfession}
                        </p>
                      </div>
                    </div>
                    <p className={`${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-3`}>{request.message}</p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} />
                      <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {activeTab === 'received' && request.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleRespond(request.id, 'accept')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleRespond(request.id, 'reject')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Requests
