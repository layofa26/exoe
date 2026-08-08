import { useState } from 'react'
import { Play, Eye, MessageCircle, ThumbsUp, Lock, Globe, FileText, GraduationCap, Briefcase, Calendar as CalendarIcon, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { ContactModal } from '../modals/ContactModal'

interface InstitutionVideoCardProps {
  id: string
  institution: {
    name: string
    logoUrl: string
    isVerified: boolean
  }
  createdAt: string
  visibility: 'public' | 'interne'
  contentType: 'annonce' | 'cours' | 'recrutement' | 'evenement'
  department?: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  cta?: {
    label: 's_inscrire' | 'en_savoir_plus' | 'telecharger_pdf' | 'aucun'
    url: string
  }
  associatedEvent?: {
    id: string
    title: string
  }
  likesCount: number
  commentsCount: number
  allowComments: boolean
}

export const InstitutionVideoCard = ({
  id,
  institution,
  createdAt,
  visibility,
  contentType,
  department,
  title,
  description,
  videoUrl,
  thumbnailUrl,
  cta,
  associatedEvent,
  likesCount,
  commentsCount,
  allowComments,
}: InstitutionVideoCardProps) => {
  const { resolvedTheme } = useTheme()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  // Profil utilisateur connecté
  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
  const currentUserId = userProfile?.id || 'current-user-' + Date.now()

  const handleContact = () => {
    setShowContactModal(true)
  }

  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'annonce': return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'cours': return <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'recrutement': return <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'evenement': return <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      default: return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    }
  }

  const getContentTypeColor = () => {
    switch (contentType) {
      case 'annonce': return resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-700 border-red-200'
      case 'cours': return resolvedTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'recrutement': return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'evenement': return resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'
      default: return resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'annonce': return 'Annonce'
      case 'cours': return 'Cours'
      case 'recrutement': return 'Recrutement'
      case 'evenement': return 'Événement'
      default: return 'Contenu'
    }
  }

  const getCtaLabel = () => {
    switch (cta?.label) {
      case 's_inscrire': return "S'inscrire"
      case 'en_savoir_plus': return 'En savoir plus'
      case 'telecharger_pdf': return 'Télécharger le PDF'
      case 'aucun': return ''
      default: return ''
    }
  }

  const isDescriptionLong = description.length > 150

  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* Header - Hauteur réduite */}
      <div className={`p-2 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1.5">
          {/* User Info - Profil utilisateur connecté - Compact */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 overflow-hidden">
              {userProfile?.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs sm:text-sm font-bold text-white">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {userProfile?.name || 'Utilisateur'}
                </span>
              </div>
            </div>
          </div>

          {/* Bouton Contacter - Plus petit */}
          <button
            onClick={handleContact}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-medium transition-colors flex items-center gap-1"
          >
            <MessageCircle className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Contacter</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>

        {/* Badges - Compact */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getContentTypeColor()}`}>
            {getContentTypeIcon()}
            {getContentTypeLabel()}
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-black">
        {isPlaying ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full aspect-video"
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative w-full aspect-video">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <video src={videoUrl} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 flex items-center justify-center hover:bg-white transition-all hover:scale-105 shadow-xl"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 ml-0.5 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      {cta && cta.label !== 'aucun' && (
        <div className="p-3 sm:p-4">
          <a
            href={cta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2 sm:py-3 bg-social text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-social/90 transition-colors"
          >
            {getCtaLabel()}
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      )}

      {/* Associated Event Banner */}
      {associatedEvent && (
        <div className={`px-3 sm:px-4 pb-3 sm:pb-4`}>
          <a
            href={`/social/events/${associatedEvent.id}`}
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-600'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            <div className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'} flex-shrink-0`}>
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] sm:text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                Événement associé
              </p>
              <p className={`text-xs sm:text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                {associatedEvent.title}
              </p>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
          </a>
        </div>
      )}

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h3 className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} ${!showFullDescription && isDescriptionLong ? 'line-clamp-3' : ''}`}>
          {description}
        </p>
        {isDescriptionLong && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className={`text-[10px] sm:text-xs font-medium text-social hover:underline flex items-center gap-0.5 sm:gap-1`}
          >
            {showFullDescription ? (
              <>
                Voir moins
                <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </>
            ) : (
              <>
                Voir plus
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </>
            )}
          </button>
        )}

        {/* Stats */}
        <div className={`flex items-center gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
            {likesCount}
          </div>
          {allowComments && (
            <div className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              {commentsCount}
            </div>
          )}
          <div className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            0
          </div>
        </div>
      </div>

      {/* ContactModal */}
      {showContactModal && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          receiver={{
            id: institution.name,
            name: institution.name,
            avatar: institution.logoUrl || null,
            profession: 'Institution'
          }}
          sender={{
            id: currentUserId,
            name: userProfile?.name || 'Moi',
            avatar: userProfile?.photo || null,
            profession: userProfile?.profession || 'Utilisateur'
          }}
        />
      )}
    </div>
  )
}
