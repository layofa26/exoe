// Hook algorithmique pour capturer les signaux liés aux événements
// Capture le temps passé sur une page événement et détecte l'intérêt pour SQL
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Event } from '../../types/events'
import {
  loadUserSignals,
  updateSignals,
  cleanupOldSignals
} from '../storage/signalStorage'
import type { ViewedEvent, CategoryPreference } from '../types/signals'

const SQL_DESCRIPTION_THRESHOLD = 30 // secondes
const SQL_KEYWORDS = ['sql', 'database', 'base de données', 'mysql', 'postgresql', 'mongodb']

export interface UseEventsAlgoReturn {
  // État du tracking
  isTracking: boolean
  currentEventId: string | null
  timeSpent: number

  // Actions
  startTracking: (event: Event) => void
  stopTracking: () => void
  markDescriptionRead: (eventId: string) => void
  markEventRegistered: (eventId: string) => void

  // Signaux calculés
  sqlInterestScore: number
  categoryPreferences: CategoryPreference[]
  isInterestedInSQL: boolean
}

export const useEventsAlgo = (userId: string): UseEventsAlgoReturn => {
  const [isTracking, setIsTracking] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [sqlInterestScore, setSqlInterestScore] = useState(0)
  const [categoryPreferences, setCategoryPreferences] = useState<CategoryPreference[]>([])

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const currentEventRef = useRef<Event | null>(null)

  // Charger les signaux existants
  useEffect(() => {
    const signals = loadUserSignals(userId)
    if (signals) {
      setSqlInterestScore(signals.events.sqlInterestScore)
      setCategoryPreferences(signals.events.categoryPreferences)
    }
  }, [userId])

  // Démarrer le tracking d'un événement
  const startTracking = useCallback((event: Event) => {
    if (isTracking && currentEventId === event.id) return

    // Arrêter le tracking précédent si nécessaire
    if (isTracking) {
      stopTracking()
    }

    setIsTracking(true)
    setCurrentEventId(event.id)
    currentEventRef.current = event
    startTimeRef.current = Date.now()
    setTimeSpent(0)

    // Démarrer l'intervalle de tracking
    trackingIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      setTimeSpent(elapsed)
    }, 1000)
  }, [isTracking, currentEventId])

  // Arrêter le tracking
  const stopTracking = useCallback(() => {
    if (!isTracking || !currentEventId || !currentEventRef.current) return

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }

    const event = currentEventRef.current
    const finalTimeSpent = timeSpent

    // Sauvegarder les données de tracking
    updateSignals(userId, (signals) => {
      // Créer ou mettre à jour l'événement vu
      const existingIndex = signals.events.viewedEvents.findIndex(
        (ve) => ve.eventId === currentEventId
      )

      const viewedEvent: ViewedEvent = {
        eventId: event.id,
        eventTitle: event.title,
        category: event.category,
        timeSpent: finalTimeSpent,
        viewedAt: new Date().toISOString(),
        readDescription: false,
        registered: false
      }

      if (existingIndex >= 0) {
        // Mettre à jour l'événement existant
        signals.events.viewedEvents[existingIndex] = {
          ...signals.events.viewedEvents[existingIndex],
          timeSpent: signals.events.viewedEvents[existingIndex].timeSpent + finalTimeSpent,
          viewedAt: new Date().toISOString()
        }
      } else {
        // Ajouter le nouvel événement
        signals.events.viewedEvents.push(viewedEvent)
      }

      // Mettre à jour le temps total passé
      signals.events.totalTimeSpent += finalTimeSpent

      // Mettre à jour les préférences de catégorie
      updateCategoryPreference(signals, event.category, finalTimeSpent)

      // Détecter l'intérêt pour SQL
      if (isSQLEvent(event)) {
        signals.events.sqlInterestScore = Math.min(100, signals.events.sqlInterestScore + 10)
      }

      return signals
    })

    // Nettoyer les anciennes données
    cleanupOldSignals(userId)

    setIsTracking(false)
    setCurrentEventId(null)
    currentEventRef.current = null
    startTimeRef.current = null
    setTimeSpent(0)
  }, [isTracking, currentEventId, timeSpent, userId])

  // Marquer la description comme lue
  const markDescriptionRead = useCallback((eventId: string) => {
    updateSignals(userId, (signals) => {
      const eventIndex = signals.events.viewedEvents.findIndex((ve) => ve.eventId === eventId)
      if (eventIndex >= 0) {
        signals.events.viewedEvents[eventIndex].readDescription = true

        // Si c'est un événement SQL et que le temps passé est suffisant, augmenter le score
        const event = signals.events.viewedEvents[eventIndex]
        if (isSQLEvent({ category: event.category, title: event.eventTitle } as Event)) {
          if (event.timeSpent >= SQL_DESCRIPTION_THRESHOLD) {
            signals.events.sqlInterestScore = Math.min(100, signals.events.sqlInterestScore + 20)
          }
        }
      }
      return signals
    })

    // Mettre à jour l'état local
    const signals = loadUserSignals(userId)
    if (signals) {
      setSqlInterestScore(signals.events.sqlInterestScore)
    }
  }, [userId])

  // Marquer l'événement comme enregistré
  const markEventRegistered = useCallback((eventId: string) => {
    updateSignals(userId, (signals) => {
      const eventIndex = signals.events.viewedEvents.findIndex((ve) => ve.eventId === eventId)
      if (eventIndex >= 0) {
        signals.events.viewedEvents[eventIndex].registered = true
      }
      return signals
    })
  }, [userId])

  // Vérifier si un événement est lié à SQL
  const isSQLEvent = (event: Event): boolean => {
    const lowerTitle = event.title.toLowerCase()
    const lowerCategory = event.category.toLowerCase()
    const lowerDescription = event.description?.toLowerCase() || ''

    return SQL_KEYWORDS.some((keyword) =>
      lowerTitle.includes(keyword) ||
      lowerCategory.includes(keyword) ||
      lowerDescription.includes(keyword)
    )
  }

  // Mettre à jour les préférences de catégorie
  const updateCategoryPreference = (
    signals: any,
    category: string,
    timeSpent: number
  ): void => {
    const existingIndex = signals.events.categoryPreferences.findIndex(
      (cp: CategoryPreference) => cp.category === category
    )

    if (existingIndex >= 0) {
      // Mettre à jour la préférence existante
      const currentScore = signals.events.categoryPreferences[existingIndex].score
      const newScore = Math.min(100, currentScore + Math.floor(timeSpent / 10))
      signals.events.categoryPreferences[existingIndex] = {
        category,
        score: newScore,
        lastUpdated: new Date().toISOString()
      }
    } else {
      // Créer une nouvelle préférence
      signals.events.categoryPreferences.push({
        category,
        score: Math.min(100, Math.floor(timeSpent / 10)),
        lastUpdated: new Date().toISOString()
      })
    }
  }

  // Calculer si l'utilisateur est intéressé par SQL
  const isInterestedInSQL = sqlInterestScore >= 50

  return {
    isTracking,
    currentEventId,
    timeSpent,
    startTracking,
    stopTracking,
    markDescriptionRead,
    markEventRegistered,
    sqlInterestScore,
    categoryPreferences,
    isInterestedInSQL
  }
}
