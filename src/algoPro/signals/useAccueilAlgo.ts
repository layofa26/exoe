// Hook algorithmique pour suivre les types de vidéos/lives cliqués sur l'accueil
// Suit les clics sur vidéos et lives pour calculer les taux d'engagement
import { useState, useEffect, useCallback } from 'react'
import type { Video } from '../../types/video'
import {
  loadUserSignals,
  loadSignalsFromBackend,
  updateSignals,
  cleanupOldSignals
} from '../storage/signalStorage'
import type { VideoClick, LiveClick, CategoryEngagement, ContentType, TimeOfDayPattern } from '../types/signals'

const ENGAGEMENT_DECAY_DAYS = 30 // jours avant que les données d'engagement ne décroissent
const MIN_WATCH_DURATION = 5 // secondes minimum pour considérer un clic comme engagement

export interface UseAccueilAlgoReturn {
  // État
  videoClicks: VideoClick[]
  liveClicks: LiveClick[]
  categoryEngagement: CategoryEngagement[]
  liveEngagementRate: number
  videoEngagementRate: number
  preferredContentTypes: ContentType[]

  // Actions
  trackVideoClick: (video: Video, watchDuration: number, completed: boolean, liked: boolean) => void
  trackLiveClick: (liveId: string, creatorId: string, category: string, watchDuration: number, joinedChat: boolean) => void
  getContentTypePreference: () => { video: number; live: number }
  shouldShowLive: (availableLives: number) => boolean
  getOptimalLiveFrequency: () => number

  // Signaux calculés
  prefersLives: boolean
  prefersVideos: boolean
  mostEngagedCategory: string | null
  peakEngagementHour: number | null
}

