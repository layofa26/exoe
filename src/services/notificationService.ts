export interface AppNotification {
  id: string
  type: 'message' | 'request_accepted' | 'new_contact' | 'system'
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
}

type NotificationListener = (notification: AppNotification) => void

class NotificationService {
  private listeners: Set<NotificationListener> = new Set()
  private notifications: AppNotification[] = []

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('exile_notifications')
      if (stored) {
        this.notifications = JSON.parse(stored)
      }
    } catch {
      this.notifications = []
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('exile_notifications', JSON.stringify(this.notifications.slice(0, 50)))
    } catch {
      // Ignorer erreur de stockage
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
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false
    }

    this.notifications.unshift(fullNotification)
    this.saveToStorage()

    // Émettre aux écouteurs
    this.listeners.forEach(listener => {
      try {
        listener(fullNotification)
      } catch (err) {
        console.error('Notification listener error:', err)
      }
    })

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
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }))
    this.saveToStorage()
  }

  public notifyNewMessage(senderName: string, messageContent: string, conversationId: string) {
    return this.notify({
      type: 'message',
      title: `Nouveau message de ${senderName}`,
      message: messageContent.length > 60 ? `${messageContent.substring(0, 57)}...` : messageContent,
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
      type: 'new_contact',
      title: `Nouvelle demande reçue`,
      message: `${senderName} vous a envoyé une demande professionnelle : ${messageContent ? (messageContent.length > 50 ? `${messageContent.substring(0, 47)}...` : messageContent) : 'Consultez vos demandes.'}`,
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
