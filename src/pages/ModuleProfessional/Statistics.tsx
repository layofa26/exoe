import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Eye,
  ThumbsUp,
  BarChart3,
  PieChart,
  Share2,
  ArrowLeft
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface StatCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ElementType
  color: string
}

const StatCard = ({ title, value, change, isPositive, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span>{change}</span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

export const Statistics = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const stats = [
    {
      title: 'Vues totales',
      value: '125.4K',
      change: '+12.5% ce mois',
      isPositive: true,
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      title: 'Nouveaux abonnés',
      value: '2,847',
      change: '+8.2% ce mois',
      isPositive: true,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Likes reçus',
      value: '8.9K',
      change: '+15.3% ce mois',
      isPositive: true,
      icon: ThumbsUp,
      color: 'bg-red-500'
    },
    {
      title: 'Commentaires',
      value: '1,234',
      change: '-2.1% ce mois',
      isPositive: false,
      icon: MessageSquare,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 mb-4 sm:mb-6 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pro/settings')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Statistiques</h1>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Analysez vos performances</p>
              </div>

              {/* Period selector */}
              <div className={`flex gap-1 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg p-1 shadow-sm border`}>
                {[
                  { id: '7d', label: '7 jours' },
                  { id: '30d', label: '30 jours' },
                  { id: '90d', label: '90 jours' },
                  { id: '1y', label: '1 an' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      period === p.id
                        ? 'bg-primary text-white'
                        : resolvedTheme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Main Chart Placeholder */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Évolution des vues</h2>
            </div>
            <div className="h-64 bg-gray-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-zinc-400">Graphique d'évolution (à implémenter avec une librairie de charts)</p>
            </div>
          </div>

          {/* Engagement Chart */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Engagement par vidéo</h2>
            </div>
            <div className={`h-64 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
              <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Graphique d'engagement (à implémenter)</p>
            </div>
          </div>
        </div>

        {/* Audience Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Demographics */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Démographie</h2>
            </div>
            <div className={`h-64 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
              <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Graphique démographique (à implémenter)</p>
            </div>
          </div>

          {/* Geographic */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <Share2 className="w-5 h-5 text-primary" />
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Répartition géographique</h2>
            </div>
            <div className="space-y-3">
              {[
                { country: 'France', percentage: 65, flag: '🇫🇷' },
                { country: 'Belgique', percentage: 12, flag: '🇧🇪' },
                { country: 'Suisse', percentage: 8, flag: '🇨🇭' },
                { country: 'Canada', percentage: 7, flag: '🇨🇦' },
                { country: 'Autres', percentage: 8, flag: '🌍' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-lg">{item.flag}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>{item.country}</span>
                      <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.percentage}%</span>
                    </div>
                    <div className={`h-2 ${resolvedTheme === 'dark' ? 'bg-zinc-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Performing */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Meilleures vidéos</h2>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Comment rénovation...', views: '45.2K', likes: '2.1K' },
                { title: 'Tutoriel décoration...', views: '32.1K', likes: '1.8K' },
                { title: 'Avant/Après salon...', views: '28.5K', likes: '1.5K' },
                { title: 'Conseils éclairage...', views: '21.3K', likes: '1.2K' },
                { title: 'Choisir ses couleurs...', views: '18.7K', likes: '980' }
              ].map((video, index) => (
                <div key={index} className={`flex items-center gap-3 p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'} rounded-lg transition-colors`}>
                  <span className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300' : 'bg-gray-200 text-gray-600'} rounded-full flex items-center justify-center text-sm font-bold`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{video.title}</p>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{video.views} vues • {video.likes} likes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
