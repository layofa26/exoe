// Orchestrateur central qui combine tous les signaux algorithmiques
// Prend les données des Logic Hooks et utilise les feed mixers pour créer le feed final
import type { Video } from '../../types/video'
import type { FeedItem, FeedMixConfig, ContentType } from '../types/signals'
import {
  mixFeedWithLives,
  createMixedFeed,
  adjustMixByTimeOfDay,
  filterFeedByCategoryPreferences,
  DEFAULT_FEED_CONFIG
} from './feedMixers'

export interface TigerFeedOrchestratorConfig {
  userId: string
  // Signaux des Logic Hooks
  signals: {
    // useSubsAlgo
    subscribedCreators: string[]
    priorityCreators: string[]
    shouldPrioritizeCreator: (creatorId: string) => boolean
    
    // useAccueilAlgo
    liveEngagementRate: number
    videoEngagementRate: number
    preferredContentTypes: ContentType[]
    mostEngagedCategory: string | null
    peakEngagementHour: number | null
    shouldShowLive: (availableLives: number) => boolean
    getOptimalLiveFrequency: () => number
    
    // useEventsAlgo
    categoryPreferences: { category: string; score: number }[]
    
    // useRequestsAlgo
    preferredCategories: string[]
  }
  
  // Configuration du mix
  feedConfig?: FeedMixConfig
}

export interface OrchestratedFeedResult {
  feed: FeedItem[]
  metadata: {
    totalItems: number
    videosCount: number
    livesCount: number
    eventsCount: number
    topFeedCount: number
    discoveryCount: number
    diversityCount: number
    liveInjectionStats: {
      injectedCount: number
      averageVideosBetweenLives: number
    }
  }
  appliedRules: string[]
}

/**
 * Orchestrateur principal qui crée le feed personnalisé
 */
export class TigerFeedOrchestrator {
  private config: TigerFeedOrchestratorConfig
  private appliedRules: string[] = []

  constructor(config: TigerFeedOrchestratorConfig) {
    this.config = config
  }

  /**
   * Crée le feed orchestré complet
   */
  orchestrateFeed(
    allVideos: Video[],
    allLives: any[],
    allEvents: any[]
  ): OrchestratedFeedResult {
    this.appliedRules = []

    // Étape 1: Séparer et scorer les contenus selon les sources
    const { topFeed, discovery, diversity } = this.separateAndScoreContent(
      allVideos,
      allLives,
      allEvents
    )

    // Étape 2: Créer le mix initial Top/Discovery/Diversity
    const mixedFeed = createMixedFeed(
      topFeed,
      discovery,
      diversity,
      this.config.feedConfig || DEFAULT_FEED_CONFIG
    )

    // Étape 3: Séparer vidéos et lives pour l'injection dynamique
    const videos = mixedFeed.filter(item => item.type === 'video')
    const lives = mixedFeed.filter(item => item.type === 'live')

    // Étape 4: Injecter les lives dynamiquement
    const liveInjectionResult = mixFeedWithLives(
      videos,
      lives,
      this.config.signals.liveEngagementRate,
      this.config.feedConfig || DEFAULT_FEED_CONFIG,
      {
        priorityLives: this.config.signals.priorityCreators,
        minVideosBetweenLives: this.config.signals.getOptimalLiveFrequency() - 1,
        maxVideosBetweenLives: this.config.signals.getOptimalLiveFrequency() + 1
      }
    )

    this.appliedRules.push('dynamic_live_injection')

    // Étape 5: Ajuster selon l'heure de la journée
    const currentHour = new Date().getHours()
    const timeAdjustedFeed = adjustMixByTimeOfDay(
      liveInjectionResult.feed,
      currentHour,
      this.config.signals.peakEngagementHour
    )

    if (this.config.signals.peakEngagementHour !== null) {
      this.appliedRules.push('time_of_day_adjustment')
    }

    // Étape 6: Filtrer selon les préférences de catégorie
    const categoryFilteredFeed = filterFeedByCategoryPreferences(
      timeAdjustedFeed,
      this.config.signals.preferredCategories,
      0.3
    )

    if (this.config.signals.preferredCategories.length > 0) {
      this.appliedRules.push('category_preference_filter')
    }

    // Étape 7: Calculer les métadonnées
    const metadata = this.calculateMetadata(
      categoryFilteredFeed,
      liveInjectionResult.stats,
      topFeed.length,
      discovery.length,
      diversity.length
    )

    return {
      feed: categoryFilteredFeed,
      metadata,
      appliedRules: this.appliedRules
    }
  }

