import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Loader2,
  MessageSquare,
  Pin,
  Check
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { ConversationListSchema, ConversationSchema } from '../../schemas/apiSchemas'
import { getCurrentUserId } from '../../services/apiClient'

interface Conversation {
  id: string
  lastMessageAt: string
  participants: {
    id: string
    userId: string
    lastReadAt?: string
    user: {
      id: string
      fullName: string
      username: string
      avatarUrl?: string
      verified?: boolean
    }
  }[]
  messages: {
    id: string
    content: string
    senderId: string
    createdAt: string
    read: boolean
  }[]
  isPinned?: boolean
}

export const ConversationsPage = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current user ID
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }
        
        const userId = getCurrentUserId()
        setCurrentUserId(userId)
        
        // Load conversations from backend
        const result = await api.get('/v1/conversations/conversations/', ConversationListSchema)
        
        if (result.success && result.data) {
          const conversationsData = (result.data.results || result.data).map((conv: any) => ({
            id: String(conv.id),
            lastMessageAt: conv.updated_at || conv.created_at,
            participants: conv.participants || [],
            messages: conv.messages || [],
            isPinned: conv.is_pinned || false
          }))
          setConversations(conversationsData)
        }
      } catch (err) {
        console.error('Error loading conversations:', err)
        setError('Erreur lors du chargement des conversations')
      } finally {
        setLoading(false)
      }
    }
    
    loadConversations()
  }, [navigate])

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId)
    if (!otherParticipant) return false
    
    const searchLower = searchQuery.toLowerCase()
    return (
      otherParticipant.user.fullName.toLowerCase().includes(searchLower) ||
      otherParticipant.user.username.toLowerCase().includes(searchLower)
    )
  })

  const getUnreadCount = (conversation: Conversation) => {
    if (!currentUserId) return 0
    const participant = conversation.participants.find(p => p.userId === currentUserId)
    if (!participant || !participant.lastReadAt) {
      return conversation.messages.filter(m => m.senderId !== currentUserId && !m.read).length
    }
    const lastReadDate = new Date(participant.lastReadAt)
    return conversation.messages.filter(
      m => m.senderId !== currentUserId && 
      !m.read && 
      new Date(m.createdAt) > lastReadDate
    ).length
  }

  const formatLastMessageTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - messageDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} j`
    return messageDate.toLocaleDateString('fr-FR')
  }

  const handleBack = () => {
    navigate('/pro')
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
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
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Conversations</h1>
                  <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} hidden sm:block`}>Vos messages</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div>
              <div className="relative">
                <Search className={`absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-white bg-zinc-700' : 'border-gray-300 text-gray-900 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleBack}
              className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Conversations</h1>
            </div>

            {/* Search */}
            <div className="relative w-32 sm:w-48 flex-shrink-0">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-1.5 text-xs sm:text-sm border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-white bg-zinc-700' : 'border-gray-300 text-gray-900 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>

            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pt-44 sm:pt-52 md:pt-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MessageSquare className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId)
              if (!otherParticipant) return null

              const lastMessage = conversation.messages[conversation.messages.length - 1]
              const unreadCount = getUnreadCount(conversation)

              return (
                <div
                  key={conversation.id}
                  onClick={() => navigate(`/pro/conversation/${conversation.id}`)}
                  className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl border p-3 sm:p-4 shadow-sm cursor-pointer transition-colors`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center overflow-hidden`}>
                        {otherParticipant.user.avatarUrl ? (
                          <img 
                            src={otherParticipant.user.avatarUrl} 
                            alt={otherParticipant.user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                            {otherParticipant.user.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {conversation.isPinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <Pin className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    
            <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                          {otherParticipant.user.fullName}
                        </h3>
                        {otherParticipant.user.verified && (
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                        <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} flex-shrink-0`}>
                          {formatLastMessageTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      
                      <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} truncate mb-1`}>
                        {lastMessage?.content || 'Aucun message'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                          @{otherParticipant.user.username}
                        </span>
                        {unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[1.25rem] sm:min-w-[1.5rem] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationsPage
