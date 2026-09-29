import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users, Play, Heart, Bell, BellOff, Search, ArrowLeft,
  Share2, Bookmark, X, Award, Filter, Crown, Check, Loader2, UserPlus,
  ExternalLink, Compass, Flame
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { AbonnementListSchema } from '../../schemas/apiSchemas'
import { useQuery } from '../../hooks/useQuery'
import { resolveMediaUrl } from '../../utils/mediaUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// ============================================================================
// HELPER FUNCTIONS FOR USER NAMES & INITIALS
// ============================================================================

function getCleanName(name?: string, username?: string): string {
  if (name && name.trim()) {
    return name.replace(/^@+/, '').trim()
  }
  if (username && username.trim()) {
    return username.replace(/^@+/, '').trim()
  }
  return 'Professionnel'
}

function getInitials(name?: string, username?: string): string {
  const clean = getCleanName(name, username)
  const parts = clean.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0].replace(/^@+/, '')[0] || ''
    const second = parts[1].replace(/^@+/, '')[0] || ''
    return (first + second).toUpperCase() || 'P'
  }
  const cleanFirstTwo = clean.replace(/^@+/, '').slice(0, 2)
  return cleanFirstTwo.toUpperCase() || 'P'
}

const GRADIENTS = [
  'from-orange-500 to-amber-500',
  'from-blue-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-rose-500 to-orange-400',
  'from-indigo-600 to-violet-500',
]

function getAvatarGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// ============================================================================
// COMPONENT: CREATOR AVATAR (NO BROKEN IMAGES, NO RAW @ INITIALS)
// ============================================================================

interface CreatorAvatarProps {
  src?: string | null
  name?: string
  username?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showVip?: boolean
  isVip?: boolean
}

const CreatorAvatar = ({
  src,
  name,
  username,
  size = 'md',
  className = '',
  showVip = false,
  isVip = false,
}: CreatorAvatarProps) => {
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = src ? resolveMediaUrl(src) : null
  const initials = getInitials(name, username)
  const gradient = getAvatarGradient(name || username || 'exile')

  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-16 h-16 text-lg font-bold',
  }[size]

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center select-none shadow-sm`}>
        {resolvedUrl && !hasError ? (
          <img
            src={resolvedUrl}
            alt={getCleanName(name, username)}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-bold tracking-wider`}>
            {initials}
          </div>
        )}
      </div>
      {showVip && isVip && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-zinc-900">
          <Crown size={10} className="fill-white" />
        </span>
      )}
    </div>
  )
}

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT: SUBSCRIPTIONS
// ============================================================================

