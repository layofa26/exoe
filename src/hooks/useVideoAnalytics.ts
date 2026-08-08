import { useEffect, useRef, useCallback } from 'react';

interface UseVideoAnalyticsOptions {
  videoId: string;
  userId?: string;
  enabled?: boolean;
  viewThreshold?: number; // seconds before counting a view
  onViewRegistered?: (videoId: string, userId: string) => void;
  onWatchTimeUpdated?: (videoId: string, userId: string, watchTime: number) => void;
}

/**
 * Hook pour gérer les analytics vidéo
 * - Enregistre une vue après X secondes de lecture
 * - Suit le temps de visionnage
 * - Préparé pour l'intégration backend
 */
export function useVideoAnalytics({
  videoId,
  userId = 'anonymous',
  enabled = true,
  viewThreshold = 3,
  onViewRegistered,
  onWatchTimeUpdated,
}: UseVideoAnalyticsOptions) {
  const viewRegisteredRef = useRef(false);
  const watchStartTimeRef = useRef<number | null>(null);
  const totalWatchTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enregistrer la vue après le seuil
  const registerView = useCallback(() => {
    if (!enabled || viewRegisteredRef.current) return;

    viewRegisteredRef.current = true;
    onViewRegistered?.(videoId, userId);

    // Préparer pour l'appel API backend
    // await api.registerView({ videoId, userId })
  }, [enabled, videoId, userId, onViewRegistered]);

  // Mettre à jour le temps de visionnage
  const updateWatchTime = useCallback(() => {
    if (!enabled || watchStartTimeRef.current === null) return;

    const elapsed = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
    totalWatchTimeRef.current = elapsed;
    onWatchTimeUpdated?.(videoId, userId, elapsed);

    // Préparer pour l'appel API backend
    // await api.updateWatchTime({ videoId, userId, watchTime: elapsed })
  }, [enabled, videoId, userId, onWatchTimeUpdated]);

  // Démarrer le suivi quand la vidéo commence
  const startTracking = useCallback(() => {
    if (!enabled) return;

    watchStartTimeRef.current = Date.now();
    totalWatchTimeRef.current = 0;

    // Enregistrer la vue après le seuil
    setTimeout(registerView, viewThreshold * 1000);

    // Mettre à jour le temps de visionnage toutes les secondes
    intervalRef.current = setInterval(updateWatchTime, 1000);
  }, [enabled, viewThreshold, registerView, updateWatchTime]);

  // Arrêter le suivi quand la vidéo s'arrête
  const stopTracking = useCallback(() => {
    if (!enabled) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (watchStartTimeRef.current !== null) {
      updateWatchTime();
      watchStartTimeRef.current = null;
    }
  }, [enabled, updateWatchTime]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    registerView,
    startTracking,
    stopTracking,
    totalWatchTime: totalWatchTimeRef.current,
    isViewRegistered: viewRegisteredRef.current,
  };
}

/**
 * Hook pour enregistrer une vue vidéo (version simplifiée)
 */
export function useVideoView(videoId: string, userId?: string) {
  const viewRegisteredRef = useRef(false);

  const registerView = useCallback(() => {
    if (viewRegisteredRef.current) return;

    viewRegisteredRef.current = true;

    // Préparer pour l'appel API backend
    // await api.registerView({ videoId, userId: userId || 'anonymous' })
    console.log(`[Analytics] View registered for video ${videoId} by user ${userId || 'anonymous'}`);
  }, [videoId, userId]);

  return { registerView, isViewRegistered: viewRegisteredRef.current };
}

/**
 * Hook pour suivre le temps de visionnage (version simplifiée)
 */
export function useWatchTime(videoId: string, userId?: string) {
  const watchTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTracking = useCallback(() => {
    intervalRef.current = setInterval(() => {
      watchTimeRef.current += 1;
      // Préparer pour l'appel API backend
      // await api.updateWatchTime({ videoId, userId: userId || 'anonymous', watchTime: watchTimeRef.current })
    }, 1000);
  }, [videoId, userId]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getWatchTime = useCallback(() => watchTimeRef.current, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    startTracking,
    stopTracking,
    getWatchTime,
    watchTime: watchTimeRef.current,
  };
}
