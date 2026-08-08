// Types pour les Alertes du Module Social

export type AlertType = 'urgency' | 'health' | 'recruitment' | 'announcement' | 'event' | 'promotion' | 'video'
export type AlertPriority = 'high' | 'medium' | 'low'

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  institution: {
    id: string
    name: string
    verified: boolean
    avatar?: string
  }
  priority: AlertPriority
  isBoosted: boolean
  createdAt: string
  expiresAt?: string
  attachments?: string[]
  location?: string
  category?: string
  stats: {
    views: number
    shares: number
    comments: number
  }
}

export interface CreateAlertData {
  type: AlertType
  title: string
  description: string
  priority: AlertPriority
  expiresAt?: string
  attachments?: File[]
  location?: string
  category?: string
}
