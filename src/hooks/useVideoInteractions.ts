import { useState, useEffect, useCallback, useRef } from 'react'
import { videoApi, type VideoInteractionState } from '../services/videoApi'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'

export interface UseVideoInteractionsOptions {
  videoId: string | number
  authorId?: string | number
  initialLikes?: number
  initialDislikes?: number
  initialViews?: number
  initialIsLiked?: boolean
  initialIsDisliked?: boolean
  initialIsFavorite?: boolean
  initialIsSubscribed?: boolean
  initialSubscribersCount?: number
}

export interface VideoInteractionsReturn {
  likesCount: number
  dislikesCount: number
  viewsCount: number
  subscribersCount: number
  isLiked: boolean
  isDisliked: boolean
  isFavorite: boolean
  isSubscribed: boolean
  isPending: boolean
  handleLike: () => Promise<void>
  handleDislike: () => Promise<void>
  handleFavorite: () => Promise<void>
  handleToggleSubscribe: () => Promise<void>
  recordView: () => Promise<void>
  refreshInteractions: () => Promise<void>
}

/**
 * useVideoInteractions
 * Hook centralisé unique pour toutes les interactions vidéo (Like, Dislike, Favoris, Abonnement, Vues).
 * - Empêche les clics multiples et les requêtes concurrentes via un verrou `isPending`
 * - Synchronise l'état avec la réponse officielle du Backend Django (autorité finale)
 * - Propage les changements en temps réel à travers toute l'application via `exile_video_interaction_updated`
 */
