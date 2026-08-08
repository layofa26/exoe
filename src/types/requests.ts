// Types pour le module Demandes (Requests)

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type RequestCategory = 'urgent' | 'collaboration' | 'question' | 'service' | 'info' | 'other'
export type AvailabilityStatus = 'available' | 'busy' | 'away' | 'offline'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'scam' | 'other'

export interface Request {
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
  status: RequestStatus
  createdAt: string
  respondedAt?: string
  responseMessage?: string
  category?: RequestCategory
  isPinned?: boolean
  isArchived?: boolean
  expiresAt?: string
  autoReplyMessage?: string
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  read: boolean
  attachments?: Attachment[]
  isPinned?: boolean
  editedAt?: string
}

export interface Attachment {
  id: string
  type: 'image' | 'file' | 'audio'
  url: string
  name: string
  size: number
}

export interface Conversation {
  id: string
  requestId: string
  participantIds: [string, string] // [senderId, receiverId]
  participantNames: [string, string]
  participantAvatars: [string | null, string | null]
  messages: Message[]
  lastMessageAt: string
  unreadCount: number
  isPinned?: boolean
  isArchived?: boolean
  isBlocked?: boolean
  lastTypingAt?: string
  typingUserId?: string | null
}

export interface BlockedUser {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  blockedAt: string
  reason?: string
}

export interface Report {
  id: string
  reporterId: string
  reportedId: string
  requestId?: string
  conversationId?: string
  reason: ReportReason
  description?: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
}

export interface UserAvailability {
  userId: string
  status: AvailabilityStatus
  autoReplyEnabled: boolean
  autoReplyMessage?: string
  autoReply?: {
    enabled: boolean
    message: string
    schedule?: {
      startTime: string
      endTime: string
    }
  }
  schedule?: {
    startTime?: string
    endTime?: string
    daysOfWeek?: number[]
  }
  updatedAt: string
}

export interface ConversationStats {
  userId: string
  totalConversations: number
  totalMessagesSent: number
  totalMessagesReceived: number
  averageResponseTime: number
  acceptanceRate: number
  pendingRequests: number
  acceptedRequests: number
  rejectedRequests: number
  updatedAt: string
}

// Request categories
export const REQUEST_CATEGORIES = [
  { id: 'urgent', label: 'Urgent', icon: '🔴' },
  { id: 'collaboration', label: 'Collaboration', icon: '🤝' },
  { id: 'question', label: 'Question', icon: '❓' },
  { id: 'service', label: 'Service', icon: '⚡' },
  { id: 'info', label: 'Information', icon: 'ℹ️' },
  { id: 'other', label: 'Autre', icon: '📝' }
] as const

// Template de messages
export const MESSAGE_TEMPLATES = [
  {
    id: 'collab',
    label: 'Collaboration',
    content: "Bonjour, je suis intéressé(e) par votre travail et j'aimerais collaborer avec vous sur un projet. Êtes-vous disponible pour en discuter ?"
  },
  {
    id: 'question',
    label: 'Question',
    content: "Bonjour, j'ai une question concernant votre expertise dans votre domaine. Pouvez-vous m'aider ?"
  },
  {
    id: 'service',
    label: 'Service',
    content: "Bonjour, je souhaite faire appel à vos services. Quand seriez-vous disponible pour un rendez-vous ?"
  },
  {
    id: 'info',
    label: "Demande d'info",
    content: "Bonjour, je souhaiterais avoir plus d'informations sur vos prestations. Pouvez-vous me contacter ?"
  }
]

// LocalStorage keys
export const STORAGE_KEYS = {
  REQUESTS: 'exile_requests',
  CONVERSATIONS: 'exile_conversations',
  MESSAGES: 'exile_messages',
  DAILY_REQUESTS: 'exile_daily_requests',
  NOTIFICATIONS: 'exile_notifications',
  BLOCKED_USERS: 'exile_blocked_users',
  REPORTS: 'exile_reports',
  AVAILABILITY: 'exile_availability',
  CONVERSATION_STATS: 'exile_conversation_stats',
  SETTINGS: 'exile_settings'
}

// Constantes
export const MAX_DAILY_REQUESTS = 15
export const REQUEST_EXPIRATION_DAYS = 7
export const MAX_ATTACHMENTS_PER_MESSAGE = 5
export const MAX_FILE_SIZE_MB = 10
export const TYPING_TIMEOUT_MS = 3000
