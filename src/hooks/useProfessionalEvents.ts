import { useState, useEffect } from 'react';

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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadEvents = async (pageNum: number = 1) => {
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

      const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.results || data)
      } else {
        setError('Impossible de charger les événements')
      }
    } catch (err) {
      console.error('Error loading professional events:', err);
      setError('Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadEvents(page + 1);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, [professionalId]);

  return { events, loading, error, loadMore, hasMore };
};
