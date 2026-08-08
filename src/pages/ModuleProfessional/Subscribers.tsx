import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, Users, UserCheck, UserPlus, Download, MessageCircle, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface Subscriber {
  id: string
  name: string
  username: string
  avatar: string
  profession: string
  location: string
  subscribedAt: string
  isFollowing: boolean
  mutualConnections: number
}

export const Subscribers = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent' | 'mutual'>('all')

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        
        const response = await fetch('${API_BASE_URL}/v1/abonnement/abonnements/subscribers/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        const subscribersData = data.results || data
        
        setSubscribers(subscribersData.map((sub: any) => ({
          id: sub.id,
          name: sub.user?.full_name || sub.professionnel || 'Utilisateur',
          username: sub.user?.username || '@user',
          avatar: sub.user?.avatar || '',
          profession: sub.user?.profession || 'Non renseigné',
          location: sub.user?.city && sub.user?.country 
            ? `${sub.user.city}, ${sub.user.country}` 
            : sub.user?.city || sub.user?.country || 'Non renseigné',
          subscribedAt: sub.created_at,
          isFollowing: false,
          mutualConnections: 0
        })))
      } catch (error) {
        console.error('Error loading subscribers:', error)
        setSubscribers([])
      } finally {
        setLoading(false)
      }
    }
    loadSubscribers()
  }, [])

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.profession.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filter === 'recent') {
      return matchesSearch && new Date(sub.subscribedAt) > new Date('2024-01-01')
    }
    if (filter === 'mutual') {
      return matchesSearch && sub.mutualConnections > 0
    }
    return matchesSearch
  })

  const toggleFollow = (id: string) => {
    setSubscribers(subs => 
      subs.map(sub => 
        sub.id === id ? { ...sub, isFollowing: !sub.isFollowing } : sub
      )
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = {
    total: subscribers.length,
    newThisMonth: subscribers.filter(s => new Date(s.subscribedAt) > new Date('2024-01-01')).length,
    mutual: subscribers.filter(s => s.mutualConnections > 0).length,
    following: subscribers.filter(s => s.isFollowing).length
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 mb-4 sm:mb-6 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-3 sm:py-4`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/pro/profile')}
              className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <h1 className={`text-lg sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mes abonnés</h1>
                <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez votre communauté</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-2.5 sm:p-4 shadow-sm border`}>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Total</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-2.5 sm:p-4 shadow-sm border`}>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Nouveaux</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{stats.newThisMonth}</p>
            <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>ce mois</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-2.5 sm:p-4 shadow-sm border`}>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Mutuels</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.mutual}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-2.5 sm:p-4 shadow-sm border`}>
            <div className={`flex items-center gap-1.5 sm:gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Vous suivez</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.following}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 border`}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un abonné..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border ${resolvedTheme === 'dark' ? 'border-zinc-600 bg-zinc-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
            </div>

            {/* Filter */}
            <div className="flex gap-1 sm:gap-2">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'recent', label: 'Récents' },
                { id: 'mutual', label: 'Mutuels' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export */}
            <button className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}>
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Exporter</span>
            </button>
          </div>
        </div>

        {/* Subscribers List */}
        {filteredSubscribers.length === 0 ? (
          <div className={`text-center py-12 sm:py-16 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
            <Users className={`w-12 h-12 sm:w-16 sm:h-16 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-300'} mx-auto mb-3 sm:mb-4`} />
            <h3 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>
              {searchQuery ? 'Aucun abonné trouvé' : 'Pas encore d\'abonnés'}
            </h3>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Essayez une autre recherche' : 'Partagez votre profil pour gagner des abonnés'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-1">
            {filteredSubscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'} border-l-4 border-purple-500 rounded-r-lg p-2.5 sm:p-3 transition-colors`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-pro to-emerald-400 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">
                      {subscriber.name.charAt(0)}
                    </div>
                    {subscriber.mutualConnections > 0 && (
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-500 text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center border-2 ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-white'}`}>
                        {subscriber.mutualConnections}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{subscriber.name}</h3>
                      <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>@{subscriber.username}</span>
                    </div>
                    <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{subscriber.profession}</p>
                    <div className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-0.5 sm:mt-1`}>
                      <span className="truncate">{subscriber.location}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Abonné depuis {new Date(subscriber.subscribedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} hover:text-primary rounded-lg transition-colors`}>
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => toggleFollow(subscriber.id)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                        subscriber.isFollowing
                          ? resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {subscriber.isFollowing ? 'Suivi' : 'Suivre'}
                    </button>
                  </div>
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
