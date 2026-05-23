import { useState, useEffect } from 'react'
import { 
  X, 
  MessageSquare, 
  Send, 
  Inbox, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  BarChart3,
  Users,
  Percent
} from 'lucide-react'
import type { ConversationStats as ConversationStatsType } from '../../types/requests'
import { useTheme } from '../../contexts/ThemeContext'

interface ConversationStatsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export const ConversationStatsModal = ({ isOpen, onClose, userId }: ConversationStatsModalProps) => {
  const { resolvedTheme } = useTheme()
  const [stats, setStats] = useState<ConversationStatsType | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    if (!isOpen) return

    // Load stats from localStorage
    const savedStats = localStorage.getItem('exile_conversation_stats')
    const allStats: ConversationStatsType[] = savedStats ? JSON.parse(savedStats) : []
    const userStats = allStats.find(s => s.userId === userId)

    if (userStats) {
      setStats(userStats)
    } else {
      // Generate default stats from local data
      generateStats()
    }
  }, [isOpen, userId])

  const generateStats = () => {
    // Get data from localStorage
    const savedConversations = localStorage.getItem('exile_conversations')
    const savedRequests = localStorage.getItem('exile_requests')
    
    const conversations: any[] = savedConversations ? JSON.parse(savedConversations) : []
    const requests: any[] = savedRequests ? JSON.parse(savedRequests) : []

    // Calculate stats
    const userConversations = conversations.filter(c => 
      c.participantIds.includes(userId)
    )

    const userRequests = requests.filter(r => 
      r.senderId === userId || r.receiverId === userId
    )

    const totalMessagesSent = userConversations.reduce((acc, conv) => {
      return acc + conv.messages.filter((m: any) => m.senderId === userId).length
    }, 0)

    const totalMessagesReceived = userConversations.reduce((acc, conv) => {
      return acc + conv.messages.filter((m: any) => m.senderId !== userId).length
    }, 0)

    const pendingRequests = userRequests.filter(r => r.status === 'pending').length
    const acceptedRequests = userRequests.filter(r => r.status === 'accepted').length
    const rejectedRequests = userRequests.filter(r => r.status === 'rejected').length
    const totalRequests = userRequests.length

    const acceptanceRate = totalRequests > 0 
      ? Math.round((acceptedRequests / totalRequests) * 100) 
      : 0

    const newStats: ConversationStatsType = {
      userId,
      totalConversations: userConversations.length,
      totalMessagesSent,
      totalMessagesReceived,
      averageResponseTime: 0, // Would need timestamps calculation
      acceptanceRate,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      updatedAt: new Date().toISOString()
    }

    setStats(newStats)

    // Save to localStorage
    const savedStats = localStorage.getItem('exile_conversation_stats')
    const allStats: ConversationStatsType[] = savedStats ? JSON.parse(savedStats) : []
    const filtered = allStats.filter(s => s.userId !== userId)
    localStorage.setItem('exile_conversation_stats', JSON.stringify([...filtered, newStats]))
  }

  if (!isOpen || !stats) return null

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color = 'blue',
    trend
  }: { 
    icon: any, 
    label: string, 
    value: string | number,
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
    trend?: { value: number, positive: boolean }
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600'
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`text-xs font-medium flex items-center gap-1 ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} />
              {trend.value}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Statistiques de messagerie
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vue d'ensemble de votre activité
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : 'Tout'}
                </button>
              ))}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={MessageSquare}
              label="Conversations"
              value={stats.totalConversations}
              color="blue"
            />
            <StatCard
              icon={Send}
              label="Messages envoyés"
              value={stats.totalMessagesSent}
              color="green"
            />
            <StatCard
              icon={Inbox}
              label="Messages reçus"
              value={stats.totalMessagesReceived}
              color="purple"
            />
            <StatCard
              icon={Percent}
              label="Taux d'acceptation"
              value={`${stats.acceptanceRate}%`}
              color="orange"
            />
          </div>

          {/* Request Status Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Répartition des demandes
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingRequests}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.acceptedRequests}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Acceptées</p>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.rejectedRequests}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Refusées</p>
              </div>
            </div>
          </div>

          {/* Activity Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations clés
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total des messages</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalMessagesSent + stats.totalMessagesReceived}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ratio envoi/réception</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalMessagesReceived > 0 
                    ? (stats.totalMessagesSent / stats.totalMessagesReceived).toFixed(2)
                    : 'N/A'}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(stats.updatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={generateStats}
            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Rafraîchir les statistiques
          </button>
        </div>
      </div>
    </div>
  )
}
