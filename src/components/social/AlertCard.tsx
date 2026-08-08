import { AlertTriangle, CheckCircle, TrendingUp, Share2, MessageCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Alert } from '../../types/social/alert'

interface AlertCardProps {
  alert: Alert
  onShare?: () => void
  onComment?: () => void
}

export const AlertCard = ({ alert, onShare, onComment }: AlertCardProps): JSX.Element => {
  const { resolvedTheme } = useTheme()

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return resolvedTheme === 'dark' ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-orange-100 text-orange-700 border-orange-200'
      default: return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getBorderColor = (type: string, priority: string): string => {
    if (priority === 'high') return 'border-red-500'
    if (type === 'urgency') return 'border-red-500'
    if (type === 'health') return 'border-emerald-500'
    if (type === 'recruitment') return 'border-blue-500'
    if (type === 'event') return 'border-purple-500'
    if (type === 'video') return 'border-pink-500'
    if (type === 'promotion') return 'border-amber-500'
    return 'border-social'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgency': return <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'health': return <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      default: return <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    }
  }

  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 sm:p-6 border-l-4 shadow-sm hover:shadow-md transition-shadow ${getBorderColor(alert.type, alert.priority)}`}>
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        {/* Icon */}
        <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg ${getPriorityColor(alert.priority)} flex-shrink-0`}>
          {getTypeIcon(alert.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Institution */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className={`font-semibold text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {alert.institution.name}
            </span>
            {alert.institution.verified && (
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            )}
            <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>•</span>
            <span className={`text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {alert.createdAt}
            </span>
            {alert.isBoosted && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-social/20 text-social text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Boosté
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-sm sm:text-base md:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>
            {alert.title}
          </h3>

          {/* Description */}
          <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-3 sm:mb-4 line-clamp-2`}>
            {alert.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs">
            <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
              {alert.stats.views} vues
            </span>
            <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
              {alert.stats.shares} partages
            </span>
            {alert.type !== 'urgency' && (
              <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
                {alert.stats.comments} commentaires
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
        <button
          onClick={onShare}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium ${
            resolvedTheme === 'dark'
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors`}
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Partager
        </button>
        {alert.type !== 'urgency' && (
          <button
            onClick={onComment}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition-colors`}
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Commenter
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertCard
