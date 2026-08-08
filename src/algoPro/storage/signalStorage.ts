// Gestionnaire de stockage des signaux algorithmiques dans LocalStorage
import type { UserSignals } from '../types/signals'

const STORAGE_KEY = 'exile_user_signals'
const MAX_VIEWED_EVENTS = 100
const MAX_RECENT_SEARCHES = 50
const MAX_VISITED_PROFILES = 100
const MAX_VIDEO_CLICKS = 200
const MAX_LIVE_CLICKS = 100

// Initialiser les signaux pour un utilisateur
export const initializeUserSignals = (userId: string): UserSignals => {
  return {
    userId,
    lastUpdated: new Date().toISOString(),
    events: {
      viewedEvents: [],
      totalTimeSpent: 0,
      categoryPreferences: [],
      sqlInterestScore: 0
    },
    subscriptions: {
      visitedProfiles: [],
      subscribedCreators: [],
      priorityCreators: [],
      lastProfileVisit: new Date().toISOString()
    },
    requests: {
      recentSearches: [],
      searchPreferences: [],
      lastSearchQuery: '',
      lastSearchTime: new Date().toISOString()
    },
    profile: {
      userType: 'debutant',
      uiPreferences: {
        hideDebutantOptions: false,
        showAdvancedFeatures: false,
        preferredViewMode: 'grid',
        showTutorials: true
      },
      activityLevel: 'low',
      lastProfileUpdate: new Date().toISOString()
    },
    accueil: {
      videoClicks: [],
      liveClicks: [],
      categoryEngagement: [],
      liveEngagementRate: 0.5,
      videoEngagementRate: 0.5,
      preferredContentTypes: ['video'],
      timeOfDayPatterns: []
    }
  }
}

// Charger les signaux depuis LocalStorage
export const loadUserSignals = (userId: string): UserSignals | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const allSignals = JSON.parse(stored)
    return allSignals[userId] || null
  } catch (error) {
    console.error('Erreur lors du chargement des signaux:', error)
    return null
  }
}

// Sauvegarder les signaux dans LocalStorage
export const saveUserSignals = (signals: UserSignals): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const allSignals = stored ? JSON.parse(stored) : {}

    // Mettre à jour le timestamp
    signals.lastUpdated = new Date().toISOString()

    allSignals[signals.userId] = signals
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSignals))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des signaux:', error)
  }
}

// Charger les signaux depuis le backend (disabled - backend removed)
export const loadSignalsFromBackend = async (): Promise<UserSignals | null> => {
  return null
}


// Mettre à jour une partie des signaux
export const updateSignals = (
  userId: string,
  updater: (signals: UserSignals) => UserSignals
): void => {
  let signals = loadUserSignals(userId)
  if (!signals) {
    signals = initializeUserSignals(userId)
  }

  const updatedSignals = updater(signals)
  saveUserSignals(updatedSignals)
}

// Nettoyer les anciennes données (limiter la taille)
export const cleanupOldSignals = (userId: string): void => {
  updateSignals(userId, (signals) => {
    // Limiter les événements vus
    if (signals.events.viewedEvents.length > MAX_VIEWED_EVENTS) {
      signals.events.viewedEvents = signals.events.viewedEvents
        .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
        .slice(0, MAX_VIEWED_EVENTS)
    }

    // Limiter les recherches récentes
    if (signals.requests.recentSearches.length > MAX_RECENT_SEARCHES) {
      signals.requests.recentSearches = signals.requests.recentSearches
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_RECENT_SEARCHES)
    }

    // Limiter les profils visités
    if (signals.subscriptions.visitedProfiles.length > MAX_VISITED_PROFILES) {
      signals.subscriptions.visitedProfiles = signals.subscriptions.visitedProfiles
        .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
        .slice(0, MAX_VISITED_PROFILES)
    }

    // Limiter les clics vidéo
    if (signals.accueil.videoClicks.length > MAX_VIDEO_CLICKS) {
      signals.accueil.videoClicks = signals.accueil.videoClicks
        .sort((a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime())
        .slice(0, MAX_VIDEO_CLICKS)
    }

    // Limiter les clics live
    if (signals.accueil.liveClicks.length > MAX_LIVE_CLICKS) {
      signals.accueil.liveClicks = signals.accueil.liveClicks
        .sort((a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime())
        .slice(0, MAX_LIVE_CLICKS)
    }

    return signals
  })
}

// Supprimer les signaux d'un utilisateur
export const deleteUserSignals = (userId: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const allSignals = JSON.parse(stored)
    delete allSignals[userId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSignals))
  } catch (error) {
    console.error('Erreur lors de la suppression des signaux:', error)
  }
}

// Réinitialiser tous les signaux
export const resetAllSignals = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des signaux:', error)
  }
}
