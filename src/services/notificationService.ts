const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

export interface AppNotification {
  id: string
  type: 'message' | 'request_accepted' | 'new_contact' | 'system' | 'campaign_active' | 'inquiry_received' | 'campaign_ended' | 'request_received' | string
  title: string
  message: string
  iconUrl?: string
  data?: any
  actionButton?: {
    label: string
    actionUrl: string
  }
  createdAt: string
  read: boolean
  userUuid?: string
}

export type NotificationCategory = 'all' | 'message' | 'pub' | 'request' | 'system'

type NotificationListener = (notification: AppNotification) => void

/**
 * Joue un carillon subtil et professionnel ("ding" élégant) via la Web Audio API
 */
export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    // Fréquences harmoniques élégantes (880Hz -> 1320Hz)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12)

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(440, now)
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.12)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.5)
    osc2.stop(now + 0.5)
  } catch {
    // Ignorer si bloqué par les politiques de lecture automatique
  }
}

/**
 * Déclenche une vibration haptique brève sur les mobiles Android/PWA
 */
export function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80])
    }
  } catch {
    // Ignorer si non supporté
  }
}

/**
 * Formate une date ISO en chaîne de temps relative ("À l'instant", "Il y a 5 min", "Il y a 2 h", "Hier à 14:30")
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 45) {
    return "À l'instant"
  }
  if (diffInSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffInSeconds / 60))
    return `Il y a ${mins} min`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `Il y a ${hours} h`
  }
  if (diffInSeconds < 172800) {
    return `Hier à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * Catégorise une notification pour le filtrage par onglets
 */
export function getNotificationCategory(notif: AppNotification): NotificationCategory {
  const t = (notif.type || '').toLowerCase()
  if (t === 'message' || t.includes('chat') || notif.data?.conversationId) {
    return 'message'
  }
  if (t === 'campaign_active' || t === 'inquiry_received' || t === 'campaign_ended' || notif.data?.isPub || notif.data?.adId) {
    return 'pub'
  }
  if (t === 'request_accepted' || t === 'new_contact' || t === 'request_received' || notif.data?.requestId) {
    return 'request'
  }
  return 'system'
}

class NotificationService {
  private listeners: Set<NotificationListener> = new Set()
  private notifications: AppNotification[] = []
  private pollTimer: any = null
  private currentUserUuid: string = ''

  constructor() {
    this.initUser()
    this.startBackendSync()
  }

