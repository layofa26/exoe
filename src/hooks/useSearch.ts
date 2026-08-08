import { useState, useEffect, useCallback } from 'react';

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
          // Backend removed - search disabled
          setError('Backend service not available');
        } catch (err) {
          console.error('Search error:', err);
          setError('Erreur lors de la recherche');
        } finally {
          setLoading(false);
        }
      }, 300);

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
