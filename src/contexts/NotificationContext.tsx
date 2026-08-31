import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X, Wifi, WifiOff, Play } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  icon?: ReactNode
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  // Convenience methods
  showSuccess: (title: string, message: string, duration?: number) => void
  showError: (title: string, message: string, duration?: number) => void
  showWarning: (title: string, message: string, duration?: number) => void
  showInfo: (title: string, message: string, duration?: number) => void
  // Upload-specific notifications
  showUploadResumed: () => void
  showUploadCompleted: () => void
  showConnectionLost: () => void
  showConnectionRestored: () => void
  showProfileUpdated: () => void
  showLogoutSuccess: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration,
      icon: <CheckCircle className="w-5 h-5" />
    })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration,
      icon: <AlertCircle className="w-5 h-5" />
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration,
      icon: <AlertCircle className="w-5 h-5" />
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration,
      icon: <Info className="w-5 h-5" />
    })
  }, [addNotification])

  // Upload-specific notifications
  const showUploadResumed = useCallback(() => {
    addNotification({
      type: 'info',
      title: 'Upload repris',
      message: 'L\'upload de votre vidéo a repris automatiquement.',
      duration: 4000,
      icon: <Play className="w-5 h-5" />
    })
  }, [addNotification])

  const showUploadCompleted = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Upload terminé',
      message: 'Votre vidéo a été uploadée avec succès !',
      duration: 5000,
      icon: <CheckCircle className="w-5 h-5" />
    })
  }, [addNotification])

  const showConnectionLost = useCallback(() => {
    addNotification({
      type: 'warning',
      title: 'Connexion perdue',
      message: 'L\'upload sera repris automatiquement lorsque Internet sera disponible.',
      duration: 0, // Don't auto-remove
      icon: <WifiOff className="w-5 h-5" />
    })
  }, [addNotification])

  const showConnectionRestored = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Connexion rétablie',
      message: 'L\'upload va reprendre automatiquement.',
      duration: 4000,
      icon: <Wifi className="w-5 h-5" />
    })
  }, [addNotification])

  const showProfileUpdated = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Profil mis à jour',
      message: 'Vos modifications ont été enregistrées avec succès.',
      duration: 4000,
      icon: <CheckCircle className="w-5 h-5" />
    })
  }, [addNotification])

  const showLogoutSuccess = useCallback(() => {
    // Intentionnellement vide pour ne pas afficher de notification intrusive
  }, [])

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showUploadResumed,
    showUploadCompleted,
    showConnectionLost,
    showConnectionRestored,
    showProfileUpdated,
    showLogoutSuccess,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = ({ 
  notifications, 
  onRemove 
}: { 
  notifications: Notification[]
  onRemove: (id: string) => void 
}) => {
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[50000] space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-right ${getTypeStyles(notification.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
              {notification.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm ${notification.type === 'error' ? 'text-red-900 dark:text-red-100' : notification.type === 'warning' ? 'text-yellow-900 dark:text-yellow-100' : notification.type === 'success' ? 'text-green-900 dark:text-green-100' : 'text-blue-900 dark:text-blue-100'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${notification.type === 'error' ? 'text-red-700 dark:text-red-300' : notification.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : notification.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
