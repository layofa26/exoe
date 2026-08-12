import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface SearchResults {
  professionals: any[];
  videos: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'videos' | 'professionals'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const debouncedSearch = useCallback(
    (searchQuery: string, searchType: 'all' | 'videos' | 'professionals', searchPage: number = 1) => {
      const timer = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setResults(null);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem('accessToken');
          
          // Recherche parallèle professionnels et vidéos
          const [profilsResponse, videosResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/profil/profils/?search=${searchQuery}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch(`${API_BASE_URL}/accueil/videos/?search=${searchQuery}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          ]);

          const profilsData = profilsResponse.ok ? await profilsResponse.json() : { results: [] };
          const videosData = videosResponse.ok ? await videosResponse.json() : { results: [] };

          const professionals = profilsData.results ? profilsData.results.map((p: any) => ({
            id: p.id,
            username: p.username,
            fullName: p.full_name || p.username,
            profession: p.profession || p.user_profession || '',
            company: '',
            followersCount: 0,
            videosCount: 0,
            avatarUrl: p.photo_url || p.photo
          })) : [];

          const videos = videosData.results ? videosData.results.map((v: any) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            thumbnail: v.cover_url || v.cover,
            videoUrl: v.file_url || v.file,
            author: {
              id: v.owner,
              fullName: v.owner || 'Utilisateur',
              profession: ''
            },
            views: 0,
            createdAt: v.created_at
          })) : [];

          const filteredProfessionals = searchType === 'video' ? [] : professionals;
          const filteredVideos = searchType === 'professional' ? [] : videos;

          setResults({
            professionals: filteredProfessionals,
            videos: filteredVideos,
            total: filteredProfessionals.length + filteredVideos.length,
            page: searchPage,
            limit: 20,
            hasMore: false
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
            hasMore: false
          });
        } finally {
          setLoading(false);
        }
      }, 150);

      return () => clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    const cleanup = debouncedSearch(query, type, page);
    return cleanup;
  }, [query, type, page, debouncedSearch]);

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
