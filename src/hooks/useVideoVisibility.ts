import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVideoVisibilityOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseVideoVisibilityReturn {
  isVisible: boolean;
  intersectionRatio: number;
  ref: React.RefObject<HTMLDivElement>;
}

/**
 * Hook pour détecter la visibilité d'un élément vidéo avec Intersection Observer
 * Utilisé pour l'autoplay intelligent des vidéos
 */
export function useVideoVisibility(options: UseVideoVisibilityOptions = {}): UseVideoVisibilityReturn {
  const { threshold = 0.5, rootMargin = '0px', triggerOnce = false } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting) {
      setIntersectionRatio(entry.intersectionRatio);
      
      if (!triggerOnce || !hasTriggered.current) {
        setIsVisible(true);
        hasTriggered.current = true;
      }
    } else {
      setIntersectionRatio(0);
      if (!triggerOnce) {
        setIsVisible(false);
      }
    }
  }, [triggerOnce]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, handleIntersection]);

  return { isVisible, intersectionRatio, ref };
}

/**
 * Hook pour coordonner la visibilité de plusieurs vidéos
 * S'assure qu'une seule vidéo joue à la fois
 */
export function useVideoVisibilityManager() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const videoVisibilityMap = useRef<Map<string, number>>(new Map());

  const registerVideo = useCallback((videoId: string, intersectionRatio: number) => {
    videoVisibilityMap.current.set(videoId, intersectionRatio);
    
    // Trouver la vidéo la plus visible
    let maxRatio = 0;
    let mostVisibleId: string | null = null;
    
    videoVisibilityMap.current.forEach((ratio, id) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisibleId = id;
      }
    });

    // Seulement changer si la nouvelle vidéo est significativement plus visible
    if (mostVisibleId && maxRatio > 0.5) {
      setActiveVideoId(mostVisibleId);
    } else if (maxRatio < 0.3) {
      setActiveVideoId(null);
    }
  }, []);

  const unregisterVideo = useCallback((videoId: string) => {
    videoVisibilityMap.current.delete(videoId);
    
    // Recalculer la vidéo la plus visible
    let maxRatio = 0;
    let mostVisibleId: string | null = null;
    
    videoVisibilityMap.current.forEach((ratio, id) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisibleId = id;
      }
    });

    if (mostVisibleId && maxRatio > 0.5) {
      setActiveVideoId(mostVisibleId);
    } else {
      setActiveVideoId(null);
    }
  }, []);

  return { activeVideoId, registerVideo, unregisterVideo };
}
