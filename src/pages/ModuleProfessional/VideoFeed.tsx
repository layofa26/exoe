import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Video } from '../../types/video';
import { VideoPlayerPage } from '../../components/video/VideoPlayerPage';
import SectionPub from '../../pages/PUB/SectionPub';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccueilAlgo } from '../../algoPro/signals/useAccueilAlgo';
import { useSubsAlgo } from '../../algoPro/signals/useSubsAlgo';
import { useRequestsAlgo } from '../../algoPro/signals/useRequestsAlgo';
import { useEventsAlgo } from '../../algoPro/signals/useEventsAlgo';
import { TigerFeedOrchestrator } from '../../algoPro/orchestrator/TigerFeedOrchestrator';
import { useSearch } from '../../hooks/useSearch';
import { useQuery } from '../../hooks/useQuery';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, WifiOff, Wifi, RefreshCw, AlertCircle, Plus, Play, ArrowRight, Radio, Users } from 'lucide-react';
import { ContactModal } from '../../components/modals/ContactModal';
import { UploadVideo } from '../../components/video/UploadVideo';
import { FeedVideoCard } from '../../components/video/FeedVideoCard';

// Composant Skeleton Loader haute performance façon YouTube
const VideoSkeleton = ({ resolvedTheme }: { resolvedTheme: string }) => {
  const isDark = resolvedTheme === 'dark'
  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'} animate-pulse flex flex-col`}>
      {/* Thumbnail aspect ratio 16:9 */}
      <div className={`w-full aspect-video ${isDark ? 'bg-zinc-700/50' : 'bg-gray-200'} relative`}>
        <div className="absolute bottom-2 right-2 w-10 h-4 rounded bg-black/40" />
      </div>
      {/* Video info skeleton */}
      <div className="p-3 flex gap-3">
        <div className={`w-10 h-10 rounded-full flex-shrink-0 ${isDark ? 'bg-zinc-700/70' : 'bg-gray-300'}`} />
        <div className="flex-1 space-y-2 py-1">
          <div className={`h-4 rounded w-5/6 ${isDark ? 'bg-zinc-700/70' : 'bg-gray-300'}`} />
          <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-zinc-700/50' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedLiveCard — Carte sobre et neutre pour les diffusions en direct (AlgoPro)
// ─────────────────────────────────────────────────────────────────────────────
interface FeedLiveCardProps {
  live: {
    id: string
    title: string
    category?: string
    coverImage?: string
    viewerCount?: number
    creatorId?: string
    organizerName?: string
    organizerAvatar?: string
    organizerProfession?: string
    liveRoomName?: string
  }
  onClick: () => void
  onProfileClick?: (creatorId: string) => void
  resolvedTheme: string
}

const FeedLiveCard: React.FC<FeedLiveCardProps> = ({ live, onClick, onProfileClick, resolvedTheme }) => {
  const isDark = resolvedTheme === 'dark'
  const initialLetter = (live.organizerName || 'U').charAt(0).toUpperCase()
  const viewers = live.viewerCount ?? 0

  return (
    <div
      className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-white border-slate-200'} border-b flex flex-col overflow-hidden cursor-pointer group`}
      onClick={onClick}
    >
      {/* ── ZONE MINIATURE DU DIRECT (16:9) ── */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center select-none">
        {live.coverImage ? (
          <img
            src={live.coverImage}
            alt={live.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black relative overflow-hidden select-none">
            {/* Vagues sonores animées en fond */}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-25 pointer-events-none">
              <span className="w-1.5 h-10 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-16 bg-zinc-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-20 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1.5 h-14 bg-zinc-300 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
              <span className="w-1.5 h-8 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
            </div>

            {/* Avatar de l'hôte avec cercle rouge pulsant de direct */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="relative w-14 h-14 rounded-full ring-2 ring-red-500 ring-offset-2 ring-offset-black flex items-center justify-center overflow-hidden bg-zinc-800 shadow-xl">
                {live.organizerAvatar ? (
                  <img src={live.organizerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-base">{initialLetter}</span>
                )}
                <div className="absolute inset-0 bg-red-500/10 animate-ping rounded-full pointer-events-none" />
              </div>
              <span className="text-xs font-bold text-zinc-200 tracking-wide shadow-sm">
                Direct en cours • {live.organizerName || 'Créateur'}
              </span>
            </div>
          </div>
        )}

        {/* Badge EN DIRECT sobre */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>En Direct</span>
        </div>

        {/* Compteur Spectateurs */}
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium">
          <Users size={11} className="text-zinc-300" />
          <span>{viewers} spectateurs</span>
        </div>

        {/* Bouton Rejoindre discret au survol */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <div className="px-3 py-1.5 rounded-full bg-black/85 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
            <Play size={12} className="fill-white" />
            <span>Rejoindre</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER DU DIRECT ── */}
      <div className="px-3 py-2 flex items-start gap-2.5">
        {/* Avatar de l'hôte */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            if (live.creatorId) onProfileClick?.(live.creatorId)
          }}
          className={`w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer mt-0.5 border ${
            isDark ? 'border-zinc-700 bg-zinc-800' : 'border-gray-200 bg-gray-100'
          }`}
        >
          {live.organizerAvatar ? (
            <img
              src={live.organizerAvatar}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
              {initialLetter}
            </span>
          )}
        </div>

        {/* Infos du direct */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
              {live.organizerName}
            </span>
            {live.organizerProfession && (
              <>
                <span className="text-[10px] text-zinc-500">•</span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {live.organizerProfession}
                </span>
              </>
            )}
          </div>

          <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>
            {live.title}
          </h4>

          {live.category && (
            <div className="mt-1">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${
                isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {live.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function mapEventToVideo(item: any): Video {
  const isLiveNow = item.isLive === true || item.is_live === true || item.status === 'live' || item.live_status === 'ongoing' || item.streaming?.isLive === true
  const cleanId = String(item.id).replace('evt-', '').replace('exile-', '')
  return {
    id: `evt-${cleanId}`,
    eventId: cleanId,
    title: item.title || item.name || 'Événement',
    description: item.description || '',
    category: item.categorie || item.category || 'Événement',
    isLive: isLiveNow,
    liveRoomName: item.live_room_name || item.jitsi_room || item.streaming?.roomName || `exile-${cleanId}`,
    startDate: item.date_debut || item.start_date,
    endDate: item.date_fin || item.end_date,
    replayUrl: item.replay_url || item.recording_url || item.recording_file,
    videoUrl: item.replay_url || item.recording_url || item.recording_file || '',
    thumbnail: item.cover || item.cover_image || item.image || item.coverImage,
    views: item.views_count || item.participants_count || item.participantsCount || item.stats?.attendees || 0,
    viewsCount: item.views_count || item.participants_count || item.participantsCount || item.stats?.attendees || 0,
    likes: 0,
    isRegistered: Boolean(item.is_registered),
    author: {
      id: String(item.owner_id || item.ownerId || item.organizerId || ''),
      name: item.owner_name || item.organizer_name || item.organizerName || 'Organisateur',
      username: item.owner_username || item.owner_name || item.organizer_name || 'Organisateur',
      profession: item.owner_profession || item.profession || 'Créateur',
      location: item.location || 'En ligne',
      initials: (item.owner_name || item.organizer_name || 'U').charAt(0).toUpperCase(),
      avatarColor: '#27272a',
      avatarUrl: item.owner_avatar || item.organizer_avatar || item.organizerAvatar
    }
  }
}

export default function VideoFeed() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [allBackendEvents, setAllBackendEvents] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Détection de la connexion réseau en temps réel
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      loadVideos()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, []);

  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedVideoForContact, setSelectedVideoForContact] = useState<Video | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Use search hook
  const { query, setQuery, type, results, loading: searchLoading, error: searchError, reset, loadMore } = useSearch();

  // Récupérer ou créer un userId pour les signaux algorithmiques
  const userId = localStorage.getItem('exile_user_id') || 'user_default'
  
  // Initialiser les Logic Hooks (AlgoPro)
  const accueilAlgo = useAccueilAlgo(userId)
  const subsAlgo = useSubsAlgo(userId)
  const requestsAlgo = useRequestsAlgo(userId)
  const eventsAlgo = useEventsAlgo(userId)

  // Hook SWR avec revalidation - Récupère exclusivement les VRAIES vidéos du Backend Django
  const {
    data: cachedVideos,
    isLoading: loading,
    error: queryError,
    refetch: loadVideos,
    setData: setVideos
  } = useQuery<Video[]>(
    async () => {
      try {
        const { videoApi, mapApiVideo } = await import('../../services/videoApi')
        const result = await videoApi.getVideos()
        const backendVideos: Video[] = result.success && result.data ? result.data.map(mapApiVideo) : []
        return backendVideos
      } catch (err) {
        console.error('[VideoFeed] Error loading videos from backend:', err)
        return []
      }
    },
    {
      cacheKey: 'pro:videos:feed:live',
      cacheTime: 30 * 1000,
      refetchOnMount: true,
    }
  )

  // Hook SWR - Récupère les diffusions en DIRECT actives (Backend Django & LocalStorage)
  const {
    data: cachedLives,
    refetch: loadLives
  } = useQuery<any[]>(
    async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        })

        let rawEvents: any[] = []
        if (response.ok) {
          const data = await response.json()
          rawEvents = Array.isArray(data) ? data : (data.results || [])
        }

        setAllBackendEvents(rawEvents)
        const allEvents = rawEvents

        // Filtrer les événements actuellement en direct
        const activeLives = allEvents
          .filter((item: any) =>
            item.isLive === true ||
            item.is_live === true ||
            item.status === 'live' ||
            item.live_status === 'ongoing' ||
            item.streaming?.isLive === true
          )
          .map((item: any) => ({
            id: String(item.id),
            title: item.title || item.name || 'Direct en cours',
            description: item.description || '',
            category: item.categorie || item.category || 'GENERAL',
            coverImage: item.cover || item.cover_image || item.coverImage,
            viewerCount: item.viewerCount || item.participants_count || item.participantsCount || item.stats?.attendees || 0,
            creatorId: String(item.owner_id || item.ownerId || item.organizerId || ''),
            organizerName: item.owner_name || item.organizer_name || item.organizerName || 'Organisateur',
            organizerAvatar: item.owner_avatar || item.organizer_avatar || item.organizerAvatar,
            organizerProfession: item.owner_profession || item.profession || 'Créateur',
            liveRoomName: item.live_room_name || item.jitsi_room || item.streaming?.roomName
          }))

        const seen = new Set<string>()
        return activeLives.filter(l => {
          if (seen.has(l.id)) return false
          seen.add(l.id)
          return true
        })
      } catch (err) {
        console.warn('[VideoFeed] Error loading lives:', err)
        return []
      }
    },
    {
      cacheKey: 'pro:lives:feed:active',
      cacheTime: 15 * 1000,
      refetchOnMount: true,
    }
  )

  const videos = cachedVideos || []
  const error = queryError ? queryError.message : null

  const handleRetryConnection = async () => {
    setIsReconnecting(true)
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true
    setIsOnline(online)
    await Promise.all([loadVideos(), loadLives()])
    setTimeout(() => setIsReconnecting(false), 600)
  }

  // Écouter les événements pour rafraîchissement instantané
  useEffect(() => {
    const handleRefresh = () => {
      loadVideos()
      loadLives()
    }

    window.addEventListener('video-uploaded', handleRefresh)
    window.addEventListener('video-published', handleRefresh)
    return () => {
      window.removeEventListener('video-uploaded', handleRefresh)
      window.removeEventListener('video-published', handleRefresh)
    }
  }, [loadVideos, loadLives])

  const [searchParams, setSearchParams] = useSearchParams()
  const eventParam = searchParams.get('event') || searchParams.get('live')

  const handleOpen = useCallback((video: Video) => {
    // Arrêter immédiatement toute vidéo en lecture dans le feed
    window.dispatchEvent(new CustomEvent('exile_feed_play_video', { detail: { videoId: '__stop_all__' } }))

    // Tracker le clic sur la vidéo avec useAccueilAlgo
    accueilAlgo.trackVideoClick(video, 0, false, false)
    
    // Tracker la visite du profil créateur avec useSubsAlgo
    if (video.author) {
      subsAlgo.trackProfileVisit(video.author, 0)
    }
    
    setActiveVideo(video);
    const nextParams = new URLSearchParams(searchParams);
    if (video.eventId || video.isLive) {
      const cleanId = String(video.eventId || video.id).replace('evt-', '').replace('exile-', '');
      if (video.isLive) {
        nextParams.set('live', cleanId);
        nextParams.delete('event');
      } else {
        nextParams.set('event', cleanId);
        nextParams.delete('live');
      }
    } else {
      nextParams.delete('event');
      nextParams.delete('live');
    }
    setSearchParams(nextParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [accueilAlgo, subsAlgo, searchParams, setSearchParams]);

  // Charger l'événement ou le live directement dans le lecteur avec le deuxième feed
  useEffect(() => {
    if (!eventParam) return
    const cleanId = String(eventParam).replace('evt-', '').replace('exile-', '')
    if (activeVideo && (activeVideo.eventId === cleanId || activeVideo.id === `evt-${cleanId}`)) {
      return
    }

    let isCancelled = false

    const loadEventIntoPlayer = async () => {
      try {
        if (!cleanId || isNaN(Number(cleanId))) {
          const next = new URLSearchParams(searchParams)
          next.delete('event')
          next.delete('live')
          setSearchParams(next, { replace: true })
          return
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        })
        if (res.ok && !isCancelled) {
          const item = await res.json()
          const isLiveNow = item.is_live === true || item.status === 'live' || item.live_status === 'ongoing' || searchParams.has('live')
          const eventVideo: Video = {
            id: `evt-${item.id}`,
            eventId: item.id,
            title: item.title || item.name || 'Événement',
            description: item.description || '',
            category: item.categorie || item.category || 'Événement',
            isLive: isLiveNow,
            liveRoomName: item.live_room_name || `exile-${item.id}`,
            startDate: item.date_debut || item.start_date,
            endDate: item.date_fin || item.end_date,
            replayUrl: item.replay_url || item.recording_url,
            videoUrl: item.replay_url || item.recording_url || '',
            thumbnail: item.cover || item.cover_image,
            views: item.participants_count || item.stats?.attendees || 0,
            viewsCount: item.participants_count || item.stats?.attendees || 0,
            likes: 0,
            isRegistered: Boolean(item.is_registered),
            author: {
              id: String(item.owner_id || ''),
              name: item.owner_name || 'Organisateur',
              username: item.owner_username || item.owner_name,
              profession: item.owner_profession || 'Créateur',
              location: item.location || 'En ligne',
              initials: (item.owner_name || 'U').charAt(0).toUpperCase(),
              avatarColor: '#27272a',
              avatarUrl: item.owner_avatar
            }
          }
          setActiveVideo(eventVideo)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else if (!res.ok && !isCancelled) {
          const next = new URLSearchParams(searchParams)
          next.delete('event')
          next.delete('live')
          setSearchParams(next, { replace: true })
        }
      } catch (err) {
        console.error('[VideoFeed] Erreur chargement événement pour lecteur:', err)
        if (!isCancelled) {
          const next = new URLSearchParams(searchParams)
          next.delete('event')
          next.delete('live')
          setSearchParams(next, { replace: true })
        }
      }
    }

    loadEventIntoPlayer()

    return () => {
      isCancelled = true
    }
  }, [eventParam, activeVideo, searchParams, setSearchParams])

  const handleBack = useCallback(() => {
    setActiveVideo(null);
    const fromParam = searchParams.get('from');
    if (fromParam) {
      navigate(fromParam, { replace: true });
      return;
    }
    if (searchParams.has('event') || searchParams.has('live')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('event');
      nextParams.delete('live');
      nextParams.delete('from');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  const handleContact = useCallback((video: Video) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedVideoForContact(video);
    setShowContactModal(true);
  }, [isAuthenticated, navigate]);

  const handleProfileClick = useCallback((authorId: string) => {
    const currentUserId = user?.id?.toString() || ''
    if (authorId === currentUserId) {
      navigate('/pro/profile')
    } else {
      navigate(`/pro/profile/${authorId}`)
    }
  }, [navigate, user]);

  const handleLiveClick = useCallback((live: any) => {
    window.dispatchEvent(new CustomEvent('exile_feed_play_video', { detail: { videoId: '__stop_all__' } }))
    accueilAlgo.trackLiveClick(
      String(live.id),
      String(live.creatorId || ''),
      live.category || 'general',
      0,
      false
    )
    const cleanId = String(live.id).replace('evt-', '').replace('exile-', '')
    const liveVideo: Video = {
      id: `evt-${cleanId}`,
      eventId: cleanId,
      title: live.title || 'Direct en cours',
      description: live.description || '',
      category: live.category || 'Direct',
      isLive: true,
      liveRoomName: live.liveRoomName || `exile-${cleanId}`,
      thumbnail: live.coverImage,
      views: live.viewerCount || 0,
      viewsCount: live.viewerCount || 0,
      likes: 0,
      author: {
        id: String(live.creatorId || ''),
        name: live.organizerName || 'Organisateur',
        username: live.organizerName,
        profession: live.organizerProfession || 'Créateur',
        location: 'En ligne',
        initials: (live.organizerName || 'U').charAt(0).toUpperCase(),
        avatarColor: '#27272a',
        avatarUrl: live.organizerAvatar
      }
    }
    setActiveVideo(liveVideo)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('live', cleanId)
    nextParams.delete('event')
    setSearchParams(nextParams, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [accueilAlgo, searchParams, setSearchParams]);

  // Cacher body + html scroll quand on est dans le player
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      localStorage.setItem('exile_video_player_active', 'true')
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      localStorage.setItem('exile_video_player_active', 'false')
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      localStorage.setItem('exile_video_player_active', 'false')
    };
  }, [activeVideo]);

  // Écouter l'événement de publication de vidéo pour rafraîchir le feed
  useEffect(() => {
    const handleVideoPublished = () => {
      loadVideos()
    }

    window.addEventListener('video-published', handleVideoPublished)

    return () => {
      window.removeEventListener('video-published', handleVideoPublished)
    }
  }, [])

  // Profil utilisateur connecté
  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
  const currentUserId = userProfile?.id || 'current-user-' + Date.now()

  // Filtrer & Dédupliquer les vidéos par ID unique pour éviter les clés dupliquées React
  const displayVideos: Video[] = useMemo(() => {
    const rawList: Video[] = query && results
      ? results.videos
      : videos.filter(video => {
          if (!query.trim()) return true;
          const searchLower = query.toLowerCase();
          const titleMatch = video.title?.toLowerCase().includes(searchLower);
          const professionMatch = video.author?.profession?.toLowerCase().includes(searchLower);
          const authorMatch = video.author?.name?.toLowerCase().includes(searchLower);
          return titleMatch || professionMatch || authorMatch;
        });

    const seenIds = new Set<string>();
    return rawList.filter((v, idx) => {
      const idKey = v?.id != null ? String(v.id) : `idx_${idx}`;
      if (seenIds.has(idKey)) return false;
      seenIds.add(idKey);
      return true;
    });
  }, [query, results, videos]);

  // Orchestration unifiée du feed (Vidéos d'accueil + Événements + Directs) via AlgoPro
  const orchestratedItems = useMemo(() => {
    if (query.trim()) {
      return displayVideos.map(v => ({ id: String(v.id), type: 'video' as const, content: v }))
    }
    const lives = cachedLives || []
    try {
      const orchestrator = new TigerFeedOrchestrator({
        userId,
        signals: {
          subscribedCreators: subsAlgo.subscribedCreators,
          priorityCreators: subsAlgo.priorityCreators,
          shouldPrioritizeCreator: subsAlgo.shouldPrioritizeCreator,
          liveEngagementRate: accueilAlgo.liveEngagementRate,
          videoEngagementRate: accueilAlgo.videoEngagementRate,
          preferredContentTypes: accueilAlgo.preferredContentTypes,
          mostEngagedCategory: accueilAlgo.mostEngagedCategory,
          peakEngagementHour: accueilAlgo.peakEngagementHour,
          shouldShowLive: accueilAlgo.shouldShowLive,
          getOptimalLiveFrequency: accueilAlgo.getOptimalLiveFrequency,
          categoryPreferences: eventsAlgo.categoryPreferences || [],
          preferredCategories: requestsAlgo.getPreferredCategories ? requestsAlgo.getPreferredCategories() : [],
        }
      })
      const mappedEvents = (allBackendEvents || []).map(mapEventToVideo)
      const combinedVideos = [...displayVideos]
      const seen = new Set(displayVideos.map(v => String(v.id)))
      for (const mv of mappedEvents) {
        if (!seen.has(String(mv.id))) {
          seen.add(String(mv.id))
          combinedVideos.push(mv)
        }
      }

      const result = orchestrator.orchestrateFeed(combinedVideos, lives, [])
      return result.feed
    } catch (err) {
      console.warn('[VideoFeed] Orchestrator fallback:', err)
      return displayVideos.map(v => ({ id: String(v.id), type: 'video' as const, content: v }))
    }
  }, [displayVideos, cachedLives, allBackendEvents, query, userId, subsAlgo, accueilAlgo, eventsAlgo, requestsAlgo]);

  // Deuxième Feed Algo Pro pour le lecteur (Vidéos d'accueil + Replays/Événements + Directs orchestrés)
  const related = useMemo(() => {
    if (!activeVideo) return [];
    const activeCleanId = String(activeVideo.eventId || activeVideo.id).replace('evt-', '').replace('exile-', '');

    const list: Video[] = [];
    const seen = new Set<string>();
    seen.add(activeCleanId);
    if (activeVideo.id) seen.add(String(activeVideo.id));

    // 1. Vidéos & contenus issus de l'orchestration Algo Pro unifiée
    for (const item of orchestratedItems) {
      if (item.type === 'video') {
        const v = item.content as Video;
        const vCleanId = String(v.eventId || v.id).replace('evt-', '').replace('exile-', '');
        if (!seen.has(vCleanId) && !seen.has(String(v.id))) {
          seen.add(vCleanId);
          seen.add(String(v.id));
          list.push(v);
        }
      } else if (item.type === 'live') {
        const l = item.content;
        const lCleanId = String(l.id).replace('evt-', '').replace('exile-', '');
        if (!seen.has(lCleanId) && !seen.has(`evt-${lCleanId}`)) {
          seen.add(lCleanId);
          seen.add(`evt-${lCleanId}`);
          list.push({
            id: `evt-${lCleanId}`,
            eventId: lCleanId,
            title: l.title || 'Direct en cours',
            description: l.description || '',
            category: l.category || 'Direct',
            isLive: true,
            liveRoomName: l.liveRoomName || `exile-${lCleanId}`,
            thumbnail: l.coverImage,
            views: l.viewerCount || 0,
            viewsCount: l.viewerCount || 0,
            likes: 0,
            author: {
              id: String(l.creatorId || ''),
              name: l.organizerName || 'Organisateur',
              username: l.organizerName,
              profession: l.organizerProfession || 'Créateur',
              location: 'En ligne',
              initials: (l.organizerName || 'U').charAt(0).toUpperCase(),
              avatarColor: '#27272a',
              avatarUrl: l.organizerAvatar
            }
          });
        }
      } else if ((item as any).type === 'event') {
        const ev = item.content;
        const evCleanId = String(ev.id).replace('evt-', '').replace('exile-', '');
        if (!seen.has(evCleanId) && !seen.has(`evt-${evCleanId}`)) {
          seen.add(evCleanId);
          seen.add(`evt-${evCleanId}`);
          list.push(mapEventToVideo(ev));
        }
      }
    }

    // 2. Toujours s'assurer d'inclure toutes les vidéos d'accueil (displayVideos) non vues
    for (const v of displayVideos) {
      const vCleanId = String(v.eventId || v.id).replace('evt-', '').replace('exile-', '');
      if (!seen.has(vCleanId) && !seen.has(String(v.id))) {
        seen.add(vCleanId);
        seen.add(String(v.id));
        list.push(v);
      }
    }

    // 3. Compléter avec tous les autres événements / diffusions / replays du backend non vus
    if (allBackendEvents && allBackendEvents.length > 0) {
      for (const ev of allBackendEvents) {
        const evCleanId = String(ev.id).replace('evt-', '').replace('exile-', '');
        if (!seen.has(evCleanId) && !seen.has(`evt-${evCleanId}`)) {
          seen.add(evCleanId);
          seen.add(`evt-${evCleanId}`);
          list.push(mapEventToVideo(ev));
        }
      }
    }

    // 4. Scoring et tri Algo Pro :
    // - Priorité aux créateurs suivis (Top Feed +40)
    // - Directs en cours (+30)
    // - Même catégorie que la vidéo actuelle (+20) ou catégorie préférée (+15)
    // - Engagement & vues
    const activeCategory = (activeVideo.category || '').toLowerCase();
    const preferredCat = (accueilAlgo.mostEngagedCategory || '').toLowerCase();

    return list.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (subsAlgo.subscribedCreators?.includes(a.author?.id || '')) scoreA += 40;
      if (subsAlgo.subscribedCreators?.includes(b.author?.id || '')) scoreB += 40;

      if (a.isLive) scoreA += 30;
      if (b.isLive) scoreB += 30;

      const catA = (a.category || '').toLowerCase();
      const catB = (b.category || '').toLowerCase();
      if (activeCategory && catA === activeCategory) scoreA += 20;
      if (activeCategory && catB === activeCategory) scoreB += 20;
      if (preferredCat && catA === preferredCat) scoreA += 15;
      if (preferredCat && catB === preferredCat) scoreB += 15;

      scoreA += Math.min(25, (a.views || 0) / 10);
      scoreB += Math.min(25, (b.views || 0) / 10);

      return scoreB - scoreA;
    });
  }, [activeVideo, orchestratedItems, displayVideos, allBackendEvents, subsAlgo, accueilAlgo]);

  // Tracker les recherches avec useRequestsAlgo
  useEffect(() => {
    if (query.trim()) {
      const resultsCount = displayVideos.length
      requestsAlgo.trackSearch(query, undefined, resultsCount)
    }
  }, [query, displayVideos.length, requestsAlgo])

  // Infinite scroll for search results
  useEffect(() => {
    const handleScroll = () => {
      if (!searchResultsRef.current || !results?.hasMore || searchLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = searchResultsRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    const container = searchResultsRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [results?.hasMore, searchLoading, loadMore]);

  return (
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20 m-0 p-0`}>
      {/* PAGE PLAYER - Overlay ki kouvri TOUT (Header, Sidebar, tout) */}
      {activeVideo && (
        <div
          className={`fixed ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'} overflow-y-auto`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            zIndex: 9999,
            transform: 'translateZ(0)'
          }}
        >
          <VideoPlayerPage
            video={activeVideo}
            related={related}
            onBack={handleBack}
            onSelect={handleOpen}
          />
        </div>
      )}

      {/* Chargement direct d'un événement ou live - évite le flash de l'accueil */}
      {!activeVideo && eventParam && (
        <div
          className={`fixed inset-0 flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}
          style={{
            zIndex: 9999,
            transform: 'translateZ(0)'
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`w-8 h-8 border-2 border-t-transparent ${resolvedTheme === 'dark' ? 'border-zinc-400' : 'border-zinc-700'} rounded-full animate-spin`} />
          </div>
        </div>
      )}

      {/* FEED ACCUEIL - Mobile First: Videyo anba */}
      <div
        ref={feedRef}
        className={`flex-1 flex flex-col ${activeVideo || eventParam ? 'hidden' : 'flex'}`}
        style={{ 
          scrollPaddingTop: '0px'
        }}
      >
        {/* Loading State */}
        {searchLoading && (
          <div className="px-4 md:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center">
              <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
            </div>
          </div>
        )}

        {/* Error State */}
        {searchError && (
          <div className="px-4 md:px-6 lg:px-8 py-8">
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border text-center`}>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{searchError}</p>
              <button
                onClick={() => reset()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Professional Results */}
        {query && results && results.professionals.length > 0 && type !== 'videos' && (
          <div className="px-4 md:px-6 lg:px-8 py-4">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Professionnels ({results.professionals.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.professionals.map((prof: any) => (
                <div
                  key={prof.id}
                  onClick={() => handleProfileClick(String(prof.userId ?? prof.id))}
                  className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    {prof.photo || prof.avatarUrl ? (
                      <img
                        src={prof.photo_url || prof.avatarUrl || prof.photo}
                        alt={prof.fullName || prof.username}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold ${prof.photo || prof.avatarUrl ? 'hidden' : ''}`}>
                      {prof.fullName?.charAt(0) || prof.username?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {prof.fullName}
                      </h4>
                      <p className={`text-sm truncate ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        @{prof.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      {prof.profession}
                    </p>
                    {prof.company && (
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        {prof.company}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                      {prof.followersCount} abonnés
                    </span>
                    <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                      {prof.videosCount} vidéos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Results with Load More */}
        {query && results && results.videos.length > 0 && type !== 'professionals' && (
          <div ref={searchResultsRef} className="px-4 md:px-6 lg:px-8 py-4 max-h-[600px] overflow-y-auto">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('pro.profile.videos', 'Vidéos')} ({results.videos.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.videos.map((video: Video) => (
                <FeedVideoCard
                  key={`search-video-${video.id}`}
                  video={video}
                  onClick={() => handleOpen(video)}
                  onContact={handleContact}
                  onProfileClick={handleProfileClick}
                />
              ))}
            </div>
            {results.hasMore && (
              <button
                onClick={() => loadMore()}
                disabled={searchLoading}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? t('common.loading', 'Chargement...') : t('pro.feed.loadMore', 'Charger plus de résultats')}
              </button>
            )}
          </div>
        )}

        {/* Mobile/Tablette: Videyo - Design responsive sans espace sous le header */}
        <div className="lg:hidden">
          <div className="pt-0 pb-4">
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 md:gap-4">
              {loading && orchestratedItems.length === 0 ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <VideoSkeleton key={`mob-skel-${i}`} resolvedTheme={resolvedTheme} />
                  ))}
                </>
              ) : error && orchestratedItems.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className={`${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'} text-sm`}>{error}</p>
                  <button
                    onClick={() => loadVideos()}
                    className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                  >
                    {t('common.retry', 'Réessayer')}
                  </button>
                </div>
              ) : orchestratedItems.length > 0 ? (
                <>
                  {orchestratedItems.map((item, idx) => (
                    <React.Fragment key={`mob-feed-${item.type}-${item.id}-${idx}`}>
                      {item.type === 'live' ? (
                        <FeedLiveCard
                          live={item.content}
                          onClick={() => handleLiveClick(item.content)}
                          onProfileClick={handleProfileClick}
                          resolvedTheme={resolvedTheme}
                        />
                      ) : (
                        <FeedVideoCard
                          video={item.content}
                          onClick={() => handleOpen(item.content)}
                          onContact={handleContact}
                          onProfileClick={handleProfileClick}
                        />
                      )}
                      {/* SectionPub après 2 contenus sur Mobile/Tablette - Espacement compact et fluide sans vide */}
                      {idx === 1 && (
                        <div className="col-span-full my-0.5 sm:my-1">
                          <SectionPub />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <div className="col-span-full py-16 px-4 text-center space-y-3">
                  <p className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    {query ? t('pro.feed.noResults', 'Aucun résultat trouvé pour votre recherche') : t('pro.feed.emptyFeed', 'Aucune vidéo sur la plateforme pour le moment')}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {t('pro.feed.beFirst', 'Soyez le premier à publier du contenu sur EXILE !')}
                  </p>
                  {!query && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-lg transition-all"
                    >
                      <Plus size={16} />
                      <span>{t('pro.feed.publishVideo', 'Publier une vidéo')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: 2 KOLON: VIDEO | SECTIONPUB */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-row lg:gap-6 lg:overflow-visible order-2 lg:order-1">
          {/* Kolon GOUCH - Videyo yo (Desktop) */}
          <div className="flex-1 min-w-0 pr-80">
            {/* Kontenè videyo a - kole pi pre header la */}
            <div className="px-4 md:px-6 lg:px-8 pb-6 pt-2">
              {/* Grid videyo - Desktop: 3 cols */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {loading && orchestratedItems.length === 0 ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <VideoSkeleton key={`desk-skel-${i}`} resolvedTheme={resolvedTheme} />
                    ))}
                  </>
                ) : error && orchestratedItems.length === 0 ? (
                  <div className="col-span-full py-12 text-center">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                    <button
                      onClick={() => loadVideos()}
                      className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                    >
                      {t('common.retry', 'Réessayer')}
                    </button>
                  </div>
                ) : orchestratedItems.length > 0 ? (
                  orchestratedItems.map((item, idx) => (
                    item.type === 'live' ? (
                      <FeedLiveCard
                        key={`desk-live-${item.id}-${idx}`}
                        live={item.content}
                        onClick={() => handleLiveClick(item.content)}
                        onProfileClick={handleProfileClick}
                        resolvedTheme={resolvedTheme}
                      />
                    ) : (
                      <FeedVideoCard
                        key={`desk-video-${item.id}-${idx}`}
                        video={item.content}
                        onClick={() => handleOpen(item.content)}
                        onContact={handleContact}
                        onProfileClick={handleProfileClick}
                      />
                    )
                  ))
                ) : (
                  <div className="col-span-full py-20 px-4 text-center space-y-3">
                    <p className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      {query ? t('pro.feed.noResults', 'Aucun résultat trouvé pour votre recherche') : t('pro.feed.noVideosAvailable', 'Aucune vidéo disponible pour le moment')}
                    </p>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                      {t('pro.feed.beFirst', 'Soyez le premier à publier du contenu sur EXILE !')}
                    </p>
                    {!query && (
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-lg transition-all"
                      >
                        <Plus size={16} />
                        <span>{t('pro.feed.publishVideo', 'Publier une vidéo')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolon DWAT - SectionPub (Desktop) */}
          <aside className="w-72 xl:w-80 flex-shrink-0 lg:fixed lg:right-0 lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto overflow-visible" style={{ scrollbarWidth: 'thin' }}>
            <SectionPub />
          </aside>
        </div>
      </div>

      {/* Animation CSS custom */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ContactModal */}
      {showContactModal && selectedVideoForContact && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          receiver={{
            id: selectedVideoForContact.author?.id || 'unknown',
            name: selectedVideoForContact.author?.name || 'Inconnu',
            username: selectedVideoForContact.author?.username,
            avatar: selectedVideoForContact.author?.avatarUrl || null,
            profession: selectedVideoForContact.author?.profession || 'Professionnel'
          }}
          sender={{
            id: currentUserId,
            name: userProfile?.name || 'Moi',
            avatar: userProfile?.photo || null,
            profession: userProfile?.profession || 'Utilisateur'
          }}
        />
      )}

      {/* Video Upload Modal */}
      {isUploadOpen && (
        <UploadVideo
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      )}
    </div>
  );
}
