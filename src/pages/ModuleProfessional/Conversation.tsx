import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  User,
  Pin,
  Archive,
  Search,
  X,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Smile
} from 'lucide-react'
import type { Conversation, Message, Attachment } from '../../types/requests'
import { TYPING_TIMEOUT_MS } from '../../types/requests'
import { useTheme } from '../../contexts/ThemeContext'

// Mock user ID
const CURRENT_USER_ID = 'current-user-123'

export const ConversationPage = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Nouvo state
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Charger conversation
  useEffect(() => {
    const savedConversations = localStorage.getItem('exile_conversations')
    if (savedConversations && id) {
      const conversations: Conversation[] = JSON.parse(savedConversations)
      const found = conversations.find(c => c.id === id)
      if (found) {
        setConversation(found)
        
        // Marquer messages comme lus
        const updatedConversations = conversations.map(c => {
          if (c.id === id) {
            return {
              ...c,
              messages: c.messages.map(m => 
                m.senderId !== CURRENT_USER_ID ? { ...m, read: true } : m
              )
            }
          }
          return c
        })
        localStorage.setItem('exile_conversations', JSON.stringify(updatedConversations))
      }
    }
    setIsLoading(false)
  }, [id])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  // Envoyer message
  const sendMessage = () => {
    if (!newMessage.trim() || !conversation) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      requestId: conversation.requestId,
      senderId: CURRENT_USER_ID,
      senderName: 'Vous', // À remplacer par le vrai nom
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false
    }

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, newMsg],
      lastMessageAt: newMsg.timestamp
    }

    setConversation(updatedConversation)
    
    // Sauvegarder
    const savedConversations = localStorage.getItem('exile_conversations')
    if (savedConversations) {
      const conversations: Conversation[] = JSON.parse(savedConversations)
      const updated = conversations.map(c => c.id === id ? updatedConversation : c)
      localStorage.setItem('exile_conversations', JSON.stringify(updated))
    }

    setNewMessage('')
  }

  // Format heure
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Obtenir l'autre participant
  const getOtherParticipant = () => {
    if (!conversation) return null
    const index = conversation.participantIds[0] === CURRENT_USER_ID ? 1 : 0
    return {
      id: conversation.participantIds[index],
      name: conversation.participantNames[index],
      avatar: conversation.participantAvatars[index]
    }
  }

  // Toggle pin conversation
  const togglePin = () => {
    if (!conversation) return
    const updated = { ...conversation, isPinned: !conversation.isPinned }
    setConversation(updated)
    saveConversation(updated)
  }

  // Toggle archive conversation
  const toggleArchive = () => {
    if (!conversation) return
    const updated = { ...conversation, isArchived: !conversation.isArchived }
    setConversation(updated)
    saveConversation(updated)
    if (updated.isArchived) {
      navigate('/pro/requests')
    }
  }

  // Save conversation helper
  const saveConversation = (conv: Conversation) => {
    const saved = localStorage.getItem('exile_conversations')
    const all: Conversation[] = saved ? JSON.parse(saved) : []
    const filtered = all.filter(c => c.id !== conv.id)
    localStorage.setItem('exile_conversations', JSON.stringify([...filtered, conv]))
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
    ? conversation.messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversation?.messages || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex flex-col pb-20`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro/requests')}
                className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  {otherUser?.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{otherUser?.name}</p>
                  <p className="text-xs text-green-600">En ligne</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-full transition-colors ${showSearch ? `${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Pin */}
              <button
                onClick={togglePin}
                className={`p-2 rounded-full transition-colors ${conversation?.isPinned ? `${resolvedTheme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
                title={conversation?.isPinned ? 'Désépingler' : 'Épingler'}
              >
                <Pin className={`w-5 h-5 ${conversation?.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Archive */}
              <button
                onClick={toggleArchive}
                className={`p-2 rounded-full transition-colors ${conversation?.isArchived ? `${resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}` : resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
                title={conversation?.isArchived ? 'Désarchiver' : 'Archiver'}
              >
                <Archive className={`w-5 h-5 ${conversation?.isArchived ? 'fill-current' : ''}`} />
              </button>

              <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}>
                <Phone className="w-5 h-5" />
              </button>
              <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}>
                <Video className="w-5 h-5" />
              </button>
              <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b p-3`}>
          <div className="max-w-4xl mx-auto relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la conversation..."
              className={`w-full pl-10 pr-10 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-100'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} mt-2 text-center`}>
              {filteredMessages.length} résultat{filteredMessages.length !== 1 ? 's' : ''} trouvé{filteredMessages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Aucun message encore</p>
              <p className="text-sm text-gray-400">Commencez la conversation !</p>
            </div>
          ) : (
            conversation.messages.map((message, index) => {
              const isMe = message.senderId === CURRENT_USER_ID
              const showAvatar = index === 0 || 
                conversation.messages[index - 1].senderId !== message.senderId

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && showAvatar && (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-8" />}

                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'text-blue-200' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                        <span className="text-xs">{formatTime(message.timestamp)}</span>
                        {isMe && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getOtherParticipant()?.name.charAt(0).toUpperCase()}
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {attachments.map((att, index) => (
                <div key={att.id} className="relative flex-shrink-0">
                  {att.type === 'image' ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex flex-col items-center justify-center p-2">
                      <Paperclip className="w-6 h-6 text-gray-500" />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => {
                // Simulate file selection
                const mockAttachment: Attachment = {
                  id: `att-${Date.now()}`,
                  type: 'file',
                  url: '#',
                  name: 'document.pdf',
                  size: 1024
                }
                setAttachments(prev => [...prev, mockAttachment])
              }}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Image Button */}
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => {
                const mockImage: Attachment = {
                  id: `img-${Date.now()}`,
                  type: 'image',
                  url: '#',
                  name: 'image.jpg',
                  size: 2048
                }
                setAttachments(prev => [...prev, mockImage])
              }}
            >
              <ImageIcon className="w-5 h-5" />
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
              className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
            />
            
            {/* Emoji Button */}
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {/* Voice Button */}
            <button 
              className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() && attachments.length === 0}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