  private initUser() {
    try {
      // Purger l'ancien stockage global non partitionné pour éliminer les vieux résidus
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('exile_notifications')
        const storedUser = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
        this.currentUserUuid = storedUser?.uuid || storedUser?.id || ''
      }
    } catch {
      this.currentUserUuid = ''
    }
    this.loadFromStorage()
  }

  public setUserUuid(uuid?: string) {
    const newUuid = uuid || ''
    if (this.currentUserUuid !== newUuid) {
      this.currentUserUuid = newUuid
      this.loadFromStorage()
      this.syncWithBackend()
    }
  }

  private getStorageKey(): string {
    return this.currentUserUuid ? `exile_notifications_${this.currentUserUuid}` : 'exile_notifications_guest'
  }

  private loadFromStorage() {
    try {
      const key = this.getStorageKey()
      const stored = localStorage.getItem(key)
      if (stored) {
        this.notifications = JSON.parse(stored)
      } else {
        this.notifications = []
      }
    } catch {
      this.notifications = []
    }
  }

  private saveToStorage() {
    try {
      const key = this.getStorageKey()
      localStorage.setItem(key, JSON.stringify(this.notifications.slice(0, 100)))
      window.dispatchEvent(new CustomEvent('exile_notifications_updated'))
    } catch {
      // Ignorer erreur de stockage
    }
  }

  private startBackendSync() {
    if (typeof window === 'undefined') return

    // Sync immédiat
    this.syncWithBackend()

    // Polling toutes les 15 secondes
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => {
      if (navigator.onLine) {
        this.syncWithBackend()
      }
    }, 15000)

    // Sync au retour de focus sur l'onglet
    window.addEventListener('focus', () => {
      this.syncWithBackend()
    })
  }

  public async syncWithBackend() {
    try {
      const url = this.currentUserUuid
        ? `${API_BASE_URL}/notifications/?user_uuid=${encodeURIComponent(this.currentUserUuid)}`
        : `${API_BASE_URL}/notifications/`
      const res = await fetch(url, {
        headers: { Accept: 'application/json' }
      })
      if (!res.ok) return
      const remoteData: AppNotification[] = await res.json()
      if (!Array.isArray(remoteData)) return

      let hasNew = false
      const currentMap = new Map(this.notifications.map(n => [n.id, n]))

      remoteData.forEach(remoteNotif => {
        if (!currentMap.has(remoteNotif.id)) {
          currentMap.set(remoteNotif.id, remoteNotif)
          hasNew = true
        } else {
          // Mettre à jour si remote a un statut plus récent
          const existing = currentMap.get(remoteNotif.id)!
          if (remoteNotif.read !== existing.read) {
            currentMap.set(remoteNotif.id, { ...existing, read: remoteNotif.read })
          }
        }
      })

      // Re-trier par date décroissante
      const merged = Array.from(currentMap.values()).sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )

      this.notifications = merged
      this.saveToStorage()

      if (hasNew) {
        window.dispatchEvent(new CustomEvent('exile_notifications_updated'))
      }
    } catch {
      // Échec silencieux si hors-ligne
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public notify(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const fullNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userUuid: this.currentUserUuid || (notification as any).userUuid || '',
      createdAt: new Date().toISOString(),
      read: false
    }

    this.notifications.unshift(fullNotification)
    this.saveToStorage()

    // Retour sonore et haptique immersif
    playNotificationSound()
    triggerHaptic()

    // Émettre aux écouteurs frontend
    this.listeners.forEach(listener => {
      try {
        listener(fullNotification)
      } catch (err) {
        console.error('Notification listener error:', err)
      }
    })

    // Synchronisation vers le backend
    fetch(`${API_BASE_URL}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullNotification)
    }).catch(() => {})

    return fullNotification
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications]
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
    this.saveToStorage()

    // Sync vers le backend
    fetch(`${API_BASE_URL}/notifications/${id}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    }).catch(() => {})
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }))
    this.saveToStorage()

    // Sync vers le backend
    fetch(`${API_BASE_URL}/notifications/mark-all-read/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {})
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.saveToStorage()

    // Appel suppression backend
    fetch(`${API_BASE_URL}/notifications/${id}/`, {
      method: 'DELETE'
    }).catch(() => {})
  }

  public notifyNewMessage(senderName: string, messageContent: string, conversationId: string) {
    return this.notify({
      type: 'message',
      title: `Nouveau message de ${senderName}`,
      message: messageContent.length > 65 ? `${messageContent.substring(0, 62)}...` : messageContent,
      data: { conversationId }
    })
  }

  public notifyRequestAccepted(userName: string, conversationId?: string) {
    return this.notify({
      type: 'request_accepted',
      title: 'Demande acceptée',
      message: `${userName} a accepté votre demande de contact. Vous pouvez maintenant échanger.`,
      data: { conversationId }
    })
  }

  public notifyRequestReceived(senderName: string, messageContent?: string) {
    return this.notify({
      type: 'request_received',
      title: `Nouvelle demande reçue`,
      message: `${senderName} vous a envoyé une demande professionnelle : ${messageContent ? (messageContent.length > 55 ? `${messageContent.substring(0, 52)}...` : messageContent) : 'Consultez vos demandes.'}`,
      data: { senderName }
    })
  }

  public notifyNewContact(userName: string) {
    return this.notify({
      type: 'new_contact',
      title: 'Nouveau contact',
      message: `Vous êtes désormais connecté avec ${userName}.`
    })
  }
}

export const notificationService = new NotificationService()
