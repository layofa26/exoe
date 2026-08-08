import { useState, useEffect } from 'react';

interface ProfessionalProfile {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profession?: string;
  specialty?: string;
  bio?: string;
  country?: string;
  city?: string;
  phone?: string;
  email?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  websites?: string[];
  skills?: any[];
  certifications?: string[];
  languages?: string[];
  followersCount: number;
  followingCount: number;
  videosCount: number;
  eventsCount: number;
  totalViews: number;
  totalLikes: number;
  rating?: number;
  experienceYears?: number;
  recommendationsCount: number;
}

export const useProfessionalProfile = (professionalId: string) => {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!professionalId) {
        setError('ID de professionnel manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Backend removed - profile loading disabled
        setError('Backend service not available');
      } catch (err) {
        console.error('Error loading professional profile:', err);
        setError('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [professionalId]);

  return { profile, loading, error };
};
