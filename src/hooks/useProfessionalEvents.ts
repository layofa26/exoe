import { useQuery } from './useQuery';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1');

interface Event {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  type: string;
  category: string;
  startDate: string;
  endDate?: string;
  city?: string;
  country?: string;
  venue?: string;
  coverImageUrl?: string;
  registrationsCount: number;
  attendeesCount: number;
  capacity: number;
  isFree: boolean;
  price: number;
  liveStatus?: string;
  status: string;
}

export const useProfessionalEvents = (professionalId: string) => {
  const {
    data: cachedEvents,
    isLoading: loading,
    error: queryError
  } = useQuery<Event[]>(
    async () => {
      if (!professionalId) return [];

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return [];

        const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

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