export const useVideoInteractions = ({
  videoId,
  authorId,
  initialLikes = 0,
  initialDislikes = 0,
  initialViews = 0,
  initialIsLiked = false,
  initialIsDisliked = false,
  initialIsFavorite = false,
  initialIsSubscribed = false,
  initialSubscribersCount = 0
}: UseVideoInteractionsOptions): VideoInteractionsReturn => {
  const { isAuthenticated } = useAuth()
  const { showSuccess, showError } = useNotifications()

  const [likesCount, setLikesCount] = useState<number>(initialLikes)
  const [dislikesCount, setDislikesCount] = useState<number>(initialDislikes)
  const [viewsCount, setViewsCount] = useState<number>(initialViews)
  const [subscribersCount, setSubscribersCount] = useState<number>(initialSubscribersCount)
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked)
  const [isDisliked, setIsDisliked] = useState<boolean>(initialIsDisliked)
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(initialIsSubscribed)
  const [isPending, setIsPending] = useState<boolean>(false)

  const viewCountedRef = useRef<boolean>(false)
  const isPendingRef = useRef<boolean>(false)

  const videoIdNum = Number(videoId)

  // Écouter les mises à jour synchronisées depuis d'autres composants
  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{
        videoId: string | number
        likes_count?: number
        dislikes_count?: number
        views_count?: number
        is_liked?: boolean
        is_disliked?: boolean
        is_favorite?: boolean
        is_subscribed?: boolean
        subscribers_count?: number
      }>

      if (custom.detail && String(custom.detail.videoId) === String(videoId)) {
        if (custom.detail.likes_count !== undefined) setLikesCount(custom.detail.likes_count)
        if (custom.detail.dislikes_count !== undefined) setDislikesCount(custom.detail.dislikes_count)
        if (custom.detail.views_count !== undefined) setViewsCount(custom.detail.views_count)
        if (custom.detail.is_liked !== undefined) setIsLiked(custom.detail.is_liked)
        if (custom.detail.is_disliked !== undefined) setIsDisliked(custom.detail.is_disliked)
        if (custom.detail.is_favorite !== undefined) setIsFavorite(custom.detail.is_favorite)
        if (custom.detail.is_subscribed !== undefined) setIsSubscribed(custom.detail.is_subscribed)
        if (custom.detail.subscribers_count !== undefined) setSubscribersCount(custom.detail.subscribers_count)
      }
    }

    window.addEventListener('exile_video_interaction_updated', handleSync)
    return () => window.removeEventListener('exile_video_interaction_updated', handleSync)
  }, [videoId])

  // Helper pour diffuser la mise à jour officielle
  const broadcastUpdate = useCallback((state: Partial<VideoInteractionState> & { is_subscribed?: boolean; subscribers_count?: number }) => {
    window.dispatchEvent(
      new CustomEvent('exile_video_interaction_updated', {
        detail: {
          videoId,
          ...state,
        }
      })
    )
  }, [videoId])

  // 1. LIKE ATOMIQUE
  const handleLike = useCallback(async () => {
    if (isPendingRef.current) return
    if (!isAuthenticated) {
      showError('Veuillez vous connecter pour aimer cette vidéo')
      return
    }

    isPendingRef.current = true
    setIsPending(true)

    try {
      const res = await videoApi.likeVideo(videoIdNum)
      if (res.success && res.data) {
        setLikesCount(res.data.likes_count)
        setDislikesCount(res.data.dislikes_count)
        setIsLiked(res.data.is_liked)
        setIsDisliked(res.data.is_disliked)
        broadcastUpdate(res.data)
      } else if (res.error) {
        showError(res.error)
      }
    } catch {
      showError('Erreur de connexion')
    } finally {
      isPendingRef.current = false
      setIsPending(false)
    }
  }, [isAuthenticated, videoIdNum, broadcastUpdate, showError])

  // 2. DISLIKE ATOMIQUE
  const handleDislike = useCallback(async () => {
    if (isPendingRef.current) return
    if (!isAuthenticated) {
      showError('Veuillez vous connecter pour interagir')
      return
    }

    isPendingRef.current = true
    setIsPending(true)

    try {
      const res = await videoApi.dislikeVideo(videoIdNum)
      if (res.success && res.data) {
        setLikesCount(res.data.likes_count)
        setDislikesCount(res.data.dislikes_count)
        setIsLiked(res.data.is_liked)
        setIsDisliked(res.data.is_disliked)
        broadcastUpdate(res.data)
      } else if (res.error) {
        showError(res.error)
      }
    } catch {
      showError('Erreur de connexion')
    } finally {
      isPendingRef.current = false
      setIsPending(false)
    }
  }, [isAuthenticated, videoIdNum, broadcastUpdate, showError])

  // 3. FAVORIS ATOMIQUE
  const handleFavorite = useCallback(async () => {
    if (isPendingRef.current) return
    if (!isAuthenticated) {
      showError('Veuillez vous connecter pour enregistrer dans vos favoris')
      return
    }

    isPendingRef.current = true
    setIsPending(true)

    try {
      const res = await videoApi.favoriteVideo(videoIdNum)
      if (res.success && res.data) {
        setIsFavorite(res.data.is_favorite)
        showSuccess(res.data.is_favorite ? 'Enregistré dans vos favoris 🔖' : 'Retiré des favoris')
        broadcastUpdate({ is_favorite: res.data.is_favorite })
      } else if (res.error) {
        showError(res.error)
      }
    } catch {
      showError('Erreur de connexion')
    } finally {
      isPendingRef.current = false
      setIsPending(false)
    }
  }, [isAuthenticated, videoIdNum, broadcastUpdate, showSuccess, showError])

  // 4. ABONNEMENT ATOMIQUE
  const handleToggleSubscribe = useCallback(async () => {
    if (isPendingRef.current) return
    if (!authorId) return
    if (!isAuthenticated) {
      showError('Veuillez vous connecter pour vous abonner')
      return
    }

    isPendingRef.current = true
    setIsPending(true)

    try {
      const res = await videoApi.toggleSubscription(authorId)
      if (res.success && res.data) {
        setIsSubscribed(res.data.is_subscribed)
        setSubscribersCount(res.data.subscribers_count)
        showSuccess(res.data.is_subscribed ? 'Abonnement confirmé 🔔' : 'Désabonné')
        broadcastUpdate({
          is_subscribed: res.data.is_subscribed,
          subscribers_count: res.data.subscribers_count
        })
      } else if (res.error) {
        showError(res.error)
      }
    } catch {
      showError('Erreur de connexion')
    } finally {
      isPendingRef.current = false
      setIsPending(false)
    }
  }, [isAuthenticated, authorId, broadcastUpdate, showSuccess, showError])

  // 5. VUE PROTÉGÉE CONTRE LES DOUBLONS
  const recordView = useCallback(async () => {
    if (viewCountedRef.current || !videoIdNum || Number.isNaN(videoIdNum)) return
    viewCountedRef.current = true

    try {
      const res = await videoApi.incrementView(videoIdNum)
      if (res.success && typeof res.views === 'number') {
        setViewsCount(res.views)
        broadcastUpdate({ views_count: res.views })
      }
    } catch {}
  }, [videoIdNum, broadcastUpdate])

  // 6. RAFRAÎCHISSEMENT DE L'ÉTAT OFFICIEL
  const refreshInteractions = useCallback(async () => {
    if (!videoIdNum || Number.isNaN(videoIdNum)) return
    try {
      const res = await videoApi.getVideoInteractions(videoIdNum)
      if (res.success && res.data) {
        setLikesCount(res.data.likes_count)
        setDislikesCount(res.data.dislikes_count)
        setViewsCount(res.data.views_count)
        setIsLiked(res.data.is_liked)
        setIsDisliked(res.data.is_disliked)
        setIsFavorite(res.data.is_favorite)
        if (res.data.is_subscribed !== undefined) setIsSubscribed(res.data.is_subscribed)
        if (res.data.subscribers_count !== undefined) setSubscribersCount(res.data.subscribers_count)
      }
    } catch {}
  }, [videoIdNum])

  return {
    likesCount,
    dislikesCount,
    viewsCount,
    subscribersCount,
    isLiked,
    isDisliked,
    isFavorite,
    isSubscribed,
    isPending,
    handleLike,
    handleDislike,
    handleFavorite,
    handleToggleSubscribe,
    recordView,
    refreshInteractions,
  }
}
