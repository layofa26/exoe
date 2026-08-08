import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Check,
  CheckCheck,
  Pin,
  Archive,
  Search,
  X,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Smile
} from 'lucide-react'
import type { Attachment } from '../../types/requests'
import { TYPING_TIMEOUT_MS } from '../../types/requests'
import { useTheme } from '../../contexts/ThemeContext'

export const ConversationPage = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Nouvo state
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ type: 'block' | 'restore' | 'delete' | null }>({ type: null })
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [hasDraft, setHasDraft] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Auto-draft functionality
  useEffect(() => {
    const draftKey = `draft_${id}`
    
    // Load draft on mount
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      setNewMessage(savedDraft)
      setHasDraft(true)
    }

    // Save draft on change
    const handleBeforeUnload = () => {
      if (newMessage.trim()) {
        localStorage.setItem(draftKey, newMessage)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [id])

  useEffect(() => {
    const draftKey = `draft_${id}`
    if (newMessage.trim()) {
      localStorage.setItem(draftKey, newMessage)
      setHasDraft(true)
    } else {
      localStorage.removeItem(draftKey)
      setHasDraft(false)
    }
  }, [newMessage, id])

  const clearDraft = () => {
    const draftKey = `draft_${id}`
    localStorage.removeItem(draftKey)
    setNewMessage('')
    setHasDraft(false)
  }

  // Charger conversation depuis backend API
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        if (!id) {
          setError('ID de conversation manquant')
          setIsLoading(false)
          return
        }
        
        // Backend removed - conversation loading disabled
        setError('Backend service not available');
      } catch (err) {
        console.error('Error loading conversation:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConversation()
  }, [id])

  // Load more messages (infinite scroll)
  const loadMoreMessages = async () => {
    if (!id || loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const offset = messages.length
      // Backend removed - messages loading disabled
      setHasMore(false)
    } catch (err) {
      console.error('Error loading more messages:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Infinite scroll trigger
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, messages.length])

  // Envoyer message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !id) return

    try {
      await api.sendMessage(id, {
        content: newMessage.trim(),
        isImportant: false
      })
      
      // Clear draft after sending
      clearDraft()
      
      // Reload conversation to get updated messages
      const convResponse = await api.getConversation(id) as { success: boolean; data: any }
      setConversation(convResponse.data)
      setMessages(convResponse.data.messages || [])
      
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  // Format heure exacte
  const formatExactTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays < 7) return `Il y a ${diffDays} j`
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? '2-digit' : undefined
    }) + ' ' + date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Format heure courte
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Obtenir l'autre participant
  const getOtherParticipant = () => {
    if (!conversation || !currentUserId) return null
    const participants = conversation.participants || []
    const other = participants.find((p: any) => p.userId !== currentUserId)
    if (!other) return null
    return {
      id: other.userId,
      name: other.user?.fullName || other.user?.username || 'Inconnu',
      avatar: other.user?.avatarUrl
    }
  }

  // Toggle pin conversation
  const togglePin = async () => {
    if (!id) return
    try {
      // Backend removed - pin toggle disabled
      alert('Backend service not available');
    } catch (err) {
      console.error('Error toggling pin:', err)
    }
  }

  // Toggle archive conversation
  const toggleArchive = async () => {
    if (!id) return
    try {
      // Backend removed - archive toggle disabled
      alert('Backend service not available');
    } catch (err) {
      console.error('Error toggling archive:', err)
    }
  }

  // Block user
  const handleBlock = async () => {
    if (!conversation || !currentUserId) return
    const otherParticipant = getOtherParticipant()
    if (!otherParticipant) return
    
    try {
      // Backend removed - block user disabled
      alert('Backend service not available');
    } catch (err) {
      console.error('Error blocking user:', err)
    }
  }

  // Restore conversation (placeholder)
  const handleRestore = () => {
    // TODO: Implement restore via backend API
    console.log('Restore - to be implemented')
    setShowConfirmDialog({ type: null })
    setShowMenu(false)
  }

  // Delete conversation definitively
  const handleDelete = async () => {
    if (!id) return
    
    try {
      // Backend removed - conversation deletion disabled
      alert('Backend service not available');
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      // In real app, send typing event to other user via WebSocket
      setTimeout(() => setIsTyping(false), TYPING_TIMEOUT_MS)
    }
  }

  // Filter messages by search
  const filteredMessages = searchQuery && conversation
    ? (conversation.messages || []).filter((m: any) => 
        m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversation?.messages || []

  if (isLoading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Conversation non trouvée</p>
          <button
            onClick={() => navigate('/pro/requests')}
            className={`mt-4 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
          >
            Retour aux demandes
          </button>
        </div>
      </div>
    )
  }

  const otherUser = getOtherParticipant()

  // Toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  // Check if message should be truncated
  const shouldTruncate = (content: string) => {
    return content.length > 150 || content.split('\n').length > 3
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex flex-col h-screen`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="w-full px-3 sm:px-4">
          <div className="flex items-center justify-between py-2.5 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pro/requests')}
                className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  {otherUser?.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`font-semibold text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{otherUser?.name}</p>
                  <p className="text-[10px] sm:text-xs text-green-600">En ligne</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${showSearch ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Pin */}
              <button
                onClick={togglePin}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${conversation?.isPinned ? `${resolvedTheme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
                title={conversation?.isPinned ? 'Désépingler' : 'Épingler'}
              >
                <Pin className={`w-4 h-4 sm:w-5 sm:h-5 ${conversation?.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Archive */}
              <button
                onClick={toggleArchive}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${conversation?.isArchived ? `${resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
                title={conversation?.isArchived ? 'Désarchiver' : 'Archiver'}
              >
                <Archive className={`w-4 h-4 sm:w-5 sm:h-5 ${conversation?.isArchived ? 'fill-current' : ''}`} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div className={`absolute right-0 top-10 sm:top-12 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl py-2 w-44 sm:w-48 z-50`}>
                    {true ? (
                      <button
                        onClick={() => setShowConfirmDialog({ type: 'block' })}
                        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                        <span className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}>Bloquer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmDialog({ type: 'restore' })}
                        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                        <span className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}>Restaurer</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowConfirmDialog({ type: 'delete' })}
                      className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                    >
                      <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      <span className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}>Supprimer définitivement</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog.type && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {showConfirmDialog.type === 'block' && 'Bloquer cette conversation ?'}
              {showConfirmDialog.type === 'restore' && 'Restaurer cette conversation ?'}
              {showConfirmDialog.type === 'delete' && 'Supprimer définitivement cette conversation ?'}
            </h3>
            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              {showConfirmDialog.type === 'block' && 'Vous ne pourrez plus envoyer de messages à cet utilisateur.'}
              {showConfirmDialog.type === 'restore' && 'La conversation sera restaurée et vous pourrez envoyer des messages.'}
              {showConfirmDialog.type === 'delete' && 'Cette action est irréversible. Tous les messages seront supprimés.'}
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowConfirmDialog({ type: null })}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'} hover:opacity-80 transition-opacity`}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (showConfirmDialog.type === 'block') handleBlock()
                  else if (showConfirmDialog.type === 'restore') handleRestore()
                  else if (showConfirmDialog.type === 'delete') handleDelete()
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${showConfirmDialog.type === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b p-2 sm:p-3`}>
          <div className="max-w-4xl mx-auto relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la conversation..."
              className={`w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 text-sm sm:text-base ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-100'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} mt-1.5 sm:mt-2 text-center`}>
              {filteredMessages.length} résultat{filteredMessages.length !== 1 ? 's' : ''} trouvé{filteredMessages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="w-full space-y-3 sm:space-y-4">
          {(!messages || messages.length === 0) ? (
            <div className="text-center py-8 sm:py-12">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                <Send className={`w-6 h-6 sm:w-8 sm:h-8 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucun message encore</p>
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((message: any, index: number) => {
              const isMe = message.senderId === currentUserId
              const showAvatar = index === 0 || 
                messages[index - 1].senderId !== message.senderId
              const senderName = message.sender?.fullName || message.sender?.username || 'Inconnu'

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && showAvatar && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold flex-shrink-0">
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-6 sm:w-8" />}

                    <div
                      className={`px-3 sm:px-4 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : resolvedTheme === 'dark' 
                            ? 'bg-zinc-800 border-zinc-700 text-white rounded-bl-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p className={`break-words text-xs sm:text-sm ${!expandedMessages.has(message.id) && shouldTruncate(message.content) ? 'line-clamp-3' : ''}`}>
                        {message.content}
                      </p>
                      {shouldTruncate(message.content) && (
                        <button
                          onClick={() => toggleMessageExpansion(message.id)}
                          className={`text-[10px] sm:text-xs mt-1 ${isMe ? 'text-blue-200 hover:text-blue-100' : resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          {expandedMessages.has(message.id) ? 'Voir moins' : 'Voir plus'}
                        </button>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'text-blue-200' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                        <span className="text-[10px] sm:text-xs" title={new Date(message.createdAt).toLocaleString('fr-FR')}>
                          {formatExactTime(message.createdAt)}
                        </span>
                        {isMe && (
                          message.read ? (
                            <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" title="Lu" />
                          ) : (
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" title="Envoyé" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {/* Load more indicator */}
          {loadingMore && (
            <div className="text-center py-2">
              <div className={`inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
            </div>
          )}
          
          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[80%]">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold flex-shrink-0">
                  {getOtherParticipant()?.name.charAt(0).toUpperCase()}
                </div>
                <div className={`px-3 sm:px-4 py-2 sm:py-3 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl rounded-bl-md`}>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-t p-3 sm:p-4`}>
        <div className="w-full">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 sm:mb-3 overflow-x-auto pb-2">
              {attachments.map((att, index) => (
                <div key={att.id} className="relative flex-shrink-0">
                  {att.type === 'image' ? (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} flex items-center justify-center`}>
                      <ImageIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} flex flex-col items-center justify-center p-1.5 sm:p-2`}>
                      <Paperclip className={`w-4 h-4 sm:w-6 sm:h-6 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`} />
                      <span className={`text-[8px] sm:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} truncate w-full text-center`}>{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {conversation.isBlocked ? (
            <div className={`text-center py-3 sm:py-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              <p className="text-sm sm:text-base">Conversation bloquée</p>
              <p className="text-xs sm:text-sm">Vous ne pouvez plus envoyer de messages</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Clear Draft Button */}
              {hasDraft && (
                <button
                  onClick={clearDraft}
                  className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-amber-400 hover:bg-zinc-700' : 'text-amber-600 hover:bg-gray-100'} rounded-full transition-colors`}
                  title="Effacer le brouillon"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Attachment Button */}
              <button 
                className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} rounded-full transition-colors hidden sm:block`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Image Button */}
              <button 
                className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} rounded-full transition-colors hidden sm:block`}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Input */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez votre message..."
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white placeholder-zinc-500 focus:bg-zinc-600' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white'} border-0 rounded-full focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm`}
              />
              
              {/* Emoji Button */}
              <button 
                className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} rounded-full transition-colors hidden sm:block`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Voice Button */}
              <button 
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} hidden sm:block`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
                className="p-1.5 sm:p-2 sm:p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
