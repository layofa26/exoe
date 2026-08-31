import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '../services/cacheService';

export interface UseQueryOptions<T> {
  cacheKey: string;
  cacheTime?: number; // TTL en millisecondes (durée où la donnée est considérée "fraîche")
  enabled?: boolean; // Si false, ne lance pas la requête automatique
  initialData?: T; // Donnée par défaut si pas de cache
  staleTime?: number; // Temps avant revalidation d'arrière-plan (défaut: même que cacheTime)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchOnMount?: boolean; // Si true, revalide toujours en arrière-plan au montage même si frais
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean; // True SEULEMENT si AUCUNE donnée n'est disponible (ni cache ni mémoire)
  isRevalidating: boolean; // True quand un appel réseau tourne en arrière-plan
  error: Error | null;
  refetch: () => Promise<T | null>;
  setData: (updater: T | ((prev: T | null) => T)) => void;
  invalidate: () => void;
}

/**
 * Hook SWR Haute Performance façon YouTube
 * 1. Renvoie immédiatement la donnée en cache (0ms, pas de loader bloquant)
 * 2. Revalide en arrière-plan si expiré ou si demandé
 * 3. Se synchronise en temps réel avec les autres composants via cacheService
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T>
): UseQueryResult<T> {
  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000,
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    refetchOnMount = true
  } = options;

  // Lecture synchrone initiale pour éviter tout flash d'état vide
  const initialCache = cacheService.get<T>(cacheKey, { maxAge: cacheTime, allowStale: true });

  const [data, setInternalData] = useState<T | null>(() => {
    if (initialCache.hasCache && initialCache.data !== null) {
      return initialCache.data;
    }
    return initialData;
  });

  // isLoading est true UNIQUEMENT si on n'a absolument rien à afficher
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!enabled) return false;
    return !initialCache.hasCache && initialData === null;
  });

  const [isRevalidating, setIsRevalidating] = useState<boolean>(() => {
    if (!enabled) return false;
    return initialCache.hasCache ? (initialCache.isStale || refetchOnMount) : false;
  });

  const [error, setError] = useState<Error | null>(null);

  // Garder les refs à jour pour éviter les triggers de useEffect infinis
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Fonction de récupération de données fraîches
  const executeFetch = useCallback(async (isManualRefetch = false): Promise<T | null> => {
    if (!enabled) return null;

    // Si on a déjà des données, on active seulement isRevalidating (pas de spinner bloquant)
    const currentCached = cacheService.get<T>(cacheKey, { maxAge: cacheTime, allowStale: true });
    if (currentCached.hasCache && currentCached.data !== null) {
      setIsRevalidating(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const freshData = await queryFnRef.current();
      
      // Mettre en cache
      cacheService.set<T>(cacheKey, freshData, cacheTime);
      setInternalData(freshData);
      onSuccessRef.current?.(freshData);
      return freshData;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.warn(`[useQuery:${cacheKey}] Error fetching:`, e);
      setError(e);
      onErrorRef.current?.(e);
      return null;
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, [cacheKey, cacheTime, enabled]);

  // Déclencher le fetch au montage / changement de clé
  useEffect(() => {
    if (!enabled) return;

    const cacheStatus = cacheService.get<T>(cacheKey, { maxAge: cacheTime, allowStale: true });
    
    // Si la donnée est en cache, synchroniser l'état immédiatement
    if (cacheStatus.hasCache && cacheStatus.data !== null) {
      setInternalData(cacheStatus.data);
      setIsLoading(false);
      
      // Si la donnée est périmée ou si refetchOnMount est activé, revalider en arrière-plan
      if (cacheStatus.isStale || refetchOnMount) {
        executeFetch();
      }
    } else {
      // Pas de cache -> fetch initial complet
      executeFetch();
    }
  }, [cacheKey, cacheTime, enabled, refetchOnMount, executeFetch]);

  // S'abonner aux mises à jour externes du cache (autres onglets/composants)
  useEffect(() => {
    const unsubscribe = cacheService.subscribe<T>(cacheKey, (newData) => {
      if (newData !== null) {
        setInternalData(newData);
        setIsLoading(false);
      } else {
        // En cas d'invalidation explicite
        executeFetch();
      }
    });

    return unsubscribe;
  }, [cacheKey, executeFetch]);

  // Permet de mettre à jour manuellement la valeur locale et le cache
  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    if (typeof updater === 'function') {
      cacheService.mutate<T>(cacheKey, updater as (prev: T | null) => T, { ttl: cacheTime });
    } else {
      cacheService.set<T>(cacheKey, updater, cacheTime);
    }
  }, [cacheKey, cacheTime]);

  // Invalider cette clé
  const invalidate = useCallback(() => {
    cacheService.invalidate(cacheKey);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    refetch: () => executeFetch(true),
    setData,
    invalidate
  };
}

export interface UseMutationOptions<TData, TVariables = void> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateKeys?: (string | RegExp)[];
}

export interface UseMutationResult<TData, TVariables = void> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook de mutation avec invalidation automatique des clés de cache associées
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);

        // Invalider les clés de cache spécifiées
        if (options?.invalidateKeys) {
          options.invalidateKeys.forEach(key => cacheService.invalidate(key));
        }

        options?.onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        options?.onError?.(errorObj, variables);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, data, reset };
}

/**
 * Hook et fonction d'invalidation globale
 */
export function useInvalidateQuery() {
  const invalidate = useCallback((keyOrPattern: string | RegExp) => {
    cacheService.invalidate(keyOrPattern);
  }, []);

  const clearAll = useCallback(() => {
    cacheService.clear();
  }, []);

  return { invalidate, clearAll };
}

export const invalidateCache = (keyOrPattern: string | RegExp) => {
  cacheService.invalidate(keyOrPattern);
};
