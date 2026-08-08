import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVideoAutoplayOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  isVisible: boolean;
  isActive: boolean;
  shouldAutoplay?: boolean;
  defaultMuted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
}

interface UseVideoAutoplayReturn {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  togglePlay: () => void;
  play: () => Promise<void>;
  pause: () => void;
}

/**
 * Hook pour gérer l'autoplay intelligent des vidéos
 * - Autoplay muted quand la vidéo entre dans le viewport
 * - Pause quand la vidéo quitte le viewport
 * - Gestion du son (muted par défaut, peut être activé par l'utilisateur)
 * - Conserve le choix utilisateur pour la session
 */
export function useVideoAutoplay(options: UseVideoAutoplayOptions): UseVideoAutoplayReturn {
  const {
    videoRef,
    isVisible,
    isActive,
    shouldAutoplay = true,
    defaultMuted = true,
    loop = true,
    onPlay,
    onPause,
    onError,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Récupérer le choix utilisateur depuis localStorage
    const savedMuted = localStorage.getItem('exile_video_muted');
    return savedMuted !== null ? savedMuted === 'true' : defaultMuted;
  });

  const userMutedChoice = useRef(isMuted);

  // Jouer la vidéo
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
      onPlay?.();
    } catch (error) {
      console.error('Error playing video:', error);
      onError?.(error as Error);
    }
  }, [videoRef, onPlay, onError]);

  // Mettre en pause la vidéo
  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    onPause?.();
  }, [videoRef, onPause]);

  // Basculer le son
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    userMutedChoice.current = newMuted;
    
    // Sauvegarder le choix utilisateur
    localStorage.setItem('exile_video_muted', String(newMuted));
  }, [videoRef, isMuted]);

  // Basculer lecture/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Autoplay quand la vidéo devient visible et active
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAutoplay) return;

    if (isVisible && isActive) {
      // Appliquer le choix utilisateur pour le son
      video.muted = userMutedChoice.current;
      play();
    } else {
      pause();
    }
  }, [isVisible, isActive, shouldAutoplay, play, pause]);

  // Configurer loop et playsInline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = loop;
    video.playsInline = true;
  }, [videoRef, loop]);

  return {
    isPlaying,
    isMuted,
    toggleMute,
    togglePlay,
    play,
    pause,
  };
}
