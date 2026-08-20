import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  className?: string
  /** Type MIME réel du fichier; déduit de l'URL s'il n'est pas fourni */
  type?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  m3u8: 'application/x-mpegURL',
}

/**
 * Certains conteneurs (.mov) sont lisibles par le navigateur alors que
 * canPlayType() rejette leur type déclaré : on retombe sur video/mp4 pour ne
 * pas faire échouer la source (MEDIA_ERR_SRC_NOT_SUPPORTED).
 */
export const toPlayableMimeType = (mimeType: string): string => {
  if (typeof document === 'undefined') return mimeType
  if (mimeType === 'application/x-mpegURL') return mimeType

  const probe = document.createElement('video')
  return probe.canPlayType(mimeType) ? mimeType : 'video/mp4'
}

export const guessVideoMimeType = (url: string): string => {
  const path = url.split('?')[0].split('#')[0]
  const extension = path.split('.').pop()?.toLowerCase() || ''
  return toPlayableMimeType(MIME_BY_EXTENSION[extension] || 'video/mp4')
}

export const VideoPlayer = ({
  src,
  poster,
  autoplay = false,
  className = '',
  type,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate
}: VideoPlayerProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playerError, setPlayerError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoRef.current || !src) return

    setPlayerError(null)

    const sourceType = type ? toPlayableMimeType(type) : guessVideoMimeType(src)
    const isStream = sourceType === 'application/x-mpegURL'

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay,
      preload: 'auto',
      poster,
      fluid: true,
      responsive: true,
      sources: [{ src, type: sourceType }],
      html5: {
        vhs: {
          overrideNative: isStream
        },
        // Lecture native requise pour MP4/WebM/MOV progressifs
        nativeAudioTracks: !isStream,
        nativeVideoTracks: !isStream
      }
    })

    playerRef.current = player

    // Event listeners
    player.on('play', () => {
      setIsPlaying(true)
      onPlay?.()
    })

    player.on('pause', () => {
      setIsPlaying(false)
      onPause?.()
    })

    player.on('ended', () => {
      setIsPlaying(false)
      onEnded?.()
    })

    player.on('timeupdate', () => {
      const current = player.currentTime() ?? 0
      const total = player.duration() ?? 0
      setCurrentTime(current)
      setDuration(total)
      onTimeUpdate?.(current, total)
    })

    player.on('volumechange', () => {
      setVolume(player.volume() ?? 1)
      setIsMuted(Boolean(player.muted()))
    })

    player.on('error', () => {
      const error = player.error()
      if (error?.code === 4) {
        setPlayerError("Format vidéo non supporté ou lien expiré. Rechargez la page pour obtenir un nouveau lien.")
      } else {
        setPlayerError(error?.message || 'Impossible de lire cette vidéo.')
      }
    })

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
      }
    }
  }, [src, poster, autoplay, type])

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (playerRef.current) {
      playerRef.current.volume(newVolume)
      playerRef.current.muted(newVolume === 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (playerRef.current) {
      playerRef.current.currentTime(time)
    }
  }

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (playerRef.current.isFullscreen()) {
        playerRef.current.exitFullscreen()
      } else {
        playerRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`relative w-full bg-black overflow-hidden ${className}`}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          playsInline
          className="video-js vjs-big-play-centered vjs-fluid"
        />
      </div>

      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
          <p className="text-white text-sm">{playerError}</p>
        </div>
      )}
      
      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            
            {/* Time */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Settings */}
            <button className="text-white hover:text-blue-400 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
