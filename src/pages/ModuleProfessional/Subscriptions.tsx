import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users, Play, Heart, Bell, BellOff, Search, ArrowLeft,
  Share2, Bookmark, X, Sparkles, Filter, Crown, Check, Loader2, UserPlus
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { AbonnementListSchema } from '../../schemas/apiSchemas'
import { useQuery } from '../../hooks/useQuery'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Types
interface SubscribedProfessional {
  id: string
  name: string
  username?: string
  avatar: string | null
  profession: string
  specialty: string
  subscribedAt: string
  subscribersCount?: number
  notificationsEnabled?: boolean
  isVip?: boolean
  vipTier?: string
}

interface SuggestedProfessional {
  id: number
  username: string
  name: string
  avatar: string | null
  profession: string
  speciality: string
  subscribers_count: number
  videos_count: number
}

interface VideoFeedItem {
  id: string | number
  title: string
  description?: string
  thumbnail: string
  duration: string | number
  file_url?: string
  author: {
    id: string | number
    name: string
    username?: string
    avatar?: string | null
    profession?: string
  }
  viewsCount: number
  likesCount: number
  isLiked?: boolean
  isFavorite?: boolean
  createdAt: string
}

interface FavoriteVideo {
  id?: string | number
  videoId: string
  title: string
  professionalId: string
  professionalName: string
  professionalAvatar?: string | null
  thumbnailUrl: string
  duration: string | number
  likes?: number
  addedAt: string
}

const CATEGORIES = [
  'Tous',
  'Santé',
  'Droit & Justice',
  'Architecture & Design',
  'Technologie',
  'Finance & Économie',
  'Éducation',
  'Marketing'
]


