// Hook algorithmique pour gérer les signaux liés aux recherches et demandes
// Sauvegarde les dernières recherches pour modifier les suggestions
import { useState, useEffect, useCallback } from 'react'
import {
  loadUserSignals,
  updateSignals,
  cleanupOldSignals
} from '../storage/signalStorage'
import type { RecentSearch, SearchPreference } from '../types/signals'

const MAX_SUGGESTIONS = 10
const RECENT_SEARCH_DECAY_DAYS = 7 // jours avant qu'une recherche ne soit plus considérée récente

export interface UseRequestsAlgoReturn {
  // État
  recentSearches: RecentSearch[]
  searchPreferences: SearchPreference[]
  lastSearchQuery: string

  // Actions
  trackSearch: (query: string, category?: string, resultsCount?: number) => void
  trackSearchResultClick: (query: string, clickedResultId: string) => void
  getSearchSuggestions: (partialQuery: string) => string[]
  getPreferredCategories: () => string[]
  clearRecentSearches: () => void

  // Signaux calculés
  searchTrends: { query: string; frequency: number }[]
  isQueryFrequent: (query: string) => boolean
}

export const useRequestsAlgo = (userId: string): UseRequestsAlgoReturn => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [searchPreferences, setSearchPreferences] = useState<SearchPreference[]>([])
  const [lastSearchQuery, setLastSearchQuery] = useState('')

  // Charger les signaux existants
  useEffect(() => {
    const signals = loadUserSignals(userId)
    if (signals) {
      setRecentSearches(signals.requests.recentSearches)
      setSearchPreferences(signals.requests.searchPreferences)
      setLastSearchQuery(signals.requests.lastSearchQuery)
    }
  }, [userId])

  // Tracker une recherche
  const trackSearch = useCallback((
    query: string,
    category?: string,
    resultsCount: number = 0
  ) => {
    if (!query.trim()) return

    const normalizedQuery = query.trim().toLowerCase()

    updateSignals(userId, (signals) => {
      // Créer la nouvelle recherche
      const newSearch: RecentSearch = {
        query: normalizedQuery,
        category,
        timestamp: new Date().toISOString(),
        resultsCount,
        clickedResult: undefined
      }

      // Ajouter au début de la liste
      signals.requests.recentSearches.unshift(newSearch)

      // Mettre à jour les préférences de catégorie
      if (category) {
        updateCategoryPreference(signals, category)
      }

      // Mettre à jour la dernière recherche
      signals.requests.lastSearchQuery = normalizedQuery
      signals.requests.lastSearchTime = new Date().toISOString()

      return signals
    })

    // Nettoyer les anciennes données
    cleanupOldSignals(userId)

    // Mettre à jour l'état local
    const signals = loadUserSignals(userId)
    if (signals) {
      setRecentSearches(signals.requests.recentSearches)
      setSearchPreferences(signals.requests.searchPreferences)
      setLastSearchQuery(signals.requests.lastSearchQuery)
    }
  }, [userId])

  // Tracker un clic sur un résultat de recherche
  const trackSearchResultClick = useCallback((query: string, clickedResultId: string) => {
    updateSignals(userId, (signals) => {
      const searchIndex = signals.requests.recentSearches.findIndex(
        (rs) => rs.query === query.toLowerCase()
      )

      if (searchIndex >= 0) {
        signals.requests.recentSearches[searchIndex].clickedResult = clickedResultId
      }

      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setRecentSearches(signals.requests.recentSearches)
    }
  }, [userId])

  // Mettre à jour les préférences de catégorie
  const updateCategoryPreference = (signals: any, category: string): void => {
    const existingIndex = signals.requests.searchPreferences.findIndex(
      (sp: SearchPreference) => sp.category === category
    )

    if (existingIndex >= 0) {
      // Incrémenter la fréquence
      signals.requests.searchPreferences[existingIndex].frequency += 1
      signals.requests.searchPreferences[existingIndex].lastUsed = new Date().toISOString()
    } else {
      // Créer une nouvelle préférence
      signals.requests.searchPreferences.push({
        category,
        frequency: 1,
        lastUsed: new Date().toISOString()
      })
    }
  }

  // Obtenir des suggestions de recherche basées sur l'historique
  const getSearchSuggestions = useCallback((partialQuery: string): string[] => {
    if (!partialQuery.trim()) {
      // Retourner les recherches les plus récentes
      return recentSearches
        .slice(0, MAX_SUGGESTIONS)
        .map((rs) => rs.query)
    }

    const normalizedPartial = partialQuery.toLowerCase()

    // Filtrer les recherches qui correspondent partiellement
    const matchingSearches = recentSearches
      .filter((rs) => rs.query.includes(normalizedPartial))
      .sort((a, b) => {
        // Prioriser les recherches plus récentes et avec plus de résultats
        const aScore = new Date(a.timestamp).getTime() + (a.resultsCount * 1000)
        const bScore = new Date(b.timestamp).getTime() + (b.resultsCount * 1000)
        return bScore - aScore
      })
      .slice(0, MAX_SUGGESTIONS)
      .map((rs) => rs.query)

    return matchingSearches
  }, [recentSearches])

  // Obtenir les catégories préférées
  const getPreferredCategories = useCallback((): string[] => {
    return searchPreferences
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((sp) => sp.category)
  }, [searchPreferences])

  // Effacer les recherches récentes
  const clearRecentSearches = useCallback(() => {
    updateSignals(userId, (signals) => {
      signals.requests.recentSearches = []
      signals.requests.lastSearchQuery = ''
      return signals
    })

    const signals = loadUserSignals(userId)
    if (signals) {
      setRecentSearches(signals.requests.recentSearches)
      setLastSearchQuery(signals.requests.lastSearchQuery)
    }
  }, [userId])

  // Calculer les tendances de recherche
  const searchTrends = useCallback(() => {
    const queryFrequency: { [key: string]: number } = {}

    recentSearches.forEach((rs) => {
      queryFrequency[rs.query] = (queryFrequency[rs.query] || 0) + 1
    })

    return Object.entries(queryFrequency)
      .map(([query, frequency]) => ({ query, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }, [recentSearches])()

  // Vérifier si une requête est fréquente
  const isQueryFrequent = useCallback((query: string): boolean => {
    const normalizedQuery = query.toLowerCase()
    const frequency = recentSearches.filter((rs) => rs.query === normalizedQuery).length
    return frequency >= 3
  }, [recentSearches])

  return {
    recentSearches,
    searchPreferences,
    lastSearchQuery,
    trackSearch,
    trackSearchResultClick,
    getSearchSuggestions,
    getPreferredCategories,
    clearRecentSearches,
    searchTrends,
    isQueryFrequent
  }
}
