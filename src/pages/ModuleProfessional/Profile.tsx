import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Globe, Calendar,
  Briefcase, Plus, Edit2, Lock, X,
  Users, Video, MessageSquare,
  TrendingUp, Settings, Camera, Heart, ArrowLeft,
  ChevronDown, Award
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getCurrentUserId } from '../../services/apiClient'
import { 
  getProfileWithFallback, 
  mapBackendProfile, 
  syncStoredProfile,
  canModifyProfession,
  getDaysUntilProfessionModification,
  canModifyPhoto,
  getDaysUntilPhotoModification
} from '../../hooks/useProfileUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
  lastProfessionUpdate?: string
  last_profession_update?: string
  bio?: string
  location?: string
  country?: string
  city?: string
  websites?: string[]
  status?: 'online' | 'offline'
  createdAt?: string
  date_joined?: string
  skills?: Skill[]
  username?: string
  fullName?: string
  avatarUrl?: string
  photo_url?: string
  banner_url?: string
  professionalProfile?: {
    profession?: string
    specialty?: string
    bio?: string
    country?: string
    city?: string
    phone?: string
    email?: string
    websites?: string[]
    skills?: Skill[]
  }
}

interface UserStatistics {
  videos?: {
    total: number
    totalViews: number
    totalLikes: number
    totalComments: number
  }
  events?: {
    total: number
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
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now())

  const [showProfessionModal, setShowProfessionModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [showBioModal, setShowBioModal] = useState(false)
  const [showWebsitesModal, setShowWebsitesModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'website' | 'skill', item: string } | null>(null)
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [showWebsitesDropdown, setShowWebsitesDropdown] = useState(false)
  const [showMobileInfoDropdown, setShowMobileInfoDropdown] = useState(false)
  const [newProfession, setNewProfession] = useState('')
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Technique', level: 'Intermédiaire' })
  const [newBio, setNewBio] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [uploadedBanner, setUploadedBanner] = useState<string>('')
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropScale, setCropScale] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const { showProfileUpdated } = useNotifications()

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
        setLoading(true)
        setError(null)
        
