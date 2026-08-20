import { useState, useEffect, useCallback } from 'react';
import { videoApi, mapApiVideo } from '../services/videoApi';
import type { Video } from '../types/video';

/**
 * Vidéos publiques d'un professionnel donné (par identifiant utilisateur).
 * `mine` permet de charger aussi les vidéos privées de l'utilisateur connecté.
 */
export const useProfessionalVideos = (
  professionalId: string,
  initialPage: number = 1,
  initialLimit: number = 20,
  mine: boolean = false
) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const limit = initialLimit;

  const loadVideos = useCallback(async () => {
    if (!mine && !professionalId) {
      setError('ID de professionnel manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = mine
        ? await videoApi.getMyVideos()
        : await videoApi.getVideos(undefined, { owner: professionalId });

      if (result.success && result.data) {
        const mapped = result.data.map(mapApiVideo);
        setVideos(mapped);
        setTotal(mapped.length);
      } else {
        setVideos([]);
        setError(result.error || 'Impossible de charger les vidéos');
      }
    } catch (err) {
      console.error('Error loading professional videos:', err);
      setVideos([]);
      setError('Impossible de charger les vidéos');
    } finally {
      setLoading(false);
    }
  }, [professionalId, mine]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return {
    videos,
    loading,
    error,
    loadMore: () => undefined,
    hasMore: false,
    total,
    limit,
    page: initialPage,
    refresh: loadVideos,
  };
};
