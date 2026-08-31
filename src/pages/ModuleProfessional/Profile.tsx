import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Globe, Calendar,
  Briefcase, Plus, Edit2, Lock, X,
  Users, Video, MessageSquare,
  TrendingUp, Settings, Camera, Heart, ArrowLeft,
  ChevronDown, Award, Sparkles
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUserId } from '../../services/apiClient'
import { cacheService } from '../../services/cacheService'
import { 
  getProfileWithFallback, 
  mapBackendProfile, 
  syncStoredProfile,
  canModifyProfession,
  getDaysUntilProfessionModification,
  canModifyPhoto,
  getDaysUntilPhotoModification
} from '../../hooks/useProfileUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

async function authFetch(path: string, options?: RequestInit): Promise<Response> {
  let token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    const refresh = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token')
    if (refresh) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        })
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.access) {
            localStorage.setItem('accessToken', refreshData.access)
            headers['Authorization'] = `Bearer ${refreshData.access}`
            res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
          }
        }
      } catch {}
    }
  }
  return res
}

interface Skill {
  id: string
  name: string
  category: string
  level: string
  createdAt: string
}

interface UserProfile {
  id?: string
  userId?: string
  name?: string
  email?: string
  photo?: string
  banner?: string
  photoLastModified?: string
  profession?: string
  speciality?: string
  location?: string
  website?: string
  bio?: string
  skills?: Skill[]
  websites?: string[]
  avatarUrl?: string
  photo_url?: string
  bannerUrl?: string
  cover_url?: string
  username?: string
  fullName?: string
  full_name?: string
  lastProfessionUpdate?: string
  last_profession_update?: string
  phone?: string
  showEmail?: boolean
  showPhone?: boolean
  showLocation?: boolean
  badges?: Array<{ id: number | string; name: string; description: string; [key: string]: unknown }>
  certifications?: Array<{ id: string; name: string; issuer: string; date: string }>
  education?: Array<{ id: string; degree: string; school: string; year: string }>
  experience?: Array<{ id: string; title: string; company: string; period: string }>
}

interface UserStatistics {
  views?: number
  subscribers?: number
  rating?: number
  experience?: number
  videos?: {
    total: number
    totalViews: number
    totalLikes: number
    totalComments: number
  }
  engagement?: {
    views: number
    likes: number
    comments: number
  }
  subscriptions?: {
    following?: number
    followers?: number
  }
  badges?: Array<{ id: number | string; name: string; description: string; [key: string]: unknown }>
}

interface RecentActivity {
  type: string
  title: string
  time: string
}

