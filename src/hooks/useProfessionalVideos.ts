import { videoApi, mapApiVideo } from '../services/videoApi';
import type { Video } from '../types/video';
import { useQuery } from './useQuery';

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
  const limit = initialLimit;

  const {
    data: cachedVideos,
    isLoading: loading,
    error: queryError,
    refetch: refresh
  } = useQuery<Video[]>(
    async () => {
      if (!mine && !professionalId) return [];

      const result = mine
        ? await videoApi.getMyVideos()
        : await videoApi.getVideos(undefined, { owner: professionalId });

      if (result.success && result.data) {
        return result.data.map(mapApiVideo);
      }
      return [];
    },
    {
      cacheKey: mine ? 'pro:videos:my' : `pro:videos:user:${professionalId}`,
      cacheTime: 3 * 60 * 1000,
      enabled: mine || !!professionalId,
      initialData: []
    }
  );

  const videos = cachedVideos || [];

  return {
    videos,
    loading,
    error: queryError ? queryError.message : null,
    loadMore: () => undefined,
    hasMore: false,
    total: videos.length,
    limit,
    page: initialPage,
    refresh,
  };
};
