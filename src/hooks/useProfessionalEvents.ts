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
      // Backend removed - events loading disabled
      setError('Backend service not available');
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
