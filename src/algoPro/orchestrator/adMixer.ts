// AlgoPro Ad Targeter & Impression Engine
// Injecte intelligemment les publicités selon l'objectif de vues (targetViews)
// et les signaux de préférences utilisateur

import { getStoredAds, saveStoredAds, type Ad } from '../../pages/PUB/AdBanner'

export interface AdTargetingResult {
  selectedAd: Ad | null
  remainingViewsNeeded: number
  isGoalReached: boolean
}

/**
 * Sélectionne la publicité prioritaire selon l'objectif de vues et les préférences utilisateur
 */
export function selectAlgoProAd(
  userCategories: { category: string; score: number }[] = []
): AdTargetingResult {
  const ads = getStoredAds()
  const activeAds = ads.filter(a => a.status === 'active' && a.impressions < a.targetViews)

  if (activeAds.length === 0) {
    return { selectedAd: null, remainingViewsNeeded: 0, isGoalReached: true }
  }

  // Scorer chaque annonce en fonction de l'avancement de l'objectif de vues et des préférences
  const scoredAds = activeAds.map(ad => {
    const viewsRemaining = Math.max(0, ad.targetViews - ad.impressions)
    const progressRatio = ad.impressions / (ad.targetViews || 1)
    
    // Priorité aux annonces loin de leur objectif (progressRatio faible)
    let urgencyScore = (1 - progressRatio) * 100

    // Bonus de catégorie selon les préférences utilisateur
    const pref = userCategories.find(c => c.category.toLowerCase() === ad.category.toLowerCase())
    const categoryBonus = pref ? pref.score * 0.5 : 0

    return {
      ad,
      score: urgencyScore + categoryBonus,
      viewsRemaining
    }
  })

  // Trier par score décroissant
  scoredAds.sort((a, b) => b.score - a.score)
  const topMatch = scoredAds[0]

  return {
    selectedAd: topMatch.ad,
    remainingViewsNeeded: topMatch.viewsRemaining,
    isGoalReached: false
  }
}

/**
 * Enregistre une vue réelle pour la publicité et met à jour AlgoPro
 */
export function registerAlgoProAdImpression(adId: string): void {
  const ads = getStoredAds()
  let goalReached = false

  const updatedAds = ads.map(ad => {
    if (ad.id === adId) {
      const nextImpressions = ad.impressions + 1
      const isCompleted = nextImpressions >= ad.targetViews
      if (isCompleted) goalReached = true

      return {
        ...ad,
        impressions: nextImpressions,
        status: isCompleted ? ('ended' as const) : ad.status
      }
    }
    return ad
  })

  saveStoredAds(updatedAds)

  if (goalReached) {
    window.dispatchEvent(new CustomEvent('exile_toast', { detail: '🎯 Objectif de vues atteint pour une campagne PUB !' }))
  }
}
