// Logique de mixage dynamique pour le feed vidéos/lives
// Gère l'injection intelligente des lives selon les signaux utilisateur
import type { FeedItem, FeedMixConfig, LiveInjectionRule } from '../types/signals'

export interface MixedFeedResult {
  feed: FeedItem[]
  stats: {
    totalVideos: number
    totalLives: number
    liveInjectionCount: number
    averageVideosBetweenLives: number
  }
}

// Configuration par défaut du mix
export const DEFAULT_FEED_CONFIG: FeedMixConfig = {
  topFeedRatio: 0.5,
  discoveryRatio: 0.3,
  diversityRatio: 0.2,
  liveInjectionPattern: 'dynamic',
  liveFrequency: 5
}

// Règles d'injection des lives par défaut
export const DEFAULT_LIVE_RULES: LiveInjectionRule = {
  minVideosBetweenLives: 3,
  maxVideosBetweenLives: 7,
  priorityLives: [],
  hotContentThreshold: 100
}

/**
 * Mixe dynamiquement vidéos et lives selon les signaux utilisateur
 */
export const mixFeedWithLives = (
  videos: FeedItem[],
  lives: FeedItem[],
  liveEngagementRate: number,
  config: FeedMixConfig = DEFAULT_FEED_CONFIG,
  customRules?: Partial<LiveInjectionRule>
): MixedFeedResult => {
  if (lives.length === 0) {
    return {
      feed: videos,
      stats: {
        totalVideos: videos.length,
        totalLives: 0,
        liveInjectionCount: 0,
        averageVideosBetweenLives: 0
      }
    }
  }

  const rules = { ...DEFAULT_LIVE_RULES, ...customRules }
  const mixedFeed: FeedItem[] = []
  let videoIndex = 0
  let liveIndex = 0
  let liveInjectionCount = 0
  const videoPositions: number[] = []

  // Déterminer la fréquence d'injection selon le pattern
  let injectionFrequency: number
  switch (config.liveInjectionPattern) {
    case 'fixed':
      injectionFrequency = config.liveFrequency
      break
    case 'dynamic':
      injectionFrequency = calculateDynamicFrequency(liveEngagementRate, rules)
      break
    case 'hot_content':
      injectionFrequency = calculateHotContentFrequency(lives, rules)
      break
    default:
      injectionFrequency = 5
  }

  // Premier live après 2-3 vidéos pour accroche rapide
  const firstLivePosition = Math.min(3, injectionFrequency)

  // Mixer le feed
  while (videoIndex < videos.length || liveIndex < lives.length) {
    // Injecter le premier live tôt pour accroche
    if (liveInjectionCount === 0 && videoIndex >= firstLivePosition && liveIndex < lives.length) {
      mixedFeed.push(lives[liveIndex])
      videoPositions.push(videoIndex)
      liveIndex++
      liveInjectionCount++
      continue
    }

    // Injecter les lives prioritaires
    if (rules.priorityLives.length > 0 && liveIndex < lives.length) {
      const currentLive = lives[liveIndex]
      if (rules.priorityLives.includes(currentLive.id)) {
        mixedFeed.push(currentLive)
        videoPositions.push(videoIndex)
        liveIndex++
        liveInjectionCount++
        continue
      }
    }

    // Injection régulière selon la fréquence
    if (videoIndex > 0 && videoIndex % injectionFrequency === 0 && liveIndex < lives.length) {
      // Vérifier si on respecte les limites min/max
      const videosSinceLastLive = videoIndex - (videoPositions[videoPositions.length - 1] || 0)
      
      if (videosSinceLastLive >= rules.minVideosBetweenLives && 
          videosSinceLastLive <= rules.maxVideosBetweenLives) {
        mixedFeed.push(lives[liveIndex])
        videoPositions.push(videoIndex)
        liveIndex++
        liveInjectionCount++
        videoIndex++
        continue
      }
    }

    // Ajouter une vidéo
    if (videoIndex < videos.length) {
      mixedFeed.push(videos[videoIndex])
      videoIndex++
    } else {
      // Plus de vidéos, ajouter les lives restants
      if (liveIndex < lives.length) {
        mixedFeed.push(lives[liveIndex])
        liveIndex++
        liveInjectionCount++
      }
    }
  }

  // Calculer les statistiques
  const stats = {
    totalVideos: mixedFeed.filter(item => item.type === 'video').length,
    totalLives: mixedFeed.filter(item => item.type === 'live').length,
    liveInjectionCount,
    averageVideosBetweenLives: videoPositions.length > 1 
      ? videoPositions.reduce((sum, pos, i, arr) => {
          if (i === 0) return 0
          return sum + (pos - arr[i - 1])
        }, 0) / (videoPositions.length - 1)
      : 0
  }

  return { feed: mixedFeed, stats }
}

