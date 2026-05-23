import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, AlertTriangle, Briefcase, Calendar } from 'lucide-react'
import ActionGate from '../../components/auth/ActionGate'
import { useTheme } from '../../contexts/ThemeContext'

interface AlertItem {
  id: string
  type: 'urgency' | 'health' | 'recruitment' | 'announcement' | 'event'
  title: string
  institution: string
  time: string
  priority: 'high' | 'medium' | 'low'
}

export const SocialFeed = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'urgency',
      title: 'Urgence: Fermeture route nationale',
      institution: 'Ministère des Transports',
      time: 'Il y a 2h',
      priority: 'high',
    },
    {
      id: '2',
      type: 'recruitment',
      title: 'Recrutement: Développeur Web Senior',
      institution: 'Hôpital Saint-Jean',
      time: 'Il y a 5h',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'event',
      title: 'Conférence: Innovation en santé',
      institution: 'Université d\'État',
      time: 'Il y a 1j',
      priority: 'low',
    },
  ]

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return resolvedTheme === 'dark' ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-orange-100 text-orange-700 border-orange-200'
      default: return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgency': return <AlertTriangle className="w-4 h-4" />
      case 'recruitment': return <Briefcase className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      default: return <Building2 className="w-4 h-4" />
    }
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* Hero */}
      <div className="bg-gradient-to-r from-social to-blue-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-6 h-6" />
            <span className="text-lg font-semibold">Module Social Institutionnel</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Alertes et informations officielles
          </h1>
          <p className="text-blue-100">
            Institutions vérifiées uniquement
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex space-x-2 overflow-x-auto">
            {['all', 'urgency', 'health', 'recruitment', 'event'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'Tous' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded-xl p-6 border-l-4 shadow-sm ${
                alert.priority === 'high' ? 'border-red-500' : 
                alert.priority === 'medium' ? 'border-orange-500' : 'border-social'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${getPriorityColor(alert.priority)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{alert.institution}</span>
                    <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>•</span>
                    <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{alert.time}</span>
                  </div>
                  <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {alert.title}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <ActionGate action="share">
                      <button className="text-sm text-social hover:underline">
                        Partager
                      </button>
                    </ActionGate>
                    {alert.type === 'recruitment' && (
                      <Link
                        to={`/social/jobs/apply/${alert.id}`}
                        className="text-sm text-social font-semibold hover:underline"
                      >
                        Postuler
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SocialFeed
