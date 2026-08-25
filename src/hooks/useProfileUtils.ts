import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
 * Helper function pour récupérer le profil avec fallback
 */
export const getProfileWithFallback = async (token: string) => {
  console.log('Getting profile...');
  
  // Récupérer l'utilisateur connecté depuis l'API
  let currentUserId: string | null = null;
  try {
    const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      currentUserId = userData.id?.toString();
      console.log('Current userId from API:', currentUserId);
    }
  } catch (error) {
    console.log('Error fetching user from API, trying localStorage fallback:', error);
    currentUserId = localStorage.getItem('userId');
    console.log('Current userId from localStorage fallback:', currentUserId);
  }
  
  // Endpoint standard pour récupérer le profil de l'utilisateur connecté
  try {
    const meResponse = await fetch(`${API_BASE_URL}/profil/profils/?user=${currentUserId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (meResponse.ok) {
      const meData = await meResponse.json();
      if (meData.results && meData.results.length > 0) {
        return meData.results[0];
      } else if (Array.isArray(meData) && meData.length > 0) {
        return meData[0];
      }
    }
  } catch (error) {
    console.log('Error fetching /profil/profils/?user=, trying list endpoint:', error);
  }

  // Fallback: liste complète filtrée sur l'utilisateur connecté
  console.log('Loading from list endpoint');
  const listResponse = await fetch(`${API_BASE_URL}/profil/profils/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('List response status:', listResponse.status);
  
  if (!listResponse.ok) {
    throw new Error(`Erreur HTTP: ${listResponse.status}`);
  }

  const data = await listResponse.json();
  console.log('Profile list data received:', data);
  
  // Chercher le profil de l'utilisateur connecté
  if (data.results && data.results.length > 0) {
    console.log('Data has results array with', data.results.length, 'items');
    const foundProfile = data.results.find((p: any) => p.user?.toString() === currentUserId);
    console.log('Found profile by userId:', foundProfile);
    if (!foundProfile) {
      console.error('No profile found for current user ID:', currentUserId);
      console.error('Available profiles:', data.results.map((p: any) => ({ id: p.id, user: p.user, username: p.username })));
    }
    return foundProfile;
  } else if (Array.isArray(data) && data.length > 0) {
    console.log('Data is array with', data.length, 'items');
    const foundProfile = data.find((p: any) => p.user?.toString() === currentUserId);
    console.log('Found profile by userId:', foundProfile);
    if (!foundProfile) {
      console.error('No profile found for current user ID:', currentUserId);
      console.error('Available profiles:', data.map((p: any) => ({ id: p.id, user: p.user, username: p.username })));
    }
    return foundProfile;
  } else if (data.id) {
    console.log('Data has id:', data.id);
    // Vérifier que c'est bien le profil de l'utilisateur connecté
    if (data.user?.toString() !== currentUserId) {
      console.error('Profile ID does not match current user ID:', { profileUser: data.user, currentUser: currentUserId });
      return null;
    }
    return data;
  }
  
  console.log('No profile found, returning null');
  return null;
};

/**
 * Mapping unique backend -> UI (évite que des champs restent aux anciennes valeurs)
 */
export const mapBackendProfile = (data: any): UserProfile => {
  console.log('mapBackendProfile input FULL:', JSON.stringify(data, null, 2))
  
  // Construire l'URL publique pour les images (éviter les URLs signées qui expirent)
  const SUPABASE_URL = 'https://rmbvwaemgiijitumhnys.supabase.co/storage/v1/object/public/Exile_images'
  
  const getPublicImageUrl = (filename: string | null | undefined): string | undefined => {
    if (!filename) return undefined
    console.log('getPublicImageUrl input:', filename)
    // Si c'est déjà une URL complète, la retourner
    if (filename.startsWith('http')) {
      console.log('Already a full URL, returning as-is:', filename)
      return filename
    }
    // Sinon, construire l'URL publique
    const publicUrl = `${SUPABASE_URL}/${filename}`
    console.log('Constructed public URL:', publicUrl)
    return publicUrl
  }
  
  const mapped: UserProfile = {
    id: data.id,
    username: data.username,
    photo: getPublicImageUrl(data.photo || data.photo_url),
    bio: data.bio,
    location: data.location,
    country: data.country,
    city: data.city,
    websites: data.website ? [data.website] : [],
    name: data.full_name || data.username,
    fullName: data.full_name || data.username,
    avatarUrl: getPublicImageUrl(data.photo || data.photo_url),
    // Utiliser l'URL publique pour la bannière
    banner: getPublicImageUrl(data.banner || data.banner_url),
    banner_url: data.banner_url,
    profession: data.profession || data.user_profession,
    speciality: data.speciality || data.user_speciality,
    lastProfessionUpdate: data.last_profession_update || data.lastProfessionUpdate,
    skills: data.skills || [],
    createdAt: data.date_joined || data.created_at,
    date_joined: data.date_joined || data.created_at,
    status: 'online' as const,
    email: data.email || ''
  }
  console.log('mapBackendProfile output banner:', mapped.banner)
  console.log('mapBackendProfile output banner_url:', mapped.banner_url)
  console.log('mapBackendProfile output FULL:', JSON.stringify(mapped, null, 2))
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