export const Subscriptions = (): JSX.Element => {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'subscribers' | 'favorites'>('feed')
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Real Stats
  const [stats, setStats] = useState({ following_count: 0, subscribers_count: 0 })

  // Real Subscribers List
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
          thumbnail: resolveMediaUrl(v.cover_url || v.cover) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${('0' + Math.floor(v.duration % 60)).slice(-2)}` : '05:00',
          file_url: resolveMediaUrl(v.file_url || v.file),
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
            thumbnailUrl: resolveMediaUrl(vd.cover_url || vd.cover) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
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

  // S'abonner / Se désabonner d'un créateur (suggestions)
  const handleToggleSubscribe = async (profId: number) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    setActionLoading(`sub_${profId}`)
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
        const data = await res.json()
        if (data.is_subscribed) {
          showToast('✓ Abonnement réussi !')
        } else {
          showToast('Abonnement retiré')
        }
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

  // Vérifier si un créateur est déjà abonné
  const isSubscribed = (id: number | string) => {
    return subscriptions.some(s => String(s.id) === String(id))
  }

  // Filtres de recherche
  const displayedVideos = feedVideos.filter(v => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return v.title.toLowerCase().includes(q) || 
      (v.author.name && v.author.name.toLowerCase().includes(q)) ||
      (v.author.username && v.author.username.toLowerCase().includes(q))
  })

  const displayedSuggestions = suggestions.filter(sugg => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (sugg.name && sugg.name.toLowerCase().includes(q)) ||
      (sugg.username && sugg.username.toLowerCase().includes(q)) ||
      (sugg.profession && sugg.profession.toLowerCase().includes(q)) ||
      (sugg.speciality && sugg.speciality.toLowerCase().includes(q))
  })

  const filteredSubscribers = mySubscribers.filter(sub => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (sub.name || sub.username || '').toLowerCase().includes(q) ||
      (sub.profession && sub.profession.toLowerCase().includes(q))
  })

  const sortedFavorites = [...favorites].filter(f => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return f.title.toLowerCase().includes(q) ||
           f.professionalName.toLowerCase().includes(q)
  }).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

  // Ouvrir une vidéo avec header masqué (mode immersif)
  const handleOpenVideo = (video: VideoFeedItem) => {
    try { localStorage.setItem('exile_video_player_active', 'true') } catch {}
    navigate(`/pro/video/${video.id}`)
  }

  const baseTheme = isDark ? 'bg-[#0b0e14] text-white' : 'bg-slate-50 text-slate-900'

  return (
    <div className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden ${baseTheme}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold bg-zinc-900 text-white border border-zinc-700/80 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* ── EN-TÊTE HARMONIEUX, RICHE ET RÉACTIF (DESKTOP, TABLETTE, MOBILE) ── */}
      <div className={`flex-shrink-0 border-b backdrop-blur-xl transition-all ${
        isDark ? 'border-white/5 bg-black/50' : 'border-slate-200 bg-white/85'
      }`}>
        {/* Ligne 1: Titre, Badges Statistiques & Barre de Recherche Intégrée */}
        <div className="px-3.5 sm:px-5 lg:px-6 pt-3.5 pb-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Gauche: Retour, Logo & Titre avec Compteurs */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate('/pro')}
                className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                  isDark ? 'hover:bg-white/10 active:bg-white/15' : 'hover:bg-slate-100 active:bg-slate-200'
                }`}
                title="Retour"
              >
                <ArrowLeft size={18} />
              </button>
              
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Heart size={19} className="fill-white" />
              </div>
              
              <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="font-bold text-base sm:text-lg tracking-tight truncate">
                  {t('pro.profile.subscriptions', 'Abonnements')}
                </h1>
                
                {/* Badges de stats réels intégrés dans le header */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    <strong className="text-[#FF6B00]">{subscriptions.length}</strong> {subscriptions.length > 1 ? 'abonnements' : 'abonnement'}
                  </span>
                  {stats.subscribers_count > 0 && (
                    <span className={`hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <strong className="text-blue-400">{stats.subscribers_count}</strong> {stats.subscribers_count > 1 ? 'abonnés' : 'abonné'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Droite: Recherche intégrée élégante avec bouton clear */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border w-full sm:w-80 md:w-96 lg:w-[380px] xl:w-[460px] 2xl:w-[500px] transition-all ${
                isDark 
                  ? 'bg-zinc-900/80 border-zinc-800 text-white focus-within:border-[#FF6B00]/70 focus-within:ring-1 focus-within:ring-[#FF6B00]/30' 
                  : 'bg-slate-100/90 border-slate-200 text-slate-900 focus-within:border-[#FF6B00]/70 focus-within:ring-1 focus-within:ring-[#FF6B00]/30 focus-within:bg-white'
              }`}>
                <Search size={15} className={isDark ? 'text-zinc-400' : 'text-slate-500'} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'discover' 
                      ? "Rechercher un professionnel..."
                      : activeTab === 'subscribers'
                      ? "Rechercher dans mes abonnés..."
                      : "Rechercher une vidéo, un créateur..."
                  }
                  className="flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0 placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-0.5 hover:opacity-75">
                    <X size={14} className={isDark ? 'text-zinc-400' : 'text-slate-500'} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ligne 2: Onglets Segmentés Modernes */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'feed', label: t('pro.subscribers.feedTab', 'Fil des Vidéos'), icon: Play, count: displayedVideos.length },
              { id: 'discover', label: 'Découvrir', icon: Compass, count: suggestions.length },
              { id: 'subscribers', label: t('pro.subscribers.subscribersTab', 'Mes Abonnés'), icon: Users, count: stats.subscribers_count },
              { id: 'favorites', label: t('pro.subscribers.favoritesTab', 'Favoris'), icon: Bookmark, count: sortedFavorites.length }
            ].map((tTab) => {
              const Icon = tTab.icon
              const active = activeTab === tTab.id
              return (
                <button
                  key={tTab.id}
                  onClick={() => setActiveTab(tTab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    active 
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20 scale-[1.02]' 
                      : isDark 
                      ? 'bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300' 
                      : 'bg-slate-100/70 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tTab.label}</span>
                  {tTab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/25 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tTab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ligne 3: Carrousel des bulles d'abonnements (uniquement si onglet feed) */}
        {activeTab === 'feed' && subscriptions.length > 0 && (
          <div className={`px-3.5 sm:px-5 lg:px-6 py-2 border-t flex items-center gap-3 overflow-x-auto ${
            isDark ? 'border-zinc-800/50 bg-black/20' : 'border-slate-100 bg-slate-50/50'
          }`} style={{ scrollbarWidth: 'none' }}>
            {/* Bulle "Tous" */}
            <button
              onClick={() => setSelectedCreatorId('all')}
              className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group focus:outline-none"
            >
              <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                selectedCreatorId === 'all'
                  ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/40 scale-105 shadow-md shadow-orange-500/10'
                  : isDark ? 'border-zinc-700 hover:border-zinc-500' : 'border-slate-200 hover:border-slate-400'
              } ${isDark ? 'bg-zinc-800/90' : 'bg-white'}`}>
                <Heart size={18} className={selectedCreatorId === 'all' ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-zinc-400'} />
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${
                selectedCreatorId === 'all' ? 'text-[#FF6B00]' : isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                {t('common.all', 'Tous')}
              </span>
            </button>

            {/* Bulles des créateurs abonnés avec vrais avatars résolus */}
            {subscriptions.map(sub => {
              const isSelected = selectedCreatorId === sub.id
              const cleanName = getCleanName(sub.name, sub.username)
              const displayHandle = sub.username ? `@${sub.username.replace(/^@+/, '')}` : cleanName

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCreatorId(sub.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group focus:outline-none"
                >
                  <div className={`p-0.5 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/40 scale-105 shadow-md shadow-orange-500/10'
                      : isDark ? 'border-zinc-700 hover:border-zinc-500' : 'border-slate-200 hover:border-slate-400'
                  }`}>
                    <CreatorAvatar
                      src={sub.avatar}
                      name={sub.name}
                      username={sub.username}
                      size="lg"
                      showVip={true}
                      isVip={sub.isVip}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap max-w-[62px] truncate text-center ${
                    isSelected ? 'text-[#FF6B00]' : isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}>
                    {displayHandle}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Ligne 4: Filtres par Catégorie (si onglet feed) */}
        {activeTab === 'feed' && (
          <div className={`px-3.5 sm:px-5 lg:px-6 py-2 border-t flex items-center gap-2 overflow-x-auto ${
            isDark ? 'border-zinc-800/40' : 'border-slate-100'
          }`} style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? isDark 
                      ? 'bg-white text-black border-transparent shadow-sm' 
                      : 'bg-zinc-900 text-white border-transparent shadow-sm'
                    : isDark 
                    ? 'bg-zinc-900/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENU DÉFILANT (PLEINE HAUTEUR / PLEINE LARGEUR) ── */}
      <div className="flex-1 overflow-y-auto w-full px-3.5 sm:px-5 lg:px-6 py-4 pb-24 md:pb-10">

        {/* ================================================================ */}
        {/* ONGLET 1 : FIL DES VIDÉOS DES ABONNÉS                           */}
        {/* ================================================================ */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {loadingFeed ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                <p className="text-xs font-medium">{t('pro.subscriptions.loadingVideos', 'Chargement des vidéos de vos abonnements...')}</p>
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="space-y-8">
                {/* État vide soigné */}
                <div className={`text-center py-12 px-4 rounded-3xl border ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg">{t('pro.subscriptions.noVideos', 'Aucune vidéo pour le moment')}</h3>
                  <p className={`text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {subscriptions.length === 0
                      ? "Vous n'êtes pas encore abonné à des professionnels. Découvrez nos recommandations ci-dessous pour enrichir votre fil d'expertise !"
                      : "Les professionnels que vous suivez n'ont pas encore publié de vidéo dans cette catégorie."}
                  </p>
                  {subscriptions.length === 0 && (
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors shadow-sm"
                    >
                      <Compass size={15} />
                      <span>Explorer les professionnels</span>
                    </button>
                  )}
                </div>

                {/* Section "Professionnels recommandés" avec cartes modernes */}
                {suggestions.length > 0 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass size={16} className="text-[#FF6B00]" />
                        <h2 className="font-bold text-sm sm:text-base tracking-tight">
                          Créateurs & Professionnels recommandés
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="text-xs font-semibold text-[#FF6B00] hover:underline"
                      >
                        Voir tout ({suggestions.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {suggestions.slice(0, 8).map(sugg => {
                        const subbed = isSubscribed(sugg.id)
                        const isLoading = actionLoading === `sub_${sugg.id}`
                        const cleanName = getCleanName(sugg.name, sugg.username)
                        const handle = sugg.username ? `@${sugg.username.replace(/^@+/, '')}` : ''

                        return (
                          <div
                            key={sugg.id}
                            className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between group ${
                              isDark 
                                ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border-zinc-800/80 hover:border-zinc-700' 
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            {/* Bannière d'accentuation haute */}
                            <div className="h-14 sm:h-16 w-full relative bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                              {sugg.speciality && (
                                <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 truncate max-w-[140px]">
                                  {sugg.speciality}
                                </span>
                              )}
                            </div>

                            {/* Contenu et profil */}
                            <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 flex-1 flex flex-col">
                              {/* Avatar superposé sur la bannière */}
                              <div className="-mt-7 mb-2 flex items-end justify-between">
                                <div className={`p-0.5 rounded-full ring-2 shadow-md ${isDark ? 'ring-zinc-900 bg-zinc-900' : 'ring-white bg-white'}`}>
                                  <CreatorAvatar
                                    src={sugg.avatar}
                                    name={sugg.name}
                                    username={sugg.username}
                                    size="lg"
                                  />
                                </div>
                                <button
                                  onClick={() => navigate(`/pro/profile/${sugg.id}`)}
                                  className={`p-1.5 rounded-xl text-xs transition-colors ${
                                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                                  }`}
                                  title="Voir profil complet"
                                >
                                  <ExternalLink size={14} />
                                </button>
                              </div>

                              {/* Identité */}
                              <div className="min-w-0 flex-1">
                                <h4
                                  onClick={() => navigate(`/pro/profile/${sugg.id}`)}
                                  className={`font-bold text-xs sm:text-sm truncate cursor-pointer hover:underline ${
                                    isDark ? 'text-zinc-100' : 'text-slate-900'
                                  }`}
                                >
                                  {cleanName}
                                </h4>
                                {handle && (
                                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    {handle}
                                  </p>
                                )}

                                {/* Badge Métier */}
                                <div className="mt-1.5">
                                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 truncate max-w-full">
                                    {sugg.profession || 'Professionnel'}
                                  </span>
                                </div>

                                {/* Compteurs */}
                                <div className={`flex items-center gap-2.5 mt-3 pt-2 border-t text-[11px] ${
                                  isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-slate-100 text-slate-500'
                                }`}>
                                  <span className="flex items-center gap-1">
                                    <Users size={12} className="text-[#FF6B00]" />
                                    <span>{sugg.subscribers_count} abonnés</span>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Play size={12} className="text-blue-500" />
                                    <span>{sugg.videos_count} vidéos</span>
                                  </span>
                                </div>
                              </div>

                              {/* Bouton d'action S'abonner / Déjà abonné */}
                              <div className="mt-3.5 pt-1">
                                <button
                                  onClick={() => handleToggleSubscribe(sugg.id)}
                                  disabled={isLoading}
                                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                    subbed
                                      ? isDark 
                                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                      : 'bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-[#e05e00] hover:to-orange-600 text-white shadow-orange-500/20'
                                  }`}
                                >
                                  {isLoading ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : subbed ? (
                                    <>
                                      <Check size={13} />
                                      <span>Abonné</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus size={13} />
                                      <span>S'abonner</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Grille Responsive des vidéos style YouTube */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
                {displayedVideos.map(video => {
                  const dur = String(video.duration || '')
                  const fmtViews = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n)
                  const fmtAgo = (d?: string) => {
                    if (!d) return ''
                    const ms = Date.now() - new Date(d).getTime()
                    if (isNaN(ms) || ms < 0) return ''
                    const m = Math.floor(ms / 60000)
                    if (m < 60) return `${Math.max(1,m)}min`
                    const h = Math.floor(m / 60)
                    if (h < 24) return `${h}h`
                    const day = Math.floor(h / 24)
                    if (day < 7) return `${day}j`
                    if (day < 30) return `${Math.floor(day/7)}sem`
                    return `${Math.floor(day/30)}mois`
                  }
                  const thumbSrc = video.thumbnail || ''

                  return (
                    <div
                      key={video.id}
                      onClick={() => handleOpenVideo(video)}
                      className={`cursor-pointer rounded-xl overflow-hidden group transition-all hover:scale-[1.02] ${
                        isDark ? 'bg-zinc-900/80 hover:bg-zinc-900' : 'bg-white hover:shadow-md border border-slate-100'
                      }`}
                    >
                      {/* Miniature 16:9 */}
                      <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={24} className="text-zinc-500" />
                          </div>
                        )}
                        {dur && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm">
                            {dur}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center shadow-lg">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Métadonnées */}
                      <div className="p-2 flex gap-2">
                        <CreatorAvatar
                          src={video.author?.avatar}
                          name={video.author?.name}
                          username={video.author?.username}
                          size="xs"
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-semibold leading-tight line-clamp-2 mb-0.5 ${
                            isDark ? 'text-zinc-100' : 'text-slate-900'
                          }`}>
                            {video.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {getCleanName(video.author?.name, video.author?.username)}
                          </p>
                          <p className="text-[9px] text-zinc-500 mt-0.5 flex items-center gap-1">
                            <span>{fmtViews(video.viewsCount)} vues</span>
                            {video.createdAt && <><span>•</span><span>{fmtAgo(video.createdAt)}</span></>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ONGLET 2 : DÉCOUVRIR (SUGGESTIONS & RECHERCHE DE CRÉATEURS)      */}
        {/* ================================================================ */}
        {activeTab === 'discover' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm sm:text-base tracking-tight">
                  Professionnels & Créateurs à découvrir
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Abonnez-vous à des experts de premier plan pour enrichir votre réseau et votre fil.
                </p>
              </div>
            </div>

            {loadingSuggestions ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement des suggestions...</p>
              </div>
            ) : displayedSuggestions.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Users className="w-12 h-12 text-zinc-500 mx-auto" />
                <h3 className="font-bold text-sm">Aucun professionnel trouvé</h3>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Essayez avec un autre mot-clé dans la barre de recherche ci-dessus.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {displayedSuggestions.map(sugg => {
                  const subbed = isSubscribed(sugg.id)
                  const isLoading = actionLoading === `sub_${sugg.id}`
                  const cleanName = getCleanName(sugg.name, sugg.username)
                  const handle = sugg.username ? `@${sugg.username.replace(/^@+/, '')}` : ''

                  return (
                    <div
                      key={sugg.id}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between group ${
                        isDark 
                          ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border-zinc-800/80 hover:border-zinc-700' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      {/* Bannière */}
                      <div className="h-16 w-full relative bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                        {sugg.speciality && (
                          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 truncate max-w-[140px]">
                            {sugg.speciality}
                          </span>
                        )}
                      </div>

                      {/* Corps de la carte */}
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 flex-1 flex flex-col">
                        <div className="-mt-7 mb-2 flex items-end justify-between">
                          <div className={`p-0.5 rounded-full ring-2 shadow-md ${isDark ? 'ring-zinc-900 bg-zinc-900' : 'ring-white bg-white'}`}>
                            <CreatorAvatar
                              src={sugg.avatar}
                              name={sugg.name}
                              username={sugg.username}
                              size="lg"
                            />
                          </div>
                          <button
                            onClick={() => navigate(`/pro/profile/${sugg.id}`)}
                            className={`p-1.5 rounded-xl text-xs transition-colors ${
                              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Voir profil complet"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => navigate(`/pro/profile/${sugg.id}`)}
                            className={`font-bold text-xs sm:text-sm truncate cursor-pointer hover:underline ${
                              isDark ? 'text-zinc-100' : 'text-slate-900'
                            }`}
                          >
                            {cleanName}
                          </h4>
                          {handle && (
                            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {handle}
                            </p>
                          )}

                          <div className="mt-1.5">
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 truncate max-w-full">
                              {sugg.profession || 'Professionnel'}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2.5 mt-3 pt-2 border-t text-[11px] ${
                            isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-slate-100 text-slate-500'
                          }`}>
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-[#FF6B00]" />
                              <span>{sugg.subscribers_count} abonnés</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Play size={12} className="text-blue-500" />
                              <span>{sugg.videos_count} vidéos</span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-3.5 pt-1">
                          <button
                            onClick={() => handleToggleSubscribe(sugg.id)}
                            disabled={isLoading}
                            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                              subbed
                                ? isDark 
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-[#e05e00] hover:to-orange-600 text-white shadow-orange-500/20'
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : subbed ? (
                              <>
                                <Check size={13} />
                                <span>Abonné</span>
                              </>
                            ) : (
                              <>
                                <UserPlus size={13} />
                                <span>S'abonner</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ONGLET 3 : MES ABONNÉS (CEUX QUI ME SUIVENT)                    */}
        {/* ================================================================ */}
        {activeTab === 'subscribers' && (
          <div className="space-y-3.5">
            {loadingMySubscribers ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement de vos abonnés...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-base">Aucun abonné pour l'instant</h3>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Publiez des vidéos et organisez des lives pour attirer des professionnels et développer votre communauté sur EXILE.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSubscribers.map(sub => {
                  const cleanName = getCleanName(sub.name, sub.username)
                  const handle = sub.username ? `@${sub.username.replace(/^@+/, '')}` : ''

                  return (
                    <div
                      key={sub.id}
                      className={`${
                        isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'
                      } rounded-2xl p-3.5 border shadow-sm flex items-center justify-between gap-3 hover:border-[#FF6B00]/40 transition-colors`}
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        onClick={() => navigate(`/pro/profile/${sub.id}`)}
                      >
                        <CreatorAvatar
                          src={sub.avatar}
                          name={sub.name}
                          username={sub.username}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-xs sm:text-sm truncate hover:underline">
                            {cleanName}
                          </h3>
                          {handle && (
                            <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {handle}
                            </p>
                          )}
                          <p className="text-[11px] text-[#FF6B00] font-medium truncate mt-0.5">
                            {sub.profession || 'Membre'}
                          </p>
                          {sub.subscribed_at && (
                            <p className={`text-[9px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Abonné depuis le {new Date(sub.subscribed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/pro/conversations?userId=${sub.id}`)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors ${
                          isDark 
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Message
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ONGLET 4 : FAVORIS                                              */}
        {/* ================================================================ */}
        {activeTab === 'favorites' && (
          <div>
            {loadingFavorites ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                <p className="text-xs">Chargement de vos favoris...</p>
              </div>
            ) : sortedFavorites.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto stroke-1" />
                <p className="text-sm font-semibold text-zinc-400">{t('pro.subscribers.noFavorites', 'Aucune vidéo dans vos favoris')}</p>
                <p className="text-xs text-zinc-500">{t('pro.subscribers.noFavoritesDesc', "Ajoutez des vidéos aux favoris depuis l'accueil ou le lecteur vidéo.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedFavorites.map(fav => (
                  <div
                    key={fav.id || fav.videoId}
                    onClick={() => navigate(`/pro/video/${fav.videoId}`)}
                    className={`${
                      isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'
                    } rounded-2xl overflow-hidden border shadow-sm cursor-pointer group hover:border-[#FF6B00]/50 transition-all`}
                  >
                    <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                      <img 
                        src={fav.thumbnailUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {fav.duration || '05:00'}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug">
                        {fav.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <CreatorAvatar
                          src={fav.professionalAvatar}
                          name={fav.professionalName}
                          size="xs"
                        />
                        <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {getCleanName(fav.professionalName)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/40">
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
