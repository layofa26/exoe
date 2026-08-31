import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Volume2, VolumeX, Play,
  Share2, Bookmark, MoreVertical, Flag,
  MessageSquare, Check, X, ShieldAlert,
  Loader2
} from 'lucide-react'
import type { Video } from '../../types/video'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { resolveMediaUrl, cleanUsername } from '../../services/videoApi'
import { useVideoInteractions } from '../../hooks/useVideoInteractions'
import { playbackPositionStore } from '../../utils/playbackPositionStore'

interface FeedVideoCardProps {
  video: Video
  onClick?: () => void
  onContact?: (video: Video) => void
  onProfileClick?: (authorId: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedProfession — Animation d'entrée / sortie fluide (5s)
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedProfession: React.FC<{ profession?: string }> = ({ profession }) => {
  const text = (profession || '').trim() || 'Professionnel'
  const isLong = text.length > 22

  const chunks = useMemo<string[]>(() => {
    if (!isLong) return [text]
    const words = text.split(' ')
    const result: string[] = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (candidate.length <= 22) {
        line = candidate
      } else {
        if (line) result.push(line)
        line = word
      }
    }
    if (line) result.push(line)
    return result.length ? result : [text]
  }, [text, isLong])

  const [index, setIndex] = useState<number>(0)
  const [visible, setVisible] = useState<boolean>(true)

  useEffect(() => {
    if (chunks.length <= 1) return
    const cycle = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % chunks.length)
        setVisible(true)
      }, 400)
    }, 5000)
    return () => clearInterval(cycle)
  }, [chunks.length])

  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium text-zinc-400 transition-all duration-400 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
      style={{
        maxWidth: 160,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
      }}
    >
      {chunks[index]}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownMenu rendu dans un Portal
// ─────────────────────────────────────────────────────────────────────────────
interface DropdownMenuProps {
  anchorRef: React.RefObject<HTMLButtonElement>
  onClose: () => void
  isDark: boolean
  isSaved: boolean
  copied: boolean
  isPending: boolean
  onSave: (e: React.MouseEvent) => void
  onShare: (e: React.MouseEvent) => void
  onOpenReport: () => void
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  anchorRef, onClose, isDark,
  isSaved, copied, isPending, onSave, onShare, onOpenReport
}) => {
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
      })
    }
  }, [anchorRef])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current && menuRef.current.contains(target)) return
      if (anchorRef.current && anchorRef.current.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRef, onClose])

  return createPortal(
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        zIndex: 99999,
        width: 190,
        borderRadius: 14,
        border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
        background: isDark ? '#18181b' : '#ffffff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        padding: '5px',
        animation: 'menuFade 0.15s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`@keyframes menuFade { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>

      {/* Favoris */}
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          onSave(e)
          onClose()
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer disabled:opacity-50 ${
          isDark ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
        }`}
      >
        <Bookmark size={14} className={isSaved ? 'fill-[#FF6B00] text-[#FF6B00]' : ''} />
        <span>{isSaved ? 'Retirer des favoris' : 'Enregistrer'}</span>
      </button>

      {/* Partager */}
      <button
        type="button"
        onClick={(e) => {
          onShare(e)
          onClose()
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
          isDark ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
        }`}
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
        <span>{copied ? 'Lien copié !' : 'Partager la vidéo'}</span>
      </button>

      {/* Signaler */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onOpenReport()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors text-red-400 hover:bg-red-500/10 cursor-pointer"
      >
        <Flag size={14} />
        <span>Signaler</span>
      </button>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Signalement
// ─────────────────────────────────────────────────────────────────────────────
interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  videoTitle: string
  isDark: boolean
  onSubmit: (reason: string) => void
}

