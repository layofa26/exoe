// Hook algorithmique pour gérer les signaux liés aux abonnements
// Priorise les créateurs visités récemment même si non abonnés
import { useState, useEffect, useCallback } from 'react'
import type { Author } from '../../types/video'
import {
  loadUserSignals,
  updateSignals,
  cleanupOldSignals
} from '../storage/signalStorage'
import type { VisitedProfile } from '../types/signals'

const PRIORITY_DECAY_HOURS = 24 // heures avant qu'un créateur prioritaire perde sa priorité
const VISIT_THRESHOLD = 2 // nombre minimum de visites pour devenir prioritaire

export interface UseSubsAlgoReturn {
  // État
  priorityCreators: string[]
  visitedProfiles: VisitedProfile[]
  subscribedCreators: string[]

  // Actions
  trackProfileVisit: (creator: Author, timeSpent: number) => void
  addSubscription: (creatorId: string) => void
  removeSubscription: (creatorId: string) => void
  getPriorityCreators: () => string[]
  isCreatorPriority: (creatorId: string) => boolean

  // Signaux calculés
  recentlyVisitedCreators: Author[]
  shouldPrioritizeCreator: (creatorId: string) => boolean
}

export const useSubsAlgo = (userId: string): UseSubsAlgoReturn => {
  const [priorityCreators, setPriorityCreators] = useState<string[]>([])
  const [visitedProfiles, setVisitedProfiles] = useState<VisitedProfile[]>([])
  const [subscribedCreators, setSubscribedCreators] = useState<string[]>([])

  // Charger les signaux existants
  useEffect(() => {
    const signals = loadUserSignals(userId)
    if (signals) {
      setPriorityCreators(signals.subscriptions.priorityCreators)
      setVisitedProfiles(signals.subscriptions.visitedProfiles)
      setSubscribedCreators(signals.subscriptions.subscribedCreators)
    }
  }, [userId])

  // Tracker une visite de profil
  const trackProfileVisit = useCallback((
    creator: Author,
    timeSpent: number
  ) => {
    updateSignals(userId, (signals) => {
      const existingIndex = signals.subscriptions.visitedProfiles.findIndex(
        (vp) => vp.creatorId === creator.id
      )

      const visitedProfile: VisitedProfile = {
        creatorId: creator.id,
        creatorName: creator.name,
        profession: creator.profession,
        visitedAt: new Date().toISOString(),
        timeSpent,
        visitCount: 1
      }

      if (existingIndex >= 0) {
        // Mettre à jour la visite existante
        const existing = signals.subscriptions.visitedProfiles[existingIndex]
        signals.subscriptions.visitedProfiles[existingIndex] = {
          ...existing,
          visitedAt: new Date().toISOString(),
          timeSpent: existing.timeSpent + timeSpent,
          visitCount: existing.visitCount + 1
        }

        // Si le créateur a été visité suffisamment de fois, l'ajouter aux priorités
        if (existing.visitCount + 1 >= VISIT_THRESHOLD) {
          if (!signals.subscriptions.priorityCreators.includes(creator.id)) {
            signals.subscriptions.priorityCreators.push(creator.id)
          }
        }
      } else {
        // Ajouter la nouvelle visite
        signals.subscriptions.visitedProfiles.push(visitedProfile)

        // Si c'est la première visite mais avec un temps significatif, considérer comme priorité
        if (timeSpent > 30) {
          signals.subscriptions.priorityCreators.push(creator.id)
        }
      }

      signals.subscriptions.lastProfileVisit = new Date().toISOString()
      return signals
    })

    // Nettoyer les anciennes données
    cleanupOldSignals(userId)

    // Mettre à jour l'état local
    const signals = loadUserSignals(userId)
    if (signals) {
      setPriorityCreators(signals.subscriptions.priorityCreators)
      setVisitedProfiles(signals.subscriptions.visitedProfiles)
    }
  }, [userId])

  // Ajouter un abonnement
  const addSubscription = useCallback((creatorId: string) => {
    updateSignals(userId, (signals) => {
      if (!signals.subscriptions.subscribedCreators.includes(creatorId)) {
        signals.subscriptions.subscribedCreators.push(creatorId)
      }
      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setSubscribedCreators(signals.subscriptions.subscribedCreators)
    }
  }, [userId])

  // Supprimer un abonnement
  const removeSubscription = useCallback((creatorId: string) => {
    updateSignals(userId, (signals) => {
      signals.subscriptions.subscribedCreators = signals.subscriptions.subscribedCreators.filter(
        (id) => id !== creatorId
      )
      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setSubscribedCreators(signals.subscriptions.subscribedCreators)
    }
  }, [userId])

  // Obtenir les créateurs prioritaires (nettoyés des anciens)
  const getPriorityCreators = useCallback((): string[] => {
    const signals = loadUserSignals(userId)
    if (!signals) return []

    const now = new Date()
    const threshold = new Date(now.getTime() - PRIORITY_DECAY_HOURS * 60 * 60 * 1000)

    // Filtrer les créateurs prioritaires visités récemment
    const activePriorityCreators = signals.subscriptions.priorityCreators.filter((creatorId) => {
      const visit = signals.subscriptions.visitedProfiles.find(
        (vp) => vp.creatorId === creatorId
      )
      if (!visit) return false

      const visitDate = new Date(visit.visitedAt)
      return visitDate > threshold
    })

    // Mettre à jour la liste des priorités
    if (activePriorityCreators.length !== signals.subscriptions.priorityCreators.length) {
      updateSignals(userId, (s) => {
        s.subscriptions.priorityCreators = activePriorityCreators
        return s
      })
    }

    return activePriorityCreators
  }, [userId])

  // Vérifier si un créateur est prioritaire
  const isCreatorPriority = useCallback((creatorId: string): boolean => {
    return priorityCreators.includes(creatorId)
  }, [priorityCreators])

  // Obtenir les créateurs visités récemment (dernières 24h)
  const recentlyVisitedCreators = useCallback((): Author[] => {
    const signals = loadUserSignals(userId)
    if (!signals) return []

    const now = new Date()
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    return signals.subscriptions.visitedProfiles
      .filter((vp) => new Date(vp.visitedAt) > threshold)
      .map((vp) => ({
        id: vp.creatorId,
        name: vp.creatorName,
        profession: vp.profession,
        location: '',
        initials: vp.creatorName.split(' ').map(n => n[0]).join('').toUpperCase(),
        avatarColor: '#666'
      } as Author))
  }, [userId])()

  // Déterminer si on doit prioriser un créateur
  const shouldPrioritizeCreator = useCallback((creatorId: string): boolean => {
    // Priorité 1: Abonné
    if (subscribedCreators.includes(creatorId)) {
      return true
    }

    // Priorité 2: Créateur prioritaire (visité récemment plusieurs fois)
    if (priorityCreators.includes(creatorId)) {
      return true
    }

    // Priorité 3: Visité récemment avec un temps significatif
    const recentVisit = visitedProfiles.find(
      (vp) => vp.creatorId === creatorId && vp.timeSpent > 30
    )
    if (recentVisit) {
      const visitDate = new Date(recentVisit.visitedAt)
      const hoursSinceVisit = (Date.now() - visitDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceVisit < 24) {
        return true
      }
    }

    return false
  }, [subscribedCreators, priorityCreators, visitedProfiles])

  return {
    priorityCreators,
    visitedProfiles,
    subscribedCreators,
    trackProfileVisit,
    addSubscription,
    removeSubscription,
    getPriorityCreators,
    isCreatorPriority,
    recentlyVisitedCreators,
    shouldPrioritizeCreator
  }
}
