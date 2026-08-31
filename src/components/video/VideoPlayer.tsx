import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, RotateCcw, RotateCw, Subtitles,
  PictureInPicture, WifiOff, RefreshCw, Check, AlertCircle, X
} from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { playbackPositionStore } from '../../utils/playbackPositionStore';

export interface CaptionTrack {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface VideoQualityOption {
  id: string | number;
  label: string;
  height?: number;
  bitrate?: number;
}

export interface VideoPlayerProps {
  src: string;
  hlsUrl?: string;
  poster?: string;
  videoId?: string | number;
  autoplay?: boolean;
  className?: string;
  type?: string;
  captions?: CaptionTrack[];
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (error: string) => void;
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
};

export const toPlayableMimeType = (mimeType: string): string => {
  if (typeof document === 'undefined') return mimeType;
  if (mimeType === 'application/x-mpegURL') return mimeType;
  const probe = document.createElement('video');
  return probe.canPlayType(mimeType) ? mimeType : 'video/mp4';
};

export const guessVideoMimeType = (url: string): string => {
  const path = url.split('?')[0].split('#')[0];
  const extension = path.split('.').pop()?.toLowerCase() || '';
  return toPlayableMimeType(MIME_BY_EXTENSION[extension] || 'video/mp4');
};

const formatTime = (seconds: number): string => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  hlsUrl,
  poster,
  videoId,
  autoplay = true,
  className = '',
  type,
  captions = [],
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCaptionsMenu, setShowCaptionsMenu] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<VideoQualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string | number>('auto');
  const [currentQualityLabel, setCurrentQualityLabel] = useState<string>('Auto');

  const [availableTracks, setAvailableTracks] = useState<CaptionTrack[]>(captions);
  const [selectedTrack, setSelectedTrack] = useState<string>('off');

  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewPos, setPreviewPos] = useState<number>(0);
  const [skipFeedback, setSkipFeedback] = useState<{ side: 'left' | 'right'; show: boolean }>({ side: 'right', show: false });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);

  const effectiveSource = useMemo(() => {
    if (hlsUrl && (hlsUrl.includes('.m3u8') || type === 'application/x-mpegURL')) {
      return { src: hlsUrl, type: 'application/x-mpegURL' };
    }
    if (src && (src.includes('.m3u8') || type === 'application/x-mpegURL')) {
      return { src, type: 'application/x-mpegURL' };
    }
    return {
      src,
      type: type ? toPlayableMimeType(type) : guessVideoMimeType(src),
    };
  }, [src, hlsUrl, type]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (playerRef.current && isPlaying) {
        playerRef.current.play()?.catch?.(() => {});
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (navConn) {
      const checkSpeed = () => {
        setIsSlowConnection(navConn.saveData || navConn.effectiveType === '2g' || navConn.effectiveType === 'slow-2g');
      };
      checkSpeed();
      navConn.addEventListener?.('change', checkSpeed);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navConn.removeEventListener?.('change', checkSpeed);
      };
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      setIsPiPSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !effectiveSource.src) return;
    setPlayerError(null);
    setIsBuffering(true);
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-fluid w-full h-full object-contain';
    videoElement.playsInline = true;
    if (poster) videoElement.poster = poster;
    containerRef.current.appendChild(videoElement);

    const isHls = effectiveSource.type === 'application/x-mpegURL';
    const player = videojs(videoElement, {
      controls: false,
      autoplay,
      preload: 'auto',
      poster,
      fluid: true,
      responsive: true,
      sources: [effectiveSource],
      html5: {
        vhs: { overrideNative: isHls, smoothQualityChange: true, handlePartialData: true },
        nativeAudioTracks: !isHls,
        nativeVideoTracks: !isHls,
      },
    });

    playerRef.current = player;

    const restorePlaybackPosition = () => {
      if (!videoId) return;
      let savedTime = playbackPositionStore.get(videoId);
      if (savedTime <= 0) {
        const stored = parseFloat(localStorage.getItem(`video_progress_${videoId}`) || '0');
        if (!Number.isNaN(stored) && stored > 0) savedTime = stored;
      }
      const totalDur = player.duration() ?? 0;
      if (savedTime > 0 && totalDur > 0) {
        if (savedTime >= totalDur * 0.95) {
          savedTime = 0;
          playbackPositionStore.set(videoId, 0);
        } else {
          player.currentTime(savedTime);
          setCurrentTime(savedTime);
        }
      }
    };

    player.on('loadedmetadata', () => {
      setIsBuffering(false);
      const vidWidth = player.videoWidth();
      const vidHeight = player.videoHeight();
      if (vidWidth > 0 && vidHeight > 0) setIsVertical(vidHeight > vidWidth);
      setDuration(player.duration() ?? 0);
      restorePlaybackPosition();
      try {
        const vhs = (player as any).tech_?.vhs;
        if (vhs && vhs.representations) {
          const reps = vhs.representations();
          if (Array.isArray(reps) && reps.length > 0) {
            const quals: VideoQualityOption[] = reps.map((r: any, idx: number) => ({
              id: r.id || idx,
              label: r.height ? `${r.height}p` : `${Math.round((r.bandwidth || 0) / 1000)}k`,
              height: r.height,
              bitrate: r.bandwidth,
            })).sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
            const uniqueQuals = quals.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i);
            setAvailableQualities(uniqueQuals);
          }
        }
      } catch {}
    });

    player.on('play', () => { setIsPlaying(true); setIsBuffering(false); onPlay?.(); });
    player.on('pause', () => {
      setIsPlaying(false);
      onPause?.();
      if (videoId && player.currentTime() > 0) {
        const time = player.currentTime();
        playbackPositionStore.set(videoId, time);
        localStorage.setItem(`video_progress_${videoId}`, time.toString());
      }
    });
    player.on('waiting', () => setIsBuffering(true));
    player.on('playing', () => setIsBuffering(false));
    player.on('ended', () => {
      setIsPlaying(false);
      if (videoId) {
        playbackPositionStore.set(videoId, 0);
        localStorage.removeItem(`video_progress_${videoId}`);
      }
      onEnded?.();
    });
    player.on('timeupdate', () => {
      const cur = player.currentTime() ?? 0;
      const dur = player.duration() ?? 0;
      setCurrentTime(cur);
      setDuration(dur);
      onTimeUpdate?.(cur, dur);
      const buffered = player.buffered();
      if (buffered && buffered.length > 0) setBufferedEnd(buffered.end(buffered.length - 1));
      if (videoId && cur > 0 && Math.floor(cur) % 5 === 0) {
        playbackPositionStore.set(videoId, cur);
        localStorage.setItem(`video_progress_${videoId}`, cur.toString());
      }
    });
    player.on('volumechange', () => { setVolume(player.volume() ?? 1); setIsMuted(Boolean(player.muted())); });
    player.on('fullscreenchange', () => setIsFullscreen(Boolean(player.isFullscreen())));
    player.on('error', () => {
      setIsBuffering(false);
      const err = player.error();
      const msg = err?.message || 'Impossible de charger la vidéo.';
      setPlayerError(msg);
      onError?.(msg);
    });
    if (captions && captions.length > 0) {
      captions.forEach(c => player.addRemoteTextTrack({ kind: 'subtitles', src: c.src, srclang: c.srclang, label: c.label, default: c.default }, false));
      setAvailableTracks(captions);
    }
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed?.()) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }
    };
  }, [effectiveSource.src, effectiveSource.type, videoId]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !showSettingsMenu && !showCaptionsMenu) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  }, [isPlaying, showSettingsMenu, showCaptionsMenu]);

  const handleVideoTap = useCallback(() => {
    if (showSettingsMenu || showCaptionsMenu) {
      setShowSettingsMenu(false);
      setShowCaptionsMenu(false);
      return;
    }
    if (showControls) {
      setShowControls(false);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    } else {
      resetControlsTimer();
    }
  }, [showControls, showSettingsMenu, showCaptionsMenu, resetControlsTimer]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pause();
    else playerRef.current.play()?.catch?.(() => { playerRef.current.muted(true); playerRef.current.play()?.catch?.(() => {}); });
    resetControlsTimer();
  }, [isPlaying, resetControlsTimer]);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    const next = !isMuted;
    playerRef.current.muted(next);
    setIsMuted(next);
    resetControlsTimer();
  }, [isMuted, resetControlsTimer]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (playerRef.current) { playerRef.current.volume(val); playerRef.current.muted(val === 0); }
    resetControlsTimer();
  }, [resetControlsTimer]);

  const skipSeconds = useCallback((seconds: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    const cur = playerRef.current.currentTime() ?? 0;
    const dur = playerRef.current.duration() ?? 0;
    const target = Math.max(0, Math.min(dur, cur + seconds));
    playerRef.current.currentTime(target);
    setCurrentTime(target);
    setSkipFeedback({ side: seconds > 0 ? 'right' : 'left', show: true });
    setTimeout(() => setSkipFeedback({ side: 'right', show: false }), 600);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (playerRef.current.isFullscreen()) playerRef.current.exitFullscreen();
    else playerRef.current.requestFullscreen();
    resetControlsTimer();
  }, [resetControlsTimer]);

  const togglePiP = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        const videoEl = containerRef.current?.querySelector('video');
        if (videoEl && videoEl.requestPictureInPicture) {
          await videoEl.requestPictureInPicture();
          setIsPiPActive(true);
        }
      }
    } catch {}
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSelectQuality = useCallback((qualityId: string | number) => {
    setSelectedQuality(qualityId);
    if (!playerRef.current) return;
    try {
      const vhs = (playerRef.current as any).tech_?.vhs;
      if (vhs && vhs.representations) {
        const reps = vhs.representations();
        if (qualityId === 'auto') {
          reps.forEach((r: any) => { r.enabled(true); });
          setCurrentQualityLabel('Auto');
        } else {
          reps.forEach((r: any) => {
            const match = r.id === qualityId || r.height === qualityId;
            r.enabled(match);
            if (match) setCurrentQualityLabel(r.height ? `${r.height}p` : 'Fixe');
          });
        }
      }
    } catch {}
    setShowSettingsMenu(false);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSelectCaption = useCallback((srclang: string) => {
    setSelectedTrack(srclang);
    if (!playerRef.current) return;
    const tracks = playerRef.current.textTracks?.();
    if (tracks) {
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (srclang === 'off') t.mode = 'disabled';
        else t.mode = t.language === srclang ? 'showing' : 'disabled';
      }
    }
    setShowCaptionsMenu(false);
    resetControlsTimer();
  }, [resetControlsTimer]);
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setPreviewPos(pos * 100);
    setPreviewTime(pos * duration);
  }, [duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !playerRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    playerRef.current.currentTime(target);
    setCurrentTime(target);
    resetControlsTimer();
  }, [duration, resetControlsTimer]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  const displayQualities: VideoQualityOption[] = useMemo(() => {
    if (availableQualities.length > 0) return availableQualities;
    return [
      { id: '1080p', label: '1080p Full HD', height: 1080 },
      { id: '720p', label: '720p HD', height: 720 },
      { id: '480p', label: '480p SD', height: 480 },
      { id: '360p', label: '360p', height: 360 },
      { id: '240p', label: '240p', height: 240 },
    ];
  }, [availableQualities]);

  return (
    <div
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={handleVideoTap}
      className={`relative w-full aspect-video bg-black select-none overflow-hidden group flex items-center justify-center ${
        isVertical ? 'max-h-[85vh] max-w-sm mx-auto aspect-[9/16]' : 'aspect-video'
      } ${className}`}
    >
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
      {!isOnline && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-red-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-pulse">
          <WifiOff size={14} />
          <span>Connexion perdue.</span>
        </div>
      )}
      {isOnline && isSlowConnection && (
        <div className="absolute top-3 right-3 z-30 bg-zinc-800/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm border border-zinc-700">
          Mode Éco
        </div>
      )}
      {isBuffering && !playerError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-3 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-6 text-center" onClick={e => e.stopPropagation()}>
          <AlertCircle size={36} className="text-red-500 mb-2" />
          <p className="text-white text-xs font-semibold mb-3 max-w-xs">{playerError}</p>
          <button
            onClick={() => { if (playerRef.current) { setPlayerError(null); playerRef.current.load(); playerRef.current.play()?.catch?.(() => {}); } }}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow-md border border-zinc-600"
          >
            <RefreshCw size={13} />
            <span>Réessayer</span>
          </button>
        </div>
      )}
      {skipFeedback.show && (
        <div className={`absolute inset-y-0 ${skipFeedback.side === 'left' ? 'left-0' : 'right-0'} w-1/3 flex items-center justify-center bg-white/10 pointer-events-none transition-opacity duration-300 z-20`}>
          <div className="flex flex-col items-center gap-1 text-white font-black text-xs">
            {skipFeedback.side === 'left' ? <RotateCcw size={26} /> : <RotateCw size={26} />}
            <span>{skipFeedback.side === 'left' ? '-10s' : '+10s'}</span>
          </div>
        </div>
      )}
      {!isPlaying && !playerError && !isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={(e) => togglePlay(e)}
            className="p-3.5 sm:p-4 rounded-full bg-black/60 hover:bg-zinc-800 text-white pointer-events-auto transition-all active:scale-90 shadow-2xl backdrop-blur-sm border border-white/20"
            title="Lecture"
          >
            <Play size={28} className="ml-0.5" />
          </button>
        </div>
      )}
      <div
        onClick={e => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 z-25 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-6 pb-2 px-3 transition-all duration-300 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setPreviewTime(null)}
          className="relative w-full h-1.5 hover:h-2.5 bg-white/25 rounded-full cursor-pointer transition-all mb-2 flex items-center"
        >
          <div className="absolute top-0 bottom-0 left-0 bg-white/35 rounded-full pointer-events-none" style={{ width: `${bufferedPercent}%` }} />
          <div className="absolute top-0 bottom-0 left-0 bg-red-600 rounded-full pointer-events-none" style={{ width: `${progressPercent}%` }} />
          <div className="absolute w-3 h-3 bg-white rounded-full shadow-md -translate-x-1/2 pointer-events-none" style={{ left: `${progressPercent}%` }} />
          {previewTime !== null && (
            <div className="absolute bottom-5 -translate-x-1/2 bg-zinc-900/95 border border-zinc-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xl pointer-events-none flex flex-col items-center gap-0.5 backdrop-blur-md" style={{ left: `${previewPos}%` }}>
              <span>{formatTime(previewTime)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2">
            <button type="button" onClick={(e) => togglePlay(e)} className="p-1 text-white hover:text-red-500 transition-colors">
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button type="button" onClick={(e) => skipSeconds(-10, e)} className="p-1 text-zinc-300 hover:text-white transition-colors">
              <RotateCcw size={15} />
            </button>
            <button type="button" onClick={(e) => skipSeconds(10, e)} className="p-1 text-zinc-300 hover:text-white transition-colors">
              <RotateCw size={15} />
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={(e) => toggleMute(e)} className="p-1 text-zinc-300 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-14 sm:w-16 h-1 bg-white/30 accent-white rounded cursor-pointer hidden sm:block" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 ml-1">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-1.5 relative">
            {availableTracks.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowCaptionsMenu(o => !o); setShowSettingsMenu(false); }}
                className={`p-1.5 rounded-lg transition-colors ${selectedTrack !== 'off' ? 'text-white bg-white/20' : 'text-zinc-300 hover:text-white'}`}
              >
                <Subtitles size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowSettingsMenu(o => !o); setShowCaptionsMenu(false); }}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors relative"
            >
              <Settings size={16} />
              {currentQualityLabel !== 'Auto' && <span className="absolute -top-1 -right-1 bg-zinc-700 border border-zinc-600 text-[8px] font-bold px-1 rounded text-white">{currentQualityLabel}</span>}
            </button>
            {isPiPSupported && (
              <button type="button" onClick={(e) => togglePiP(e)} className={`p-1.5 rounded-lg transition-colors ${isPiPActive ? 'text-white' : 'text-zinc-300 hover:text-white'}`}>
                <PictureInPicture size={16} />
              </button>
            )}
            <button type="button" onClick={(e) => toggleFullscreen(e)} className="p-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            {showCaptionsMenu && (
              <div onClick={e => e.stopPropagation()} className="absolute right-0 bottom-9 z-40 bg-zinc-950/95 border border-zinc-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-md min-w-[130px] text-xs">
                <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800 mb-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Sous-titres</span>
                  <button onClick={() => setShowCaptionsMenu(false)} className="text-zinc-400 hover:text-white"><X size={12} /></button>
                </div>
                <button type="button" onClick={() => handleSelectCaption('off')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${selectedTrack === 'off' ? 'bg-white/15 text-white font-bold' : 'hover:bg-zinc-800/70 text-zinc-300'}`}>
                  <span>Désactivé</span>
                  {selectedTrack === 'off' && <Check size={12} className="text-white" />}
                </button>
                {availableTracks.map(t => (
                  <button key={t.srclang} type="button" onClick={() => handleSelectCaption(t.srclang)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${selectedTrack === t.srclang ? 'bg-white/15 text-white font-bold' : 'hover:bg-zinc-800/70 text-zinc-300'}`}>
                    <span>{t.label}</span>
                    {selectedTrack === t.srclang && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
            {showSettingsMenu && (
              <div onClick={e => e.stopPropagation()} className="absolute right-0 bottom-9 z-40 bg-zinc-950/95 border border-zinc-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-md min-w-[150px] text-xs">
                <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800 mb-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Qualité Vidéo</span>
                  <button onClick={() => setShowSettingsMenu(false)} className="text-zinc-400 hover:text-white"><X size={12} /></button>
                </div>
                <button type="button" onClick={() => handleSelectQuality('auto')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${selectedQuality === 'auto' ? 'bg-white/15 text-white font-bold' : 'hover:bg-zinc-800/70 text-zinc-300'}`}>
                  <span>Auto (Recommandé)</span>
                  {selectedQuality === 'auto' && <Check size={12} className="text-white" />}
                </button>
                {displayQualities.map(q => (
                  <button key={q.id} type="button" onClick={() => handleSelectQuality(q.height || q.id)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${selectedQuality === (q.height || q.id) ? 'bg-white/15 text-white font-bold' : 'hover:bg-zinc-800/70 text-zinc-300'}`}>
                    <span>{q.label}</span>
                    {selectedQuality === (q.height || q.id) && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
