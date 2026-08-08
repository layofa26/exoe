// Hook algorithmique pour adapter l'UI selon le profil de l'utilisateur
// Ex: cacher l'option "Débutant" si le profil indique "Instructeur"
import { useState, useEffect, useCallback } from 'react'
import {
  loadUserSignals,
  updateSignals
} from '../storage/signalStorage'
import type { UIPreferences } from '../types/signals'

const ACTIVITY_THRESHOLD_HIGH = 20 // actions par jour pour "high"
const ACTIVITY_THRESHOLD_MEDIUM = 5 // actions par jour pour "medium"

export interface UseProfileAlgoReturn {
  // État
  userType: 'debutant' | 'intermediaire' | 'expert' | 'instructeur'
  uiPreferences: UIPreferences
  activityLevel: 'low' | 'medium' | 'high'

  // Actions
  updateUserType: (type: 'debutant' | 'intermediaire' | 'expert' | 'instructeur') => void
  updateUIPreferences: (preferences: Partial<UIPreferences>) => void
  trackActivity: (actionType: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  hideTutorials: () => void
  showTutorials: () => void

  // Signaux calculés pour l'UI
  shouldHideDebutantOptions: boolean
  shouldShowAdvancedFeatures: boolean
  preferredViewMode: 'grid' | 'list'
  shouldShowTutorials: boolean
  isAdvancedUser: boolean
}

export const useProfileAlgo = (userId: string): UseProfileAlgoReturn => {
  const [userType, setUserType] = useState<'debutant' | 'intermediaire' | 'expert' | 'instructeur'>('debutant')
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>({
    hideDebutantOptions: false,
    showAdvancedFeatures: false,
    preferredViewMode: 'grid',
    showTutorials: true
  })
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>('low')

  // Charger les signaux existants
  useEffect(() => {
    const signals = loadUserSignals(userId)
    if (signals) {
      setUserType(signals.profile.userType)
      setUiPreferences(signals.profile.uiPreferences)
      setActivityLevel(signals.profile.activityLevel)
    }
  }, [userId])

  // Mettre à jour le type d'utilisateur
  const updateUserType = useCallback((
    type: 'debutant' | 'intermediaire' | 'expert' | 'instructeur'
  ) => {
    updateSignals(userId, (signals) => {
      signals.profile.userType = type
      signals.profile.lastProfileUpdate = new Date().toISOString()

      // Ajuster automatiquement les préférences UI selon le type
      if (type === 'instructeur' || type === 'expert') {
        signals.profile.uiPreferences.hideDebutantOptions = true
        signals.profile.uiPreferences.showAdvancedFeatures = true
        signals.profile.uiPreferences.showTutorials = false
      } else if (type === 'intermediaire') {
        signals.profile.uiPreferences.hideDebutantOptions = false
        signals.profile.uiPreferences.showAdvancedFeatures = true
        signals.profile.uiPreferences.showTutorials = true
      } else {
        // debutant
        signals.profile.uiPreferences.hideDebutantOptions = false
        signals.profile.uiPreferences.showAdvancedFeatures = false
        signals.profile.uiPreferences.showTutorials = true
      }

      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setUserType(signals.profile.userType)
      setUiPreferences(signals.profile.uiPreferences)
    }
  }, [userId])

  // Mettre à jour les préférences UI
  const updateUIPreferences = useCallback((preferences: Partial<UIPreferences>) => {
    updateSignals(userId, (signals) => {
      signals.profile.uiPreferences = {
        ...signals.profile.uiPreferences,
        ...preferences
      }
      signals.profile.lastProfileUpdate = new Date().toISOString()
      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setUiPreferences(signals.profile.uiPreferences)
    }
  }, [userId])

  // Tracker l'activité de l'utilisateur
  const trackActivity = useCallback((_actionType: string) => {
    updateSignals(userId, (signals) => {
      // Simuler un compteur d'activités (en production, utiliser un vrai compteur)
      const todayActivities = (signals as any).todayActivities || 0
      ;(signals as any).todayActivities = todayActivities + 1

      // Mettre à jour le niveau d'activité
      if ((signals as any).todayActivities >= ACTIVITY_THRESHOLD_HIGH) {
        signals.profile.activityLevel = 'high'
      } else if ((signals as any).todayActivities >= ACTIVITY_THRESHOLD_MEDIUM) {
        signals.profile.activityLevel = 'medium'
      } else {
        signals.profile.activityLevel = 'low'
      }

      // Si l'utilisateur est très actif et débutant, le promouvoir à intermédiaire
      if (signals.profile.userType === 'debutant' && signals.profile.activityLevel === 'high') {
        signals.profile.userType = 'intermediaire'
        signals.profile.uiPreferences.showAdvancedFeatures = true
      }

      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setUserType(signals.profile.userType)
      setActivityLevel(signals.profile.activityLevel)
    }
  }, [userId])

  // Définir le mode de vue préféré
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    updateUIPreferences({ preferredViewMode: mode })
  }, [updateUIPreferences])

  // Cacher les tutoriels
  const hideTutorials = useCallback(() => {
    updateUIPreferences({ showTutorials: false })
  }, [updateUIPreferences])

  // Afficher les tutoriels
  const showTutorials = useCallback(() => {
    updateUIPreferences({ showTutorials: true })
  }, [updateUIPreferences])

  // Signaux calculés pour l'UI
  const shouldHideDebutantOptions = uiPreferences.hideDebutantOptions
  const shouldShowAdvancedFeatures = uiPreferences.showAdvancedFeatures
  const preferredViewMode = uiPreferences.preferredViewMode
  const shouldShowTutorials = uiPreferences.showTutorials
  const isAdvancedUser = userType === 'expert' || userType === 'instructeur'

  return {
    userType,
    uiPreferences,
    activityLevel,
    updateUserType,
    updateUIPreferences,
    trackActivity,
    setViewMode,
    hideTutorials,
    showTutorials,
    shouldHideDebutantOptions,
    shouldShowAdvancedFeatures,
    preferredViewMode,
    shouldShowTutorials,
    isAdvancedUser
  }
}
