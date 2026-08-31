import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  MapPin,
  Briefcase,
  ExternalLink,
  Sparkles,
  Calendar,
  X
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from '../../hooks/useQuery'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface Subscriber {
  id: string
  userId?: string
  username: string
  avatar: string
  profession: string
  location: string
  subscribedAt: string
  isFollowing: boolean
}

export const Subscribers = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent'>('all')

  // SWR query avec chargement instantané (0ms) depuis le cache
  const {
    data: cachedSubscribers,
    isLoading: loading,
    setData: setSubscribers
  } = useQuery<Subscriber[]>(
    async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        if (!token) return []

        const response = await fetch(`${API_BASE_URL}/abonnement/abonnements/subscribers/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) return []
        
        const data = await response.json()
        const subscribersData = Array.isArray(data) ? data : (data.results || [])
        
        return subscribersData.map((sub: any) => {
          const rawUser = sub.user || sub.abonne || sub
          const rawUsername = rawUser?.username || sub.username || 'Utilisateur'
          const formattedUsername = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`
          
          return {
            id: String(sub.id),
            userId: String(rawUser?.id || sub.user_id || sub.id),
            username: formattedUsername,
            avatar: rawUser?.avatar || rawUser?.photo || sub.avatar || '',
            profession: rawUser?.profession || sub.profession || 'Professionnel',
            location: rawUser?.city && rawUser?.country 
              ? `${rawUser.city}, ${rawUser.country}` 
              : rawUser?.city || rawUser?.country || rawUser?.location || 'Non renseigné',
            subscribedAt: sub.created_at || new Date().toISOString(),
            isFollowing: false
          }
        })
      } catch (error) {
        console.error('Error loading subscribers:', error)
        return []
      }
    },
    {
      cacheKey: 'pro:subscribers:list',
      cacheTime: 5 * 60 * 1000,
      initialData: []
    }
  )

  const subscribers = cachedSubscribers || []

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filter === 'recent') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return matchesSearch && new Date(sub.subscribedAt) > thirtyDaysAgo
    }
    return matchesSearch
  })

  const stats = {
    total: subscribers.length,
    recent: subscribers.filter(s => new Date(s.subscribedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
  }

  const toggleFollow = (id: string) => {
    setSubscribers(subs => 
      subs ? subs.map(sub => 
        sub.id === id ? { ...sub, isFollowing: !sub.isFollowing } : sub
      ) : []
    )
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} pb-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pro/profile')}
            className={`p-2.5 rounded-xl border transition-all ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-900'
            } shadow-sm active:scale-95`}
            title="Retour au profil"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mes abonnés</h1>
            </div>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              Consultez et interagissez avec les membres qui vous suivent
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl">
          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Total Abonnés</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold">{stats.total}</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Nouveaux (30j)</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-500">+{stats.recent}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className={`p-3 sm:p-4 rounded-2xl border ${
          resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
        } shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`}>
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher un abonné par nom, profession ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 py-2 rounded-xl text-sm border transition-colors ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Tous', count: stats.total },
              { id: 'recent', label: 'Récents', count: stats.recent }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filter === f.id ? 'bg-white/20 text-white' : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subscribers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`rounded-2xl border p-4 animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-3/4 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                    <div className={`h-3 w-1/2 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {searchQuery ? 'Aucun abonné trouvé' : 'Aucun abonné pour le moment'}
            </h3>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Modifiez votre recherche.' : 'Publiez des vidéos et participez aux événements pour développer votre audience.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSubscribers.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-white/10">
                        {sub.avatar ? (
                          <img src={sub.avatar} alt={sub.username} className="w-full h-full object-cover" />
                        ) : (
                          sub.username.replace('@', '').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm sm:text-base truncate text-gray-900 dark:text-white">
                          {sub.username}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 truncate">
                          <Briefcase className="w-3 h-3 flex-shrink-0 text-blue-500" />
                          <span className="truncate">{sub.profession}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/pro/conversations?to=${sub.userId || sub.id}`)}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 transition-colors flex-shrink-0"
                      title="Envoyer un message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-zinc-400 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{sub.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Abonné depuis le {new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleFollow(sub.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      sub.isFollowing
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {sub.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Abonné</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>S'abonner en retour</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/pro/profile/${sub.userId || sub.id}`)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    title="Voir le profil public"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Subscribers