/**
 * Calcule la fréquence d'injection dynamique selon l'engagement
 */
const calculateDynamicFrequency = (
  liveEngagementRate: number,
  rules: LiveInjectionRule
): number => {
  // Plus l'engagement est élevé, plus on injecte fréquemment
  if (liveEngagementRate > 0.7) {
    return rules.minVideosBetweenLives
  } else if (liveEngagementRate > 0.5) {
    return Math.floor((rules.minVideosBetweenLives + rules.maxVideosBetweenLives) / 2)
  } else if (liveEngagementRate > 0.3) {
    return rules.maxVideosBetweenLives
  } else {
    return rules.maxVideosBetweenLives + 2
  }
}

/**
 * Calcule la fréquence selon le contenu hot (trending)
 */
const calculateHotContentFrequency = (
  lives: FeedItem[],
  rules: LiveInjectionRule
): number => {
  // Compter les lives hot (beaucoup de viewers)
  const hotLives = lives.filter(live => {
    const viewers = live.content?.viewerCount || 0
    return viewers >= rules.hotContentThreshold
  })

  // Si beaucoup de lives hot, injecter plus fréquemment
  if (hotLives.length >= 3) {
    return rules.minVideosBetweenLives
  } else if (hotLives.length >= 1) {
    return Math.floor((rules.minVideosBetweenLives + rules.maxVideosBetweenLives) / 2)
  } else {
    return rules.maxVideosBetweenLives
  }
}

/**
 * Crée un feed mixé selon les ratios Top/Discovery/Diversity
 */
export const createMixedFeed = (
  topFeedItems: FeedItem[],
  discoveryItems: FeedItem[],
  diversityItems: FeedItem[],
  config: FeedMixConfig = DEFAULT_FEED_CONFIG
): FeedItem[] => {
  const totalItems = topFeedItems.length + discoveryItems.length + diversityItems.length
  const mixedFeed: FeedItem[] = []

  const topCount = Math.floor(totalItems * config.topFeedRatio)
  const discoveryCount = Math.floor(totalItems * config.discoveryRatio)
  const diversityCount = totalItems - topCount - discoveryCount

  // Mélanger les sources
  const shuffledTop = shuffleArray([...topFeedItems]).slice(0, topCount)
  const shuffledDiscovery = shuffleArray([...discoveryItems]).slice(0, discoveryCount)
  const shuffledDiversity = shuffleArray([...diversityItems]).slice(0, diversityCount)

  // Intercaler les items
  const maxLength = Math.max(shuffledTop.length, shuffledDiscovery.length, shuffledDiversity.length)
  
  for (let i = 0; i < maxLength; i++) {
    if (i < shuffledTop.length) mixedFeed.push(shuffledTop[i])
    if (i < shuffledDiscovery.length) mixedFeed.push(shuffledDiscovery[i])
    if (i < shuffledDiversity.length) mixedFeed.push(shuffledDiversity[i])
  }

  return mixedFeed
}

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Ajuste le mix selon l'heure de la journée
 */
export const adjustMixByTimeOfDay = (
  feed: FeedItem[],
  currentHour: number,
  peakEngagementHour: number | null
): FeedItem[] => {
  if (!peakEngagementHour) return feed

  // Si on est proche de l'heure de pointe, prioriser le contenu engagement
  const hourDiff = Math.abs(currentHour - peakEngagementHour)
  const isPeakHour = hourDiff <= 2

  if (isPeakHour) {
    // Pendant l'heure de pointe, mettre le contenu le plus engageant en premier
    return feed.sort((a, b) => b.score - a.score)
  }

  return feed
}

/**
 * Filtre le feed selon les préférences de catégorie
 */
export const filterFeedByCategoryPreferences = (
  feed: FeedItem[],
  preferredCategories: string[],
  maxOtherContent: number = 0.3
): FeedItem[] => {
  if (preferredCategories.length === 0) return feed

  const preferred = feed.filter(item => 
    preferredCategories.includes(item.content?.category || '')
  )
  const other = feed.filter(item => 
    !preferredCategories.includes(item.content?.category || '')
  )

  const maxOtherCount = Math.floor(feed.length * maxOtherContent)
  const filteredOther = other.slice(0, maxOtherCount)

  return [...preferred, ...filteredOther]
}
