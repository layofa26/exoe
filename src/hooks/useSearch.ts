import { useState, useEffect, useCallback } from 'react';
import { videoApi, mapApiVideo, unwrapList } from '../services/videoApi';
import { api } from '../services/apiClient';
import type { Video } from '../types/video';

export interface SearchProfessional {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  profession: string;
  location: string;
  avatarUrl: string;
  initials: string;
}

interface ProfilApiResult {
  id: number;
  user?: number;
  username?: string;
  full_name?: string;
  profession?: string;
  user_profession?: string;
  location?: string;
  city?: string;
  photo_url?: string | null;
}

interface SearchResults {
  professionals: SearchProfessional[];
  videos: Video[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const mapProfessional = (p: ProfilApiResult): SearchProfessional => {
  const fullName = p.full_name || p.username || 'Utilisateur';
  return {
    id: String(p.id),
    userId: p.user != null ? String(p.user) : String(p.id),
    username: p.username || '',
    fullName,
    profession: p.profession || p.user_profession || '',
    location: p.location || p.city || '',
    avatarUrl: p.photo_url || '',
    initials: fullName.charAt(0).toUpperCase(),
  };
};

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'videos' | 'professionals'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const runSearch = useCallback(
    async (searchQuery: string, searchType: 'all' | 'videos' | 'professionals', searchPage: number) => {
      try {
        setLoading(true);
        setError(null);

        const needProfessionals = searchType !== 'videos';
        const needVideos = searchType !== 'professionals';

        const [profilsResult, videosResult] = await Promise.all([
          needProfessionals
            ? api.get<unknown>(`/profil/profils/?search=${encodeURIComponent(searchQuery)}`)
            : Promise.resolve({ success: true, data: [] as unknown }),
          needVideos
            ? videoApi.getVideos(undefined, { search: searchQuery })
            : Promise.resolve({ success: true, data: [] }),
        ]);

        const professionals = profilsResult.success
          ? unwrapList<ProfilApiResult>(profilsResult.data).map(mapProfessional)
          : [];
        const videos = videosResult.success && videosResult.data
          ? videosResult.data.map(mapApiVideo)
          : [];

        if (!profilsResult.success && !videosResult.success) {
          setError('Erreur lors de la recherche');
        }

        setResults({
          professionals,
          videos,
          total: professionals.length + videos.length,
          page: searchPage,
          limit: 20,
          hasMore: false,
        });
      } catch (err) {
        console.error('Search error:', err);
        setError('Erreur lors de la recherche');
        setResults({
          professionals: [],
          videos: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      runSearch(query.trim(), type, page);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, page, runSearch]);

  const loadMore = () => {
    if (results?.hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const reset = () => {
    setQuery('');
    setType('all');
    setResults(null);
    setPage(1);
    setError(null);
  };

  return {
    query,
    setQuery,
    type,
    setType,
    results,
    loading,
    error,
    loadMore,
    reset,
    hasMore: results?.hasMore || false
  };
};
