import { useState, useEffect, useCallback } from 'react';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
  createdAt: string;
  duration?: number;
  likesCount: number;
  commentsCount: number;
  hashtags?: string[];
}

interface VideosResponse {
  videos: Video[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const useProfessionalVideos = (professionalId: string, initialPage: number = 1, initialLimit: number = 20) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const limit = initialLimit;

  const loadVideos = useCallback(async (pageNum: number = initialPage) => {
    if (!professionalId) {
      setError('ID de professionnel manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Token non trouvé')
        return
      }

      const response = await fetch(`${API_BASE_URL}/accueil/videos/my_videos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.results || data)
      } else {
        setError('Impossible de charger les vidéos')
      }
    } catch (err) {
      console.error('Error loading professional videos:', err);
      setError('Impossible de charger les vidéos');
    } finally {
      setLoading(false);
    }
  }, [professionalId, initialPage, limit]);

  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  const loadMore = () => {
    if (hasMore && !loading) {
      loadVideos(page + 1);
    }
  };

  const refresh = () => {
    loadVideos(1);
  };

  return { videos, loading, error, loadMore, hasMore, total, refresh };
};
