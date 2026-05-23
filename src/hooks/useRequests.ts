import { useState, useEffect, useCallback } from 'react'
import type { 
  Request, 
  RequestStatus, 
  Conversation, 
  Message 
} from '../types/requests'
import { 
  STORAGE_KEYS, 
  MESSAGE_TEMPLATES, 
  MAX_DAILY_REQUESTS 
} from '../types/requests'

// Générer ID unique
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Obtenir date du jour (format: YYYY-MM-DD)
const getToday = () => new Date().toISOString().split('T')[0]

export const useRequests = (currentUserId: string) => {
  const [requests, setRequests] = useState<Request[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [dailyRequestCount, setDailyRequestCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  // Charger depuis localStorage
  useEffect(() => {
    const savedRequests = localStorage.getItem(STORAGE_KEYS.REQUESTS)
    const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    const savedDaily = localStorage.getItem(STORAGE_KEYS.DAILY_REQUESTS)

    if (savedRequests) {
      setRequests(JSON.parse(savedRequests))
    }

    if (savedConversations) {
      setConversations(JSON.parse(savedConversations))
    }

    // Vérifier limite quotidienne
    if (savedDaily) {
      const daily = JSON.parse(savedDaily)
      if (daily.date === getToday()) {
        setDailyRequestCount(daily.count)
      } else {
        // Nouveau jour, reset
        localStorage.setItem(STORAGE_KEYS.DAILY_REQUESTS, JSON.stringify({ date: getToday(), count: 0 }))
        setDailyRequestCount(0)
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.DAILY_REQUESTS, JSON.stringify({ date: getToday(), count: 0 }))
    }
  }, [])

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  }, [requests])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations))
  }, [conversations])

  // Calculer notifications non lues
  useEffect(() => {
    const receivedRequests = requests.filter(r => r.receiverId === currentUserId)
    const pendingCount = receivedRequests.filter(r => r.status === 'pending').length
    
    // Compter messages non lus dans conversations
    const unreadMessages = conversations.reduce((acc, conv) => {
      if (conv.participantIds.includes(currentUserId)) {
        const unreadInConv = conv.messages.filter(
          m => m.senderId !== currentUserId && !m.read
        ).length
        return acc + unreadInConv
      }
      return acc
    }, 0)

    setUnreadCount(pendingCount + unreadMessages)
  }, [requests, conversations, currentUserId])

  // Envoyer une demande
  const sendRequest = useCallback((
    receiver: { id: string; name: string; avatar: string | null; profession: string },
    message: string,
    sender: { id: string; name: string; avatar: string | null; profession: string }
  ): { success: boolean; error?: string } => {
    // Vérifier limite
    if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
      return { success: false, error: `Limite de ${MAX_DAILY_REQUESTS} demandes par jour atteinte` }
    }

    // Vérifier si demande existe déjà
    const existingRequest = requests.find(r => 
      r.senderId === sender.id && r.receiverId === receiver.id && r.status === 'pending'
    )
    if (existingRequest) {
      return { success: false, error: 'Une demande est déjà en cours avec ce professionnel' }
    }

    const newRequest: Request = {
      id: generateId(),
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderProfession: sender.profession,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar,
      receiverProfession: receiver.profession,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    setRequests(prev => [newRequest, ...prev])
    
    // Incrémenter compteur quotidien
    const newCount = dailyRequestCount + 1
    setDailyRequestCount(newCount)
    localStorage.setItem(STORAGE_KEYS.DAILY_REQUESTS, JSON.stringify({ date: getToday(), count: newCount }))

    return { success: true }
  }, [requests, dailyRequestCount])

  // Répondre à une demande
  const respondToRequest = useCallback((
    requestId: string,
    status: 'accepted' | 'rejected',
    responseMessage?: string
  ) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status,
          respondedAt: new Date().toISOString(),
          responseMessage
        }
      }
      return req
    }))

    // Si acceptée, créer une conversation
    if (status === 'accepted') {
      const request = requests.find(r => r.id === requestId)
      if (request) {
        const newConversation: Conversation = {
          id: generateId(),
          requestId,
          participantIds: [request.senderId, request.receiverId],
          participantNames: [request.senderName, request.receiverName],
          participantAvatars: [request.senderAvatar, request.receiverAvatar],
          messages: [],
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        }
        setConversations(prev => [newConversation, ...prev])
      }
    }
  }, [requests])

  // Envoyer un message
  const sendMessage = useCallback((
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string
  ) => {
    const newMessage: Message = {
      id: generateId(),
      requestId: conversationId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      read: false
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessageAt: newMessage.timestamp
        }
      }
      return conv
    }))
  }, [])

  // Marquer messages comme lus
  const markAsRead = useCallback((conversationId: string, userId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map(m => 
            m.senderId !== userId ? { ...m, read: true } : m
          )
        }
      }
      return conv
    }))
  }, [])

  // Getters filtrés
  const receivedRequests = requests.filter(r => r.receiverId === currentUserId)
  const sentRequests = requests.filter(r => r.senderId === currentUserId)
  const userConversations = conversations.filter(c => 
    c.participantIds.includes(currentUserId)
  )

  return {
    // Data
    requests,
    receivedRequests,
    sentRequests,
    conversations: userConversations,
    dailyRequestCount,
    unreadCount,
    
    // Actions
    sendRequest,
    respondToRequest,
    sendMessage,
    markAsRead,
    
    // Utils
    templates: MESSAGE_TEMPLATES,
    maxDailyRequests: MAX_DAILY_REQUESTS
  }
}