        // Vérifier le token JWT
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }

        // Charger le profil depuis le backend
        const loadedProfile = await refreshProfile(token)

        // Charger les statistiques videos de l'utilisateur connecte
        if (loadedProfile?.userId) {
          try {
            const videosResponse = await fetch(`${API_BASE_URL}/accueil/videos/?owner=${loadedProfile.userId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            if (videosResponse.ok) {
              const videosData = await videosResponse.json()
              const videos: any[] = videosData.results || videosData || []
              setStatistics(prev => ({
                ...prev,
                videos: {
                  total: videos.length,
                  totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
                  totalLikes: videos.reduce((sum, v) => sum + (v.likes || v.likes_count || 0), 0),
                  totalComments: videos.reduce((sum, v) => sum + (v.comments || v.comments_count || 0), 0)
                }
              }))
            }
          } catch (error) {
            console.error('Error loading video statistics:', error)
          }
        }

        if (!loadedProfile) {
          console.log('No profile data found, creating empty profile')
          setProfile({
            username: localStorage.getItem('exile_username') || 'Utilisateur',
            fullName: localStorage.getItem('exile_username') || 'Utilisateur',
            email: ''
          })
        }

        // Charger les abonnés
        try {
          const subscribersResponse = await fetch(`${API_BASE_URL}/abonnement/abonnements/subscribers/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (subscribersResponse.ok) {
            const subscribersData = await subscribersResponse.json()
            setStatistics(prev => ({
              ...prev,
              subscriptions: { followers: subscribersData.count || subscribersData.length || 0 }
            }))
          }
        } catch (error) {
          console.error('Error loading subscribers:', error)
        }

        // Charger l'activité récente
        try {
          const activitiesResponse = await fetch(`${API_BASE_URL}/activities/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json()
            const activities = activitiesData.results || activitiesData
            setRecentActivities(activities.map((activity: any) => ({
              id: activity.id,
              type: activity.activity_type,
              description: activity.description,
              timestamp: activity.created_at,
              user: activity.username || activity.user_full_name
            })))
          }
        } catch (error) {
          console.error('Error loading activities:', error)
        }

        // Charger les badges
        try {
          const badgesResponse = await fetch(`${API_BASE_URL}/badges/user-badges/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json()
            const badges = badgesData.results || badgesData
            setStatistics(prev => ({
              ...prev,
              badges: badges.map((badge: any) => ({
                id: badge.id,
                name: badge.badge_details?.name || 'Badge',
                description: badge.badge_details?.description || '',
                icon: badge.badge_details?.icon || '🏆',
                color: badge.badge_details?.color || '#3B82F6',
                earnedAt: badge.earned_at
              }))
            }))
          }
        } catch (error) {
          console.error('Error loading badges:', error)
        }
        
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

  // Modifier la profession
  const handleProfessionUpdate = async () => {
    if (!profile) return
    if (newProfession.trim() && newProfession.length >= 3 && newProfession.length <= 50) {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        if (!token) {
          alert('Vous devez être connecté pour modifier votre profession')
          return
        }

        // Vérifier restriction 30 jours
        const lastUpdate = profile.last_profession_update || profile.lastProfessionUpdate
        if (lastUpdate) {
          const daysSinceUpdate = getDaysSinceLastProfessionUpdate(lastUpdate)
          if (daysSinceUpdate < 30) {
            const daysRemaining = 30 - daysSinceUpdate
            alert(`Vous devez attendre ${daysRemaining} jours avant de modifier votre profession à nouveau`)
            return
          }
        }

        // Récupérer le profil existant pour avoir son ID
        const existingProfile = await getProfileWithFallback(token)
        if (!existingProfile) {
          alert('Impossible de récupérer votre profil')
          return
        }

        const response = await fetch(`${API_BASE_URL}/profil/profils/${existingProfile.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profession: newProfession.trim() })
        })

        if (response.ok) {
          await refreshProfile(token)
          setNewProfession('')
          setShowProfessionModal(false)
          showProfileUpdated()
        } else {
          const errorData = await response.json()
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
    if (!profile) return
    if (newSkill.name.trim() && newSkill.name.length >= 2 && newSkill.name.length <= 30) {
      if ((profile.skills?.length || 0) < 10) {
        const skill: Skill = {
          id: `skill-${Date.now()}`,
          name: newSkill.name,
          category: newSkill.category,
          level: newSkill.level,
          createdAt: new Date().toISOString()
        }
        try {
          const token = localStorage.getItem('accessToken')
          if (!token) {
            alert('Token non trouvé. Veuillez vous reconnecter.')
            return
          }

          console.log('Adding skill:', skill)
          
          // Récupérer d'abord le profil existant pour avoir son ID
          const existingProfile = await getProfileWithFallback(token)
          console.log('Get profile data:', existingProfile)

          if (!existingProfile) {
            alert('Profil non trouvé. Veuillez d\'abord créer un profil.')
            return
          }
          
          // Mapper les catégories et niveaux français vers anglais
          const categoryMap: { [key: string]: string } = {
            'Technique': 'technical',
            'Soft Skills': 'soft',
            'Langue': 'language',
            'Communication': 'communication',
            'Management': 'management',
            'Autre': 'other'
          }
          
          const levelMap: { [key: string]: string } = {
            'Débutant': 'beginner',
            'Intermédiaire': 'intermediate',
            'Avancé': 'advanced',
            'Expert': 'expert'
          }
          
          const englishCategory = categoryMap[newSkill.category] || newSkill.category
          const englishLevel = levelMap[newSkill.level] || newSkill.level
          
          console.log('Sending to backend:', { name: newSkill.name, category: englishCategory, level: englishLevel, profile: existingProfile.id })
          
          // Créer la compétence via le backend avec l'ID du profil
          const response = await fetch(`${API_BASE_URL}/profil/skills/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: newSkill.name,
              category: englishCategory,
              level: englishLevel
            })
          })

          console.log('Add skill response status:', response.status)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Add skill error:', errorText)
            throw new Error(`Erreur lors de l'ajout de la compétence: ${response.status} - ${errorText}`)
          }

          const data = await response.json()
          console.log('Skill created:', data)
          
          // Mettre à jour l'état local avec la compétence créée
          const updatedSkills = [...(profile.skills || []), {
            ...skill,
            id: data.id
          }]
          setProfile({ ...profile, skills: updatedSkills })
          setNewSkill({ name: '', category: '', level: 'intermediate' })
          showProfileUpdated()
          
          console.log('Skill added successfully')
          
        } catch (error) {
          console.error('Error adding skill:', error)
          alert(`Erreur lors de l'ajout de la compétence: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
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

  // Confirmer le crop et sauvegarder l'image
  const handleCropConfirm = async () => {
    if (!profile) return
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      console.log('Updating profile photo...')
      console.log('Uploaded image type:', typeof uploadedImage)
      console.log('Uploaded image length:', uploadedImage?.length)

      // Convertir base64 en blob
      const response = await fetch(uploadedImage)
      const blob = await response.blob()
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })

      console.log('File created:', file.name, file.size, file.type)

      // Récupérer d'abord le profil existant
      const existingProfile = await getProfileWithFallback(token)
      console.log('Get profile data:', existingProfile)

      if (!existingProfile) {
        console.log('No existing profile, creating new one...')
        // Créer un nouveau profil avec photo
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('bio', profile.bio || '')
        formData.append('location', profile.location || '')
        formData.append('website', profile.websites?.[0] || '')

        // Récupérer l'ID de l'utilisateur
        const userId = localStorage.getItem('exile_user_id')

        const createResponse = await fetch(`${API_BASE_URL}/profil/profils/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        })

        console.log('Create profile response status:', createResponse.status)
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error('Create profile error:', errorText)
          throw new Error(`Erreur lors de la création du profil: ${createResponse.status} - ${errorText}`)
        }
        
        console.log('Profile created successfully')
      } else {
        console.log('Updating existing profile:', existingProfile.id)
        // Mettre à jour le profil existant avec photo
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('bio', existingProfile.bio || '')
        formData.append('location', existingProfile.location || '')
        formData.append('website', existingProfile.website || '')

        console.log('Updating profile with FormData...')
        
        // Utiliser l'endpoint direct avec l'ID du profil
        const updateResponse = await fetch(`${API_BASE_URL}/profil/profils/${existingProfile.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        })

        console.log('Update profile response status:', updateResponse.status)
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error('Update profile error:', errorText)
          throw new Error(`Erreur lors de la mise à jour du profil: ${updateResponse.status} - ${errorText}`)
        }
        
        console.log('Profile updated successfully')
      }

      setShowCropModal(false)
      setUploadedImage('')
      showProfileUpdated()

      // Update cache buster to force image refresh
      setImageCacheBuster(Date.now())

      // Recharger le profil depuis le backend au lieu de recharger la page
      await refreshProfile(token)
      
    } catch (error) {
      console.error('Error updating photo:', error)
      alert(`Erreur lors de la mise à jour de la photo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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

  // Confirmer l'upload de bannière
  const handleBannerConfirm = async () => {
    if (!profile) return
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      console.log('Updating profile banner...')
      console.log('Current profile:', profile)
      console.log('Profile ID:', profile?.id)
      
      if (!profile?.id) {
        alert('Profil non trouvé. Veuillez recharger la page.')
        return
      }
      
      // Convertir base64 en blob
      const response = await fetch(uploadedBanner)
      const blob = await response.blob()
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' })
      
      console.log('Banner file created:', file.name, file.size, file.type)
      
      // Utiliser l'endpoint standard avec l'ID du profil
      const formData = new FormData()
      formData.append('banner', file)

      console.log('Updating profile with banner using PATCH on /profil/profils/{id}/ endpoint...')
      
      const updateResponse = await fetch(`${API_BASE_URL}/profil/profils/${profile.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      console.log('Update profile response status:', updateResponse.status)
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('Update profile error:', errorText)
        throw new Error(`Erreur lors de la mise à jour du profil: ${updateResponse.status} - ${errorText}`)
      }
      
      const updatedData = await updateResponse.json()
      console.log('Profile updated successfully, response:', updatedData)
      console.log('Banner URL in response:', updatedData.banner_url || updatedData.banner)
      console.log('All banner-related fields:', {
        banner: updatedData.banner,
        banner_url: updatedData.banner_url,
        photo: updatedData.photo,
        photo_url: updatedData.photo_url
      })
      
      // Vérifier si le backend retourne les bonnes données
      if (!updatedData.banner && !updatedData.banner_url) {
        console.error('Backend did not return banner or banner_url after upload')
        alert('Erreur: Le backend n\'a pas retourné l\'URL de la bannière après l\'upload')
        return
      }

      // Mettre à jour immédiatement l'état du profil avec les données retournées par l'API
      const bannerUrl = updatedData.banner_url || updatedData.banner
      if (bannerUrl) {
        setProfile(prev => prev ? { 
          ...prev, 
          banner: bannerUrl,
          banner_url: updatedData.banner_url || bannerUrl
        } : null)
        console.log('Profile state updated with banner URL:', bannerUrl)
      }

      setShowBannerModal(false)
      setUploadedBanner('')
      showProfileUpdated()

      // Update cache buster to force image refresh
      setImageCacheBuster(Date.now())
      
    } catch (error) {
      console.error('Error updating banner:', error)
      alert(`Erreur lors de la mise à jour de la bannière: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Annuler l'upload de bannière
  const handleBannerCancel = () => {
    setShowBannerModal(false)
    setUploadedBanner('')
  }

  // Modifier le bio
  const handleBioUpdate = async () => {
    if (!profile) return
    if (newBio.trim() && newBio.length <= 60) {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          alert('Token non trouvé. Veuillez vous reconnecter.')
          return
        }

        console.log('Updating bio to:', newBio)
        
        // Récupérer d'abord le profil existant
        const existingProfile = await getProfileWithFallback(token)
        console.log('Get profile data:', existingProfile)

        if (!existingProfile) {
          alert('Profil non trouvé. Veuillez d\'abord créer un profil.')
          return
        }

        // Mettre à jour le profil existant
        console.log('Updating existing profile with bio:', newBio)
        console.log('Existing profile data:', existingProfile)
        
        const updateResponse = await fetch(`${API_BASE_URL}/profil/profils/${existingProfile.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bio: newBio,
            location: existingProfile.location || '',
            website: existingProfile.website || ''
          })
        })

        console.log('Update profile response status:', updateResponse.status)
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error('Update profile error:', errorText)
          throw new Error(`Erreur lors de la mise à jour du profil: ${updateResponse.status} - ${errorText}`)
        }
        
        console.log('Profile updated successfully')

        setNewBio('')
        setShowBioModal(false)
        showProfileUpdated()

        // Recharger le profil depuis le backend au lieu de recharger la page
        await refreshProfile(token)
        
      } catch (error) {
        console.error('Error updating bio:', error)
        alert('Erreur lors de la mise à jour de la bio')
      }
    }
  }

  // Ajouter un site web
  const handleAddWebsite = async () => {
    if (!profile) return
    if (newWebsite.trim() && !(profile.websites || []).includes(newWebsite) && (profile.websites || []).length < 6) {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          alert('Token non trouvé. Veuillez vous reconnecter.')
          return
        }

        // Valider et formater l'URL
        let formattedWebsite = newWebsite.trim()
        if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
          formattedWebsite = 'https://' + formattedWebsite
        }

        console.log('Adding website:', formattedWebsite)
        
        // Récupérer d'abord le profil existant
        const existingProfile = await getProfileWithFallback(token)
        console.log('Get profile data:', existingProfile)

        if (!existingProfile) {
          alert('Profil non trouvé. Veuillez d\'abord créer un profil.')
          return
        }

        // Mettre à jour le profil existant
        console.log('Updating existing profile with website:', formattedWebsite)
        console.log('Existing profile data:', existingProfile)
        
        const updateResponse = await fetch(`${API_BASE_URL}/profil/profils/${existingProfile.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bio: existingProfile.bio || '',
            location: existingProfile.location || '',
            website: formattedWebsite
          })
        })

        console.log('Update profile response status:', updateResponse.status)
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error('Update profile error:', errorText)
          throw new Error(`Erreur lors de la mise à jour du profil: ${updateResponse.status} - ${errorText}`)
        }
        
        console.log('Profile updated successfully')

        setNewWebsite('')
        setShowWebsitesModal(false)
        showProfileUpdated()

        // Recharger le profil depuis le backend au lieu de recharger la page
        await refreshProfile(token)
        
      } catch (error) {
        console.error('Error adding website:', error)
        alert(`Erreur lors de l'ajout du site web: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }
  }

  // Supprimer un site web avec confirmation
  const handleDeleteWebsite = (website: string) => {
    setShowDeleteConfirm({ type: 'website', item: website })
  }

  // Confirmer suppression
  const handleDeleteConfirm = async () => {
    if (!profile || !showDeleteConfirm) return
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/profil/profils/${profile.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Profil supprimé avec succès')
        setShowDeleteConfirm(null)
        showProfileUpdated()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Erreur lors de la suppression du profil')
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

  // Badges - à connecter au backend
  const badges: any[] = []

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
            {/* Profile Header - YouTube-style layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Left column - Profile info */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-xl p-3 sm:p-4`}>
            {/* Banner Section - YouTube style */}
            <div className="relative group mb-3 sm:mb-4">
              <div className="w-full h-28 sm:h-36 md:h-44 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-zinc-600 shadow-md">
                {(() => {
                  console.log('Rendering banner check:', {
                    hasProfile: !!profile,
                    bannerValue: profile?.banner,
                    bannerUrlValue: profile?.banner_url,
                    imageCacheBuster
                  })
                  const bannerUrl = profile?.banner_url || profile?.banner
                  return bannerUrl ? (
                    <img 
                      src={bannerUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Banner image loaded successfully')}
                      onError={(e) => console.error('Banner image failed to load:', e.currentTarget.src)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className="text-white text-sm sm:text-base font-medium opacity-80">Ajouter une bannière</span>
                      <span className="text-white text-[10px] sm:text-xs opacity-60 mt-1">Recommandé: 2560x1440px (PC) / 1546x423px (Mobile)</span>
                    </div>
                  )
                })()}
              </div>
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-1.5 bg-white/90 dark:bg-zinc-700/90 text-gray-900 dark:text-white rounded-full shadow-lg hover:bg-white dark:hover:bg-zinc-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 -mt-8 sm:-mt-10 md:-mt-12">
              {/* Photo centrée avec upload - chevauchant la bannière */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold overflow-hidden border-4 border-white dark:border-zinc-800 ring-2 ring-blue-500/60 shadow-xl">
                  {profile?.avatarUrl || profile?.photo_url || profile?.photo ? (
                    <img src={`${profile?.avatarUrl || profile?.photo_url || profile?.photo}?t=${imageCacheBuster}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || profile?.fullName?.charAt(0) || '?'
                  )}
                </div>
                {canModifyPhoto(profile?.photoLastModified) ? (
                  <button
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="w-3 h-3" />
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
                <div className={`mt-1.5 flex items-center justify-center gap-1 ${profile?.status === 'online' ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${profile?.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-xs font-medium">{profile?.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                </div>
              </div>

              {/* Info centrée */}
              <div className="text-center space-y-1.5 sm:space-y-2 w-full">
                {/* Name - Mobile: only username, Desktop: full name */}
                <div>
                  <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.username || 'Utilisateur'}
                  </h2>
                  <p className={`hidden sm:block text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {profile?.name || profile?.fullName || ''}
                  </p>
                </div>

                {/* Profession */}
                <div className="flex items-center justify-center gap-1.5">
                  <Briefcase className={`w-4 h-4 md:w-5 md:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                  <span className={`text-sm md:text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.profession && profile?.speciality 
                      ? `${profile.profession} - ${profile.speciality}`
                      : profile?.profession || profile?.speciality || 'Non renseigné'}
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
                    <div className={`mt-2 p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                      {/* Bio */}
                      <div className="mb-3">
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
                      <div className="mb-3 flex items-center gap-1.5">
                        <MapPin className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                          {profile?.city && profile?.country 
                            ? `${profile.city}, ${profile.country}`
                            : profile?.city || profile?.country || profile?.location || 'Non renseigné'}
                        </span>
                      </div>

                      {/* Websites */}
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Globe className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            Sites web
                          </span>
                          <button
                            onClick={() => setShowWebsitesModal(true)}
                            className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                            disabled={(profile?.websites || []).length >= 6}
                          >
                            <Plus className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(profile?.websites || []).map((website, index) => (
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
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Award className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            Compétences
                          </span>
                          <button
                            onClick={() => setShowSkillsModal(true)}
                            className={`p-1 rounded ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <Plus className={`w-2.5 h-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(profile?.skills || []).slice(0, 5).map((skill, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                                {skill}
                              </span>
                              <button
                                onClick={() => handleDeleteSkill(skill)}
                                className="hover:opacity-70"
                              >
                                <X className="w-2.5 h-2.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {(profile?.skills || []).length > 5 && (
                            <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                              +{(profile?.skills || []).length - 5}
                            </span>
                          )}
                        </div>
                      </div>
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
                      {(profile?.websites || []).slice(0, 3).map((website, index) => (
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
                      {(profile?.websites || []).length > 3 && (
                        <div className="relative">
                          <button
                            onClick={() => setShowWebsitesDropdown(!showWebsitesDropdown)}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'}`}
                          >
                            +{(profile?.websites || []).length - 3}
                          </button>
                          {showWebsitesDropdown && (
                            <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                              {(profile?.websites || []).slice(3).map((website, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700">
                                  <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                                  >
                                    {website}
                                  </a>
                                  <button
                                    onClick={() => handleDeleteWebsite(website)}
                                    className="hover:opacity-70"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
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

            {/* Skills Section */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className={`text-base md:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Compétences
                </h3>
                {(profile?.skills || []).length < 10 && (
                  <button
                    onClick={() => setShowSkillModal(true)}
                    className="flex items-center gap-1 text-[10px] md:text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Ajouter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {(profile?.skills || []).slice(0, 2).map((skill) => (
                  <div
                    key={skill.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] md:text-xs ${
                      skill.category === 'Technique' || skill.category === 'technical'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : skill.category === 'Soft Skills' || skill.category === 'soft'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : skill.category === 'Langue' || skill.category === 'language'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : skill.category === 'Communication' || skill.category === 'communication'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        : skill.category === 'Management' || skill.category === 'management'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}
                  >
                    <span>{skill.name}</span>
                    <span className="text-[10px] opacity-70">({skill.level})</span>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {(profile?.skills || []).length > 2 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                      className={`px-2 py-1 rounded-full text-[10px] md:text-xs ${
                        resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      +{(profile?.skills || []).length - 2}
                    </button>
                    {showSkillsDropdown && (
                      <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                        {(profile?.skills || []).slice(2).map((skill) => (
                          <div key={skill.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${
                                skill.category === 'Technique' || skill.category === 'technical'
                                  ? 'text-blue-600'
                                  : skill.category === 'Soft Skills' || skill.category === 'soft'
                                  ? 'text-purple-600'
                                  : skill.category === 'Langue' || skill.category === 'language'
                                  ? 'text-green-600'
                                  : skill.category === 'Communication' || skill.category === 'communication'
                                  ? 'text-orange-600'
                                  : skill.category === 'Management' || skill.category === 'management'
                                  ? 'text-yellow-600'
                                  : 'text-gray-600'
                              }`}>
                                {skill.name}
                              </span>
                              <span className="text-xs opacity-70">({skill.level})</span>
                            </div>
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="hover:opacity-70"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(profile?.skills || []).length === 0 && (
                  <p className={`text-[10px] md:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    Aucune compétence ajoutée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Statistics, Quick Access, Activity, Badges */}
          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            {/* Statistics */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Statistiques Globales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-lg p-2 sm:p-3`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                      <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        stat.color === 'blue' ? 'text-blue-500' :
                        stat.color === 'purple' ? 'text-purple-500' :
                        stat.color === 'green' ? 'text-green-500' :
                        stat.color === 'red' ? 'text-red-500' :
                        stat.color === 'orange' ? 'text-orange-500' :
                        'text-pink-500'
                      }`} />
                      <span className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {stat.label}
                      </span>
                    </div>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2`}>
                {recentActivities.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'event' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'request' ? 'bg-green-100 text-green-600' :
                      activity.type === 'video' ? 'bg-red-100 text-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'event' && <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      {activity.type === 'request' && <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      {activity.type === 'video' && <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      {activity.type === 'conversation' && <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[10px] sm:text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {activity.title}
                      </p>
                      <p className={`text-[9px] sm:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Badges et Récompenses
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {badges.map((badge: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                      badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      badge.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      badge.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}
                  >
                    <badge.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
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

      {/* Bio Modal */}
      {showBioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier le bio
            </h3>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Entrez votre bio (max 60 caractères)"
              rows={4}
              maxLength={60}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base`}
            />
            <div className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-right`}>{newBio.length}/60</div>
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowBioModal(false)
                  setNewBio('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleBioUpdate}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!newBio.trim()}
              >
                Confirmer
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
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
              >
                Confirmer
              </button>
              <button
                onClick={handleBannerCancel}
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
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
