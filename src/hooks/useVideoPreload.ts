import { useEffect, useRef, useState } from 'react';

interface UseVideoPreloadOptions {
  videoUrl?: string;
  preloadStrategy?: 'none' | 'metadata' | 'auto';
  isVisible?: boolean;
  isActive?: boolean;
  preloadNext?: boolean;
  preloadPrevious?: boolean;
}

interface UseVideoPreloadReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  preloadVideo: () => void;
  unloadVideo: () => void;
}

/**
 * Hook pour gérer le préchargement intelligent des vidéos
 * - Ne charge que les vidéos visibles et adjacentes
 * - Utilise preload="metadata" par défaut pour économiser la bande passante
 * - Suspend le préchargement des vidéos non visibles
 */
export function useVideoPreload(options: UseVideoPreloadOptions): UseVideoPreloadReturn {
  const {
    videoUrl,
    preloadStrategy = 'metadata',
    isVisible = false,
    isActive = false,
    preloadNext = true,
    preloadPrevious = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Précharger la vidéo
  const preloadVideo = () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setIsLoading(true);
    setError(null);

    video.src = videoUrl;
    video.preload = preloadStrategy;

    video.addEventListener('loadstart', () => {
      setIsLoading(true);
    });

    video.addEventListener('loadeddata', () => {
      setIsLoading(false);
      setIsLoaded(true);
    });

    video.addEventListener('loadedmetadata', () => {
      setIsLoading(false);
      setIsLoaded(true);
    });

    video.addEventListener('canplay', () => {
      setIsLoading(false);
      setIsLoaded(true);
    });

    video.addEventListener('error', (e) => {
      setIsLoading(false);
      setIsLoaded(false);
      setError(new Error('Failed to load video'));
    });
  };

  // Décharger la vidéo pour libérer des ressources
  const unloadVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.src = '';
    video.preload = 'none';
    setIsLoaded(false);
    setError(null);
  };

  // Précharger automatiquement quand la vidéo devient visible/active
  useEffect(() => {
    if (isVisible && isActive && videoUrl) {
      preloadVideo();
    } else if (!isVisible && !isActive) {
      // Décharger si la vidéo n'est plus visible et pas active
      // Mais garder si elle est dans la zone de préchargement
      unloadVideo();
    }
  }, [isVisible, isActive, videoUrl]);

  // Cleanup
  useEffect(() => {
    return () => {
      unloadVideo();
    };
  }, []);

  return {
    isLoading,
    isLoaded,
    error,
    preloadVideo,
    unloadVideo,
  };
}

/**
 * Hook pour gérer le préchargement de plusieurs vidéos dans une liste
 * Précharge seulement la vidéo visible et les vidéos adjacentes
 */
export function useVideoListPreload(
  videos: Array<{ id: string; url: string }>,
  activeIndex: number,
  preloadRadius: number = 1
) {
  const [preloadSet, setPreloadSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newPreloadSet = new Set<string>();

    // Précharger la vidéo active
    if (videos[activeIndex]) {
      newPreloadSet.add(videos[activeIndex].id);
    }

    // Précharger les vidéos adjacentes
    for (let i = 1; i <= preloadRadius; i++) {
      const nextIndex = activeIndex + i;
      const prevIndex = activeIndex - i;

      if (videos[nextIndex]) {
        newPreloadSet.add(videos[nextIndex].id);
      }
      if (videos[prevIndex]) {
        newPreloadSet.add(videos[prevIndex].id);
      }
    }

    setPreloadSet(newPreloadSet);
  }, [videos, activeIndex, preloadRadius]);

  const shouldPreload = (videoId: string) => {
    return preloadSet.has(videoId);
  };

  return { shouldPreload, preloadSet };
}
