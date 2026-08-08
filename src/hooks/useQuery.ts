import { useState, useEffect, useCallback } from 'react';

interface UseQueryOptions {
  enabled?: boolean;
  cacheKey: string;
  cacheTime?: number; // in milliseconds
}

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé qui simule React Query avec cache localStorage
 * Permet d'éviter l'installation de dépendances externes
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions
): UseQueryResult<T> {
  const { enabled = true, cacheKey, cacheTime = 5 * 60 * 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if (now - timestamp < cacheTime) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const result = await queryFn();
      setData(result);

      // Cache the result
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result, timestamp: Date.now() })
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, cacheKey, cacheTime, queryFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

interface UseMutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

interface UseMutationResult<TData> {
  mutate: () => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
}

/**
 * Hook personnalisé qui simule React Query mutations
 */
export function useMutation<TData>(
  mutationFn: () => Promise<TData>,
  options?: UseMutationOptions<TData>
): UseMutationResult<TData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { mutate, isLoading, error, data };
}

/**
 * Hook pour invalider le cache
 */
export function useInvalidateQuery() {
  const invalidate = useCallback((cacheKey: string) => {
    localStorage.removeItem(cacheKey);
  }, []);

  return { invalidate };
}
