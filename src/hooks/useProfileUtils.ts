import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1');

interface Skill {
  id: string;
  name: string;
  category: string;
  level: string;
  createdAt: string;
}

interface UserProfile {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  photo?: string;
  banner?: string;
  photoLastModified?: string;
  profession?: string;
  speciality?: string;
  lastProfessionUpdate?: string;
  last_profession_update?: string;
  bio?: string;
  location?: string;
  country?: string;
  city?: string;
  websites?: string[];
  status?: 'online' | 'offline';
  createdAt?: string;
  date_joined?: string;
  skills?: Skill[];
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  photo_url?: string;
  banner_url?: string;
}

/**
 * Helper function pour récupérer le profil avec le vrai endpoint /profil/profils/?user=
 */
export const getProfileWithFallback = async (token: string) => {
  let currentUserId: string | null = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUserId = payload.user_id ? String(payload.user_id) : (payload.id ? String(payload.id) : null);
  } catch {}

  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId');
  }

  const doFetchProfile = async (baseUrl: string) => {
    // 1. Essayer le endpoint direct /profil/profils/me/
    try {
      const meRes = await fetch(`${baseUrl}/profil/profils/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (meRes.ok) return meRes;
    } catch {}

    // 2. Fallback par query parameter
    if (currentUserId) {
      return await fetch(`${baseUrl}/profil/profils/?user=${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return null;
  };

  try {
    let res = await doFetchProfile(API_BASE_URL);

    if (res && res.ok) {
      const data = await res.json();
      if (!Array.isArray(data) && data && data.id) {
        return data;
      }
      const list = Array.isArray(data) ? data : (data.results || []);
      if (list.length > 0) {
        return list[0];
      }
    }
  } catch (error) {
    console.error('Error loading real profile from endpoint:', error);
  }

  return null;
};

/**
 * Mapping unique backend -> UI (évite que des champs restent aux anciennes valeurs)
 */
export const mapBackendProfile = (data: any): UserProfile => {
  const SUPABASE_URL = 'https://rmbvwaemgiijitumhnys.supabase.co/storage/v1/object/public/Exile_images'
  
  const getPublicImageUrl = (urlOrFilename: string | null | undefined): string | undefined => {
    if (!urlOrFilename || typeof urlOrFilename !== 'string') return undefined
    const clean = urlOrFilename.trim()
    if (!clean || clean === 'null' || clean === 'undefined') return undefined
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
      return clean
    }
    if (clean.startsWith('/media/') || clean.startsWith('media/')) {
      return `http://localhost:8000${clean.startsWith('/') ? clean : `/${clean}`}`
    }
    return `${SUPABASE_URL}/${clean.replace(/^\/+/, '')}`
  }

  let photoUrl = getPublicImageUrl(data.photo_url || data.photo || data.avatar)
  let bannerUrl = getPublicImageUrl(data.banner_url || data.banner || data.cover)

  // Persistance hors-ligne pour la photo et la bannière
  if (photoUrl) {
    try { localStorage.setItem('exile_cached_avatar', photoUrl) } catch {}
  } else {
    try { photoUrl = localStorage.getItem('exile_cached_avatar') || undefined } catch {}
  }

  if (bannerUrl) {
    try { localStorage.setItem('exile_cached_banner', bannerUrl) } catch {}
  } else {
    try { bannerUrl = localStorage.getItem('exile_cached_banner') || undefined } catch {}
  }
  
  const mapped: UserProfile = {
    id: data.id,
    userId: data.user?.toString() || data.userId?.toString(),
    username: data.username,
    name: data.full_name || data.username || 'Utilisateur',
    fullName: data.full_name,
    full_name: data.full_name,
    email: data.email,
    photo: photoUrl,
    avatarUrl: photoUrl,
    photo_url: photoUrl,
    banner: bannerUrl,
    bannerUrl: bannerUrl,
    banner_url: bannerUrl,
    cover_url: bannerUrl,
    bio: data.bio || '',
    location: data.location || (data.city && data.country ? `${data.city}, ${data.country}` : data.city || data.country || ''),
    country: data.country || '',
    city: data.city || '',
    websites: data.website ? [data.website] : (data.websites || []),
    profession: data.profession || data.user_profession || '',
    speciality: data.speciality || data.user_speciality || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    status: 'online',
    createdAt: data.created_at || data.date_joined,
    date_joined: data.date_joined,
    lastProfessionUpdate: data.last_profession_update,
    last_profession_update: data.last_profession_update,
  }
  return mapped
};

/**
 * Synchronise le profil stocké localement avec la réponse backend
 * NOTE: Cette fonction ne fait plus rien car le projet doit être 100% en ligne
 */
export const syncStoredProfile = (_data: any) => {
  // Plus de localStorage pour les images - tout vient du backend
  console.log('syncStoredProfile called (no-op - 100% online mode)')
};

/**
 * Vérifier si la profession est modifiable (après 30 jours)
 */
export const canModifyProfession = (lastProfessionUpdate?: string | null) => {
  // Si pas de date de dernière modification, considérer comme modifiable (nouveau compte)
  if (!lastProfessionUpdate) return true;
  
  const lastUpdate = new Date(lastProfessionUpdate);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= 30;
};

/**
 * Calculer les jours restants avant modification de la profession
 */
export const getDaysUntilProfessionModification = (lastProfessionUpdate?: string | null) => {
  // Si pas de date de dernière modification, retourner 0 (modifiable immédiatement)
  if (!lastProfessionUpdate) return 0;
  
  const lastUpdate = new Date(lastProfessionUpdate);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = 30 - daysSinceUpdate;
  return Math.max(0, Math.ceil(daysRemaining));
};

/**
 * Vérifier si la photo est modifiable (après 30 jours)
 */
export const canModifyPhoto = (photoLastModified?: string | null) => {
  // Si pas de date de dernière modification, considérer comme modifiable (nouveau compte)
  if (!photoLastModified) return true;
  
  const lastUpdate = new Date(photoLastModified);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= 30;
};

/**
 * Calculer les jours restants avant modification de la photo
 */
export const getDaysUntilPhotoModification = (photoLastModified?: string | null) => {
  // Si pas de date de dernière modification, retourner 0 (modifiable immédiatement)
  if (!photoLastModified) return 0;
  
  const lastUpdate = new Date(photoLastModified);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = 30 - daysSinceUpdate;
  return Math.max(0, Math.ceil(daysRemaining));
};

/**
 * Hook personnalisé pour la gestion du profil
 */
export const useProfileUtils = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  /**
   * Recharge le profil depuis le backend et synchronise le profil local
   */
  const refreshProfile = async (token: string): Promise<UserProfile | null> => {
    const backendProfile = await getProfileWithFallback(token);
    if (!backendProfile) return null;

    const mapped = mapBackendProfile(backendProfile);
    mapped.userId = backendProfile.user != null ? String(backendProfile.user) : undefined;
    setProfile(mapped);

    syncStoredProfile(backendProfile);

    return mapped;
  };

  return {
    profile,
    setProfile,
    getProfileWithFallback,
    mapBackendProfile,
    syncStoredProfile,
    refreshProfile,
    canModifyProfession,
    getDaysUntilProfessionModification,
    canModifyPhoto,
    getDaysUntilPhotoModification
  };
};