export const Subscriptions = (): JSX.Element => {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'subscribers' | 'favorites'>('feed')
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Real Stats
  const [stats, setStats] = useState({ following_count: 0, subscribers_count: 0 })

  // Real Subscribers List (ceux qui me suivent)
  const [mySubscribers, setMySubscribers] = useState<any[]>([])
  const [loadingMySubscribers, setLoadingMySubscribers] = useState(false)

  // Suggestions de professionnels
  const [suggestions, setSuggestions] = useState<SuggestedProfessional[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Real Feed Videos
  const [feedVideos, setFeedVideos] = useState<VideoFeedItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  // Real Favorites
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  // 1. CHARGER LES STATS RÉELLES (Abonnements & Abonnés)
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  // 2. CHARGER LES PROFESSIONNELS ABONNÉS (Mes Chaînes)
  const {
    data: cachedSubs,
    setData: setSubscriptions,
    refetch: refetchSubscriptions
  } = useQuery<SubscribedProfessional[]>(
    async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return []

      const result = await api.get('/abonnement/abonnements/', AbonnementListSchema)
      if (result.success && result.data && result.data.results) {
        return result.data.results.map((sub: any) => ({
          id: String(sub.professionnel_id || sub.professionnel),
          name: sub.professionnel_name || sub.professionnel_username || 'Expert',
          username: sub.professionnel_username || '',
          avatar: sub.professionnel_avatar || null,
          profession: sub.professionnel_profession || 'Professionnel',
          specialty: sub.professionnel_speciality || '',
          subscribedAt: sub.created_at,
          subscribersCount: sub.subscribers_count || 0,
          notificationsEnabled: sub.notifications_enabled !== false,
          isVip: Boolean(sub.is_vip),
          vipTier: sub.vip_tier || ''
        }))
      }
      return []
    },
    {
      cacheKey: (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
          return `pro:subscriptions:all:${profile?.id || localStorage.getItem('exile_client_uuid') || 'user'}`
        } catch {
          return 'pro:subscriptions:all:user'
        }
      })(),
      cacheTime: 2 * 60 * 1000,
      initialData: []
    }
  )

  const subscriptions = cachedSubs || []

  // 3. CHARGER LE FIL RÉEL DE VIDÉOS DES ABONNÉS
  const fetchFeedVideos = useCallback(async () => {
    setLoadingFeed(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setFeedVideos([])
        return
      }

      let url = `${API_BASE_URL}/abonnement/feed/tous/?`
      if (selectedCreatorId !== 'all') url += `creator_id=${selectedCreatorId}&`
      if (selectedCategory !== 'Tous') url += `profession=${encodeURIComponent(selectedCategory)}&`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const rawVideos: any[] = data.results || []
        const mapped: VideoFeedItem[] = rawVideos.map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description || '',
          thumbnail: v.cover_url || v.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${('0' + Math.floor(v.duration % 60)).slice(-2)}` : '05:00',
          file_url: v.file_url || v.file,
          author: {
            id: v.owner_id || (typeof v.owner === 'object' ? v.owner?.id : v.owner),
            name: v.owner_full_name || v.owner_username || 'Professionnel',
            username: v.owner_username || '',
            avatar: v.owner_avatar || null,
            profession: v.owner_profession || 'Expert'
          },
          viewsCount: v.views_count || v.views || 0,
          likesCount: v.likes_count || 0,
          isLiked: v.is_liked || false,
          isFavorite: v.is_favorite || false,
          createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Récemment'
        }))
        setFeedVideos(mapped)
      } else {
        setFeedVideos([])
      }
    } catch (err) {
      console.error('Error loading feed videos:', err)
      setFeedVideos([])
    } finally {
      setLoadingFeed(false)
    }
  }, [selectedCreatorId, selectedCategory])

  // 4. CHARGER LES FAVORIS DEPUIS LE BACKEND
  const fetchFavorites = useCallback(async () => {
    setLoadingFavorites(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch(`${API_BASE_URL}/abonnement/favoris/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const rawFavs: any[] = Array.isArray(data) ? data : (data.results || [])
        const mapped: FavoriteVideo[] = rawFavs.map((f: any) => {
          const vd = f.video_details || {}
          return {
            id: f.id,
            videoId: String(f.video || vd.id),
            title: vd.title || 'Vidéo',
            professionalId: String(vd.owner || '1'),
            professionalName: vd.owner_full_name || vd.owner_username || 'Expert',
            professionalAvatar: vd.owner_avatar || null,
            thumbnailUrl: vd.cover_url || vd.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
            duration: vd.duration ? `${Math.floor(vd.duration / 60)}:${('0' + Math.floor(vd.duration % 60)).slice(-2)}` : '05:00',
            likes: vd.likes_count || 0,
            addedAt: f.created_at
          }
        })
        setFavorites(mapped)
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
    } finally {
      setLoadingFavorites(false)
    }
  }, [])

  // 5. CHARGER LES ABONNÉS RÉELS (Ceux qui suivent l'utilisateur)
  const fetchMySubscribers = useCallback(async () => {
    setLoadingMySubscribers(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/subscribers/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMySubscribers(data.results || [])
      }
    } catch (err) {
      console.error('Error loading subscribers:', err)
    } finally {
      setLoadingMySubscribers(false)
    }
  }, [])

  // 6. CHARGER LES SUGGESTIONS DE PROFESSIONNELS
  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/suggestions/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error loading suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Chargement initial
  useEffect(() => {
    fetchStats()
    fetchFeedVideos()
    fetchFavorites()
    fetchSuggestions()
  }, [fetchStats, fetchFeedVideos, fetchFavorites, fetchSuggestions])

  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchMySubscribers()
    }
  }, [activeTab, fetchMySubscribers])

  // ACTIONS 100% RÉELLES

  // Toggle Favoris Backend
  const handleToggleFavorite = async (video: any) => {
    const vId = video.id || video.videoId
    if (!vId) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/favoris/toggle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ video_id: vId })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.is_favorite) {
          showToast('❤️ Ajouté à vos favoris !')
        } else {
          showToast('Retiré des favoris')
        }
        fetchFavorites()
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour des favoris')
    }
  }

  // Toggle Notifications 100% Backend
  const toggleNotifications = async (subId: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setActionLoading(`notif_${subId}`)
    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/toggle_notifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ professionnel_id: subId })
      })

      if (res.ok) {
        const data = await res.json()
        const isEnabled = data.notifications_enabled
        setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, notificationsEnabled: isEnabled } : s))
        showToast(isEnabled ? '🔔 Notifications activées pour ce professionnel' : '🔕 Notifications désactivées')
      }
    } catch (err) {
      showToast('Erreur réseau')
    } finally {
      setActionLoading(null)
    }
  }

  // Toggle VIP / Soutien Pro
  const toggleVip = async (subId: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setActionLoading(`vip_${subId}`)
    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/toggle_vip/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ professionnel_id: subId, vip_tier: 'Supporter VIP' })
      })

      if (res.ok) {
        const data = await res.json()
        setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, isVip: data.is_vip, vipTier: data.vip_tier } : s))
        showToast(data.is_vip ? '⭐ Statut VIP activé !' : 'Statut VIP retiré')
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour VIP')
    } finally {
      setActionLoading(null)
    }
  }

  // Désabonnement 100% Réel dans la Base de Données
  const unsubscribe = async (profId: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setActionLoading(`unsub_${profId}`)
    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/toggle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ professionnel_id: profId })
      })

      if (res.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== profId))
        setUnsubscribeConfirm(null)
        showToast('Désabonné avec succès')
        fetchStats()
        fetchFeedVideos()
        fetchSuggestions()
      } else {
        showToast('Erreur lors du désabonnement')
      }
    } catch (err) {
      showToast('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  // S'abonner directement depuis les suggestions
  const subscribeToSuggested = async (profId: number) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    setActionLoading(`sub_sugg_${profId}`)
    try {
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/toggle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ professionnel_id: profId })
      })

      if (res.ok) {
        showToast('✓ Abonnement réussi !')
        refetchSubscriptions()
        fetchStats()
        fetchFeedVideos()
        fetchSuggestions()
      }
    } catch (err) {
      showToast('Erreur réseau')
    } finally {
      setActionLoading(null)
    }
  }

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/pro/video/${video.id || video.videoId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Découvrez cette vidéo d'expertise sur EXILE`,
          url: shareUrl
        })
        showToast('✓ Vidéo partagée !')
        return
      } catch (e) {}
    }
    navigator.clipboard?.writeText(shareUrl)
    showToast('🔗 Lien copié !')
  }

  const displayedVideos = feedVideos.filter(v => {
    const matchesSearch = !searchQuery || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchQuery) return true
    return sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sub.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredSubscribers = mySubscribers.filter(sub => {
    if (!searchQuery) return true
    return (sub.name || sub.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sortedFavorites = [...favorites].filter(f => {
    if (!searchQuery) return true
    return f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.professionalName.toLowerCase().includes(searchQuery.toLowerCase())
  }).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

  const base = isDark ? 'bg-[#0b0e14] text-white' : 'bg-slate-50 text-slate-900'

  return (
    <div className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden ${base}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold bg-zinc-900 text-white border border-zinc-700/80 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Modal Confirmation Désabonnement */}
      {unsubscribeConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'} rounded-3xl max-w-sm w-full p-5 shadow-2xl border space-y-4`}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">{t('pro.subscribers.unsubscribeModalTitle', 'Se désabonner ?')}</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t('pro.subscribers.unsubscribeModalDesc', 'Vous ne recevrez plus les publications ni alertes de ce professionnel.')}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setUnsubscribeConfirm(null)} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button 
                onClick={() => unsubscribe(unsubscribeConfirm)} 
                disabled={Boolean(actionLoading)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm', 'Confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EN-TÊTE FULL-WIDTH FLUSH AU TOP (Même design que Demandes) ── */}
      <div className={`flex-shrink-0 p-3.5 border-b backdrop-blur-xl ${isDark ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/pro')}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Heart size={18} className="fill-white" />
            </div>
            <h1 className="font-bold text-base">{t('pro.profile.subscriptions', 'Abonnements')}</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
          <Search size={15} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('pro.subscribers.searchPlaceholder', 'Rechercher une vidéo ou un créateur...')}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={13} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </button>
          )}
        </div>

        {/* Tabs Principaux */}
        <div className="flex gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'feed', label: t('pro.subscribers.feedTab', 'Fil des Vidéos'), icon: Play, count: displayedVideos.length },
            { id: 'following', label: t('pro.subscribers.channelsTab', 'Mes Chaînes'), icon: Users, count: stats.following_count },
            { id: 'subscribers', label: t('pro.subscribers.subscribersTab', 'Mes Abonnés'), icon: UserPlus, count: stats.subscribers_count },
            { id: 'favorites', label: t('pro.subscribers.favoritesTab', 'Favoris'), icon: Bookmark, count: sortedFavorites.length }
          ].map((tTab) => {
            const Icon = tTab.icon
            const active = activeTab === tTab.id
            return (
              <button
                key={tTab.id}
                onClick={() => setActiveTab(tTab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? 'bg-[#FF6B00] text-white shadow-md' : isDark ? 'bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100/70 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tTab.label}</span>
                {tTab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/25 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                    {tTab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENU DÉFILANT RESPONSIVE ── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-5xl mx-auto w-full pb-20 md:pb-8">
        
        {/* ================================================================ */}
        {/* CONTENU ONGLET 1 : FIL RÉEL DES VIDÉOS                           */}
        {/* ================================================================ */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {/* Filtre par Catégorie / Métier */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 pl-1 pr-1">
                <Filter size={12} />
              </div>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtre par Créateur abonné */}
            {subscriptions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedCreatorId('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCreatorId === 'all'
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                      : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {t('common.all', 'Tous')}
                </button>
                {subscriptions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedCreatorId(sub.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCreatorId === sub.id
                        ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                        : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden">
                      {sub.avatar ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">{sub.name[0]}</div>}
                    </div>
                    <span>{sub.name}</span>
                    {sub.isVip && <Crown size={11} className="text-amber-400 fill-amber-400" />}
                  </button>
                ))}
              </div>
            )}

            {/* État de chargement */}
            {loadingFeed ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement des vidéos de vos abonnements...</p>
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 text-[#FF6B00] flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Aucune vidéo pour le moment</h3>
                  <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {subscriptions.length === 0
                      ? "Vous n'êtes abonné à aucun professionnel. Découvrez les suggestions ci-dessous pour commencer !"
                      : "Les créateurs que vous suivez n'ont pas encore publié de vidéo dans cette catégorie."}
                  </p>
                </div>

                {/* Suggestions si le fil est vide */}
                {suggestions.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-zinc-800/40 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-amber-400" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Professionnels recommandés</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {suggestions.slice(0, 4).map(sugg => (
                        <div key={sugg.id} className={`${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-slate-200'} p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between gap-3`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                              {sugg.avatar ? <img src={sugg.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">{sugg.name[0]}</div>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate">{sugg.name}</p>
                              <p className="text-[11px] text-[#FF6B00] truncate">{sugg.profession}</p>
                              <p className="text-[10px] text-zinc-500">{sugg.videos_count} vidéos</p>
                            </div>
                          </div>
                          <button
                            onClick={() => subscribeToSuggested(sugg.id)}
                            disabled={actionLoading === `sub_sugg_${sugg.id}`}
                            className="w-full py-1.5 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            {actionLoading === `sub_sugg_${sugg.id}` ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                            <span>S'abonner</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedVideos.map(video => (
                  <div
                    key={video.id}
                    onClick={() => navigate(`/pro/video/${video.id}`)}
                    className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl overflow-hidden border shadow-sm cursor-pointer group hover:border-[#FF6B00]/50 transition-all`}
                  >
                    <div className="relative aspect-video bg-zinc-800">
                      <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">{video.duration}</span>
                    </div>
                    <div className="p-3">
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                          {video.author?.avatar ? <img src={video.author.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{video.author?.name[0]}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug">{video.title}</h3>
                          <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{video.author?.name}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40">
                            <span className="text-[10px] text-zinc-500">{video.viewsCount} {t('pro.video.views', 'vues')} • {video.createdAt}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(video); }}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-[#FF6B00]"
                                title={t('common.save', 'Enregistrer')}
                              >
                                <Bookmark size={13} className={favorites.some(f => String(f.videoId) === String(video.id)) ? 'fill-[#FF6B00] text-[#FF6B00]' : ''} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleShare(video); }}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                title={t('common.share', 'Partager')}
                              >
                                <Share2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* CONTENU ONGLET 2 : MES CHAÎNES (ABONNEMENTS ACTIFS)              */}
        {/* ================================================================ */}
        {activeTab === 'following' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSubscriptions.length === 0 ? (
                <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
                  {t('pro.subscribers.noChannels', 'Aucune chaîne trouvée')}
                </div>
              ) : (
                filteredSubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl p-3.5 border shadow-sm flex items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/pro/profile/${sub.id}`)}>
                      <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 relative">
                        {sub.avatar ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white">{sub.name[0]}</div>}
                        {sub.isVip && (
                          <div className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full text-white shadow">
                            <Crown size={10} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm truncate">{sub.name}</h3>
                          {sub.isVip && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded uppercase">
                              {sub.vipTier || 'VIP'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#FF6B00] font-medium">{sub.profession}</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {sub.subscribersCount || 0} abonnés • {sub.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Bouton VIP */}
                      <button
                        type="button"
                        onClick={() => toggleVip(sub.id)}
                        disabled={actionLoading === `vip_${sub.id}`}
                        className={`p-2 rounded-xl transition-colors ${sub.isVip ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-amber-400' : 'bg-slate-100 text-slate-500'}`}
                        title="Abonnement VIP / Soutien"
                      >
                        <Crown size={15} className={sub.isVip ? 'fill-amber-400' : ''} />
                      </button>

                      {/* Bouton Cloche Notifs */}
                      <button
                        type="button"
                        onClick={() => toggleNotifications(sub.id)}
                        disabled={actionLoading === `notif_${sub.id}`}
                        className={`p-2 rounded-xl transition-colors ${sub.notificationsEnabled ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}
                        title={sub.notificationsEnabled ? 'Notifications activées' : 'Notifications désactivées'}
                      >
                        {sub.notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                      </button>

                      {/* Bouton Abonné / Se désabonner */}
                      <button
                        type="button"
                        onClick={() => setUnsubscribeConfirm(sub.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                      >
                        {t('pro.subscribers.subscribed', 'Abonné')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Suggestions de nouveaux professionnels */}
            {suggestions.length > 0 && (
              <div className="pt-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-amber-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Découvrir d'autres experts</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map(sugg => (
                    <div key={sugg.id} className={`${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'} p-3 rounded-2xl border shadow-sm flex items-center justify-between gap-3`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                          {sugg.avatar ? <img src={sugg.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">{sugg.name[0]}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{sugg.name}</p>
                          <p className="text-[11px] text-[#FF6B00] truncate">{sugg.profession}</p>
                          <p className="text-[10px] text-zinc-500">{sugg.subscribers_count} abonnés</p>
                        </div>
                      </div>
                      <button
                        onClick={() => subscribeToSuggested(sugg.id)}
                        disabled={actionLoading === `sub_sugg_${sugg.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                      >
                        {actionLoading === `sub_sugg_${sugg.id}` ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                        <span>Suivre</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* CONTENU ONGLET 3 : MES ABONNÉS (CEUX QUI ME SUIVENT)            */}
        {/* ================================================================ */}
        {activeTab === 'subscribers' && (
          <div className="space-y-3">
            {loadingMySubscribers ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement de vos abonnés...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-base">Aucun abonné pour l'instant</h3>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Publiez des vidéos et des lives pour attirer des professionnels et développer votre communauté sur EXILE.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSubscribers.map(sub => (
                  <div
                    key={sub.id}
                    className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl p-3.5 border shadow-sm flex items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/pro/profile/${sub.id}`)}>
                      <div className="w-11 h-11 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                        {sub.avatar ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">{sub.name[0]}</div>}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{sub.name}</h3>
                        <p className="text-xs text-blue-500 font-medium">{sub.profession}</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          Abonné depuis le {new Date(sub.subscribed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/pro/conversations?userId=${sub.id}`)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition-colors`}
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* CONTENU ONGLET 4 : FAVORIS (100% SYNCHRONISÉS BACKEND)           */}
        {/* ================================================================ */}
        {activeTab === 'favorites' && (
          <div>
            {loadingFavorites ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement de vos vidéos favorites...</p>
              </div>
            ) : sortedFavorites.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto stroke-1" />
                <p className="text-sm font-semibold text-zinc-400">{t('pro.subscribers.noFavorites', 'Aucune vidéo dans vos favoris')}</p>
                <p className="text-xs text-zinc-500">{t('pro.subscribers.noFavoritesDesc', "Ajoutez des vidéos aux favoris depuis l'accueil ou le lecteur vidéo.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFavorites.map(fav => (
                  <div
                    key={fav.id || fav.videoId}
                    onClick={() => navigate(`/pro/video/${fav.videoId}`)}
                    className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl overflow-hidden border shadow-sm cursor-pointer group hover:border-[#FF6B00]/50 transition-all`}
                  >
                    <div className="relative aspect-video bg-zinc-800">
                      <img src={fav.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">{fav.duration || '05:00'}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug">{fav.title}</h3>
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{fav.professionalName}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40">
                        <span className="text-[10px] text-zinc-500">{t('common.saved', 'Enregistré')}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(fav); }}
                          className="p-1.5 rounded-lg text-[#FF6B00] hover:bg-zinc-800"
                          title={t('pro.subscribers.removeFromFavorites', 'Retirer des favoris')}
                        >
                          <Bookmark size={14} className="fill-[#FF6B00]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Subscriptions
