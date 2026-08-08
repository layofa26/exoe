import { Calendar, MapPin, Clock, Users, CheckCircle, Share2, TrendingUp, Video, User } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { SocialEvent } from '../../types/social/event'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface EventCardProps {
  event: SocialEvent
  onRegister?: () => void
  onShare?: () => void
  onJoinLive?: () => void
  onReaction?: (emoji: string) => void
  isAuthenticated?: boolean
}

export const EventCard = ({ event, onRegister, onShare, onJoinLive, onReaction, isAuthenticated = false }: EventCardProps): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)

  const getFormatColor = (format: string): string => {
    switch (format) {
      case 'in-person': return resolvedTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
      case 'virtual': return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
      case 'hybrid': return resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
      default: return resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
    }
  }

  const getFormatLabel = (format: string): string => {
    switch (format) {
      case 'in-person': return 'En personne'
      case 'virtual': return 'Virtuel'
      case 'hybrid': return 'Hybride'
      default: return format
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const handleReaction = (emoji: string) => {
    setSelectedReaction(emoji)
    onReaction?.(emoji)
    setTimeout(() => setSelectedReaction(null), 300)
  }

  const isLive = event.liveStatus === 'live'
  const isAtComing = event.liveStatus === 'at_coming'
  const participants = event.participantsCount ?? event.stats.registrations
  const maxParticipants = event.maxParticipants ?? event.capacity
  const isFull = participants >= maxParticipants
  const canJoinLive = isAuthenticated && isLive && !!event.jitsiRoom
  const showJoinButton = isLive
  const showRegisterButton = isAtComing && !isFull
  const showFullBadge = isFull && !event.isRegistered
  const showRegisteredBadge = event.isRegistered

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 sm:p-6 border-l-4 ${isLive ? 'border-red-500' : 'border-purple-500'} shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
    >
      {/* Header - Responsive Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        {/* Icon - Changes based on Live status */}
        <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0 ${isLive ? (resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') : (resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700')}`}>
          {isLive ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          {/* Institution */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className={`font-semibold text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {event.institution.name}
            </span>
            {event.institution.verified && (
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            )}
            {event.isBoosted && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-social/20 text-social text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Boosté
              </span>
            )}
          </div>

          {/* Title with Live Badge */}
          <div className="flex items-start gap-2 mb-1.5 sm:mb-2">
            <h3 className={`text-sm sm:text-base md:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-2 flex-1`}>
              {event.title}
            </h3>
            {isLive && (
              <span className="flex-shrink-0 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full animate-pulse flex items-center gap-0.5 sm:gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping"></span>
                EN DIRECT
              </span>
            )}
          </div>

          {/* Description */}
          <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-2 sm:mb-3 line-clamp-2`}>
            {event.description}
          </p>

          {/* Speaker Info */}
          {event.speaker && (
            <div className={`flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              {event.speaker.avatar ? (
                <img src={event.speaker.avatar} alt={event.speaker.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="text-xs sm:text-sm">{event.speaker.name}</span>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              {formatDate(event.startDate)}
            </div>
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {formatTime(event.startDate)}
            </div>
            {event.location && (
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                {event.location.city}
              </div>
            )}
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              {participants} / {maxParticipants}
            </div>
          </div>

          {/* Format Badge */}
          <div className="mb-2 sm:mb-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getFormatColor(event.format)}`}>
              {getFormatLabel(event.format)}
            </span>
          </div>

          {/* Price */}
          <div className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-2 sm:mb-3`}>
            {event.price === 0 ? 'Gratuit' : `${event.price} HTG`}
          </div>

          {/* Stats */}
          <div className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
            {event.stats.views} vues • {event.stats.shares} partages
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
        {/* Primary Action Button */}
        {showJoinButton && (
          <button
            onClick={onJoinLive}
            disabled={!canJoinLive}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium transition-all ${
              canJoinLive
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } w-full sm:w-auto`}
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Rejoindre le Live (Jitsi)
          </button>
        )}
        {showRegisterButton && (
          <button
            onClick={onRegister}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-social text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-medium hover:bg-social/90 transition-colors w-full sm:w-auto"
          >
            S'inscrire
          </button>
        )}
        {showFullBadge && (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-300 text-gray-600 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium w-full sm:w-auto">
            Complet
          </span>
        )}
        {showRegisteredBadge && (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-emerald-500 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-medium w-full sm:w-auto">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Inscrit
          </span>
        )}
        {/* Share Button */}
        <button
          onClick={onShare}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium ${
            resolvedTheme === 'dark'
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors w-full sm:w-auto`}
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Partager
        </button>
      </div>

      {/* Reactions System */}
      {event.reactions && (
        <div className={`flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
          <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Réactions :</span>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => handleReaction('thumbs_up')}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all ${
                selectedReaction === 'thumbs_up'
                  ? 'scale-110 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                  : resolvedTheme === 'dark' ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              👍 {event.reactions.thumbs_up}
            </button>
            <button
              onClick={() => handleReaction('clap')}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all ${
                selectedReaction === 'clap'
                  ? 'scale-110 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : resolvedTheme === 'dark' ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              👏 {event.reactions.clap}
            </button>
            <button
              onClick={() => handleReaction('bulb')}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all ${
                selectedReaction === 'bulb'
                  ? 'scale-110 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
                  : resolvedTheme === 'dark' ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              💡 {event.reactions.bulb}
            </button>
            <button
              onClick={() => handleReaction('heart')}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all ${
                selectedReaction === 'heart'
                  ? 'scale-110 bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300'
                  : resolvedTheme === 'dark' ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              ❤️ {event.reactions.heart}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default EventCard
