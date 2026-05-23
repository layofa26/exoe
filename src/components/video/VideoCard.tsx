import { useState, useRef } from 'react'
import { 
  Play,
  MoreVertical,
  Bookmark,
  Flag,
  CheckCircle,
  X,
  Lock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Video, Professional } from '../../types'

interface VideoCardProps {
  video: Video
  author: Professional
  onLike?: (videoId: string) => void
  onShare?: (videoId: string) => void
  onReport?: (videoId: string, reason: string) => void
  onAddToFavorites?: (videoId: string) => void
  onSubscribe?: (authorId: string) => void
  onClick?: () => void
  hasLiked?: boolean
  hasFavorited?: boolean
  isSubscribed?: boolean
}

export const VideoCard = ({
  video,
  author,
  onLike,
  onShare,
  onReport,
  onClick,
  onAddToFavorites,
  onSubscribe,
  hasLiked = false,
  hasFavorited = false,
  isSubscribed = false,
}: VideoCardProps): JSX.Element => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'récemment'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "aujourd'hui"
    if (diffDays === 1) return 'il y a 1 jour'
    if (diffDays < 7) return `il y a ${diffDays} jours`
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`
    if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`
    return `il y a ${Math.floor(diffDays / 365)} ans`
  }

  const handleReport = () => {
    if (reportReason.trim() && onReport) {
      onReport(video.id, reportReason)
      setShowReportModal(false)
      setReportReason('')
      setShowActionMenu(false)
    }
  }

  const handleClickOutside = (e: React.MouseEvent) => {
    if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
      setShowActionMenu(false)
    }
  }

  const reportReasons = [
    'Contenu inapproprié',
    'Harcèlement',
    'Fausse information',
    'Spam',
    'Contenu protégé par droits d\'auteur',
    'Autre',
  ]

  return (
    <div 
      className="group cursor-pointer"
      onClick={(e) => {
        handleClickOutside(e);
        if (onClick) onClick();
      }}
    >
      {/* Thumbnail - Style pure */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {video.isLive ? (
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
          </div>
        ) : (
          <>
            <img
              src={video.thumbnail || '/api/placeholder/320/180'}
              alt={video.title}
              className="w-full h-full object-cover"
            />

            {/* Play Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>

            {/* Duration Badge */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                {video.duration}
              </div>
            )}

            {/* Live Badge */}
            {video.isLive && (
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Section - Compact style */}
      <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 px-1">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-pro to-emerald-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">
              {author.name.charAt(0)}
            </span>
          </div>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          {/* Title - 2 lines max */}
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-0.5 sm:mb-1">
            {video.title}
          </h3>

          {/* Author + Verified */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="font-medium">{author.name}</span>
            {author.verified && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pro" />}
          </div>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 text-xs text-gray-500 mt-0.5">
            <span>{formatViews(video.views)} vues</span>
            <span className="hidden sm:inline">•</span>
            <span>{video.comments || 0} commentaires</span>
            <span className="hidden sm:inline">•</span>
            <span>{formatTimeAgo(video.date)}</span>
          </div>
        </div>

        {/* More Actions */}
        <div className="relative flex-shrink-0" ref={actionMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActionMenu(!showActionMenu)
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {showActionMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  onSubscribe?.(author.id)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <span>{isSubscribed ? '✓' : '🔔'}</span>
                {isSubscribed ? 'Abonné' : "S'abonner"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  onLike?.(video.id)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <span className={hasLiked ? 'text-red-500' : ''}>♥</span>
                {hasLiked ? 'Je n\'aime plus' : "J'aime"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  alert('Commentaire ouvert')
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <span>💬</span> Commenter
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  onShare?.(video.id)
                  setShowActionMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <span>↗</span> Partager
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  onAddToFavorites?.(video.id)
                  setShowActionMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <Bookmark className={`w-4 h-4 ${hasFavorited && 'fill-current text-pro'}`} />
                {hasFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAuthenticated) {
                    setShowLoginModal(true)
                    setShowActionMenu(false)
                    return
                  }
                  setShowReportModal(true)
                  setShowActionMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
              >
                <Flag className="w-4 h-4" /> Signaler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Action réservée aux membres
              </h3>
              <p className="text-gray-600">
                Connectez-vous pour effectuer cette action
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Créer un compte
              </button>
            </div>
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700"
            >
              Continuer en visiteur
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Signaler</h3>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-1 mb-4">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    reportReason === reason
                      ? 'bg-pro/10 text-pro'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                }}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoCard
