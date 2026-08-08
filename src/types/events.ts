// Types pou sistèm evenman - 100% Frontend

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'workshop' | 'conference' | 'webinar' | 'networking' | 'meetup' | 'other'
export type EventFormat = 'in-person' | 'virtual' | 'hybrid'
export type TicketType = 'free' | 'paid'
export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled' | 'attended'

export interface Event {
  id: string
  title: string
  description: string
  type: EventType
  format: EventFormat
  status: EventStatus
  
  // Dat & Lye
  startDate: string
  endDate: string
  timezone: string
  location?: {
    venue: string
    address: string
    city: string
    country: string
    lat?: number
    lng?: number
  }
  
  // Streaming Live (Jitsi Meet)
  streaming?: {
    isLive: boolean
    platform: 'jitsi' | 'zoom' | 'youtube' | 'custom'
    roomName: string // Non chanm Jitsi a
    startTime?: string // Lè live la kòmanse
    endTime?: string // Lè live la fini
    recording?: boolean // Si ap anrejistre
  }
  
  // Media
  coverImage?: string
  images: string[]
  
  // Kategori & Tags
  category: string
  tags: string[]
  
  // K apasite
  capacity: number
  
  // Pwopriyetè
  organizerId: string
  organizerName: string
  organizerAvatar?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  publishedAt?: string
  
  // Estatistik
  stats: {
    views: number
    registrations: number
    attendees: number
    revenue: number
  }
}

export interface Ticket {
  id: string
  eventId: string
  name: string
  description: string
  type: TicketType
  price: number
  currency: string
  quantity: number
  sold: number
  
  // Limit
  minPerOrder: number
  maxPerOrder: number
  
  // Dat disponiblite
  saleStartDate?: string
  saleEndDate?: string
  
  // Features
  features: string[]
  
  createdAt: string
}

export interface Registration {
  id: string
  eventId: string
  ticketId: string
  
  // Patisipan
  attendeeId: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone?: string
  
  // Kantite tikè
  quantity: number
  
  // Peman (simulation frontend)
  totalAmount: number
  currency: string
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: 'stripe' | 'free'
  paymentId?: string // Stripe session ID oswa referans
  
  // QR Code pou tchek-in
  qrCode: string
  
  // Estatistik
  status: RegistrationStatus
  checkedInAt?: string
  checkedInBy?: string
  
  // Metadata
  registeredAt: string
  updatedAt: string
  
  // Kòd promosyon (si itilize)
  promoCode?: string
  discountAmount?: number
}

export interface PromoCode {
  id: string
  eventId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number // % oswa montan
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  applicableTickets: string[] // ID tikè oswa 'all'
}

// Live Chat pou evenman
export interface LiveChatMessage {
  id: string
  eventId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: string
  type: 'text' | 'system' | 'moderator'
  pinned?: boolean
}

// Moderasyon chanm live la
export interface RoomModeration {
  mutedUsers: string[] // Lis ID itilizatè yo ki mute
  kickedUsers: string[] // Lis ID itilizatè ki debarase
  coHosts: string[] // Lis co-host (kapab mòde tou)
  chatEnabled: boolean
  qaMode: boolean // Mode kesyon/repons (sèlman mòde ka pale)
  recordingEnabled: boolean
}

// Estatistik live
export interface LiveStats {
  peakViewers: number
  currentViewers: number
  totalMessages: number
  averageWatchTime: number // nan minit
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
}

// Kategori evenman
export const EVENT_CATEGORIES = [
  { id: 'business', label: 'Business & Entreprise', icon: '💼' },
  { id: 'tech', label: 'Technologie', icon: '💻' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'design', label: 'Design & Créatif', icon: '🎨' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'health', label: 'Santé & Bien-être', icon: '🏥' },
  { id: 'education', label: 'Éducation', icon: '📚' },
  { id: 'social', label: 'Social & Networking', icon: '🤝' },
  { id: 'entertainment', label: 'Divertissement', icon: '🎉' },
  { id: 'other', label: 'Autre', icon: '📌' }
] as const

// LocalStorage keys
export const STORAGE_KEYS = {
  EVENTS: 'exile_events',
  TICKETS: 'exile_tickets',
  REGISTRATIONS: 'exile_registrations',
  PROMO_CODES: 'exile_promo_codes',
  MY_EVENTS: 'exile_my_events_', // + userId
  MY_REGISTRATIONS: 'exile_my_registrations_' // + userId
} as const

// Konstan
export const MAX_EVENTS_PER_USER = 10 // Pou MVP gratis
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_votre_cle_ici' // Remplacer pa ou a
