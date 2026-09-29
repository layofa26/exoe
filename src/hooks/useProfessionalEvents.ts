import { useQuery } from './useQuery';
import type { EventItem } from '../types/events';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const useProfessionalEvents = (professionalId: string) => {
  const {
    data: cachedEvents,
    isLoading: loading,
    error: queryError
  } = useQuery<EventItem[]>(
    async () => {
      if (!professionalId) return [];

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return [];

        const response = await fetch(
          `${API_BASE_URL}/evenement/evenements/?owner=${encodeURIComponent(professionalId)}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.results || data || [];
        }
        return [];
      } catch (err) {
        console.error('Error loading professional events:', err);
        return [];
      }
    },
    {
      cacheKey: `pro:events:user:${professionalId}`,
      cacheTime: 5 * 60 * 1000,
      enabled: !!professionalId,
      initialData: []
    }
  );

  const events = cachedEvents || [];

  return {
    events,
    loading,
    error: queryError ? queryError.message : null,
    loadMore: () => undefined,
    hasMore: false
  };
};
