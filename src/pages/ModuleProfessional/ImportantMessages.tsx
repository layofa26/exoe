import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Search,
  Loader2
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { MessageListSchema } from '../../schemas/apiSchemas'
import { getCurrentUserId } from '../../services/apiClient'

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

export const ImportantMessages = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState<ImportantMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleBack = () => {
    navigate('/pro/requests')
  }

  useEffect(() => {
    const loadImportantMessages = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }
        
        const userId = getCurrentUserId()
        
        // Load important messages from backend
        const result = await api.get('/conversations/messages/?is_important=true', MessageListSchema)
        
        if (result.success && result.data) {
          const messagesData = result.data.results.map((msg: any) => ({
            id: String(msg.id),
            conversationId: String(msg.conversation),
            senderId: String(msg.sender),
            content: msg.content,
            isImportant: msg.is_important,
            read: msg.read,
            createdAt: msg.created_at,
            sender: msg.sender || {}
          }))
          setMessages(messagesData)
        }
      } catch (err) {
        console.error('Error loading important messages:', err)
        setError('Erreur lors du chargement des messages importants')
      } finally {
        setLoading(false)
      }
    }
    
    loadImportantMessages()
  }, [navigate])

  const handleMessageClick = (conversationId: string) => {
    navigate(`/pro/conversation/${conversationId}`)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages Importants</h1>
                  <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} hidden sm:block`}>Vos messages marqués comme importants</p>
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
                  placeholder="Rechercher..."
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
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages Importants</h1>
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
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Star className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Aucun message trouvé' : 'Aucun message important'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredMessages.map((message) => (
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
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    
                    <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} line-clamp-2 mb-1`}>
                      {message.content}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
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
      </div>
    </div>
  )
}

export default ImportantMessages
