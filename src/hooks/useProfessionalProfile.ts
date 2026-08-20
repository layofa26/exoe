import { useState, useEffect } from 'react';
import { api } from '../services/apiClient';
import { unwrapList } from '../services/videoApi';

/**
 * Réponse réelle de ProfilSerializer (backend Django).
 */
export interface ProfilApiResponse {
  id: number;
  user: number;
  username: string;
  full_name: string;
  email?: string;
  user_profession?: string;
  user_speciality?: string;
  country?: string;
  city?: string;
  photo?: string | null;
  photo_url?: string | null;
  banner?: string | null;
  banner_url?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  profession?: string;
  speciality?: string;
  created_at: string;
  date_joined?: string;
  skills?: Array<{ id: number; name: string; category: string; level: string }>;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  initials: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profession?: string;
  specialty?: string;
  bio?: string;
  country?: string;
  city?: string;
  email?: string;
  websites?: string[];
  skills: Array<{ id: number; name: string; category: string; level: string }>;
  languages: string[];
  certifications?: string[];
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

export const mapProfilResponse = (data: ProfilApiResponse): ProfessionalProfile => {
  const fullName = data.full_name || data.username || 'Utilisateur';
  return {
    id: String(data.id),
    userId: data.user != null ? String(data.user) : String(data.id),
    fullName,
    username: data.username || '',
    avatarUrl: data.photo_url || '',
    bannerUrl: data.banner_url || '',
    initials: fullName.charAt(0).toUpperCase(),
    verified: false,
    createdAt: data.date_joined || data.created_at,
    profession: data.profession || data.user_profession || '',
    specialty: data.speciality || data.user_speciality || '',
    bio: data.bio || '',
    country: data.country || '',
    city: data.city || data.location || '',
    email: data.email || '',
    websites: data.website ? [data.website] : [],
    skills: data.skills || [],
    languages: [],
    followersCount: 0,
    followingCount: 0,
    videosCount: 0,
    eventsCount: 0,
    totalViews: 0,
    totalLikes: 0,
    recommendationsCount: 0,
  };
};

/**
 * Charge le profil public d'un utilisateur à partir de son identifiant utilisateur
 * (celui exposé par les vidéos via `owner`).
 */
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

        const result = await api.get<unknown>(
          `/profil/profils/?user=${encodeURIComponent(professionalId)}`
        );

        if (!result.success) {
          setError(result.error || 'Impossible de charger le profil');
          return;
        }

        const profils = unwrapList<ProfilApiResponse>(result.data);

        if (profils.length > 0) {
          setProfile(mapProfilResponse(profils[0]));
          return;
        }

        // Repli: l'identifiant fourni est peut-être celui du profil lui-même
        const byId = await api.get<ProfilApiResponse>(
          `/profil/profils/${encodeURIComponent(professionalId)}/`
        );

        if (byId.success && byId.data) {
          setProfile(mapProfilResponse(byId.data));
        } else {
          setError('Profil non trouvé');
        }
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
