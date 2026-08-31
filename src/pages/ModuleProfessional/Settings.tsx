import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, Mail, Trash2, Shield, Bell, Palette, Globe,
  Clock, Smartphone, LogOut, HelpCircle, AlertTriangle,
  Eye, EyeOff, ChevronRight, TrendingUp, Play,
  User, Camera, MapPin, Briefcase, Plus, X
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cacheService } from '../../services/cacheService'
import { 
  syncStoredProfile,
  canModifyProfession,
  getDaysUntilProfessionModification
} from '../../hooks/useProfileUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const Settings = () => {
  const { resolvedTheme, theme, setTheme } = useTheme()
  const navigate = useNavigate()

  // Fonction de navigation conditionnelle
  const handleBack = () => {
    const previousPage = localStorage.getItem('exile_previous_page')
    if (previousPage === '/pro/profile') {
      // On vient de Mon compte → retour vers Mon compte
      navigate('/pro/profile')
    } else {
      // On vient du prosidebar → retour vers accueil
      navigate('/pro')
    }
  }

  // États pour les paramètres
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Lecture instantanée du cache profil
  const cachedProfile = cacheService.get<any>('pro:profile:data', { allowStale: true }).data

  // États pour l'édition du profil
  const [profileData, setProfileData] = useState(() => ({
    firstName: cachedProfile?.fullName?.split(' ')[0] || '',
    lastName: cachedProfile?.fullName?.split(' ').slice(1).join(' ') || '',
    username: cachedProfile?.username || '',
    profession: cachedProfile?.profession || '',
    bio: cachedProfile?.bio || '',
    city: cachedProfile?.location?.split(',')[0] || '',
    country: cachedProfile?.location?.split(',')[1]?.trim() || '',
    website: cachedProfile?.website || '',
    skills: cachedProfile?.skills?.map((s: any) => s.name || s) || [] as string[]
  }))
  const [newSkill, setNewSkill] = useState('')
  const [lastProfessionUpdate, setLastProfessionUpdate] = useState<string | null>(cachedProfile?.lastProfessionUpdate || null)
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('')
  const [photoPreview, setPhotoPreview] = useState<string>(cachedProfile?.avatarUrl || cachedProfile?.photo || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paramètres de confidentialité
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    eventsVisible: true,
    statisticsVisible: true
  })

  // Paramètres de notifications
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    frequency: 'immediate'
  })

  // Paramètres de l'application
  const [appSettings, setAppSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY'
  })

  // Paramètres de prévisualisation vidéo
  const [videoPreviewEnabled, setVideoPreviewEnabled] = useState(false)
  const [previewVideos, setPreviewVideos] = useState<any[]>([])
  const [autoplayInterval, setAutoplayInterval] = useState(5) // Intervalle en secondes

  // Charger les vidéos pour la prévisualisation
  useEffect(() => {
    const loadVideos = () => {
      const stored = localStorage.getItem('exile_videos')
      if (stored) {
        const videos = JSON.parse(stored)
        setPreviewVideos(videos)
      }
    }
    loadVideos()
  }, [])

  // Sauvegarder les paramètres de prévisualisation
  useEffect(() => {
    localStorage.setItem('exile_video_preview_enabled', JSON.stringify(videoPreviewEnabled))
    localStorage.setItem('exile_autoplay_interval', JSON.stringify(autoplayInterval))
  }, [videoPreviewEnabled, autoplayInterval])

  // Charger les paramètres de prévisualisation au démarrage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('exile_video_preview_enabled')
    const savedInterval = localStorage.getItem('exile_autoplay_interval')
    if (savedEnabled) setVideoPreviewEnabled(JSON.parse(savedEnabled))
    if (savedInterval) setAutoplayInterval(JSON.parse(savedInterval))
  }, [])

  // Sécurité
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome - Windows', location: 'Paris, France', lastActive: 'Il y a 2 minutes' },
    { id: 2, device: 'Safari - iPhone', location: 'Paris, France', lastActive: 'Il y a 1 heure' }
  ])

  const handlePasswordChange = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      alert('Mot de passe modifié avec succès!')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleEmailChange = () => {
    if (newEmail.includes('@')) {
      alert('Email modifié avec succès!')
      setShowEmailModal(false)
      setNewEmail('')
    }
  }

  const handleDeleteAccount = () => {
    alert('Compte supprimé avec succès!')
    navigate('/')
  }

  const handleRevokeSession = (sessionId: number) => {
    setActiveSessions(activeSessions.filter(s => s.id !== sessionId))
  }

  // Meme regle que 'Mon Profil': profession modifiable une fois tous les 30 jours
  const daysUntilProfessionUpdate = () => {
    return getDaysUntilProfessionModification(lastProfessionUpdate)
  }

  // Charger les données du profil
  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      // Récupérer d'abord l'ID utilisateur
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let currentUserId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id?.toString()
      }

      // Utiliser l'endpoint standard avec filtre user
      const response = await fetch(`${API_BASE_URL}/profil/profils/?user=${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const profileData = data.results && data.results.length > 0 ? data.results[0] : (Array.isArray(data) && data.length > 0 ? data[0] : null)
        
        if (profileData) {
          const fullName: string = profileData.full_name || ''
          const [firstName, ...rest] = fullName.split(' ')
          setProfileData({
            firstName: firstName || '',
            lastName: rest.join(' '),
            username: profileData.username || '',
            profession: profileData.profession || profileData.user_profession || '',
            bio: profileData.bio || '',
            city: profileData.city || profileData.location || '',
            country: profileData.country || '',
            website: profileData.website || '',
            skills: profileData.skills?.map((skill: any) => skill.name) || []
          })
          setLastProfessionUpdate(profileData.last_profession_update || null)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Handler pour l'édition du profil
  const handleProfileEdit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      // Récupérer l'ID du profil
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let currentUserId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id?.toString()
      }

      const profileResponse = await fetch(`${API_BASE_URL}/profil/profils/?user=${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!profileResponse.ok) {
        throw new Error('Erreur lors de la récupération du profil')
      }
      const profileData = await profileResponse.json()
      const profile = profileData.results && profileData.results.length > 0 ? profileData.results[0] : (Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null)
      
      if (!profile) {
        alert('Profil non trouvé. Veuillez d\'abord créer un profil.')
        return
      }

      const updateData = {
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        ...(canModifyProfession(lastProfessionUpdate) ? { profession: profileData.profession } : {}),
        bio: profileData.bio,
        city: profileData.city,
        country: profileData.country,
        location: profileData.city,
        website: profileData.website
      }

      const response = await fetch(`${API_BASE_URL}/profil/profils/${profile.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updated = await response.json().catch(() => null)
        syncStoredProfile(updated)
        alert('Profil mis à jour avec succès')
        loadProfile()
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil')
    }
  }

  // Handler pour l'upload de photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 MB.')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
      setUploadedPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handler pour sauvegarder la photo
  const handlePhotoSave = async () => {
    if (!uploadedPhoto) return

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      // Récupérer l'ID du profil
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let currentUserId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id?.toString()
      }

      const profileResponse = await fetch(`${API_BASE_URL}/profil/profils/?user=${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!profileResponse.ok) {
        throw new Error('Erreur lors de la récupération du profil')
      }
      const profileData = await profileResponse.json()
      const profile = profileData.results && profileData.results.length > 0 ? profileData.results[0] : (Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null)
      
      if (!profile) {
        alert('Profil non trouvé. Veuillez d\'abord créer un profil.')
        return
      }

      // Convertir base64 en blob
      const photoResponse = await fetch(uploadedPhoto)
      const blob = await photoResponse.blob()
      const formData = new FormData()
      formData.append('photo', blob, 'photo.jpg')

      console.log('Uploading photo to profile ID:', profile.id)

      const response = await fetch(`${API_BASE_URL}/profil/profils/${profile.id}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      console.log('Photo upload response status:', response.status)

      if (response.ok) {
        const updated = await response.json().catch(() => null)
        console.log('Photo upload response:', updated)
        
        // Vérifier que le backend retourne photo_url
        if (!updated.photo && !updated.photo_url) {
          console.error('Backend did not return photo or photo_url after upload')
          alert('Erreur: Le backend n\'a pas retourné l\'URL de la photo après l\'upload')
          return
        }

        syncStoredProfile(updated)
        alert('Photo de profil mise à jour avec succès')
        loadProfile()
        setShowPhotoUploadModal(false)
        setUploadedPhoto('')
        setPhotoPreview('')
      } else {
        const errorText = await response.text()
        console.error('Photo upload error:', errorText)
        throw new Error(`Erreur lors de l'upload: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert(`Erreur lors de l'upload de la photo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Handler pour ajouter une compétence
  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  // Handler pour supprimer une compétence
  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill)
    })
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-[100] w-full`}>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBack}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
              >
                <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <div className="flex-1">
                <h1 className={`text-base sm:text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Paramètres</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 px-3 sm:px-4 lg:px-6 lg:px-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Paramètres du Compte */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Paramètres du Compte
            </h2>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <button
              onClick={() => setShowProfileEditModal(true)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <User className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modifier le profil</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
            <button
              onClick={() => setShowPhotoUploadModal(true)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Camera className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Changer la photo</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Lock className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modifier le mot de passe</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modifier l'email</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="text-sm sm:text-base text-red-500">Supprimer le compte</span>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Sécurité */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sécurité
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Double authentification (2FA)</span>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${twoFactorEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="p-3 sm:p-4 rounded-lg">
              <h3 className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sessions actives</h3>
              <div className="space-y-2 sm:space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-zinc-700">
                    <div>
                      <p className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{session.device}</p>
                      <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{session.location} • {session.lastActive}</p>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-red-500 hover:text-red-600 text-[10px] sm:text-xs"
                    >
                      Révoquer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres de Confidentialité */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Confidentialité
            </h2>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <button
              onClick={() => navigate('/pro/settings/privacy')}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Paramètres de confidentialité</span>
              </div>
              <ChevronRight className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Paramètres de Notifications */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h2>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications par email</span>
              </div>
              <button
                onClick={() => setNotificationSettings({ ...notificationSettings, email: !notificationSettings.email })}
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors ${notificationSettings.email ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${notificationSettings.email ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Smartphone className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications push</span>
              </div>
              <button
                onClick={() => setNotificationSettings({ ...notificationSettings, push: !notificationSettings.push })}
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors ${notificationSettings.push ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${notificationSettings.push ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications in-app</span>
              </div>
              <button
                onClick={() => setNotificationSettings({ ...notificationSettings, inApp: !notificationSettings.inApp })}
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors ${notificationSettings.inApp ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${notificationSettings.inApp ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Paramètres de l'Application */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Application
            </h2>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Palette className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Thème</span>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-900'
                }`}
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Système</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Globe className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Langue</span>
              </div>
              <select
                value={appSettings.language}
                onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-900'
                }`}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Fuseau horaire</span>
              </div>
              <select
                value={appSettings.timezone}
                onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-900'
                }`}
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prévisualisation Vidéo */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Lecture Aléatoire sur l'Accueil
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Play className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <div>
                  <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activer la lecture aléatoire</span>
                  <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Les vidéos joueront automatiquement sans son pendant le défilement</p>
                </div>
              </div>
              <button
                onClick={() => setVideoPreviewEnabled(!videoPreviewEnabled)}
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors ${videoPreviewEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${videoPreviewEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {videoPreviewEnabled && (
              <div className="p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Intervalle de changement (secondes)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={autoplayInterval}
                    onChange={(e) => setAutoplayInterval(Math.max(3, Math.min(30, parseInt(e.target.value) || 5)))}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-900'
                    }`}
                  />
                  <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                    Les vidéos changeront automatiquement toutes les {autoplayInterval} secondes
                  </p>
                </div>

                {previewVideos.length > 0 ? (
                  <div className={`p-2 sm:p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {previewVideos.length} vidéo(s) disponible(s) pour la lecture aléatoire
                    </p>
                    <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                      Les vidéos seront sélectionnées aléatoirement et lues sans son pour attirer l'attention
                    </p>
                  </div>
                ) : (
                  <div className={`p-3 sm:p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                      Aucune vidéo disponible. Ajoutez des vidéos pour activer la lecture aléatoire.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Support et Aide */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 sm:p-6`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className={`text-base sm:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Support et Aide
            </h2>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <button className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <div className="flex items-center gap-2 sm:gap-3">
                <HelpCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Centre d'aide</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
            <button className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Signaler un problème</span>
              </div>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          className="w-full flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm sm:text-base"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier le mot de passe
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe (min 8 caractères)"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier l'email
            </h3>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Nouvel email"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base mb-3 sm:mb-4 ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setNewEmail('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleEmailChange}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                disabled={!newEmail.includes('@')}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-red-600`}>
              Supprimer le compte
            </h3>
            <p className={`mb-4 sm:mb-6 text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
              Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible et toutes vos données seront perdues.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Modifier le profil
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Prénom"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Nom"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Username"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Titre professionnel
                  {!canModifyProfession(lastProfessionUpdate) && (
                    <span className="ml-2 text-[10px] sm:text-xs font-normal text-gray-500">
                      Modifiable dans {daysUntilProfessionUpdate()}j
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={profileData.profession}
                  onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
                  disabled={!canModifyProfession(lastProfessionUpdate)}
                  placeholder="Titre professionnel"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Bio"
                  rows={3}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    placeholder="Ville"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Pays
                  </label>
                  <input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    placeholder="Pays"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Site web
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://example.com"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Compétences
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Ajouter une compétence"
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <div
                      key={skill}
                      className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm ${
                        resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowProfileEditModal(false)}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleProfileEdit}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-md`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Changer la photo de profil
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-zinc-500">
                      <Camera className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Sélectionner une image
              </button>
              <p className={`text-[10px] sm:text-xs text-center ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                Formats acceptés: JPG, JPEG, PNG, WEBP (max 5 MB)
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowPhotoUploadModal(false)
                  setPhotoPreview('')
                  setUploadedPhoto('')
                }}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  resolvedTheme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handlePhotoSave}
                disabled={!uploadedPhoto}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
