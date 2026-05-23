import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, Search, MoreVertical, User, Calendar, TrendingUp, MessageSquare, Users, UserCheck, UserPlus, Download, MessageCircle, MoreHorizontal, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent' | 'mutual'>('all')

  useEffect(() => {
    // Données de démo
    const demoSubscribers: Subscriber[] = [
      {
        id: '1',
        name: 'Marie Martin',
        username: '@mariemartin',
        avatar: '',
        profession: 'Designer d\'intérieur',
        location: 'Lyon, France',
        subscribedAt: '2024-01-15',
        isFollowing: true,
        mutualConnections: 12
      },
      {
        id: '2',
        name: 'Pierre Bernard',
        username: '@pierrebernard',
        avatar: '',
        profession: 'Architecte',
        location: 'Marseille, France',
        subscribedAt: '2024-01-10',
        isFollowing: false,
        mutualConnections: 5
      },
      {
        id: '3',
        name: 'Sophie Dubois',
        username: '@sophiedubois',
        avatar: '',
        profession: 'Décoratrice',
        location: 'Bordeaux, France',
        subscribedAt: '2024-01-08',
        isFollowing: true,
        mutualConnections: 8
      },
      {
        id: '4',
        name: 'Lucas Petit',
        username: '@lucaspetit',
        avatar: '',
        profession: 'Entrepreneur',
        location: 'Paris, France',
        subscribedAt: '2024-01-05',
        isFollowing: false,
        mutualConnections: 0
      },
      {
        id: '5',
        name: 'Emma Roux',
        username: '@emmaroux',
        avatar: '',
        profession: 'Journaliste',
        location: 'Nantes, France',
        subscribedAt: '2024-01-03',
        isFollowing: true,
        mutualConnections: 3
      }
    ]
    setSubscribers(demoSubscribers)
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

  const stats = {
    total: subscribers.length,
    newThisMonth: subscribers.filter(s => new Date(s.subscribedAt) > new Date('2024-01-01')).length,
    mutual: subscribers.filter(s => s.mutualConnections > 0).length,
    following: subscribers.filter(s => s.isFollowing).length
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 mb-6 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pro/settings')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mes abonnés</h1>
                <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez votre communauté</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <Users className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Nouveaux</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{stats.newThisMonth}</p>
            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>ce mois</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Mutuels</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.mutual}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
              <UserPlus className="w-4 h-4" />
              <span className="text-sm">Vous suivez</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.following}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-4 mb-6 border`}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un abonné..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${resolvedTheme === 'dark' ? 'border-zinc-600 bg-zinc-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
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
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export */}
            <button className={`flex items-center gap-2 px-4 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          </div>
        </div>

        {/* Subscribers List */}
        {filteredSubscribers.length === 0 ? (
          <div className={`text-center py-16 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
            <Users className={`w-16 h-16 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              {searchQuery ? 'Aucun abonné trouvé' : 'Pas encore d\'abonnés'}
            </h3>
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Essayez une autre recherche' : 'Partagez votre profil pour gagner des abonnés'}
            </p>
          </div>
        ) : (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm overflow-hidden border`}>
            {filteredSubscribers.map((subscriber, index) => (
              <div
                key={subscriber.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'} transition-colors ${index !== filteredSubscribers.length - 1 ? resolvedTheme === 'dark' ? 'border-b border-zinc-700' : 'border-b border-gray-100' : ''}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-pro to-emerald-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {subscriber.name.charAt(0)}
                  </div>
                  {subscriber.mutualConnections > 0 && (
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center border-2 ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-white'}`}>
                      {subscriber.mutualConnections}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{subscriber.name}</h3>
                    <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{subscriber.username}</span>
                  </div>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{subscriber.profession}</p>
                  <div className={`flex items-center gap-3 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-1`}>
                    <span>{subscriber.location}</span>
                    <span>•</span>
                    <span>Abonné depuis {new Date(subscriber.subscribedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {subscriber.mutualConnections > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {subscriber.mutualConnections} connexion{subscriber.mutualConnections > 1 ? 's' : ''} en commun
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} hover:text-primary rounded-lg transition-colors`}>
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => toggleFollow(subscriber.id)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      subscriber.isFollowing
                        ? resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {subscriber.isFollowing ? 'Suivi' : 'Suivre'}
                  </button>
                  <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}>
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
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