const Profile = () => {
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Il y a ${days} j`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `Il y a ${weeks} sem`
    const months = Math.floor(days / 30)
    if (months < 12) return `Il y a ${months} mois`
    const years = Math.floor(days / 365)
    return `Il y a ${years} ans`
  }
  
  // Initialisation instantanée depuis le cache mémoire / localStorage (0ms latence)
  const initialProfileCache = cacheService.get<UserProfile>('pro:profile:data', { maxAge: 10 * 60 * 1000, allowStale: true })
  const initialStatsCache = cacheService.get<UserStatistics>('pro:profile:stats', { maxAge: 10 * 60 * 1000, allowStale: true })
  const initialActivitiesCache = cacheService.get<RecentActivity[]>('pro:profile:activities', { maxAge: 10 * 60 * 1000, allowStale: true })

  const [profile, setProfileState] = useState<UserProfile | null>(initialProfileCache.data)
  const [statistics, setStatisticsState] = useState<UserStatistics | null>(initialStatsCache.data)
  const [recentActivities, setRecentActivitiesState] = useState<RecentActivity[]>(initialActivitiesCache.data || [])
  const [loading, setLoading] = useState<boolean>(!initialProfileCache.hasCache)
  const [error, setError] = useState<string | null>(null)
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now())

  // Setters avec synchronisation automatique du cache
  const setProfile = (updater: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    setProfileState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next) cacheService.set('pro:profile:data', next, 10 * 60 * 1000)
      return next
    })
  }

  const setStatistics = (updater: UserStatistics | null | ((prev: UserStatistics | null) => UserStatistics | null)) => {
    setStatisticsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next) cacheService.set('pro:profile:stats', next, 10 * 60 * 1000)
      return next
    })
  }

  const setRecentActivities = (updater: RecentActivity[] | ((prev: RecentActivity[]) => RecentActivity[])) => {
    setRecentActivitiesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next) cacheService.set('pro:profile:activities', next, 10 * 60 * 1000)
      return next
    })
  }

  const [showProfessionModal, setShowProfessionModal] = useState(false)
  const [showSpecialityModal, setShowSpecialityModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [showBioModal, setShowBioModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showWebsitesModal, setShowWebsitesModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'website' | 'skill', item: string } | null>(null)
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [showWebsitesDropdown, setShowWebsitesDropdown] = useState(false)
  const [showMobileInfoDropdown, setShowMobileInfoDropdown] = useState(false)
  const [newProfession, setNewProfession] = useState('')
  const [newSpeciality, setNewSpeciality] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Technique', level: 'Intermédiaire' })
  const [newBio, setNewBio] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [uploadedBanner, setUploadedBanner] = useState<string>('')
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropScale, setCropScale] = useState(1)
  const [bannerError, setBannerError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [showSkillsAccordion, setShowSkillsAccordion] = useState(true)
  const [showExtraSkillsDropdown, setShowExtraSkillsDropdown] = useState(false)
  const extraSkillsRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Fermer le menu déroulant des compétences au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (extraSkillsRef.current && !extraSkillsRef.current.contains(e.target as Node)) {
        setShowExtraSkillsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recharge le profil depuis le backend et synchronise le profil local
  const refreshProfile = async (token: string): Promise<UserProfile | null> => {
    const backendProfile = await getProfileWithFallback(token)
    if (!backendProfile) return null

    const mapped = mapBackendProfile(backendProfile)
    mapped.userId = backendProfile.user != null ? String(backendProfile.user) : undefined
    setProfile(mapped)

    syncStoredProfile(backendProfile)

    return mapped
  }

  // Charger le profil depuis API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }

        // 1. Charger immédiatement le profil principal (0-50ms)
        const loadedProfile = await refreshProfile(token)
        setLoading(false)

        if (!loadedProfile) {
          setProfile({
            username: user?.username || localStorage.getItem('exile_username') || 'Utilisateur',
            fullName: user?.fullName || user?.username || 'Utilisateur',
            avatarUrl: user?.avatarUrl,
            email: user?.email || ''
          })
        }

        // 2. Charger les statistiques et données annexes en parallèle
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        const userId = loadedProfile?.userId || user?.id

        await Promise.allSettled([
          // Vidéos
          userId ? fetch(`${API_BASE_URL}/accueil/videos/?owner=${userId}`, { headers })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
              const videos: any[] = data.results || data || []
              setStatistics(prev => ({
                ...prev,
                videos: {
                  total: videos.length,
                  totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
                  totalLikes: videos.reduce((sum, v) => sum + (v.likes || v.likes_count || 0), 0),
                  totalComments: videos.reduce((sum, v) => sum + (v.comments || v.comments_count || 0), 0)
                }
              }))
            }).catch(() => {}) : Promise.resolve(),

          // Abonnés
          fetch(`${API_BASE_URL}/abonnement/abonnements/subscribers/`, { headers })
            .then(r => r.ok ? r.json() : {})
            .then(subscribersData => {
              setStatistics(prev => ({
                ...prev,
                subscriptions: { followers: subscribersData.count || (Array.isArray(subscribersData) ? subscribersData.length : 0) }
              }))
            }).catch(() => {}),

          // Activités
          fetch(`${API_BASE_URL}/activities/`, { headers })
            .then(r => r.ok ? r.json() : [])
            .then(activitiesData => {
              const activities = activitiesData.results || activitiesData || []
              if (Array.isArray(activities)) {
                setRecentActivities(activities.map((activity: any) => ({
                  id: activity.id,
                  type: activity.activity_type || 'activity',
                  description: activity.description || '',
                  timestamp: activity.created_at,
                  user: activity.username || activity.user_full_name
                })))
              }
            }).catch(() => {}),

          // Badges
          fetch(`${API_BASE_URL}/badges/user-badges/`, { headers })
            .then(r => r.ok ? r.json() : [])
            .then(badgesData => {
              const badges = badgesData.results || badgesData || []
              if (Array.isArray(badges)) {
                setStatistics(prev => ({
                  ...prev,
                  badges: badges.map((badge: any) => ({
                    id: badge.id,
                    name: badge.badge_details?.name || badge.name || 'Badge',
                    description: badge.badge_details?.description || '',
                    icon: badge.badge_details?.icon || '🏆',
                    color: badge.badge_details?.color || '#3B82F6',
                    earnedAt: badge.earned_at
                  }))
                }))
              }
            }).catch(() => {})
        ])
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Impossible de charger le profil. Veuillez vérifier votre connexion ou réessayer.')

        // Si erreur 401 (token expiré), déconnecter et rediriger
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          navigate('/login')
        }

        // Create a basic profile from localStorage as fallback
        const username = localStorage.getItem('exile_username') || 'Utilisateur'
        setProfile({
          username: username,
          fullName: username,
          email: ''
        })
      } finally {
        setLoading(false)
      }
    };
    
    loadProfile();
  }, [navigate])

  // Détection automatique de la localisation (Pays et Ville)
  useEffect(() => {
    const detectLocation = async () => {
      if (profile && !profile.location && !profile.city && !profile.country) {
        try {
          const geoRes = await fetch('https://ipapi.co/json/')
          if (geoRes.ok) {
            const geo = await geoRes.json()
            const detectedLocation = [geo.city, geo.country_name].filter(Boolean).join(', ')
            if (detectedLocation) {
              const res = await authFetch('/profil/profils/me/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: detectedLocation,
                  city: geo.city || '',
                  country: geo.country_name || ''
                })
              })
              if (res.ok) {
                const data = await res.json()
                setProfile(mapBackendProfile(data))
              }
            }
          }
        } catch {}
      }
    }
    detectLocation()
  }, [profile?.location, profile?.city, profile?.country])

  // Modifier la localisation manuellement
  const handleLocationUpdate = async () => {
    if (newLocation.trim()) {
      try {
        const response = await authFetch('/profil/profils/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: newLocation.trim() })
        })
        if (response.ok) {
          const data = await response.json()
          setProfile(mapBackendProfile(data))
          setNewLocation('')
          setShowLocationModal(false)
        } else {
          alert('Erreur lors de la mise à jour de la localisation')
        }
      } catch (error) {
        console.error('Error updating location:', error)
      }
    }
  }

  // Calculer les jours restants avant modification
  const getDaysUntilModification = () => {
    return getDaysUntilProfessionModification(profile?.lastProfessionUpdate)
  }

  const getDaysSinceLastProfessionUpdate = (lastUpdate?: string): number => {
    if (!lastUpdate) return 30 // Pas de mise à jour précédente, donc autorisé
    const lastDate = new Date(lastUpdate)
    const now = new Date()
    const daysSinceUpdate = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    return Math.floor(daysSinceUpdate)
  }

  // Modifier la spécialité
  const handleSpecialityUpdate = async () => {
    const cleanSpec = newSpeciality.trim()
    if (cleanSpec) {
      try {
        // Mise à jour optimiste immédiate (0ms)
        setProfile(prev => prev ? { ...prev, speciality: cleanSpec } : null)
        setShowSpecialityModal(false)

        const response = await authFetch('/profil/profils/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speciality: cleanSpec })
        })
        if (response.ok) {
          const data = await response.json()
          const mapped = mapBackendProfile(data)
          mapped.speciality = cleanSpec
          setProfile(mapped)
          setNewSpeciality('')
        }
      } catch (error) {
        console.error('Error updating speciality:', error)
      }
    }
  }

  // Modifier la profession
  const handleProfessionUpdate = async () => {
    if (newProfession.trim() && newProfession.length >= 2 && newProfession.length <= 50) {
      try {
        const response = await authFetch('/profil/profils/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profession: newProfession.trim() })
        })
        if (response.ok) {
          const data = await response.json()
          setProfile(mapBackendProfile(data))
          setNewProfession('')
          setShowProfessionModal(false)
        } else {
          const errorData = await response.json().catch(() => ({}))
          alert(errorData.detail || 'Erreur lors de la mise à jour de la profession')
        }
      } catch (error) {
        console.error('Error updating profession:', error)
        alert('Erreur lors de la mise à jour de la profession')
      }
    }
  }

  // Ajouter une compétence
  const handleAddSkill = async () => {
    if (newSkill.name.trim() && newSkill.name.length >= 2 && newSkill.name.length <= 30) {
      try {
        const categoryMap: Record<string, string> = {
          'Technique': 'technical',
          'Soft Skills': 'soft',
          'Langue': 'language',
          'Communication': 'communication',
          'Management': 'management',
          'Autre': 'other'
        }
        const levelMap: Record<string, string> = {
          'Débutant': 'beginner',
          'Intermédiaire': 'intermediate',
          'Avancé': 'advanced',
          'Expert': 'expert'
        }
        const response = await authFetch('/profil/skills/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSkill.name.trim(),
            category: categoryMap[newSkill.category] || newSkill.category,
            level: levelMap[newSkill.level] || newSkill.level
          })
        })
        if (response.ok) {
          const token = localStorage.getItem('accessToken') || ''
          await refreshProfile(token)
          setNewSkill({ name: '', category: 'Technique', level: 'Intermédiaire' })
          setShowSkillModal(false)
        } else {
          alert('Erreur lors de l\'ajout de la compétence')
        }
      } catch (error) {
        console.error('Error adding skill:', error)
      }
    }
  }

  // Supprimer une compétence avec confirmation
  const handleDeleteSkill = (skillId: string) => {
    setShowDeleteConfirm({ type: 'skill', item: skillId })
  }

  // Gérer l'upload de photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        setShowCropModal(true)
        setCropPosition({ x: 0, y: 0 })
        setCropScale(1)
      }
      reader.readAsDataURL(file)
    }
  }

  // Confirmer le crop et sauvegarder l'image instantanément (0ms UI update)
  const handleCropConfirm = async () => {
    try {
      if (!uploadedImage) return
      const previewUrl = uploadedImage

      // 1. Mise à jour instantanée de l'UI (0ms)
      setProfile(prev => prev ? {
        ...prev,
        photo: previewUrl,
        avatarUrl: previewUrl,
        photo_url: previewUrl
      } : null)
      setAvatarError(false)
      setShowCropModal(false)
      setUploadedImage('')
      setImageCacheBuster(Date.now())

      // 2. Diffuser l'événement pour mettre à jour le Header et le reste du site immédiatement
      window.dispatchEvent(new CustomEvent('exile_profile_updated', { detail: { avatarUrl: previewUrl } }))

      // 3. Sauvegarde sur le serveur en arrière-plan
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('photo', file)

      const updateResponse = await authFetch('/profil/profils/me/', {
        method: 'PATCH',
        body: formData
      })

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json()
        const mapped = mapBackendProfile(updatedData)
        setProfile(mapped)
        const finalUrl = mapped.avatarUrl || mapped.photo_url || previewUrl
        window.dispatchEvent(new CustomEvent('exile_profile_updated', { detail: { avatarUrl: finalUrl } }))
      }
    } catch (error) {
      console.error('Error uploading photo in background:', error)
    }
  }

  // Mettre à jour toutes les vidéos de l'utilisateur avec la nouvelle photo de profil
  const updateVideosWithNewPhoto = (newPhotoUrl: string) => {
    if (!profile) return
    try {
      const storedVideos = localStorage.getItem('exile_videos')
      if (storedVideos) {
        const videos = JSON.parse(storedVideos)
        const userId = getCurrentUserId() || profile.id
        
        // Mettre à jour les vidéos de l'utilisateur actuel
        const updatedVideos = videos.map((video: any) => {
          if (video.author?.id === userId || video.author?.name === profile.name) {
            return {
              ...video,
              author: {
                ...video.author,
                avatarUrl: newPhotoUrl
              }
            }
          }
          return video
        })
        
        localStorage.setItem('exile_videos', JSON.stringify(updatedVideos))
        console.log('✅ Profile photo updated in all videos')
      }

      // Mettre à jour les événements de l'utilisateur avec la nouvelle photo
      const storedEvents = localStorage.getItem('exile_events_v2')
      if (storedEvents) {
        const events = JSON.parse(storedEvents)
        const userId = getCurrentUserId() || profile.id
        
        const updatedEvents = events.map((event: any) => {
          if (event.organizerId === userId || event.organizerName === profile.name) {
            return {
              ...event,
              organizerAvatar: newPhotoUrl
            }
          }
          return event
        })
        
        localStorage.setItem('exile_events_v2', JSON.stringify(updatedEvents))
        console.log('✅ Profile photo updated in all events')
      }
    } catch (error) {
      console.error('Error updating content with new photo:', error)
    }
  }

  // Annuler le crop
  const handleCropCancel = () => {
    setShowCropModal(false)
    setUploadedImage('')
    setCropPosition({ x: 0, y: 0 })
    setCropScale(1)
  }

  // Gérer l'upload de bannière
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedBanner(reader.result as string)
        setShowBannerModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Confirmer l'upload de bannière instantanément (0ms UI update)
  const handleBannerConfirm = async () => {
    try {
      if (!uploadedBanner) return
      const previewUrl = uploadedBanner

      // 1. Mise à jour instantanée de l'UI (0ms)
      setProfile(prev => prev ? {
        ...prev,
        banner: previewUrl,
        bannerUrl: previewUrl,
        banner_url: previewUrl
      } : null)
      setBannerError(false)
      setShowBannerModal(false)
      setUploadedBanner('')
      setImageCacheBuster(Date.now())

      // 2. Sauvegarde sur le serveur en arrière-plan
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], `banner_${Date.now()}.jpg`, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('banner', file)

      const updateResponse = await authFetch('/profil/profils/me/', {
        method: 'PATCH',
        body: formData
      })

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json()
        const mapped = mapBackendProfile(updatedData)
        setProfile(mapped)
      }
    } catch (error) {
      console.error('Error uploading banner in background:', error)
    }
  }

  // Annuler l'upload de bannière
  const handleBannerCancel = () => {
    setShowBannerModal(false)
    setUploadedBanner('')
  }

  // Modifier le bio (30 caractères max)
  const handleBioUpdate = async () => {
    const cleanBio = newBio.trim().slice(0, 30)
    try {
      setProfile(prev => prev ? { ...prev, bio: cleanBio } : null)
      setShowBioModal(false)

      const response = await authFetch('/profil/profils/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: cleanBio })
      })
      if (response.ok) {
        const data = await response.json()
        const mapped = mapBackendProfile(data)
        mapped.bio = cleanBio
        setProfile(mapped)
        setNewBio('')
      }
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  // Ajouter un site web
  const handleAddWebsite = async () => {
    if (newWebsite.trim() && !(profile?.websites || []).includes(newWebsite)) {
      try {
        let formattedWebsite = newWebsite.trim()
        if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
          formattedWebsite = 'https://' + formattedWebsite
        }
        const response = await authFetch('/profil/profils/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: formattedWebsite })
        })
        if (response.ok) {
          const data = await response.json()
          setProfile(mapBackendProfile(data))
          setNewWebsite('')
          setShowWebsitesModal(false)
        }
      } catch (error) {
        console.error('Error adding website:', error)
      }
    }
  }

  // Supprimer un site web avec confirmation
  const handleDeleteWebsite = (website: string) => {
    setShowDeleteConfirm({ type: 'website', item: website })
  }

  // Confirmer suppression
  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return
    try {
      if (showDeleteConfirm.type === 'skill') {
        const rawId = showDeleteConfirm.item.replace('skill-', '')
        await authFetch(`/profil/skills/${rawId}/`, { method: 'DELETE' })
        const token = localStorage.getItem('accessToken') || ''
        await refreshProfile(token)
      } else if (showDeleteConfirm.type === 'website') {
        const response = await authFetch('/profil/profils/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: '' })
        })
        if (response.ok) {
          const data = await response.json()
          setProfile(mapBackendProfile(data))
        }
      }
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting item:', error)
      setShowDeleteConfirm(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Statistiques globales - utiliser les vraies données du backend
  const stats = statistics ? [
    { label: 'Événements', value: statistics.events?.total?.toString() || '-', icon: Calendar, color: 'blue' },
    { label: 'Abonnés', value: statistics.subscriptions?.followers?.toString() || '-', icon: Users, color: 'purple' },
    { label: 'Vidéos', value: statistics.videos?.total?.toString() || '-', icon: Video, color: 'red' },
    { label: 'Vues', value: statistics.videos?.totalViews?.toString() || '-', icon: TrendingUp, color: 'orange' },
    { label: 'Likes', value: statistics.videos?.totalLikes?.toString() || '-', icon: Heart, color: 'pink' },
    { label: 'Commentaires', value: statistics.videos?.totalComments?.toString() || '-', icon: MessageSquare, color: 'green' }
  ] : [
    { label: 'Événements', value: '-', icon: Calendar, color: 'blue' },
    { label: 'Abonnés', value: '-', icon: Users, color: 'purple' },
    { label: 'Vidéos', value: '-', icon: Video, color: 'red' },
    { label: 'Vues', value: '-', icon: TrendingUp, color: 'orange' },
    { label: 'Likes', value: '-', icon: Heart, color: 'pink' },
    { label: 'Commentaires', value: '-', icon: MessageSquare, color: 'green' }
  ]

  // Accès rapide
  const quickAccess = [
    { label: 'Mes événements', path: '/pro/events', icon: Calendar },
    { label: 'Mes demandes', path: '/pro/requests', icon: MessageSquare },
    { label: 'Mes abonnés', path: '/pro/subscribers', icon: Users },
    { label: 'Mes vidéos', path: '/pro/my-videos', icon: Video }
  ]

  // Fonction de navigation avec stockage de la page d'origine
  const handleNavigate = (path: string) => {
    localStorage.setItem('exile_previous_page', '/pro/profile')
    navigate(path)
  }

  // Badges - utiliser les données du backend
  const badges = statistics?.badges || []

  // Catégories de compétences
  const skillCategories = ['Technique', 'Soft Skills', 'Langue', 'Communication', 'Management', 'Autre']
  const skillLevels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert']

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-[100] md:mt-0 w-full`}>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pro')}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <div className="flex-1">
                <h1 className={`text-base sm:text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mon Profil</h1>
              </div>
              <button
                onClick={() => handleNavigate('/pro/settings')}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <Settings className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 px-3 sm:px-4 lg:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-xl p-4 sm:p-6 animate-pulse`}>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-1/3 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-3 w-1/2 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-lg p-3 sm:p-4 animate-pulse`}>
                  <div className={`h-8 w-8 rounded mb-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 w-1/2 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-xl p-6 text-center`}>
            <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!loading && !error && profile && (
          <>
            {/* Profile Header - Pro Responsive layout (Mobile, Tablet, Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Left column - Profile info */}
              <div className={`lg:col-span-4 xl:col-span-4 ${resolvedTheme === 'dark' ? 'bg-zinc-800/95 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm`}>
                {/* Banner Section */}
                <div className="relative group mb-3 sm:mb-4">
                  {(() => {
                    const rawBanner = profile?.banner_url || profile?.banner
                    const bannerUrl = !bannerError && rawBanner 
                      ? (rawBanner.startsWith('data:') || rawBanner.startsWith('blob:') 
                          ? rawBanner 
                          : (rawBanner.includes('?') ? `${rawBanner}&_t=${imageCacheBuster}` : `${rawBanner}?_t=${imageCacheBuster}`)) 
                      : null

                    return (
                      <div className={`w-full h-36 sm:h-44 md:h-52 lg:h-44 ${bannerUrl ? 'bg-zinc-900 dark:bg-black' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700'} rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-md relative`}>
                        {bannerUrl ? (
                          <img 
                            src={bannerUrl} 
                            alt="Bannière" 
                            className="w-full h-full object-cover object-center"
                            onError={() => {
                              console.warn('Banner failed to load, fallback to gradient')
                              setBannerError(true)
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <Camera className="w-6 h-6 text-white/80 mb-1" />
                            <span className="text-white text-xs sm:text-sm font-semibold">Ajouter une bannière</span>
                            <span className="text-white/60 text-[10px] mt-0.5">Recommandé : 2560x1440px</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg transition-all backdrop-blur-sm opacity-90 group-hover:opacity-100"
                    title="Modifier la bannière"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex flex-col items-center gap-2 sm:gap-3 -mt-10 sm:-mt-12 md:-mt-14 px-3 sm:px-0">
                  {/* Photo centrée avec upload - chevauchant la bannière */}
                  <div className="relative group">
                    {(() => {
                      const rawPhoto = profile?.avatarUrl || profile?.photo_url || profile?.photo
                      const photoUrl = !avatarError && rawPhoto 
                        ? (rawPhoto.startsWith('data:') || rawPhoto.startsWith('blob:') 
                            ? rawPhoto 
                            : (rawPhoto.includes('?') ? `${rawPhoto}&_t=${imageCacheBuster}` : `${rawPhoto}?_t=${imageCacheBuster}`)) 
                        : null

                      return (
                        <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 ${photoUrl ? 'bg-zinc-900 dark:bg-black' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold overflow-hidden border-4 border-white dark:border-zinc-800 ring-2 ring-blue-500/50 shadow-xl relative`}>
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt="Photo de profil" 
                              className="w-full h-full object-cover object-center"
                              onError={() => {
                                console.warn('Avatar failed to load, fallback to initial')
                                setAvatarError(true)
                              }}
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full font-bold text-white text-2xl sm:text-3xl">
                              {(profile?.username || profile?.name || profile?.fullName || user?.username || 'U').replace(/^@/, '').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                {canModifyPhoto(profile?.photoLastModified) ? (
                  <button
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-90"
                    title="Changer la photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute bottom-0 right-0 flex items-center gap-1 px-2 py-1 bg-gray-500/80 text-white rounded-full shadow-lg">
                    <Lock className="w-2 h-2" />
                    <span className="text-[8px]">{getDaysUntilPhotoModification(profile?.photoLastModified)}j</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={!canModifyPhoto(profile?.photoLastModified)}
                />
                <div className={`mt-1.5 flex items-center justify-center gap-1.5 ${profile?.status === 'online' ? 'text-emerald-500' : 'text-gray-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile?.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs font-semibold">{profile?.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                </div>
              </div>

              {/* Info centrée */}
              <div className="text-center space-y-1.5 sm:space-y-2 w-full">
                {/* Username */}
                <div>
                  <h2 className={`text-lg sm:text-xl md:text-2xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.username?.startsWith('@') ? profile.username : `@${profile?.username || 'Utilisateur'}`}
                  </h2>
                </div>

                {/* Profession */}
                <div className="flex items-center justify-center gap-1.5">
                  <Briefcase className={`w-4 h-4 md:w-5 md:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                  <span className={`text-sm md:text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.profession || 'Non renseigné'}
                  </span>
                  {canModifyProfession(profile?.lastProfessionUpdate) ? (
                    <button
                      onClick={() => setShowProfessionModal(true)}
                      className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                    >
                      <Edit2 className={`w-2.5 h-2.5 md:w-3 md:h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                    </button>
                  ) : (
                    <div className={`flex items-center gap-1 px-2 py-0.5 bg-gray-500/80 text-white rounded-full shadow-lg`}>
                      <Lock className={`w-2 h-2`} />
                      <span className={`text-[10px]`}>Modifiable dans {getDaysUntilModification()}j</span>
                    </div>
                  )}
                </div>

                {/* Spécialité */}
                <div className="flex items-center justify-center gap-1.5">
                  <Award className={`w-4 h-4 md:w-5 md:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                  <span className={`text-sm md:text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.speciality || 'Non renseigné'}
                  </span>
                  <button
                    onClick={() => {
                      setNewSpeciality(profile?.speciality || '')
                      setShowSpecialityModal(true)
                    }}
                    className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <Edit2 className={`w-2.5 h-2.5 md:w-3 md:h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                  </button>
                </div>

                {/* Mobile: Compact info with dropdown */}
                <div className="sm:hidden">
                  <button
                    onClick={() => setShowMobileInfoDropdown(!showMobileInfoDropdown)}
                    className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                  >
                    <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Informations personnelles
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMobileInfoDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showMobileInfoDropdown && (
                    <div className={`mt-2 p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} space-y-3`}>
                      {/* Bio */}
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          Bio
                        </label>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            {profile?.bio || 'Aucune bio'}
                          </p>
                          <button
                            onClick={() => {
                              setNewBio(profile?.bio || '')
                              setShowBioModal(true)
                            }}
                            className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <Edit2 className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Localisation
                          </label>
                          <button
                            onClick={() => {
                              setNewLocation(profile?.location || profile?.city || '')
                              setShowLocationModal(true)
                            }}
                            className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <Edit2 className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            {profile?.city && profile?.country 
                              ? `${profile.city}, ${profile.country}`
                              : profile?.city || profile?.country || profile?.location || 'Non renseigné'}
                          </span>
                        </div>
                      </div>

                      {/* Websites */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Sites web
                          </label>
                          <button
                            onClick={() => setShowWebsitesModal(true)}
                            className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                            disabled={(profile?.websites || []).length >= 6}
                          >
                            <Plus className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(profile?.websites || []).slice(0, 2).map((website, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                              >
                                {website}
                              </a>
                              <button
                                onClick={() => handleDeleteWebsite(website)}
                                className="hover:opacity-70"
                              >
                                <X className="w-2.5 h-2.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {(profile?.websites || []).length > 2 && (
                            <div className="relative">
                              <button
                                onClick={() => setShowWebsitesDropdown(!showWebsitesDropdown)}
                                className={`text-xs px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 ${
                                  resolvedTheme === 'dark' ? 'bg-zinc-700/80 border-zinc-600 text-blue-400' : 'bg-gray-100 border-gray-200 text-blue-600'
                                }`}
                              >
                                <span>+{(profile?.websites || []).length - 2}</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills - Supprimé du dropdown mobile pour éviter le doublon */}
                    </div>
                  )}
                </div>

                {/* Desktop: Full info display */}
                <div className="hidden sm:block">
                  {/* Bio */}
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <p className={`text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                        {profile?.bio || 'Aucune bio'}
                      </p>
                      <button
                        onClick={() => {
                          setNewBio(profile?.bio || '')
                          setShowBioModal(true)
                        }}
                        className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                      >
                        <Edit2 className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                    <span className={`text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                      {profile?.city && profile?.country 
                        ? `${profile.city}, ${profile.country}`
                        : profile?.city || profile?.country || profile?.location || 'Non renseigné'}
                    </span>
                    <button
                      onClick={() => {
                        setNewLocation(profile?.location || profile?.city || '')
                        setShowLocationModal(true)
                      }}
                      className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                    >
                      <Edit2 className={`w-2.5 h-2.5 md:w-3 md:h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                    </button>
                  </div>

                  {/* Websites */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Globe className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                      <span className={`text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                        Sites web
                      </span>
                      <button
                        onClick={() => setShowWebsitesModal(true)}
                        className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                        disabled={(profile?.websites || []).length >= 6}
                      >
                        <Plus className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {(profile?.websites || []).slice(0, 2).map((website, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            {website}
                          </a>
                          <button
                            onClick={() => handleDeleteWebsite(website)}
                            className="hover:opacity-70"
                          >
                            <X className="w-2.5 h-2.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                      {(profile?.websites || []).length > 2 && (
                        <div className="relative">
                          <button
                            onClick={() => setShowWebsitesDropdown(!showWebsitesDropdown)}
                            className={`text-xs px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 ${
                              resolvedTheme === 'dark'
                                ? 'bg-zinc-700/80 border-zinc-600 text-blue-400'
                                : 'bg-gray-100 border-gray-200 text-blue-600'
                            }`}
                          >
                            <span>+{(profile?.websites || []).length - 2} autres</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {showWebsitesDropdown && (
                            <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl border z-50 p-1 ${
                              resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
                            } animate-in fade-in`}>
                              {(profile?.websites || []).slice(2).map((website, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-700/60 rounded-lg">
                                  <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs truncate mr-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                                  >
                                    {website}
                                  </a>
                                  <button
                                    onClick={() => handleDeleteWebsite(website)}
                                    className="hover:opacity-70 p-1 text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member since */}
                {profile?.date_joined && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Calendar className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                    <span className={`text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                      Membre depuis {new Date(profile.date_joined).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Redesigned Skills Section with Accordion Dropdown */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700/80">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowSkillsAccordion(!showSkillsAccordion)}
                  className="flex items-center gap-2 group hover:opacity-85 transition-opacity"
                  type="button"
                >
                  <div className="p-1 rounded-lg bg-blue-500/10 text-blue-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-sm sm:text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Compétences
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {(profile?.skills || []).length}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showSkillsAccordion ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {(profile?.skills || []).length < 10 && (
                  <button
                    onClick={() => setShowSkillModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                )}
              </div>

              {showSkillsAccordion && (
                <div className="mt-2.5">
                  {(profile?.skills || []).length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Affichage des 2 premières compétences */}
                      {(profile?.skills || []).slice(0, 2).map((skill) => {
                        const categoryStyles: Record<string, { bg: string, border: string, text: string, dot: string }> = {
                          technical: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                          soft: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                          language: { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                          communication: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                          management: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
                          other: { bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700', text: 'text-zinc-700 dark:text-zinc-300', dot: 'bg-zinc-400' }
                        }

                        const levelLabels: Record<string, string> = {
                          beginner: 'Débutant',
                          intermediate: 'Intermédiaire',
                          advanced: 'Avancé',
                          expert: 'Expert',
                          'Débutant': 'Débutant',
                          'Intermédiaire': 'Intermédiaire',
                          'Avancé': 'Avancé',
                          'Expert': 'Expert'
                        }

                        const style = categoryStyles[skill.category?.toLowerCase()] || categoryStyles.technical
                        const levelText = levelLabels[skill.level] || skill.level

                        return (
                          <div
                            key={skill.id}
                            className={`group relative flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border ${style.bg} ${style.border} transition-all hover:shadow-sm`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            <span className={`text-xs font-semibold ${style.text}`}>
                              {skill.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-medium">
                              {levelText}
                            </span>
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="opacity-60 hover:opacity-100 p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                              title="Supprimer"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Menu déroulant pour les compétences à partir de la 3ème */}
                      {(profile?.skills || []).length > 2 && (
                        <div className="relative" ref={extraSkillsRef}>
                          <button
                            type="button"
                            onClick={() => setShowExtraSkillsDropdown(!showExtraSkillsDropdown)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-100/80 dark:bg-zinc-800/90 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                          >
                            <span>+{(profile?.skills || []).length - 2} autres</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExtraSkillsDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showExtraSkillsDropdown && (
                            <div className="absolute left-0 top-full mt-2 w-72 max-h-56 overflow-y-auto p-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                              <div className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 px-2 py-1 border-b border-gray-100 dark:border-zinc-700/60 flex items-center justify-between">
                                <span>Autres compétences ({(profile?.skills || []).length - 2})</span>
                              </div>
                              {(profile?.skills || []).slice(2).map((skill) => {
                                const categoryStyles: Record<string, { bg: string, border: string, text: string, dot: string }> = {
                                  technical: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                                  soft: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                                  language: { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                                  communication: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                                  management: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
                                  other: { bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700', text: 'text-zinc-700 dark:text-zinc-300', dot: 'bg-zinc-400' }
                                }
                                const levelLabels: Record<string, string> = {
                                  beginner: 'Débutant',
                                  intermediate: 'Intermédiaire',
                                  advanced: 'Avancé',
                                  expert: 'Expert',
                                  'Débutant': 'Débutant',
                                  'Intermédiaire': 'Intermédiaire',
                                  'Avancé': 'Avancé',
                                  'Expert': 'Expert'
                                }
                                const style = categoryStyles[skill.category?.toLowerCase()] || categoryStyles.technical
                                const levelText = levelLabels[skill.level] || skill.level

                                return (
                                  <div
                                    key={skill.id}
                                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${style.bg} ${style.border}`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                                      <span className={`text-xs font-semibold ${style.text} truncate`}>
                                        {skill.name}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-medium flex-shrink-0">
                                        {levelText}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteSkill(skill.id)}
                                      className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors flex-shrink-0"
                                      title="Supprimer"
                                    >
                                      <X className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-3.5 rounded-xl border border-dashed text-center ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5`}>
                        Aucune compétence renseignée
                      </p>
                      <button
                        onClick={() => setShowSkillModal(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Plus className="w-3 h-3" />
                        Ajouter une première compétence
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

              {/* Right column - Statistics, Quick Access, Activity, Badges */}
              <div className="lg:col-span-8 xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Statistics */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Statistiques Globales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-lg p-3 sm:p-3`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-1.5 mb-1.5 sm:mb-1.5">
                      <stat.icon className={`w-4 h-4 sm:w-4 sm:h-4 ${
                        stat.color === 'blue' ? 'text-blue-500' :
                        stat.color === 'purple' ? 'text-purple-500' :
                        stat.color === 'green' ? 'text-green-500' :
                        stat.color === 'red' ? 'text-red-500' :
                        stat.color === 'orange' ? 'text-orange-500' :
                        'text-pink-500'
                      }`} />
                      <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {stat.label}
                      </span>
                    </div>
                    <p className={`text-xl sm:text-xl md:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Accès Rapide
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {quickAccess.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigate(item.path)}
                    className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700' : 'bg-white hover:bg-gray-50 border-gray-200'} border rounded-lg p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-1.5 transition-colors`}
                  >
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                    <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Activité Récente
              </h3>
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-lg p-3 sm:p-3 space-y-2 sm:space-y-2`}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'event' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'request' ? 'bg-green-100 text-green-600' :
                        activity.type === 'video' ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'event' && <Calendar className="w-4 h-4 sm:w-4 sm:h-4" />}
                        {activity.type === 'request' && <MessageSquare className="w-4 h-4 sm:w-4 sm:h-4" />}
                        {activity.type === 'video' && <Video className="w-4 h-4 sm:w-4 sm:h-4" />}
                        {activity.type === 'conversation' && <MessageSquare className="w-4 h-4 sm:w-4 sm:h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                          {activity.description || activity.title}
                        </p>
                        <p className={`text-[10px] sm:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                          {activity.timestamp ? formatTimeAgo(activity.timestamp) : activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} text-center py-2`}>
                    Aucune activité récente
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Badges et Récompenses
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-2">
                {badges.length > 0 ? (
                  badges.map((badge: any, index: number) => (
                    <div
                      key={badge.id || index}
                      className={`flex items-center gap-1.5 sm:gap-1.5 px-3 sm:px-3 py-1.5 sm:py-1.5 rounded-full ${
                        badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        badge.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        badge.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{badge.icon || '🏆'}</span>
                      <span className="text-xs sm:text-xs font-medium">{badge.name}</span>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    Aucun badge obtenu
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Profession Modal */}
      {showProfessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier la profession
            </h3>
            <input
              type="text"
              value={newProfession}
              onChange={(e) => setNewProfession(e.target.value)}
              placeholder="Entrez votre nouvelle profession"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
            />
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowProfessionModal(false)
                  setNewProfession('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleProfessionUpdate}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!newProfession.trim() || newProfession.length < 3 || newProfession.length > 50}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speciality Modal */}
      {showSpecialityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier la spécialité
            </h3>
            <input
              type="text"
              value={newSpeciality}
              onChange={(e) => setNewSpeciality(e.target.value)}
              placeholder="Entrez votre nouvelle spécialité"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
            />
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowSpecialityModal(false)
                  setNewSpeciality('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleSpecialityUpdate}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
                disabled={!newSpeciality.trim()}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Ajouter une compétence
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Nom de la compétence"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
              />
              <div>
                <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Catégorie
                </label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-gray-100 border-gray-200 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                >
                  {skillCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Niveau
                </label>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-gray-100 border-gray-200 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                >
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowSkillModal(false)
                  setNewSkill({ name: '', category: 'Technique', level: 'Intermédiaire' })
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleAddSkill}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!newSkill.name.trim() || newSkill.name.length < 2 || newSkill.name.length > 30 || (profile?.skills || []).length >= 10}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Confirmer la suppression
            </h3>
            <p className={`mb-4 sm:mb-6 text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
              Êtes-vous sûr de vouloir supprimer ce {showDeleteConfirm.type === 'website' ? 'site web' : 'compétence'}?
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier la localisation
            </h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Ex: Port-au-Prince, Haïti ou Paris, France"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
            />
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowLocationModal(false)
                  setNewLocation('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleLocationUpdate}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!newLocation.trim()}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bio Modal */}
      {showBioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-100'}`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier votre bio
            </h3>
            <p className={`text-xs mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              Présentez-vous brièvement (30 caractères max).
            </p>
            <input
              type="text"
              value={newBio}
              onChange={(e) => setNewBio(e.target.value.slice(0, 30))}
              placeholder="Ex: Passionné d'art & tech"
              maxLength={30}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700/80 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="w-1/2 bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    newBio.length > 25 ? 'bg-amber-500' : newBio.length >= 30 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(Math.min(newBio.length, 30) / 30) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${
                newBio.length >= 30 ? 'text-amber-500' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
              }`}>
                {newBio.length}/30
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => {
                  setShowBioModal(false)
                  setNewBio('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={handleBioUpdate}
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md active:scale-98"
                disabled={newBio.length > 30}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Websites Modal */}
      {showWebsitesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Gérer les sites web
            </h3>
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              {(profile?.websites || []).map((website, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={website}
                    readOnly
                    className={`flex-1 px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-900'
                    }`}
                  />
                  <button
                    onClick={() => handleDeleteWebsite(website)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-3 sm:mb-4">
              <input
                type="text"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="Ajouter un site web"
                className={`flex-1 px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <button
                onClick={handleAddWebsite}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
                disabled={!newWebsite.trim()}
              >
                Ajouter
              </button>
            </div>
            <button
              onClick={() => {
                setShowWebsitesModal(false)
                setNewWebsite('')
              }}
              className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Banner Preview Modal */}
      {showBannerModal && uploadedBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-2xl`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Aperçu de la bannière
            </h3>
            <div className="w-full h-32 sm:h-40 md:h-48 mb-3 sm:mb-4 rounded-lg overflow-hidden">
              <img
                src={uploadedBanner}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleBannerConfirm}
                disabled={isUploadingBanner}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {isUploadingBanner ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
              <button
                onClick={handleBannerCancel}
                disabled={isUploadingBanner}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && uploadedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-lg`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recadrer la photo
            </h3>
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mb-3 sm:mb-4 overflow-hidden rounded-full border-4 border-blue-500">
              <img
                src={uploadedImage}
                alt="Crop preview"
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`
                }}
              />
            </div>
            <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
              <div>
                <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Zoom
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCropPosition({ x: cropPosition.x - 10, y: cropPosition.y })}
                  className="flex-1 px-2.5 sm:px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                >
                  ←
                </button>
                <button
                  onClick={() => setCropPosition({ x: cropPosition.x + 10, y: cropPosition.y })}
                  className="flex-1 px-2.5 sm:px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                >
                  →
                </button>
                <button
                  onClick={() => setCropPosition({ x: cropPosition.x, y: cropPosition.y - 10 })}
                  className="flex-1 px-2.5 sm:px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                >
                  ↑
                </button>
                <button
                  onClick={() => setCropPosition({ x: cropPosition.x, y: cropPosition.y + 10 })}
                  className="flex-1 px-2.5 sm:px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                >
                  ↓
                </button>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleCropCancel}
                disabled={isUploadingPhoto}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={isUploadingPhoto}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {isUploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
