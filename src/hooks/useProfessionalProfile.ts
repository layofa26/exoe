import { api } from '../services/apiClient';
import { unwrapList } from '../services/videoApi';
import { useQuery } from './useQuery';

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

const formatImageUrl = (filename: string | null | undefined): string => {
  if (!filename) return '';
  const clean = filename.trim();
  if (!clean || clean === 'null' || clean === 'undefined') return '';
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (clean.startsWith('/media/') || clean.startsWith('media/')) {
    const serverHost = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com' : 'http://localhost:8000')
    return `${serverHost.replace('/api/v1', '').replace('/api', '')}${clean.startsWith('/') ? clean : `/${clean}`}`;
  }
  return `https://phjpbbcymhtppfkyoegk.supabase.co/storage/v1/object/public/Exile_images/${clean.replace(/^\/+/, '')}`;
};

export const mapProfilResponse = (data: ProfilApiResponse): ProfessionalProfile => {
  const fullName = data.full_name || data.username || 'Utilisateur';
  return {
    id: String(data.id),
    userId: data.user != null ? String(data.user) : String(data.id),
    fullName,
    username: data.username || '',
    avatarUrl: formatImageUrl(data.photo_url || data.photo),
    bannerUrl: formatImageUrl(data.banner_url || data.banner),
    initials: (fullName || data.username || 'U').replace(/^@/, '').charAt(0).toUpperCase(),
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
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery<ProfessionalProfile | null>(
    async () => {
      if (!professionalId) return null;

      const result = await api.get<unknown>(
        `/profil/profils/?user=${encodeURIComponent(professionalId)}`
      );

      if (result.success && result.data) {
        const profils = unwrapList<ProfilApiResponse>(result.data);
        if (profils.length > 0) {
          return mapProfilResponse(profils[0]);
        }
      }

      // Repli: l'identifiant fourni est peut-être celui du profil lui-même
      const byId = await api.get<ProfilApiResponse>(
        `/profil/profils/${encodeURIComponent(professionalId)}/`
      );

      if (byId.success && byId.data) {
        return mapProfilResponse(byId.data);
      }

      return null;
    },
    {
      cacheKey: `pro:profile:public:${professionalId}`,
      cacheTime: 10 * 60 * 1000,
      enabled: !!professionalId
    }
  );

  return { profile, loading, error: queryError ? queryError.message : null, refresh: refetch };
};
