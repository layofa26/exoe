// Types pour les Événements du Module Social

export type EventFormat = 'in-person' | 'virtual' | 'hybrid'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type LiveStatus = 'at_coming' | 'live' | 'ended'

export interface SocialEvent {
  id: string
  title: string
  description: string
  institution: {
    id: string
    name: string
    verified: boolean
    avatar?: string
  }
  startDate: string
  endDate: string
  format: EventFormat
  status: EventStatus
  location?: {
    city: string
    venue: string
    address?: string
  }
  coverImage?: string
  category: string
  capacity: number
  price: number
  isBoosted: boolean
  stats: {
    views: number
    registrations: number
    attendees: number
    shares: number
  }
  createdAt: string
  publishedAt?: string
  // Live & Jitsi fields
  liveStatus?: LiveStatus
  speaker?: {
    name: string
    avatar?: string
  }
  jitsiRoom?: string
  participantsCount?: number
  maxParticipants?: number
  reactions?: {
    thumbs_up: number
    clap: number
    bulb: number
    heart: number
  }
  isRegistered?: boolean
}

export interface EventRegistration {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  registeredAt: string
  status: 'confirmed' | 'cancelled' | 'attended'
}

export interface CreateEventData {
  title: string
  description: string
  startDate: string
  endDate: string
  format: EventFormat
  location?: {
    city: string
    venue: string
  }
  category: string
  capacity: number
  price: number
}