const REPORT_REASONS: string[] = [
  'Contenu inapproprié ou offensant',
  'Spam ou publicité trompeuse',
  'Atteinte aux droits d\'auteur',
  'Fausses informations',
  'Harcèlement ou propos haineux',
  'Autre motif'
]

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, videoTitle, isDark, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            <h3 className="font-bold text-sm">Signaler cette vidéo</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 my-3 line-clamp-1">
          Vidéo : <span className="font-semibold text-zinc-200">{videoTitle}</span>
        </p>

        <div className="space-y-1.5 my-3">
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                selectedReason === r
                  ? 'bg-[#FF6B00]/15 text-[#FF6B00] font-semibold'
                  : isDark
                  ? 'hover:bg-zinc-800 text-zinc-300'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="report_reason"
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="accent-[#FF6B00]"
              />
              <span>{r}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSubmit(selectedReason)}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white transition-colors shadow-lg shadow-[#FF6B00]/20"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedVideoCard — Lecteur Vidéo Natif React / TypeScript avec poster={thumbnailUrl}
// ─────────────────────────────────────────────────────────────────────────────
export const FeedVideoCard: React.FC<FeedVideoCardProps> = ({
  video, onClick, onContact, onProfileClick
}): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const { showSuccess } = useNotifications()
  const isDark = resolvedTheme === 'dark'

  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

  // Hook centralisé unique pour toutes les interactions (Zéro duplication, autorité backend)
  const {
    viewsCount,
    isFavorite,
    isPending,
    handleFavorite,
    recordView
  } = useVideoInteractions({
    videoId: video.id,
    authorId: video.author?.id,
    initialLikes: video.likes,
    initialDislikes: video.dislikes,
    initialViews: video.views || video.viewsCount || 0,
  })

  // États du lecteur
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isBuffering, setIsBuffering] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const [showReportModal, setShowReportModal] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Timer de lecture continue pour la vue (>= 3s)
  const watchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Coordinateur global : Une seule vidéo en lecture à la fois
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const custom = e as CustomEvent<{ videoId?: string }>
      if (custom.detail?.videoId && String(custom.detail.videoId) !== String(video.id)) {
        const v = videoRef.current
        if (v && !v.paused) {
          playbackPositionStore.set(video.id, v.currentTime)
          v.pause()
        }
      }
    }
    window.addEventListener('exile_feed_play_video', handleGlobalPlay)
    return () => window.removeEventListener('exile_feed_play_video', handleGlobalPlay)
  }, [video.id])

  // URLs médias propres avec support complet pour les couvertures (Django cover, cover_url, etc.)
  const rawThumbnail =
    video.thumbnailUrl ||
    video.thumbnail ||
    (video as any).cover_url ||
    (video as any).cover ||
    (video as any).poster ||
    (video as any).image ||
    ''
  const thumbnailUrl: string | undefined = rawThumbnail.trim() ? resolveMediaUrl(rawThumbnail) : undefined

  const rawVideo =
    video.videoUrl ||
    (video as any).url ||
    (video as any).file_url ||
    (video as any).file ||
    ''
  const videoUrl: string | undefined = rawVideo.trim() ? resolveMediaUrl(rawVideo) : undefined

  // Nettoyage strict username & initiale
  const cleanAuthorName = cleanUsername(video.author?.username || video.author?.name || 'utilisateur')
  const displayUsername = `@${cleanAuthorName}`
  const initialLetter = (cleanUsername(video.author?.name || cleanAuthorName).charAt(0) || 'U').toUpperCase()

  // Profession
  const profession = video.author?.profession || ''

  // Détection propriétaire
  const userProfile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('exile_user_profile') || '{}') } catch { return {} }
  }, [])

  const isOwnVideo = useMemo<boolean>(() => {
    const myUsername = cleanUsername(userProfile?.username || '').toLowerCase()
    const videoUsername = cleanAuthorName.toLowerCase()
    const myId = userProfile?.id != null ? String(userProfile.id) : ''
    return (
      (Boolean(myUsername) && myUsername === videoUsername) ||
      (Boolean(myId) && myId === String(video.author?.id)) ||
      video.author?.id === 'me'
    )
  }, [userProfile, cleanAuthorName, video.author])

  // Assurer la propriété muted sur le noeud DOM dès le montage
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.defaultMuted = true
    }
  }, [])

  // Nettoyer les timers et sauvegarder la position au démontage
  useEffect(() => {
    return () => {
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current)
        watchTimerRef.current = null
      }
      if (videoRef.current && videoRef.current.currentTime > 0) {
        playbackPositionStore.set(video.id, videoRef.current.currentTime)
      }
    }
  }, [video.id])

  // Restauration de la position lors du chargement des métadonnées
  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const savedTime = playbackPositionStore.get(video.id)
    if (savedTime > 0 && v.duration && savedTime < v.duration) {
      v.currentTime = savedTime
    }
  }

  // IntersectionObserver pour Autoplay / Pause fluide sans saccades
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const v = videoRef.current
        if (!v) return

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          v.muted = true
          const playPromise = v.play()
          if (playPromise !== undefined) {
            playPromise.catch(() => {})
          }
        } else if (entry.intersectionRatio < 0.25) {
          if (!v.paused) {
            playbackPositionStore.set(video.id, v.currentTime)
            v.pause()
          }
        }
      })
    }, { threshold: [0, 0.25, 0.5, 0.75, 1.0] })

    obs.observe(el)
    return () => obs.disconnect()
  }, [video.id])

  // Clic sur la zone vidéo -> Navigation vers VideoPlayerPage avec mémorisation de position
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (v) {
      playbackPositionStore.set(video.id, v.currentTime)
      if (!v.paused) v.pause()
    }
    onClick?.()
  }, [onClick, video.id])

  // Activer / Désactiver le son (isoler pour ne pas déclencher la navigation)
  const handleToggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setIsMuted(next)
    if (!next && v.volume === 0) v.volume = 1
  }, [])

  const [isPlaying, setIsPlaying] = useState(false)

  // Événements du lecteur vidéo HTML5
  const handlePlaying = () => {
    setIsPlaying(true)
    setIsBuffering(false)
    window.dispatchEvent(new CustomEvent('exile_feed_play_video', { detail: { videoId: String(video.id) } }))

    // Enregistrement de la vue seulement après >= 3s de visionnage continu
    if (watchTimerRef.current) clearTimeout(watchTimerRef.current)
    watchTimerRef.current = setTimeout(() => {
      recordView()
    }, 3000)
  }

  const handlePause = () => {
    setIsPlaying(false)
    const v = videoRef.current
    if (v && v.currentTime > 0) {
      playbackPositionStore.set(video.id, v.currentTime)
    }
    if (watchTimerRef.current) {
      clearTimeout(watchTimerRef.current)
      watchTimerRef.current = null
    }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
    playbackPositionStore.set(video.id, v.currentTime)
  }

  // Partager
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/pro/video/${video.id}`
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Regardez cette vidéo de ${video.author?.name || 'l\'expert'} sur EXILE`,
        url,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      showSuccess('Lien copié dans le presse-papiers !')
      setTimeout(() => setCopied(false), 2000)
    }
  }, [video.id, video.title, video.author?.name, showSuccess])

  // Favoris via hook centralisé
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    handleFavorite()
  }, [handleFavorite])

  // Signalement
  const handleReportSubmit = useCallback((reason: string) => {
    try {
      const reports = JSON.parse(localStorage.getItem('exile_video_reports') || '[]')
      reports.push({
        videoId: video.id,
        videoTitle: video.title,
        authorId: video.author?.id,
        reason,
        date: new Date().toISOString(),
      })
      localStorage.setItem('exile_video_reports', JSON.stringify(reports))
    } catch {}
    setShowReportModal(false)
    showSuccess('Signalement envoyé. Merci de contribuer à la sécurité.')
  }, [video.id, video.title, video.author?.id, showSuccess])

  const formatAgo = (d?: string): string => {
    if (!d) return 'Récemment'
    const ms = Date.now() - new Date(d).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 60) return `${Math.max(1, m)} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} h`
    const day = Math.floor(h / 24)
    if (day < 7) return `${day} j`
    if (day < 30) return `${Math.floor(day / 7)} sem`
    return `${Math.floor(day / 30)} mois`
  }

  const fmtViews = (v: number): string => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
    return v.toString()
  }

  const avatarColors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#0EA5E9']
  const avatarBg =
    video.author?.avatarColor ||
    avatarColors[Math.abs(Number(video.author?.id) || 0) % avatarColors.length]

  return (
    <div
      ref={containerRef}
      className={`w-full ${isDark ? 'bg-zinc-950' : 'bg-white'} border-b ${
        isDark ? 'border-zinc-800/80' : 'border-slate-200'
      } flex flex-col overflow-hidden`}
    >
      {/* ── ZONE VIDÉO CLIQUABLE VERS VideoPlayerPage ── */}
      <div
        className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden select-none flex items-center justify-center"
        onClick={handleVideoClick}
      >
        {/* Vraie Image / Miniature de la vidéo (Superposée si présente et vidéo non en lecture) */}
        {thumbnailUrl && !isPlaying && (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transition-opacity duration-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            playsInline
            width="100%"
            muted={isMuted}
            loop
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onError={() => setIsBuffering(false)}
            className="w-full h-full object-contain bg-black"
          />
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
            <Play size={44} />
          </div>
        )}

        {/* Loader discret pendant le buffering */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
            <Loader2 size={34} className="text-[#FF6B00] animate-spin" />
          </div>
        )}

        {/* Bouton son flottant compact (Isolé avec stopPropagation) */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={`sound-toggle-btn absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur transition-all active:scale-95 cursor-pointer ${
            isMuted
              ? 'bg-black/85 hover:bg-black text-white border border-white/20 shadow-md'
              : 'bg-black/60 hover:bg-black/80 text-white'
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX size={13} className="text-[#FF6B00]" />
              <span className="text-[10px] font-bold">Activer le son</span>
            </>
          ) : (
            <Volume2 size={13} className="text-emerald-400" />
          )}
        </button>

        {/* Barre de progression discrète */}
        <div className="feed-progress-bar absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-20 overflow-hidden">
          <div
            className="h-full bg-[#FF6B00] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── FOOTER DU FEED ULTRA-COMPACT ── */}
      <div className="px-3 py-2 flex items-start gap-2.5">
        
        {/* Avatar compact avec lettre propre (Isolé avec stopPropagation) */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            onProfileClick?.(video.author.id)
          }}
          className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm mt-0.5"
          style={{ background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}88)` }}
        >
          {video.author?.avatarUrl && (typeof navigator === 'undefined' || navigator.onLine) ? (
            <img
              src={video.author.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-white font-bold text-xs">
              {initialLetter}
            </span>
          )}
        </div>

        {/* Infos : @username + Profession + Titre + Vues */}
        <div
          className="flex-1 min-w-0 cursor-pointer flex flex-col gap-0.5"
          onClick={handleVideoClick}
        >
          {/* Ligne 1 : @username + • + Profession Animée */}
          <div
            className="flex items-center gap-1.5 min-w-0"
            onClick={(e) => {
              e.stopPropagation()
              onProfileClick?.(video.author.id)
            }}
          >
            <span className={`font-bold text-[12px] truncate ${isDark ? 'text-zinc-100 hover:text-[#FF6B00]' : 'text-slate-900 hover:text-[#FF6B00]'}`}>
              {displayUsername}
            </span>
            <span className="text-zinc-500 text-[10px]">•</span>
            <AnimatedProfession profession={profession} />
          </div>

          {/* Ligne 2 : Titre de la vidéo */}
          <h3 className={`font-semibold text-[13px] leading-snug line-clamp-2 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
            {video.title}
          </h3>

          {/* Ligne 3 : Vues • Temps */}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
            <span>{fmtViews(viewsCount)} vues</span>
            <span>•</span>
            <span>Il y a {formatAgo(video.createdAt || video.postedAt)}</span>
          </div>
        </div>

        {/* Actions Droite : [Contacter] + [ ⋮ ] (Isolés avec stopPropagation) */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {/* Bouton Contacter */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (isOwnVideo) {
                showSuccess('C\'est votre propre publication')
              } else if (onContact) {
                onContact(video)
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B00]/12 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/25 text-[#FF6B00] text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
            title={isOwnVideo ? 'Votre publication' : 'Contacter ce créateur'}
          >
            <MessageSquare size={11} />
            <span>Contacter</span>
          </button>

          {/* Menu ⋮ */}
          <div className="relative">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu((s) => !s)
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showMenu
                  ? isDark ? 'bg-zinc-800 text-white' : 'bg-slate-200 text-black'
                  : isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Options"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Dropdown Menu Portal */}
      {showMenu && (
        <DropdownMenu
          anchorRef={menuBtnRef}
          onClose={() => setShowMenu(false)}
          isDark={isDark}
          isSaved={isFavorite}
          copied={copied}
          isPending={isPending}
          onSave={handleSaveClick}
          onShare={handleShare}
          onOpenReport={() => {
            setShowMenu(false)
            setShowReportModal(true)
          }}
        />
      )}

      {/* Modal Signalement */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        videoTitle={video.title}
        isDark={isDark}
        onSubmit={handleReportSubmit}
      />
    </div>
  )
}

export default FeedVideoCard
