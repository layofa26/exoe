import { useState, useEffect, useCallback } from 'react'
import type { UserAvailability, AvailabilityStatus } from '../types/requests'
import { STORAGE_KEYS } from '../types/requests'

export const useAvailability = (userId: string) => {
  const [availability, setAvailability] = useState<UserAvailability | null>(null)

  // Load availability from localStorage
  useEffect(() => {
    const savedAvailability = localStorage.getItem(STORAGE_KEYS.AVAILABILITY)
    
    if (savedAvailability) {
      const allAvailability: UserAvailability[] = JSON.parse(savedAvailability)
      const userAvailability = allAvailability.find(a => a.userId === userId)
      
      if (userAvailability) {
        setAvailability(userAvailability)
      } else {
        // Default availability
        setAvailability({
          userId,
          status: 'available',
          autoReplyEnabled: false,
          updatedAt: new Date().toISOString()
        })
      }
    } else {
      // Initialize with default
      setAvailability({
        userId,
        status: 'available',
        autoReplyEnabled: false,
        updatedAt: new Date().toISOString()
      })
    }
  }, [userId])

  // Save to localStorage
  useEffect(() => {
    if (!availability) return

    const savedAvailability = localStorage.getItem(STORAGE_KEYS.AVAILABILITY)
    const allAvailability: UserAvailability[] = savedAvailability ? JSON.parse(savedAvailability) : []
    
    // Remove old entry for this user
    const filtered = allAvailability.filter(a => a.userId !== userId)
    // Add updated entry
    const newAllAvailability = [...filtered, availability]
    
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(newAllAvailability))
  }, [availability, userId])

  // Update status
  const updateStatus = useCallback((status: AvailabilityStatus) => {
    setAvailability(prev => {
      if (!prev) return null
      return {
        ...prev,
        status,
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  // Toggle auto-reply
  const toggleAutoReply = useCallback((enabled: boolean, message?: string) => {
    setAvailability(prev => {
      if (!prev) return null
      return {
        ...prev,
        autoReplyEnabled: enabled,
        autoReplyMessage: enabled ? (message || prev.autoReplyMessage) : undefined,
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  // Update auto-reply message
  const updateAutoReplyMessage = useCallback((message: string) => {
    setAvailability(prev => {
      if (!prev) return null
      return {
        ...prev,
        autoReplyMessage: message,
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  // Update schedule
  const updateSchedule = useCallback((schedule: {
    startTime?: string
    endTime?: string
    daysOfWeek?: number[]
  }) => {
    setAvailability(prev => {
      if (!prev) return null
      return {
        ...prev,
        schedule,
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  // Get auto-reply message if applicable
  const getAutoReplyMessage = useCallback(() => {
    if (!availability || !availability.autoReplyEnabled) return null
    
    // Check if within schedule
    if (availability.schedule) {
      const now = new Date()
      const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      const { startTime, endTime, daysOfWeek } = availability.schedule
      
      // Check day
      if (daysOfWeek && !daysOfWeek.includes(currentDay)) {
        return null
      }
      
      // Check time
      if (startTime && endTime) {
        if (currentTime < startTime || currentTime > endTime) {
          return null
        }
      }
    }
    
    return availability.autoReplyMessage || 'Je ne suis pas disponible pour le moment. Je vous répondrai dès que possible.'
  }, [availability])

  // Check if user is currently available
  const isCurrentlyAvailable = useCallback(() => {
    if (!availability) return true
    
    if (availability.status === 'available') {
      // Check schedule if exists
      if (availability.schedule) {
        const now = new Date()
        const currentDay = now.getDay()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        
        const { startTime, endTime, daysOfWeek } = availability.schedule
        
        if (daysOfWeek && !daysOfWeek.includes(currentDay)) {
          return false
        }
        
        if (startTime && endTime) {
          if (currentTime < startTime || currentTime > endTime) {
            return false
          }
        }
      }
      return true
    }
    
    return availability.status !== 'offline'
  }, [availability])

  return {
    // Data
    availability,
    status: availability?.status || 'available',
    autoReplyEnabled: availability?.autoReplyEnabled || false,
    autoReplyMessage: availability?.autoReplyMessage,
    schedule: availability?.schedule,
    
    // Actions
    updateStatus,
    toggleAutoReply,
    updateAutoReplyMessage,
    updateSchedule,
    
    // Utils
    getAutoReplyMessage,
    isCurrentlyAvailable
  }
}

// Hook to check another user's availability (read-only)
export const useUserAvailability = (targetUserId: string) => {
  const [availability, setAvailability] = useState<UserAvailability | null>(null)

  useEffect(() => {
    const savedAvailability = localStorage.getItem(STORAGE_KEYS.AVAILABILITY)
    
    if (savedAvailability) {
      const allAvailability: UserAvailability[] = JSON.parse(savedAvailability)
      const userAvailability = allAvailability.find(a => a.userId === targetUserId)
      setAvailability(userAvailability || null)
    }
  }, [targetUserId])

  const isAvailable = () => {
    if (!availability) return true
    if (availability.status === 'offline' || availability.status === 'away') return false
    return availability.status === 'available'
  }

  return {
    availability,
    status: availability?.status || 'available',
    isAvailable: isAvailable(),
    autoReplyEnabled: availability?.autoReplyEnabled || false,
    autoReplyMessage: availability?.autoReplyMessage
  }
}
