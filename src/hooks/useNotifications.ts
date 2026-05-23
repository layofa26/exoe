import { useState, useEffect, useCallback, useRef } from 'react'

interface NotificationPermission {
  sound: boolean
  desktop: boolean
  enabled: boolean
}

const DEFAULT_NOTIFICATION: NotificationPermission = {
  sound: true,
  desktop: true,
  enabled: true
}

// Simple notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('Error playing notification sound:', error)
  }
}

// Show desktop notification
const showDesktopNotification = (title: string, body: string, icon?: string) => {
  if (!('Notification' in window)) return
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'exile-notification',
      requireInteraction: false
    })
  }
}

export const useNotifications = (userId: string) => {
  const [permission, setPermission] = useState<NotificationPermission>(DEFAULT_NOTIFICATION)
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission['desktop']>(false)

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(`exile_notifications_${userId}`)
    if (saved) {
      setPermission(JSON.parse(saved))
    }
    
    // Check desktop notification permission
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission === 'granted')
    }
  }, [userId])

  // Save preferences
  const savePreferences = useCallback((newPermission: NotificationPermission) => {
    setPermission(newPermission)
    localStorage.setItem(`exile_notifications_${userId}`, JSON.stringify(newPermission))
  }, [userId])

  // Toggle sound notifications
  const toggleSound = useCallback(() => {
    const newPermission = { ...permission, sound: !permission.sound }
    savePreferences(newPermission)
  }, [permission, savePreferences])

  // Toggle desktop notifications
  const toggleDesktop = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Votre navigateur ne supporte pas les notifications desktop')
      return
    }

    if (Notification.permission === 'denied') {
      alert('Les notifications ont été bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.')
      return
    }

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      if (result === 'granted') {
        setDesktopPermission(true)
        const newPermission = { ...permission, desktop: true }
        savePreferences(newPermission)
        
        // Show test notification
        new Notification('Exile - Notifications activées', {
          body: 'Vous recevrez désormais des notifications desktop',
          icon: '/favicon.ico'
        })
      }
    } else {
      const newPermission = { ...permission, desktop: !permission.desktop }
      savePreferences(newPermission)
      setDesktopPermission(newPermission.desktop)
    }
  }, [permission, savePreferences])

  // Toggle all notifications
  const toggleEnabled = useCallback(() => {
    const newPermission = { ...permission, enabled: !permission.enabled }
    savePreferences(newPermission)
  }, [permission, savePreferences])

  // Send notification
  const notify = useCallback((options: {
    title: string
    body: string
    icon?: string
    playSound?: boolean
    showDesktop?: boolean
    type?: 'message' | 'request' | 'system'
  }) => {
    if (!permission.enabled) return

    const {
      title,
      body,
      icon,
      playSound = true,
      showDesktop: showDesktopNotif = true,
      type = 'system'
    } = options

    // Play sound
    if (permission.sound && playSound) {
      playNotificationSound()
    }

    // Show desktop notification
    if (permission.desktop && showDesktopNotif && desktopPermission) {
      showDesktopNotification(title, body, icon)
    }

    // Store notification in history
    const notification = {
      id: `notif-${Date.now()}`,
      title,
      body,
      type,
      read: false,
      createdAt: new Date().toISOString()
    }

    const history = JSON.parse(localStorage.getItem(`exile_notification_history_${userId}`) || '[]')
    history.unshift(notification)
    
    // Keep only last 50 notifications
    if (history.length > 50) {
      history.pop()
    }
    
    localStorage.setItem(`exile_notification_history_${userId}`, JSON.stringify(history))
  }, [permission, desktopPermission, userId])

  // Notify for new message
  const notifyNewMessage = useCallback((senderName: string, messagePreview: string, conversationId: string) => {
    notify({
      title: `Nouveau message de ${senderName}`,
      body: messagePreview.length > 60 ? messagePreview.substring(0, 60) + '...' : messagePreview,
      type: 'message',
      playSound: true,
      showDesktop: true
    })
  }, [notify])

  // Notify for new request
  const notifyNewRequest = useCallback((requesterName: string, requestCategory?: string) => {
    notify({
      title: `Nouvelle demande de ${requesterName}`,
      body: requestCategory 
        ? `Catégorie: ${requestCategory}` 
        : 'Vous avez reçu une nouvelle demande de contact',
      type: 'request',
      playSound: true,
      showDesktop: true
    })
  }, [notify])

  // Get notification history
  const getNotificationHistory = useCallback(() => {
    return JSON.parse(localStorage.getItem(`exile_notification_history_${userId}`) || '[]')
  }, [userId])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const history = getNotificationHistory().map((n: any) => ({ ...n, read: true }))
    localStorage.setItem(`exile_notification_history_${userId}`, JSON.stringify(history))
  }, [getNotificationHistory, userId])

  // Clear history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(`exile_notification_history_${userId}`)
  }, [userId])

  // Test notification
  const testNotification = useCallback(() => {
    notify({
      title: 'Test de notification',
      body: 'Ceci est une notification de test depuis Exile',
      type: 'system',
      playSound: true,
      showDesktop: true
    })
  }, [notify])

  return {
    permission,
    desktopPermission,
    toggleSound,
    toggleDesktop,
    toggleEnabled,
    notify,
    notifyNewMessage,
    notifyNewRequest,
    getNotificationHistory,
    markAllAsRead,
    clearHistory,
    testNotification
  }
}