export const useAccueilAlgo = (userId: string): UseAccueilAlgoReturn => {
  const [videoClicks, setVideoClicks] = useState<VideoClick[]>([])
  const [liveClicks, setLiveClicks] = useState<LiveClick[]>([])
  const [categoryEngagement, setCategoryEngagement] = useState<CategoryEngagement[]>([])
  const [liveEngagementRate, setLiveEngagementRate] = useState(0.5)
  const [videoEngagementRate, setVideoEngagementRate] = useState(0.5)
  const [preferredContentTypes, setPreferredContentTypes] = useState<ContentType[]>(['video'])

  // Charger les signaux existants
  useEffect(() => {
    const loadSignals = async () => {
      // Try to load from backend first
      const backendSignals = await loadSignalsFromBackend()
      if (backendSignals) {
        setVideoClicks(backendSignals.accueil.videoClicks)
        setLiveClicks(backendSignals.accueil.liveClicks)
        setCategoryEngagement(backendSignals.accueil.categoryEngagement)
        setLiveEngagementRate(backendSignals.accueil.liveEngagementRate)
        setVideoEngagementRate(backendSignals.accueil.videoEngagementRate)
        setPreferredContentTypes(backendSignals.accueil.preferredContentTypes)
      } else {
        // Fallback to localStorage
        const localSignals = loadUserSignals(userId)
        if (localSignals) {
          setVideoClicks(localSignals.accueil.videoClicks)
          setLiveClicks(localSignals.accueil.liveClicks)
          setCategoryEngagement(localSignals.accueil.categoryEngagement)
          setLiveEngagementRate(localSignals.accueil.liveEngagementRate)
          setVideoEngagementRate(localSignals.accueil.videoEngagementRate)
          setPreferredContentTypes(localSignals.accueil.preferredContentTypes)
        }
      }
    }
    
    loadSignals()
  }, [userId])

  // Tracker un clic sur une vidéo
  const trackVideoClick = useCallback((
    video: Video,
    watchDuration: number,
    completed: boolean,
    liked: boolean
  ) => {
    if (!video) {
      console.error('trackVideoClick: video is undefined')
      return
    }

    updateSignals(userId, (signals) => {
      const videoClick: VideoClick = {
        videoId: video.id || 'unknown',
        category: video.category || 'general',
        creatorId: video.author?.id || 'unknown',
        clickedAt: new Date().toISOString(),
        watchDuration,
        completed,
        liked
      }

      signals.accueil.videoClicks.unshift(videoClick)

      // Mettre à jour l'engagement par catégorie
      updateCategoryEngagement(signals, video.category, watchDuration, completed)

      // Recalculer les taux d'engagement
      recalculateEngagementRates(signals)

      // Mettre à jour les patterns temporels
      updateTimeOfDayPattern(signals, 'video', watchDuration)

      return signals
    })

    cleanupOldSignals(userId)

    const signals = loadUserSignals(userId)
    if (signals) {
      setVideoClicks(signals.accueil.videoClicks)
      setCategoryEngagement(signals.accueil.categoryEngagement)
      setLiveEngagementRate(signals.accueil.liveEngagementRate)
      setVideoEngagementRate(signals.accueil.videoEngagementRate)
      setPreferredContentTypes(signals.accueil.preferredContentTypes)
    }
  }, [userId])

  // Tracker un clic sur un live
  const trackLiveClick = useCallback((
    liveId: string,
    creatorId: string,
    category: string,
    watchDuration: number,
    joinedChat: boolean
  ) => {
    updateSignals(userId, (signals) => {
      const liveClick: LiveClick = {
        liveId,
        creatorId,
        category,
        clickedAt: new Date().toISOString(),
        watchDuration,
        joinedChat
      }

      signals.accueil.liveClicks.unshift(liveClick)

      // Mettre à jour l'engagement par catégorie
      updateCategoryEngagement(signals, category, watchDuration, joinedChat)

      // Recalculer les taux d'engagement
      recalculateEngagementRates(signals)

      // Mettre à jour les patterns temporels
      updateTimeOfDayPattern(signals, 'live', watchDuration)

      return signals
    })

    cleanupOldSignals(userId)

    const signals = loadUserSignals(userId)
    if (signals) {
      setLiveClicks(signals.accueil.liveClicks)
      setCategoryEngagement(signals.accueil.categoryEngagement)
      setLiveEngagementRate(signals.accueil.liveEngagementRate)
      setVideoEngagementRate(signals.accueil.videoEngagementRate)
      setPreferredContentTypes(signals.accueil.preferredContentTypes)
    }
  }, [userId])

  // Mettre à jour l'engagement par catégorie
  const updateCategoryEngagement = (
    signals: any,
    category: string | undefined,
    watchDuration: number,
    positiveSignal: boolean
  ): void => {
    const categorySafe = category || 'general'
    const existingIndex = signals.accueil.categoryEngagement.findIndex(
      (ce: CategoryEngagement) => ce.category === categorySafe
    )

    if (existingIndex >= 0) {
      const existing = signals.accueil.categoryEngagement[existingIndex]
      signals.accueil.categoryEngagement[existingIndex] = {
        ...existing,
        totalClicks: existing.totalClicks + 1,
        avgWatchDuration: (existing.avgWatchDuration * existing.totalClicks + watchDuration) / (existing.totalClicks + 1),
        completionRate: positiveSignal ? Math.min(100, existing.completionRate + 5) : existing.completionRate,
        lastEngaged: new Date().toISOString()
      }
    } else {
      signals.accueil.categoryEngagement.push({
        category: categorySafe,
        totalClicks: 1,
        avgWatchDuration: watchDuration,
        completionRate: positiveSignal ? 50 : 0,
        lastEngaged: new Date().toISOString()
      })
    }
  }

  // Recalculer les taux d'engagement
  const recalculateEngagementRates = (signals: any): void => {
    const recentVideoClicks = getRecentClicks(signals.accueil.videoClicks)
    const recentLiveClicks = getRecentClicks(signals.accueil.liveClicks)

    const totalVideoEngagement = recentVideoClicks.reduce((sum: number, vc: VideoClick) => {
      return sum + (vc.watchDuration >= MIN_WATCH_DURATION ? 1 : 0)
    }, 0)

    const totalLiveEngagement = recentLiveClicks.reduce((sum: number, lc: LiveClick) => {
      return sum + (lc.watchDuration >= MIN_WATCH_DURATION ? 1 : 0)
    }, 0)

    const totalInteractions = totalVideoEngagement + totalLiveEngagement

    if (totalInteractions > 0) {
      signals.accueil.videoEngagementRate = totalVideoEngagement / totalInteractions
      signals.accueil.liveEngagementRate = totalLiveEngagement / totalInteractions
    }

    // Mettre à jour les types de contenu préférés
    if (signals.accueil.liveEngagementRate > 0.6) {
      signals.accueil.preferredContentTypes = ['live', 'video']
    } else if (signals.accueil.videoEngagementRate > 0.6) {
      signals.accueil.preferredContentTypes = ['video', 'live']
    } else {
      signals.accueil.preferredContentTypes = ['video', 'live']
    }
  }

  // Obtenir les clics récents (derniers 30 jours)
  const getRecentClicks = (clicks: any[]): any[] => {
    const threshold = new Date(Date.now() - ENGAGEMENT_DECAY_DAYS * 24 * 60 * 60 * 1000)
    return clicks.filter((click) => new Date(click.clickedAt) > threshold)
  }

  // Mettre à jour les patterns temporels
  const updateTimeOfDayPattern = (signals: any, contentType: ContentType, watchDuration: number): void => {
    const hour = new Date().getHours()
    const existingIndex = signals.accueil.timeOfDayPatterns.findIndex(
      (todp: TimeOfDayPattern) => todp.hour === hour
    )

    if (existingIndex >= 0) {
      const existing = signals.accueil.timeOfDayPatterns[existingIndex]
      signals.accueil.timeOfDayPatterns[existingIndex] = {
        hour,
        preferredContentType: contentType,
        engagementScore: existing.engagementScore + Math.floor(watchDuration / 10)
      }
    } else {
      signals.accueil.timeOfDayPatterns.push({
        hour,
        preferredContentType: contentType,
        engagementScore: Math.floor(watchDuration / 10)
      })
    }
  }

  // Obtenir la préférence de type de contenu
  const getContentTypePreference = useCallback((): { video: number; live: number } => {
    return {
      video: videoEngagementRate,
      live: liveEngagementRate
    }
  }, [videoEngagementRate, liveEngagementRate])

  // Déterminer si on doit afficher des lives
  const shouldShowLive = useCallback((availableLives: number): boolean => {
    if (availableLives === 0) return false

    // Si l'utilisateur préfère les lives, toujours montrer
    if (liveEngagementRate > 0.6) return true

    // Si l'utilisateur est neutre, montrer si des lives sont disponibles
    if (liveEngagementRate > 0.3 && availableLives > 0) return true

    // Si l'utilisateur préfère les vidéos, montrer seulement si beaucoup de lives
    return availableLives >= 3
  }, [liveEngagementRate])

  // Obtenir la fréquence optimale de lives
  const getOptimalLiveFrequency = useCallback((): number => {
    if (liveEngagementRate > 0.7) return 2 // live toutes les 2-3 vidéos
    if (liveEngagementRate > 0.5) return 4 // live toutes les 4-5 vidéos
    if (liveEngagementRate > 0.3) return 6 // live toutes les 6-7 vidéos
    return 10 // live toutes les 10+ vidéos
  }, [liveEngagementRate])

  // Signaux calculés
  const prefersLives = liveEngagementRate > 0.5
  const prefersVideos = videoEngagementRate > 0.5

  const mostEngagedCategory = categoryEngagement.length > 0
    ? categoryEngagement.sort((a, b) => b.totalClicks - a.totalClicks)[0].category
    : null

  const peakEngagementHour = categoryEngagement.length > 0
    ? categoryEngagement.reduce((max, current) => {
        return current.totalClicks > (max?.totalClicks || 0) ? current : max
      }, null as CategoryEngagement | null)
    : null

  return {
    videoClicks,
    liveClicks,
    categoryEngagement,
    liveEngagementRate,
    videoEngagementRate,
    preferredContentTypes,
    trackVideoClick,
    trackLiveClick,
    getContentTypePreference,
    shouldShowLive,
    getOptimalLiveFrequency,
    prefersLives,
    prefersVideos,
    mostEngagedCategory,
    peakEngagementHour: peakEngagementHour ? new Date(peakEngagementHour.lastEngaged).getHours() : null
  }
}
