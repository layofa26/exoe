// Types pour les signaux algorithmiques côté client
// Capture les comportements utilisateurs pour personnaliser le feed

export interface UserSignals {
  userId: string
  lastUpdated: string
  events: EventSignals
  subscriptions: SubscriptionSignals
  requests: RequestSignals
  profile: ProfileSignals
  accueil: AccueilSignals
}

// Signaux pour les événements
export interface EventSignals {
  viewedEvents: ViewedEvent[]
  totalTimeSpent: number // en secondes
  categoryPreferences: CategoryPreference[]
  sqlInterestScore: number // score d'intérêt pour SQL (0-100)
}

export interface ViewedEvent {
  eventId: string
  eventTitle: string
  category: string
  timeSpent: number // en secondes
  viewedAt: string
  readDescription: boolean
  registered: boolean
}

export interface CategoryPreference {
  category: string
  score: number // 0-100
  lastUpdated: string
}

// Signaux pour les abonnements
export interface SubscriptionSignals {
  visitedProfiles: VisitedProfile[]
  subscribedCreators: string[]
  priorityCreators: string[] // créateurs à prioriser même si non abonnés
  lastProfileVisit: string
}

export interface VisitedProfile {
  creatorId: string
  creatorName: string
  profession: string
  visitedAt: string
  timeSpent: number
  visitCount: number
}

// Signaux pour les demandes
export interface RequestSignals {
  recentSearches: RecentSearch[]
  searchPreferences: SearchPreference[]
  lastSearchQuery: string
  lastSearchTime: string
}

export interface RecentSearch {
  query: string
  category?: string
  timestamp: string
  resultsCount: number
  clickedResult?: string
}

export interface SearchPreference {
  category: string
  frequency: number
  lastUsed: string
}

// Signaux pour le profil
export interface ProfileSignals {
  userType: 'debutant' | 'intermediaire' | 'expert' | 'instructeur'
  uiPreferences: UIPreferences
  activityLevel: 'low' | 'medium' | 'high'
  lastProfileUpdate: string
}

export interface UIPreferences {
  hideDebutantOptions: boolean
  showAdvancedFeatures: boolean
  preferredViewMode: 'grid' | 'list'
  showTutorials: boolean
}

// Signaux pour l'accueil (feed)
export interface AccueilSignals {
  videoClicks: VideoClick[]
  liveClicks: LiveClick[]
  categoryEngagement: CategoryEngagement[]
  liveEngagementRate: number // 0-1
  videoEngagementRate: number // 0-1
  preferredContentTypes: ContentType[]
  timeOfDayPatterns: TimeOfDayPattern[]
}

export interface VideoClick {
  videoId: string
  category: string
  creatorId: string
  clickedAt: string
  watchDuration: number
  completed: boolean
  liked: boolean
}

export interface LiveClick {
  liveId: string
  creatorId: string
  category: string
  clickedAt: string
  watchDuration: number
  joinedChat: boolean
}

export interface CategoryEngagement {
  category: string
  totalClicks: number
  avgWatchDuration: number
  completionRate: number
  lastEngaged: string
}

export type ContentType = 'video' | 'live' | 'event' | 'post'

export interface TimeOfDayPattern {
  hour: number // 0-23
  preferredContentType: ContentType
  engagementScore: number
}

// Types pour le feed mixé
export interface FeedItem {
  id: string
  type: ContentType
  content: any
  score: number
  source: 'top_feed' | 'discovery' | 'diversity'
  metadata: FeedMetadata
}

export interface FeedMetadata {
  algorithm: string
  confidence: number
  reason: string
  timestamp: string
}

export interface FeedMixConfig {
  topFeedRatio: number // 0-1
  discoveryRatio: number // 0-1
  diversityRatio: number // 0-1
  liveInjectionPattern: 'fixed' | 'dynamic' | 'hot_content'
  liveFrequency: number // nombre de vidéos entre chaque live
}

export interface LiveInjectionRule {
  minVideosBetweenLives: number
  maxVideosBetweenLives: number
  priorityLives: string[] // lives à prioriser
  hotContentThreshold: number // viewers threshold
}
