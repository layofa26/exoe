import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, Heart, X, Bell, Search, ArrowLeft, Check } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { SimpleVideoCard } from '../../components/video/SimpleVideoCard'
import type { Video } from '../../types/video'
import { api } from '../../services/apiClient'
import { AbonnementListSchema } from '../../schemas/apiSchemas'
import { getCurrentUserId } from '../../services/apiClient'

// Types
interface SubscribedProfessional {
  id: string
  name: string
  avatar: string | null
  profession: string
  specialty: string
  subscribedAt: string
}

interface FavoriteVideo {
  videoId: string
  title: string
  professionalId: string
  professionalName: string
  professionalAvatar: string | null
  thumbnail: string
  duration: string
  addedAt: string
  likes: number
}

// Données par défaut
const defaultSubscriptions: SubscribedProfessional[] = [
  {
    id: 'prof-1',
    name: 'Marie Dupont',
    avatar: null,
    profession: 'Architecture',
    specialty: 'Architecte d\'intérieur',
    subscribedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prof-2',
    name: 'Jean Pierre',
    avatar: null,
    profession: 'Design',
    specialty: 'Designer UX/UI',
    subscribedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prof-3',
    name: 'Sophie Laurent',
    avatar: null,
    profession: 'Génie Civil',
    specialty: 'Ingénieur BTP',
    subscribedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const Subscriptions = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const [subscriptions, setSubscriptions] = useState<SubscribedProfessional[]>([])
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'favorites'>('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [allVideos, setAllVideos] = useState<Video[]>([])

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // Allow viewing without auth, just show empty or demo data
          setSubscriptions(defaultSubscriptions)
          return
        }

        const userId = getCurrentUserId()
        
        // Load subscriptions from backend
        const result = await api.get('/v1/abonnement/abonnements/', AbonnementListSchema)
        
        if (result.success && result.data) {
          const subscriptions = (result.data.results || result.data).map((sub: any) => ({
            id: String(sub.professionnel),
            name: 'Professional',
            avatar: null,
            profession: 'Professional',
            specialty: '',
            subscribedAt: sub.created_at
          }))
          setSubscriptions(subscriptions)
        }
      } catch (err) {
        console.error('Error loading subscriptions:', err)
        // Fallback to localStorage
        const savedSubs = localStorage.getItem('exile_subscriptions')
        if (savedSubs) {
          const parsed = JSON.parse(savedSubs)
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            setSubscriptions(parsed)
          } else {
            setSubscriptions(defaultSubscriptions)
          }
        } else {
          setSubscriptions(defaultSubscriptions)
        }
      }
    }

    const savedFavs = localStorage.getItem('exile_favorites')
    const savedVideos = localStorage.getItem('exile_videos')
    
    try {
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs))
      }
      if (savedVideos) {
        setAllVideos(JSON.parse(savedVideos))
      }
    } catch (err) {
      console.error('Error loading favorites/videos:', err)
    }

    loadSubscriptions()
  }, [navigate])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const unsubscribe = (profId: string) => {
    const prof = subscriptions.find(s => s.id === profId)
    const updated = subscriptions.filter(s => s.id !== profId)
    setSubscriptions(updated)
    localStorage.setItem('exile_subscriptions', JSON.stringify(updated))
    setUnsubscribeConfirm(null)
    showToast(`Désabonné de ${prof?.name || 'ce professionnel'}`)
  }

  const removeFromFavorites = (videoId: string) => {
    const updated = favorites.filter(f => f.videoId !== videoId)
    setFavorites(updated)
    localStorage.setItem('exile_favorites', JSON.stringify(updated))
    showToast('Retiré des favoris')
  }

  // Filtrer les vidéos des abonnements
  const getSubscriptionVideos = (): Video[] => {
    const subscribedIds = subscriptions.map(s => s.id)
    return allVideos.filter(video => 
      video.author && subscribedIds.includes(video.author.id)
    )
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchQuery === '') return true
    return sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sub.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sortedFavorites = [...favorites].sort((a, b) => 
    new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )

  const filteredFeedVideos = getSubscriptionVideos().filter(video => {
    if (searchQuery === '') return true
    return video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           video.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Navigation vers VideoFeed avec vidéo sélectionnée
  const handleVideoClick = (video: Video) => {
    navigate('/pro', { state: { selectedVideoId: video.id } })
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} pb-16 sm:pb-20`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {toast}
        </div>
      )}

      {/* Modal de confirmation */}
      {unsubscribeConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border`}>
            <div className="text-center mb-4 sm:mb-5">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'bg-red-950/30' : 'bg-red-50'} rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <h3 className={`font-bold text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Se désabonner ?</h3>
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-1`}>
                Vous ne verrez plus son contenu
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button 
                onClick={() => setUnsubscribeConfirm(null)}
                className={`flex-1 py-2 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-xs sm:text-sm font-medium transition-colors`}
              >
                Annuler
              </button>
              <button 
                onClick={() => unsubscribe(unsubscribeConfirm)}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Sticky - Contient titre, onglets et recherche */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-[100] backdrop-blur-lg shadow-md w-full px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 md:py-2`}>
        <div className="max-w-7xl mx-auto">
          {/* Mobile layout */}
          <div className="flex flex-col md:hidden gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pro')}
                className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Abonnements</h1>
                  <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} hidden sm:block`}>
                    Contenu de vos abonnements
                  </p>
                </div>
              </div>
            </div>

            {/* Onglets Premium */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden shadow-sm`}>
              <div className="flex">
                {[
                  { id: 'feed', label: 'Feed', icon: Play },
                  { id: 'following', label: 'Abonnements', icon: Users },
                  { id: 'favorites', label: 'Favoris', icon: Heart }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium transition-all ${
                      activeTab === t.id 
                        ? 'text-blue-400 bg-blue-950/20 border-b-2 border-blue-500' 
                        : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-700/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} border-b-2 border-transparent`
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 ${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'} rounded-xl text-xs sm:text-sm border focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm`}
              />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/pro')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Abonnements</h1>
            </div>

            {/* Onglets Premium */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm`}>
              <div className="flex">
                {[
                  { id: 'feed', label: 'Feed', icon: Play },
                  { id: 'following', label: 'Abonnements', icon: Users },
                  { id: 'favorites', label: 'Favoris', icon: Heart }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all ${
                      activeTab === t.id 
                        ? 'text-blue-400 bg-blue-950/20 border-b-2 border-blue-500' 
                        : `${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-700/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} border-b-2 border-transparent`
                    }`}
                  >
                    <t.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-32 sm:w-48 flex-shrink-0">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-1.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'} rounded-lg text-xs sm:text-sm border focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm`}
              />
            </div>

            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* Contenu principal avec padding */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pt-44 sm:pt-56 md:pt-20">
        {/* ONGLET 1: Feed des abonnements */}
        {activeTab === 'feed' && (
          <div>
            {filteredFeedVideos.length === 0 ? (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-8 sm:p-12 text-center`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${resolvedTheme === 'dark' ? 'bg-blue-950/30' : 'bg-blue-50'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Aucune vidéo</h3>
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Abonnez-vous à des professionnels pour voir leur contenu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredFeedVideos.map((video) => (
                  <div key={video.id}>
                    <SimpleVideoCard
                      video={video}
                      onClick={() => handleVideoClick(video)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2: Mes Abonnements */}
        {activeTab === 'following' && (
          <div>
            {filteredSubscriptions.length === 0 ? (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-8 sm:p-12 text-center`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${resolvedTheme === 'dark' ? 'bg-blue-950/30' : 'bg-blue-50'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Aucun abonnement</h3>
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Découvrez et abonnez-vous à des professionnels
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl border p-2.5 sm:p-3 transition-all group`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        {sub.avatar ? (
                          <img 
                            src={sub.avatar} 
                            alt={sub.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-500/30 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base border-2 border-blue-500/30 flex-shrink-0">
                            {sub.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{sub.name}</h4>
                          <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>{sub.specialty}</p>
                          <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                            Abonné {new Date(sub.subscribedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUnsubscribeConfirm(sub.id)}
                        className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                          resolvedTheme === 'dark' 
                            ? 'bg-red-950/30 text-red-400 hover:bg-red-950/50' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        Se désabonner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3: Favoris */}
        {activeTab === 'favorites' && (
          <div>
            {sortedFavorites.length === 0 ? (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-8 sm:p-12 text-center`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${resolvedTheme === 'dark' ? 'bg-red-950/30' : 'bg-red-50'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Aucun favori</h3>
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Ajoutez des vidéos à vos favoris pour les retrouver facilement
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {sortedFavorites.map((fav) => (
                  <div key={fav.videoId} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl border overflow-hidden transition-all group`}>
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
                      <span className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/80 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
                        {fav.duration}
                      </span>
                      
                      <button
                        onClick={() => removeFromFavorites(fav.videoId)}
                        className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                    
                    {/* Info */}
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        {fav.professionalAvatar ? (
                          <img 
                            src={fav.professionalAvatar} 
                            alt={fav.professionalName}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                            {fav.professionalName.charAt(0)}
                          </div>
                        )}
                        <p className={`text-[10px] sm:text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{fav.professionalName}</p>
                      </div>
                      
                      <h4 className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-1.5 sm:mb-2`}>{fav.title}</h4>
                      
                      <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className={`flex items-center gap-0.5 sm:gap-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {fav.likes}
                        </span>
                        <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
                          {new Date(fav.addedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
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
