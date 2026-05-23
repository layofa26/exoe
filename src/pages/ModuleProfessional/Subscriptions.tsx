import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Play, Heart, Eye, X, Bell,
  Check, Search, TrendingUp, MoreVertical, Bookmark, ArrowLeft
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

// Types
interface UserVideo {
  id: string
  title: string
  thumbnail: string
  views: number
  likes: number
  comments: number
  duration: string
  postedAt: string
}

interface SubscribedProfessional {
  id: string
  name: string
  avatar: string | null
  specialty: string
  profession: string
  lastActivity: string
  lastActivityDate: string
  isActive: boolean
  videos: UserVideo[]
  bio?: string
  followers?: number
}

interface FeedVideo extends UserVideo {
  professionalId: string
  professionalName: string
  professionalAvatar: string | null
  professionalSpecialty: string
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

// Done default
const defaultSubscriptions: SubscribedProfessional[] = [
  {
    id: 'prof-1',
    name: 'Marie Dupont',
    avatar: null,
    specialty: 'Architecte d\'intérieur',
    profession: 'Architecture',
    bio: 'Spécialiste en design moderne et écologique.',
    followers: 2450,
    lastActivity: 'Nouvelle vidéo publiée',
    lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    videos: []
  },
  {
    id: 'prof-2',
    name: 'Jean Pierre',
    avatar: null,
    specialty: 'Designer UX/UI',
    profession: 'Design',
    bio: 'Passionné par l\'expérience utilisateur.',
    followers: 1890,
    lastActivity: 'Projet mis à jour',
    lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    videos: []
  },
  {
    id: 'prof-3',
    name: 'Sophie Laurent',
    avatar: null,
    specialty: 'Ingénieur BTP',
    profession: 'Génie Civil',
    bio: 'Expert en construction durable.',
    followers: 3200,
    lastActivity: 'A commencé à vous suivre',
    lastActivityDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    videos: []
  },
  {
    id: 'prof-4',
    name: 'Marc Bernard',
    avatar: null,
    specialty: 'Décorateur',
    profession: 'Décoration',
    bio: 'Transforme vos espaces.',
    followers: 1560,
    lastActivity: 'Profil mis à jour',
    lastActivityDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    videos: []
  }
]

export const Subscriptions = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  // State - ONGLET FIL D'ACTIVITÉ ANVAN
  const [subscriptions, setSubscriptions] = useState<SubscribedProfessional[]>([])
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'favorites'>('feed')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortFavorites, setSortFavorites] = useState<'date' | 'popular' | 'professional'>('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [selectedProfessional, setSelectedProfessional] = useState<SubscribedProfessional | null>(null)

  useEffect(() => {
    const savedSubs = localStorage.getItem('exile_subscriptions')
    const savedFavs = localStorage.getItem('exile_favorites')
    
    try {
      if (savedSubs) {
        const parsed = JSON.parse(savedSubs)
        
        // Verify if parsed is array of objects or strings
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if first item is object (correct format) or string (wrong format)
          if (typeof parsed[0] === 'object' && parsed[0] !== null) {
            setSubscriptions(parsed)
          } else {
            setSubscriptions(defaultSubscriptions)
            localStorage.setItem('exile_subscriptions', JSON.stringify(defaultSubscriptions))
          }
        } else {
          setSubscriptions(defaultSubscriptions)
          localStorage.setItem('exile_subscriptions', JSON.stringify(defaultSubscriptions))
        }
      } else {
        setSubscriptions(defaultSubscriptions)
        localStorage.setItem('exile_subscriptions', JSON.stringify(defaultSubscriptions))
      }
      
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs))
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      setSubscriptions(defaultSubscriptions)
      localStorage.setItem('exile_subscriptions', JSON.stringify(defaultSubscriptions))
    }
  }, [])

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

  const addToFavorites = (video: FeedVideo) => {
    const exists = favorites.find(f => f.videoId === video.id)
    if (exists) {
      showToast('Déjà dans vos favoris')
      return
    }
    
    const newFav: FavoriteVideo = {
      videoId: video.id,
      title: video.title,
      professionalId: video.professionalId,
      professionalName: video.professionalName,
      professionalAvatar: video.professionalAvatar,
      thumbnail: video.thumbnail,
      duration: video.duration,
      addedAt: new Date().toISOString(),
      likes: video.likes
    }
    
    const updated = [newFav, ...favorites]
    setFavorites(updated)
    localStorage.setItem('exile_favorites', JSON.stringify(updated))
    showToast('Ajouté aux favoris')
  }

  const removeFromFavorites = (videoId: string) => {
    const updated = favorites.filter(f => f.videoId !== videoId)
    setFavorites(updated)
    localStorage.setItem('exile_favorites', JSON.stringify(updated))
    showToast('Retiré des favoris')
  }

  const getFeedVideos = (): FeedVideo[] => {
    const feed: FeedVideo[] = []
    subscriptions.forEach(sub => {
      feed.push({
        id: `video-${sub.id}-1`,
        title: 'Tutoriel: Techniques avancées 2024',
        thumbnail: '',
        postedAt: sub.lastActivityDate,
        views: 1200 + Math.floor(Math.random() * 5000),
        likes: 45 + Math.floor(Math.random() * 200),
        comments: 12 + Math.floor(Math.random() * 50),
        duration: '8:30',
        professionalId: sub.id,
        professionalName: sub.name,
        professionalAvatar: sub.avatar,
        professionalSpecialty: sub.specialty
      })
      feed.push({
        id: `video-${sub.id}-2`,
        title: 'Avant/Après: Transformation complète',
        thumbnail: '',
        postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        views: 800 + Math.floor(Math.random() * 3000),
        likes: 30 + Math.floor(Math.random() * 150),
        comments: 8 + Math.floor(Math.random() * 40),
        duration: '12:45',
        professionalId: sub.id,
        professionalName: sub.name,
        professionalAvatar: sub.avatar,
        professionalSpecialty: sub.specialty
      })
    })
    
    return feed.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && sub.isActive) || 
      (filterStatus === 'inactive' && !sub.isActive)
    
    const matchesSearch = searchQuery === '' || 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Fallback: si subscriptions vid, itilize default
  const displaySubscriptions = filteredSubscriptions.length > 0 ? filteredSubscriptions : defaultSubscriptions

  const sortedFavorites = [...favorites].sort((a, b) => {
    if (sortFavorites === 'date') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    if (sortFavorites === 'popular') return b.likes - a.likes
    return a.professionalName.localeCompare(b.professionalName)
  })

  const filteredFeedVideos = getFeedVideos().filter(video => {
    if (searchQuery === '') return true
    return video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           video.professionalName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // UI Components
  const StatCard = ({ value, label, icon: Icon }: { value: string | number, label: string, icon: any }) => (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700/60 hover:border-zinc-600' : 'bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700'} rounded-xl p-4 flex items-center gap-3 border transition-colors`}>
      <div className={`w-10 h-10 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-950/40'} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-400'}`}>{label}</p>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} pb-20`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Premium */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 md:mt-0`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pro')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Centre d'activité</h1>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Suivez vos abonnements et découvrez du nouveau contenu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-3">
          <StatCard value={subscriptions.length} label="Abonnements" icon={Users} />
          <StatCard value={getFeedVideos().length} label="Vidéos" icon={Play} />
          <StatCard value={favorites.length} label="Favoris" icon={Heart} />
          <StatCard value={subscriptions.filter(s => s.isActive).length} label="Actifs" icon={TrendingUp} />
        </div>

        {/* Onglets - FIL D'ACTIVITÉ ANVAN */}
        <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 mb-4 overflow-hidden">
          <div className="flex">
            {[
              { id: 'feed', label: "Fil d'activité", icon: Play },
              { id: 'following', label: 'Abonnements', icon: Users },
              { id: 'favorites', label: 'Favoris', icon: Heart }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === t.id 
                    ? 'text-blue-400 bg-blue-950/20 border-b-2 border-blue-500' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-b-2 border-transparent'
                }`}
              >
                <t.icon className="w-4 h-4" /> 
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bar filtres compact */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>
          
          {activeTab === 'following' && (
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'active', label: 'Actifs' },
                { id: 'inactive', label: 'Inactifs' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === f.id 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          
          {activeTab === 'favorites' && (
            <select
              value={sortFavorites}
              onChange={(e) => setSortFavorites(e.target.value as any)}
              className="px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="date">Plus récents</option>
              <option value="popular">Populaires</option>
              <option value="professional">Par profil</option>
            </select>
          )}
        </div>

        {/* KONTNI */}
        
        {/* ONGLET 1: Fil d'activité - ANVAN */}
        {activeTab === 'feed' && (
          <div>
            {filteredFeedVideos.length === 0 ? (
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-8 text-center">
                <div className="w-16 h-16 bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Play className="w-8 h-8 text-blue-400/60" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Fil vide</h3>
                <p className="text-sm text-zinc-400">Abonnez-vous pour voir du contenu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredFeedVideos.map((video) => (
                  <div key={video.id} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 overflow-hidden hover:border-zinc-700 transition-all group">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Play className="w-10 h-10 text-white/90 group-hover:scale-110 transition-transform" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => addToFavorites(video)}
                          className="bg-zinc-800 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-700 border border-zinc-700"
                        >
                          <Heart className="w-3.5 h-3.5" /> Favori
                        </button>
                      </div>
                    </div>
                    
                    {/* Info compact */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                          {video.professionalAvatar ? (
                            <img src={video.professionalAvatar} alt={video.professionalName || 'Pro'} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            video.professionalName?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{video.professionalName}</p>
                          <p className="text-[10px] text-zinc-500">{video.professionalSpecialty}</p>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-medium text-white line-clamp-1 mb-2">{video.title}</h4>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {video.likes}</span>
                        </div>
                        <span className="text-zinc-500">{new Date(video.postedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
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
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-8 text-center">
                <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Aucun favori</h3>
                <p className="text-sm text-zinc-400">Sauvegardez vos vidéos préférées</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedFavorites.map((fav) => (
                  <div key={fav.videoId} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 overflow-hidden hover:border-zinc-700 transition-all group">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Play className="w-10 h-10 text-white/90" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {fav.duration}
                      </span>
                      
                      <button
                        onClick={() => removeFromFavorites(fav.videoId)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                          {fav.professionalAvatar ? (
                            <img src={fav.professionalAvatar} alt={fav.professionalName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            fav.professionalName.charAt(0)
                          )}
                        </div>
                        <p className="text-xs font-medium text-white">{fav.professionalName}</p>
                      </div>
                      
                      <h4 className="text-sm font-medium text-white line-clamp-1 mb-2">{fav.title}</h4>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {fav.likes}</span>
                        <span className="text-zinc-500">{new Date(fav.addedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal konfimasyon */}
        {unsubscribeConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-800">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-bold text-white">Se désabonner ?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Vous ne verrez plus son contenu
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUnsubscribeConfirm(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => unsubscribe(unsubscribeConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal profil */}
        {selectedProfessional && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Profil</h3>
                <button 
                  onClick={() => setSelectedProfessional(null)}
                  className="p-1.5 hover:bg-zinc-800 rounded-full"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              
              <div className="text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
                  {selectedProfessional.avatar ? (
                    <img src={selectedProfessional.avatar} alt={selectedProfessional.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedProfessional.name.charAt(0)
                  )}
                </div>
                <h4 className="font-bold text-white">{selectedProfessional.name}</h4>
                <p className="text-sm text-blue-400">{selectedProfessional.specialty}</p>
                <p className="text-xs text-zinc-500">{selectedProfessional.profession}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800/60 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedProfessional.followers?.toLocaleString()}</p>
                  <p className="text-xs text-zinc-400">Abonnés</p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedProfessional.videos?.length || 2}</p>
                  <p className="text-xs text-zinc-400">Vidéos</p>
                </div>
              </div>
              
              {selectedProfessional.bio && (
                <p className="text-sm text-zinc-400 mb-4">{selectedProfessional.bio}</p>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedProfessional(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    setSelectedProfessional(null)
                    setUnsubscribeConfirm(selectedProfessional.id)
                  }}
                  className="flex-1 py-2.5 bg-red-950/30 text-red-400 rounded-xl font-medium hover:bg-red-950/50 transition-colors"
                >
                  Se désabonner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Subscriptions