  /**
   * Sépare et score les contenus selon les sources (Top/Discovery/Diversity)
   */
  private separateAndScoreContent(
    allVideos: Video[],
    allLives: any[],
    allEvents: any[]
  ): {
    topFeed: FeedItem[]
    discovery: FeedItem[]
    diversity: FeedItem[]
  } {
    const topFeed: FeedItem[] = []
    const discovery: FeedItem[] = []
    const diversity: FeedItem[] = []

    // Traiter les vidéos
    allVideos.forEach(video => {
      const feedItem = this.createFeedItem('video', video)
      const score = this.calculateVideoScore(video)

      if (this.isTopFeedContent(video)) {
        feedItem.score = score * 1.5
        feedItem.source = 'top_feed'
        topFeed.push(feedItem)
      } else if (this.isDiscoveryContent(video)) {
        feedItem.score = score
        feedItem.source = 'discovery'
        discovery.push(feedItem)
      } else {
        feedItem.score = score * 0.8
        feedItem.source = 'diversity'
        diversity.push(feedItem)
      }
    })

    // Traiter les lives
    allLives.forEach(live => {
      const feedItem = this.createFeedItem('live', live)
      const score = this.calculateLiveScore(live)

      if (this.isTopFeedContent(live)) {
        feedItem.score = score * 1.5
        feedItem.source = 'top_feed'
        topFeed.push(feedItem)
      } else if (this.isDiscoveryContent(live)) {
        feedItem.score = score
        feedItem.source = 'discovery'
        discovery.push(feedItem)
      } else {
        feedItem.score = score * 0.8
        feedItem.source = 'diversity'
        diversity.push(feedItem)
      }
    })

    // Traiter les événements
    allEvents.forEach(event => {
      const feedItem = this.createFeedItem('event', event)
      const score = this.calculateEventScore(event)

      if (this.isDiscoveryContent(event)) {
        feedItem.score = score
        feedItem.source = 'discovery'
        discovery.push(feedItem)
      } else {
        feedItem.score = score * 0.8
        feedItem.source = 'diversity'
        diversity.push(feedItem)
      }
    })

    return { topFeed, discovery, diversity }
  }

  /**
   * Crée un FeedItem à partir d'un contenu
   */
  private createFeedItem(type: ContentType, content: any): FeedItem {
    return {
      id: content.id,
      type,
      content,
      score: 0,
      source: 'discovery',
      metadata: {
        algorithm: 'tiger_feed',
        confidence: 0.5,
        reason: 'initial_score',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Calcule le score d'une vidéo
   */
  private calculateVideoScore(video: Video): number {
    let score = 50

    // Score de base selon les vues
    score += Math.min(50, (video.views ?? 0) / 100)

    // Score selon les likes
    score += Math.min(30, (video.likes ?? 0) / 10)

    // Score selon la catégorie préférée
    if (this.config.signals.mostEngagedCategory === video.category) {
      score += 20
    }

    // Score selon les préférences de catégorie
    const categoryPref = this.config.signals.categoryPreferences.find(
      cp => cp.category === video.category
    )
    if (categoryPref) {
      score += categoryPref.score / 5
    }

    // Score selon le créateur (abonné ou prioritaire)
    if (this.config.signals.shouldPrioritizeCreator(video.author.id)) {
      score += 25
    }

    return Math.min(100, score)
  }

  /**
   * Calcule le score d'un live
   */
  private calculateLiveScore(live: any): number {
    let score = 50

    // Score selon les viewers
    const viewerCount = live.viewerCount || 0
    score += Math.min(40, viewerCount / 50)

    // Score selon l'engagement utilisateur pour les lives
    if (this.config.signals.liveEngagementRate > 0.5) {
      score += 20
    }

    // Score selon le créateur
    if (this.config.signals.shouldPrioritizeCreator(live.creatorId)) {
      score += 25
    }

    return Math.min(100, score)
  }

  /**
   * Calcule le score d'un événement
   */
  private calculateEventScore(event: any): number {
    let score = 50

    // Score selon les inscriptions
    const registrations = event.stats?.registrations || 0
    score += Math.min(30, registrations / 5)

    // Score selon la catégorie préférée
    if (this.config.signals.mostEngagedCategory === event.category) {
      score += 20
    }

    return Math.min(100, score)
  }

  /**
   * Détermine si le contenu est Top Feed (abonnés, prioritaires)
   */
  private isTopFeedContent(content: any): boolean {
    const creatorId = content.author?.id || content.creatorId
    return this.config.signals.subscribedCreators.includes(creatorId) ||
           this.config.signals.priorityCreators.includes(creatorId)
  }

  /**
   * Détermine si le contenu est Discovery (nouveau, recommandé)
   */
  private isDiscoveryContent(content: any): boolean {
    // Contenu avec un bon score mais pas abonné
    return !this.isTopFeedContent(content) && 
           (content.views > 100 || content.viewerCount > 50)
  }

  /**
   * Calcule les métadonnées du feed
   */
  private calculateMetadata(
    feed: FeedItem[],
    liveStats: any,
    topFeedCount: number,
    discoveryCount: number,
    diversityCount: number
  ) {
    return {
      totalItems: feed.length,
      videosCount: feed.filter(item => item.type === 'video').length,
      livesCount: feed.filter(item => item.type === 'live').length,
      eventsCount: feed.filter(item => item.type === 'event').length,
      topFeedCount,
      discoveryCount,
      diversityCount,
      liveInjectionStats: {
        injectedCount: liveStats.liveInjectionCount,
        averageVideosBetweenLives: liveStats.averageVideosBetweenLives
      }
    }
  }
}

/**
 * Hook React pour utiliser l'orchestrateur
 */
export const useTigerFeedOrchestrator = (config: TigerFeedOrchestratorConfig) => {
  const orchestrator = new TigerFeedOrchestrator(config)

  return {
    orchestrateFeed: (videos: Video[], lives: any[], events: any[]) =>
      orchestrator.orchestrateFeed(videos, lives, events)
  }
}
