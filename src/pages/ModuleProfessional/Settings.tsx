import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, Mail, Trash2, Shield, Bell, Globe,
  Clock, Smartphone, LogOut, HelpCircle, AlertTriangle,
  Eye, EyeOff, ChevronRight, Play,
  User, Camera, MapPin, Briefcase, Plus, X, Info,
  Check, MessageSquare, UserCheck, UserX, AlertCircle,
  Loader2, ArrowLeft, Copy, CheckCircle2, QrCode, Key, Crown, Wifi, Sparkles, RefreshCw,
  Search, FileText, Video, ShieldCheck, CreditCard, ChevronDown
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/authApi'
import { cacheService } from '../../services/cacheService'
import { 
  syncStoredProfile,
  canModifyProfession,
  getDaysUntilProfessionModification,
  canModifyUsername,
  getDaysUntilUsernameModification
} from '../../hooks/useProfileUtils'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import { API_BASE_URL } from '../../config/api'
import PayerPremiumButton from '../../components/PayerPremiumButton'
import ConfirmModal from '../../components/common/ConfirmModal'

type SettingsCategory = 
  | 'account' 
  | 'privacy'
  | 'security' 
  | 'notifications' 
  | 'app' 
  | 'video' 
  | 'support'
  | 'premium';

type WhoCanContactOption = 'everyone' | 'followers' | 'verified_pro' | 'nobody';
type ProfileVisibilityOption = 'public' | 'members' | 'private';

interface BlockedUserItem {
  id: number;
  blocked: {
    id: number;
    username: string;
    full_name?: string;
  };
  created_at: string;
}

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { resolvedTheme, theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Master-Detail Category state
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account')
  const [mobileShowContent, setMobileShowContent] = useState<boolean>(false)

  // Custom Confirm/Alert Modal States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [revokeConfirmSession, setRevokeConfirmSession] = useState<{ id: number; name: string } | null>(null)
  const [settingsAlert, setSettingsAlert] = useState<{ title?: string; message: string; type?: 'info' | 'warning' | 'danger' | 'success'; onConfirm?: () => void } | null>(null)

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const handleBack = () => {
    const previousPage = localStorage.getItem('exile_previous_page')
    if (previousPage === '/pro/profile') {
      navigate('/pro/profile')
    } else {
      navigate('/pro')
    }
  }

  // Modales d'action
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)

  // États pour Changement de Mot de Passe (100% Réel)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // États pour Changement d'Email (100% Réel)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  // États pour Suppression de Compte (100% Réel)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Cache et Profil
  const cachedProfile = cacheService.get<any>('pro:profile:data', { allowStale: true }).data
  const [profileId, setProfileId] = useState<number | null>(null)
  const [profileData, setProfileData] = useState(() => ({
    firstName: cachedProfile?.fullName?.split(' ')[0] || '',
    lastName: cachedProfile?.fullName?.split(' ').slice(1).join(' ') || '',
    username: cachedProfile?.username || '',
    email: cachedProfile?.email && cachedProfile.email.includes('@') && !cachedProfile.email.startsWith('@') ? cachedProfile.email : '',
    profession: cachedProfile?.profession || '',
    bio: cachedProfile?.bio || '',
    city: cachedProfile?.location?.split(',')[0] || '',
    country: cachedProfile?.location?.split(',')[1]?.trim() || '',
    website: cachedProfile?.website || '',
    skills: cachedProfile?.skills?.map((s: any) => s.name || s) || [] as string[]
  }))
  const [newSkill, setNewSkill] = useState('')
  const [lastProfessionUpdate, setLastProfessionUpdate] = useState<string | null>(cachedProfile?.lastProfessionUpdate || null)
  const [lastUsernameUpdate, setLastUsernameUpdate] = useState<string | null>(cachedProfile?.last_name_update || cachedProfile?.lastUsernameUpdate || localStorage.getItem('exile_last_username_update') || null)
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('')
  const [photoPreview, setPhotoPreview] = useState<string>(cachedProfile?.avatarUrl || cachedProfile?.photo || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 100% RÉEL : Confidentialité & "Qui peut me contacter ?"
  const [whoCanContact, setWhoCanContact] = useState<WhoCanContactOption>('everyone')
  const [isOnlineVisible, setIsOnlineVisible] = useState<boolean>(true)
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibilityOption>('public')
  const [savingPrivacyField, setSavingPrivacyField] = useState<string | null>(null)
  const [privacyFeedback, setPrivacyFeedback] = useState<string | null>(null)

  // 100% RÉEL : Utilisateurs bloqués
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  // 100% RÉEL : Sécurité & Sessions (2FA TOTP & Email)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'email'>('totp')
  const [show2FASetupModal, setShow2FASetupModal] = useState(false)
  const [show2FADisableModal, setShow2FADisableModal] = useState(false)
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<'choose' | 'verify'>('choose')
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret?: string
    qr_code?: string
    otpauth_url?: string
    message?: string
  } | null>(null)
  const [twoFactorSetupCode, setTwoFactorSetupCode] = useState('')
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false)
  const [twoFactorSetupError, setTwoFactorSetupError] = useState<string | null>(null)
  const [twoFactorSetupSuccess, setTwoFactorSetupSuccess] = useState<string | null>(null)
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('')
  const [twoFactorDisableLoading, setTwoFactorDisableLoading] = useState(false)
  const [twoFactorDisableError, setTwoFactorDisableError] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    frequency: 'immediate'
  })

  // Signalement de Bug Technique (100% Réel)
  const [showBugModal, setShowBugModal] = useState(false)
  const [bugSubject, setBugSubject] = useState('')
  const [bugDescription, setBugDescription] = useState('')
  const [bugCategory, setBugCategory] = useState<'video' | 'login' | 'audio' | 'display' | 'other'>('video')
  const [bugLoading, setBugLoading] = useState(false)
  const [bugSuccess, setBugSuccess] = useState<string | null>(null)
  const [bugError, setBugError] = useState<string | null>(null)

  // Paramètres de l'application
  const [appSettings, setAppSettings] = useState({
    language: 'fr',
    timezone: 'America/New_York',
    dateFormat: 'DD/MM/YYYY'
  })

  // Lecture vidéo avec chargement initial instantané depuis le localStorage
  const [videoPreviewEnabled, setVideoPreviewEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('exile_video_preview_enabled')
      return saved !== null ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })
  const [previewVideos, setPreviewVideos] = useState<any[]>([])
  const [autoplayInterval, setAutoplayInterval] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('exile_autoplay_interval')
      return saved ? JSON.parse(saved) : 5
    } catch {
      return 5
    }
  })
  const [videoDataSaver, setVideoDataSaver] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('exile_video_data_saver')
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })
  const [videoNetworkMode, setVideoNetworkMode] = useState<'all' | 'wifi_only'>(() => {
    try {
      const saved = localStorage.getItem('exile_video_network_mode')
      return saved ? JSON.parse(saved) : 'all'
    } catch {
      return 'all'
    }
  })

  // Charger les vidéos et paramètres locaux
  useEffect(() => {
    try {
      const stored = localStorage.getItem('exile_videos')
      if (stored) setPreviewVideos(JSON.parse(stored))
      const savedNotifs = localStorage.getItem('exile_notification_settings')
      if (savedNotifs) setNotificationSettings(JSON.parse(savedNotifs))
      const savedApp = localStorage.getItem('exile_app_settings')
      if (savedApp) setAppSettings(JSON.parse(savedApp))
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('exile_video_preview_enabled', JSON.stringify(videoPreviewEnabled))
    localStorage.setItem('exile_autoplay_interval', JSON.stringify(autoplayInterval))
    localStorage.setItem('exile_video_data_saver', JSON.stringify(videoDataSaver))
    localStorage.setItem('exile_video_network_mode', JSON.stringify(videoNetworkMode))
    window.dispatchEvent(new CustomEvent('exile_video_settings_updated', {
      detail: {
        videoPreviewEnabled,
        autoplayInterval,
        videoDataSaver,
        videoNetworkMode
      }
    }))
  }, [videoPreviewEnabled, autoplayInterval, videoDataSaver, videoNetworkMode])

  useEffect(() => {
    localStorage.setItem('exile_notification_settings', JSON.stringify(notificationSettings))
  }, [notificationSettings])

  useEffect(() => {
    localStorage.setItem('exile_app_settings', JSON.stringify(appSettings))
  }, [appSettings])

  const daysUntilProfessionUpdate = () => {
    return getDaysUntilProfessionModification(lastProfessionUpdate)
  }

  const daysUntilUsernameUpdate = () => {
    return getDaysUntilUsernameModification(lastUsernameUpdate)
  }

  // Centre d'aide Facebook-style
  const [supportSearchQuery, setSupportSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedHelpCategory, setSelectedHelpCategory] = useState<string | null>(null)

  // Peman Manyèl Natcash (EXILE PLATEFORME)
  const [natcashPayments, setNatcashPayments] = useState<any[]>([])

  const loadNatcashPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/abonnement/abonnements/mon_statut_natcash/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        if (d && d.success && Array.isArray(d.data)) {
          setNatcashPayments(d.data)
        }
      }
    } catch (err) {
      console.error('Error fetching natcash payments:', err)
    }
  }, [])

  useEffect(() => {
    if (activeCategory === 'premium') {
      loadNatcashPayments()
    }
  }, [activeCategory, loadNatcashPayments])


  // ==========================================================================
  // CHARGEMENT RÉEL DU PROFIL & PARAMÈTRES DEPUIS DJANGO / POSTGRESQL
  // ==========================================================================
  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const meResponse = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (meResponse.ok) {
        const data = await meResponse.json()
        setProfileId(data.id)
        const fullName: string = data.full_name || ''
        const [firstName, ...rest] = fullName.split(' ')

        const rawEmail: string = data.email || ''
        const cleanEmail = rawEmail.includes('@') && !rawEmail.startsWith('@') ? rawEmail : ''

        setProfileData({
          firstName: firstName || '',
          lastName: rest.join(' '),
          username: data.username || '',
          email: cleanEmail,
          profession: data.profession || data.user_profession || '',
          bio: data.bio || '',
          city: data.city || data.location || '',
          country: data.country || '',
          website: data.website || '',
          skills: data.skills?.map((skill: any) => skill.name) || []
        })

        if (data.photo_url || data.photo) {
          setPhotoPreview(data.photo_url || data.photo)
        }

        setLastProfessionUpdate(data.last_profession_update || null)

        if (data.who_can_contact) {
          setWhoCanContact(data.who_can_contact as WhoCanContactOption)
        }
        if (data.is_online_visible !== undefined) {
          setIsOnlineVisible(data.is_online_visible)
        }
        if (data.profile_visibility) {
          setProfileVisibility(data.profile_visibility as ProfileVisibilityOption)
        }
        if (data.two_factor_enabled !== undefined) {
          setTwoFactorEnabled(data.two_factor_enabled)
        }
        if (data.two_factor_method) {
          setTwoFactorMethod(data.two_factor_method)
        }
        if (data.notif_email !== undefined || data.notif_push !== undefined || data.notif_in_app !== undefined || data.notif_frequency) {
          setNotificationSettings({
            email: data.notif_email !== undefined ? data.notif_email : true,
            push: data.notif_push !== undefined ? data.notif_push : true,
            inApp: data.notif_in_app !== undefined ? data.notif_in_app : true,
            frequency: data.notif_frequency || 'immediate'
          })
        }
        if (data.language || data.timezone) {
          setAppSettings(prev => ({
            ...prev,
            language: data.language || prev.language,
            timezone: data.timezone || prev.timezone
          }))
          if (data.language && data.language !== i18n.language) {
            i18n.changeLanguage(data.language)
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile in settings:', error)
    }
  }, [])

  // Charger les sessions réelles
  const [revokingSessionId, setRevokingSessionId] = useState<number | null>(null)
  const [sessionFeedback, setSessionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await authApi.getSessions()
      if (res.success && res.sessions) {
        setActiveSessions(res.sessions)
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const handleRevokeSession = (sessionId: number, deviceName: string) => {
    setRevokeConfirmSession({ id: sessionId, name: deviceName })
  }

  const executeRevokeSession = async () => {
    if (!revokeConfirmSession) return
    const sessionId = revokeConfirmSession.id
    setRevokeConfirmSession(null)
    setRevokingSessionId(sessionId)
    setSessionFeedback(null)
    try {
      const res = await authApi.revokeSession(sessionId)
      if (res.success) {
        setSessionFeedback({ type: 'success', message: res.message || "Appareil déconnecté avec succès." })
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
        setTimeout(() => setSessionFeedback(null), 3500)
      } else {
        setSessionFeedback({ type: 'error', message: res.error || "Impossible de déconnecter l'appareil." })
        setTimeout(() => setSessionFeedback(null), 4000)
      }
    } catch (err) {
      setSessionFeedback({ type: 'error', message: "Erreur de connexion lors de la déconnexion." })
    } finally {
      setRevokingSessionId(null)
    }
  }


  // Charger les utilisateurs bloqués
  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlocked(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/blocked/blocked/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(Array.isArray(data) ? data : (data.results || []))
      }
    } catch (err) {
      console.error('Error loading blocked users:', err)
    } finally {
      setLoadingBlocked(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadSessions()
    loadBlockedUsers()
  }, [loadProfile, loadSessions, loadBlockedUsers])

  // ==========================================================================
  // GESTION RÉELLE DE LA CONFIDENTIALITÉ : "QUI PEUT ME CONTACTER ?"
  // ==========================================================================
  const handleUpdatePrivacySetting = async (field: string, value: any) => {
    setSavingPrivacyField(field)
    setPrivacyFeedback(null)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      })

      if (res.ok) {
        setPrivacyFeedback('Paramètre enregistré avec succès dans la base de données.')
        setTimeout(() => setPrivacyFeedback(null), 3500)
      } else {
        setPrivacyFeedback('Erreur lors de l’enregistrement du paramètre.')
      }
    } catch (err) {
      console.error('Error saving privacy setting:', err)
      setPrivacyFeedback('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSavingPrivacyField(null)
    }
  }

  // Débloquer un utilisateur
  const handleUnblockUser = async (blockedId: number) => {
    setUnblockingId(blockedId)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/blocked/blocked/unblock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blocked_id: blockedId })
      })
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.blocked?.id !== blockedId && u.id !== blockedId))
      }
    } catch (err) {
      console.error('Error unblocking:', err)
    } finally {
      setUnblockingId(null)
    }
  }

  // ==========================================================================
  // GESTION RÉELLE DES NOTIFICATIONS & ENVOI D'EMAIL RESEND
  // ==========================================================================
  const handleUpdateNotification = async (key: 'email' | 'push' | 'inApp' | 'frequency', value: any) => {
    const nextSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(nextSettings)

    const payload: any = {}
    if (key === 'email') payload.notif_email = value
    if (key === 'push') payload.notif_push = value
    if (key === 'inApp') payload.notif_in_app = value
    if (key === 'frequency') payload.notif_frequency = value

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/users/notifications/preferences/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setPrivacyFeedback(t('settings.notifications.saved', 'Préférences de notifications enregistrées dans la base de données.'))
        setTimeout(() => setPrivacyFeedback(null), 3000)
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    }
  }

  const handleSubmitBugReport = async () => {
    setBugError(null)
    setBugSuccess(null)
    if (!bugSubject.trim() || !bugDescription.trim()) {
      setBugError('Veuillez renseigner le sujet et la description du problème.')
      return
    }

    setBugLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/users/bug-reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: bugCategory,
          subject: bugSubject,
          description: bugDescription,
          url: window.location.href,
          user_agent: navigator.userAgent
        })
      })

      if (res.ok) {
        setBugSuccess('Votre signalement a été transmis avec succès à l’équipe technique. Merci !')
        setTimeout(() => {
          setShowBugModal(false)
          setBugSubject('')
          setBugDescription('')
          setBugSuccess(null)
        }, 2200)
      } else {
        setBugError('Erreur lors de l’envoi du signalement.')
      }
    } catch {
      setBugError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setBugLoading(false)
    }
  }

  // ==========================================================================
  // GESTION RÉELLE DES PRÉFÉRENCES DE L'APPLICATION (10 LANGUES & TIMEZONE)
  // ==========================================================================
  const handleUpdateLanguage = async (newLang: string) => {
    setAppSettings(prev => ({ ...prev, language: newLang }))
    i18n.changeLanguage(newLang)
    setPrivacyFeedback(t('settings.app.savedFeedback', 'Langue et préférences régionales mises à jour avec succès.'))
    setTimeout(() => setPrivacyFeedback(null), 3500)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language: newLang })
      })
    } catch (err) {
      console.error('Error persisting language to database:', err)
    }
  }

  const handleUpdateTimezone = async (newTimezone: string) => {
    setAppSettings(prev => ({ ...prev, timezone: newTimezone }))
    setPrivacyFeedback(t('settings.app.savedFeedback', 'Langue et préférences régionales mises à jour avec succès.'))
    setTimeout(() => setPrivacyFeedback(null), 3500)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timezone: newTimezone })
      })
    } catch (err) {
      console.error('Error persisting timezone to database:', err)
    }
  }

  // ==========================================================================
  // GESTION RÉELLE DU COMPTE : MOT DE PASSE, EMAIL, SUPPRESSION
  // ==========================================================================
  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    if (!currentPassword) {
      setPasswordError('Veuillez renseigner votre mot de passe actuel.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le nouveau mot de passe et sa confirmation ne correspondent pas.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit comporter au moins 8 caractères.')
      return
    }

    setPasswordLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/users/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe.')
      } else {
        setPasswordSuccess('Mot de passe mis à jour avec succès en base de données !')
        setTimeout(() => {
          setShowPasswordModal(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setPasswordSuccess(null)
        }, 1800)
      }
    } catch (err) {
      setPasswordError('Erreur de connexion avec le serveur.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleEmailChange = async () => {
    setEmailError(null)
    setEmailSuccess(null)
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Veuillez entrer une adresse email valide.')
      return
    }
    if (!emailPassword) {
      setEmailError('Veuillez renseigner votre mot de passe pour confirmer le changement.')
      return
    }

    setEmailLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/users/change-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_email: newEmail,
          password: emailPassword
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEmailError(data.error || "Erreur lors de la mise à jour de l'email.")
      } else {
        const msg = data.message || "Lien de confirmation envoyé à votre nouvelle adresse email !"
        setEmailSuccess(msg)
        setTimeout(() => {
          setShowEmailModal(false)
          setNewEmail('')
          setEmailPassword('')
          setEmailSuccess(null)
        }, 3500)
      }
    } catch (err) {
      setEmailError('Erreur de connexion avec le serveur.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    if (!deletePassword) {
      setDeleteError('Veuillez renseigner votre mot de passe pour confirmer la suppression définitive.')
      return
    }

    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${API_BASE_URL}/users/delete-account/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || 'Erreur lors de la suppression du compte.')
      } else {
        setSettingsAlert({
          title: 'Compte supprimé',
          message: 'Votre compte et vos données ont été définitivement supprimés.',
          type: 'success',
          onConfirm: () => {
            logout()
            navigate('/')
          }
        })
      }
    } catch (err) {
      setDeleteError('Erreur de connexion avec le serveur.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ==========================================================================
  // ÉDITION DU PROFIL & UPLOAD PHOTO (RÉEL SUR SUPABASE / DJANGO)
  // ==========================================================================
  const handleProfileEdit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const updateData: any = {
        ...(canModifyUsername(lastUsernameUpdate) && profileData.username ? { username: profileData.username } : {}),
        ...(canModifyProfession(lastProfessionUpdate) ? { profession: profileData.profession } : {}),
        bio: profileData.bio,
        city: profileData.city,
        country: profileData.country,
        location: profileData.city,
        website: profileData.website
      }

      const response = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updated = await response.json().catch(() => null)
        if (canModifyUsername(lastUsernameUpdate) && profileData.username) {
          const nowIso = new Date().toISOString()
          setLastUsernameUpdate(nowIso)
          localStorage.setItem('exile_last_username_update', nowIso)
        }
        syncStoredProfile(updated)
        setShowProfileEditModal(false)
        loadProfile()
      } else {
        setSettingsAlert({ title: 'Erreur de mise à jour', message: 'Erreur lors de la sauvegarde du profil.', type: 'danger' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setSettingsAlert({ title: 'Erreur réseau', message: 'Erreur réseau lors de la mise à jour.', type: 'danger' })
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setSettingsAlert({ title: 'Format non supporté', message: 'Format non supporté. Utilisez JPG, PNG ou WEBP.', type: 'warning' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setSettingsAlert({ title: 'Fichier volumineux', message: "L'image ne doit pas dépasser 5 Mo.", type: 'warning' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
      setUploadedPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoSave = async () => {
    if (!uploadedPhoto || !profileId) return
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const photoResponse = await fetch(uploadedPhoto)
      const blob = await photoResponse.blob()
      const formData = new FormData()
      formData.append('photo', blob, 'avatar.jpg')

      const response = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        const updated = await response.json().catch(() => null)
        syncStoredProfile(updated)
        setShowPhotoUploadModal(false)
        setUploadedPhoto('')
        loadProfile()
      } else {
        setSettingsAlert({ title: 'Erreur photo', message: "Erreur lors de l'enregistrement de la photo.", type: 'danger' })
      }
    } catch (error) {
      console.error('Error saving photo:', error)
    }
  }

  // ==========================================================================
  // GESTION RÉELLE DE LA 2FA (TOTP GOOGLE AUTHENTICATOR & EMAIL OTP)
  // ==========================================================================
  const handleStart2FASetup = async (method: 'totp' | 'email') => {
    setTwoFactorMethod(method)
    setTwoFactorSetupLoading(true)
    setTwoFactorSetupError(null)
    setTwoFactorSetupCode('')
    try {
      const res = await authApi.setup2FA(method)
      if (res.success && res.data) {
        setTwoFactorSetupData(res.data)
        setTwoFactorSetupStep('verify')
      } else {
        setTwoFactorSetupError(res.error || "Impossible d'initier la configuration 2FA.")
      }
    } catch (e) {
      setTwoFactorSetupError('Erreur de connexion.')
    } finally {
      setTwoFactorSetupLoading(false)
    }
  }

  const handleConfirm2FASetup = async () => {
    if (twoFactorSetupCode.length < 6) {
      setTwoFactorSetupError('Veuillez entrer le code à 6 chiffres.')
      return
    }
    setTwoFactorSetupLoading(true)
    setTwoFactorSetupError(null)
    try {
      const res = await authApi.confirm2FASetup(twoFactorSetupCode)
      if (res.success) {
        setTwoFactorEnabled(true)
        setTwoFactorSetupSuccess(res.message || 'Double authentification activée avec succès !')
        setTimeout(() => {
          setShow2FASetupModal(false)
          setTwoFactorSetupStep('choose')
          setTwoFactorSetupData(null)
          setTwoFactorSetupCode('')
          setTwoFactorSetupSuccess(null)
        }, 2000)
      } else {
        setTwoFactorSetupError(res.error || 'Code de vérification invalide ou expiré.')
      }
    } catch (e) {
      setTwoFactorSetupError('Erreur lors de la vérification.')
    } finally {
      setTwoFactorSetupLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!twoFactorDisablePassword) {
      setTwoFactorDisableError('Veuillez renseigner votre mot de passe pour confirmer la désactivation.')
      return
    }
    setTwoFactorDisableLoading(true)
    setTwoFactorDisableError(null)
    try {
      const res = await authApi.disable2FA({ password: twoFactorDisablePassword })
      if (res.success) {
        setTwoFactorEnabled(false)
        setShow2FADisableModal(false)
        setTwoFactorDisablePassword('')
      } else {
        setTwoFactorDisableError(res.error || 'Mot de passe incorrect.')
      }
    } catch (e) {
      setTwoFactorDisableError('Erreur lors de la désactivation.')
    } finally {
      setTwoFactorDisableLoading(false)
    }
  }

  const handleCopySecret = () => {
    if (twoFactorSetupData?.secret) {
      navigator.clipboard.writeText(twoFactorSetupData.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2500)
    }
  }

  // ==========================================================================
  // RENDU VISUEL : AUCUN GASPILLAGE D'ESPACE, CONTENEUR LARGE & MODERNE
  // ==========================================================================
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'} flex flex-col`}>
      {/* Header Pleine Largeur */}
      <header className={`${resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200'} border-b sticky top-0 z-40 backdrop-blur-md transition-colors`}>
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              title="Retour"
              className={`p-2 rounded-xl ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5 rtl-flip" />
            </button>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.title', 'Paramètres')}
              </h1>
              <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} hidden sm:block`}>
                {t('settings.subtitle', 'Gérez vos informations personnelles, votre sécurité et vos préférences de plateforme.')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteneur Principal Élargi (Max 1440px) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          
          {/* ============================================================ */}
          {/* COLONNE GAUCHE (SIDEBAR NAVIGATION) : 5 Cols Tablet, 3-4 Desktop */}
          {/* ============================================================ */}
          <aside className={`md:col-span-5 lg:col-span-4 xl:col-span-3 ${mobileShowContent ? 'hidden md:block' : 'block'}`}>
            <div className="space-y-4 md:sticky md:top-20 lg:top-24">
              
              {/* Carte Profil Rapide (clique redirige vers /pro/profile) */}
              <div 
                onClick={() => navigate('/pro/profile')}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border group ${
                  resolvedTheme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-sm' 
                    : 'bg-white border-gray-100 shadow-sm hover:shadow'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-blue-500/20">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">{(profileData.username?.replace('@', '')?.[0] || 'U').toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm sm:text-base font-bold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {profileData.username ? (profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`) : '@utilisateur'}
                    </p>
                    <p className={`text-xs font-medium truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {profileData.profession || t('pro.profile.viewProfile', 'Voir mon profil')}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              </div>

              {/* SECTION: COMPTE */}
              <div>
                <p className="text-[11px] font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase px-3 mb-2">
                  {t('settings.sections.account', 'Compte')}
                </p>
                <div className={`rounded-2xl border overflow-hidden transition-colors ${
                  resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 divide-y divide-zinc-800/80' : 'bg-white border-gray-100 divide-y divide-gray-100 shadow-sm'
                }`}>
                  
                  {/* 1. Informations personnelles */}
                  <button
                    onClick={() => { setActiveCategory('account'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'account'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-blue-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'account' && resolvedTheme !== 'dark' ? 'text-blue-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.account', 'Informations personnelles')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.accountDesc', 'Nom, bio, coordonnées')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'account' && resolvedTheme !== 'dark' ? 'text-blue-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 2. Confidentialité & contacts */}
                  <button
                    onClick={() => { setActiveCategory('privacy'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'privacy'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-purple-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'privacy' && resolvedTheme !== 'dark' ? 'text-purple-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.privacy', 'Confidentialité & contacts')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.privacyDesc', 'Qui peut vous contacter, visibilité')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'privacy' && resolvedTheme !== 'dark' ? 'text-purple-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 3. Sécurité & sessions */}
                  <button
                    onClick={() => { setActiveCategory('security'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'security'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-emerald-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'security' && resolvedTheme !== 'dark' ? 'text-emerald-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.security', 'Sécurité & sessions')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.securityDesc', 'Mot de passe, 2FA, appareils')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'security' && resolvedTheme !== 'dark' ? 'text-emerald-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 4. Notifications */}
                  <button
                    onClick={() => { setActiveCategory('notifications'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'notifications'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-amber-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'notifications' && resolvedTheme !== 'dark' ? 'text-amber-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.notifications', 'Notifications')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.notificationsDesc', 'Email, push, alertes')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'notifications' && resolvedTheme !== 'dark' ? 'text-amber-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 5. Langue & fuseau horaire */}
                  <button
                    onClick={() => { setActiveCategory('app'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'app'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-blue-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'app' && resolvedTheme !== 'dark' ? 'text-blue-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.app', 'Langue & fuseau horaire')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.appDesc', 'Affichage, fuseau, région')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'app' && resolvedTheme !== 'dark' ? 'text-blue-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 6. Lecture vidéo */}
                  <button
                    onClick={() => { setActiveCategory('video'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'video'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-rose-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
                      <Play className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'video' && resolvedTheme !== 'dark' ? 'text-rose-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.video', 'Lecture vidéo')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.videoDesc', 'Autoplay, qualité, données')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'video' && resolvedTheme !== 'dark' ? 'text-rose-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                  {/* 7. Support & aide */}
                  <button
                    onClick={() => { setActiveCategory('support'); setMobileShowContent(true); }}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      activeCategory === 'support'
                        ? resolvedTheme === 'dark' ? 'bg-zinc-800/80' : 'bg-teal-50/70'
                        : resolvedTheme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-500/10 text-teal-500 dark:bg-teal-500/20 dark:text-teal-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeCategory === 'support' && resolvedTheme !== 'dark' ? 'text-teal-600' : resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('settings.categories.support', 'Support & aide')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.categories.supportDesc', 'Assistance, bug, à propos')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      activeCategory === 'support' && resolvedTheme !== 'dark' ? 'text-teal-600' : resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`} />
                  </button>

                </div>
              </div>

              {/* SECTION: PASSER A PREMIUM (Bannière distincte dorée) */}
              <div
                onClick={() => { setActiveCategory('premium'); setMobileShowContent(true); }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  resolvedTheme === 'dark'
                    ? activeCategory === 'premium'
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-900/20'
                      : 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
                    : activeCategory === 'premium'
                      ? 'bg-amber-50 border-amber-300 shadow-md ring-1 ring-amber-300'
                      : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  resolvedTheme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${resolvedTheme === 'dark' ? 'text-amber-200' : 'text-gray-900'}`}>
                    {t('settings.categories.premium', 'Passer à Premium')}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-amber-300/70' : 'text-amber-800/80'}`}>
                    {t('settings.categories.premiumDesc', 'Débloquez plus de fonctionnalités')}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${resolvedTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>

              {/* SECTION: COMPTE & SÉCURITÉ (Déconnexion) */}
              <div>
                <p className="text-[11px] font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase px-3 mb-2">
                  {t('settings.sections.security', 'Compte & sécurité')}
                </p>
                <div className={`rounded-2xl border overflow-hidden transition-colors ${
                  resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100 shadow-sm'
                }`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors ${
                      resolvedTheme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400">
                      <LogOut className="w-4 h-4 rtl-flip" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 truncate">
                        {t('common.logout', 'Déconnexion')}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.logoutDesc', 'Quitter votre session')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>

            </div>
          </aside>

          {/* ============================================================ */}
          {/* COLONNE DROITE (CONTENU NOBLE) : 7 Cols Tablet, 8-9 Desktop   */}
          {/* ============================================================ */}
          <section className={`md:col-span-7 lg:col-span-8 xl:col-span-9 ${!mobileShowContent ? 'hidden md:block' : 'block'}`}>
            
            {/* Bouton Retour Mobile (uniquement sur petit écran mobile < 768px) */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setMobileShowContent(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-900 text-zinc-200 border border-zinc-800' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-4 h-4 rtl-flip" />
                <span>{t('common.back', 'Retour aux catégories')}</span>
              </button>
            </div>

            {/* Notification de feedback global */}
            {privacyFeedback && (
              <div className="mb-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 text-sm flex items-center gap-2.5 animate-fadeIn">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{privacyFeedback}</span>
              </div>
            )}

            {/* En-tête de section claire et visible */}
            <div className="mb-5 pb-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                  {activeCategory === 'account' && t('settings.categories.account', 'Informations personnelles')}
                  {activeCategory === 'privacy' && t('settings.categories.privacy', 'Confidentialité & contacts')}
                  {activeCategory === 'security' && t('settings.categories.security', 'Sécurité & sessions')}
                  {activeCategory === 'notifications' && t('settings.categories.notifications', 'Notifications')}
                  {activeCategory === 'app' && t('settings.categories.app', 'Langue & fuseau horaire')}
                  {activeCategory === 'video' && t('settings.categories.video', 'Lecture vidéo')}
                  {activeCategory === 'support' && t('settings.categories.support', 'Support & aide')}
                  {activeCategory === 'premium' && t('settings.categories.premium', 'Passer à Premium')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  {activeCategory === 'account' && t('settings.categories.accountDesc', 'Nom, bio, coordonnées et photo de profil')}
                  {activeCategory === 'privacy' && t('settings.categories.privacyDesc', 'Qui peut vous contacter, visibilité et utilisateurs bloqués')}
                  {activeCategory === 'security' && t('settings.categories.securityDesc', 'Mot de passe, 2FA, sessions et appareils connectés')}
                  {activeCategory === 'notifications' && t('settings.categories.notificationsDesc', 'Email, push, sons et alertes en direct')}
                  {activeCategory === 'app' && t('settings.categories.appDesc', 'Langue d’affichage, fuseau horaire et région')}
                  {activeCategory === 'video' && t('settings.categories.videoDesc', 'Lecture automatique, qualité et économiseur de données')}
                  {activeCategory === 'support' && t('settings.categories.supportDesc', 'FAQ, assistance en ligne et conditions d’utilisation')}
                  {activeCategory === 'premium' && t('settings.categories.premiumDesc', 'Débloquez plus de fonctionnalités et monétisez vos lives')}
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* 1. SECTION : COMPTE & PROFIL                                 */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'account' && (
              <div className="space-y-6">
                
                {/* Carte Résumé Profil Pleine Largeur */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {photoPreview ? (
                            <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (profileData.username?.replace('@', '')?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <button
                          onClick={() => setShowPhotoUploadModal(true)}
                          className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border shadow-sm transition-colors ${
                            resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:text-black'
                          }`}
                          title="Changer la photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {profileData.username ? (profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`) : '@utilisateur'}
                        </h2>
                        <p className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {profileData.profession || 'Créateur de contenu'}
                        </p>
                        <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {profileData.city || 'Localisation non définie'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowProfileEditModal(true)}
                      className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors shadow-sm ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
                      }`}
                    >
                      {t('settings.account.editProfileBtn', 'Modifier le profil')}
                    </button>
                  </div>

                  {/* Grille des Actions Compte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    
                    {/* Carte Mot de passe */}
                    <div className={`p-5 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} flex flex-col justify-between space-y-4 shadow-sm`}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <Lock className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`} />
                          <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.account.securityTitle', 'Sécurité du compte')}
                          </h3>
                        </div>
                        <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {t('settings.account.passwordDescClean', 'Mot de passe sécurisé et actif')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                          setPasswordError(null)
                          setPasswordSuccess(null)
                          setShowPassword(false)
                          setShowNewPassword(false)
                          setShowConfirmPassword(false)
                          setShowPasswordModal(true)
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors text-center ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-sm'
                        }`}
                      >
                        {t('settings.account.changePasswordClean', 'Changer le mot de passe')}
                      </button>
                    </div>

                    {/* Carte Adresse Email */}
                    <div className={`p-5 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} flex flex-col justify-between space-y-4 shadow-sm`}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <Mail className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`} />
                          <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.account.emailAssociated', 'Email associé')}
                          </h3>
                        </div>
                        <p className={`text-xs font-medium truncate ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                          {profileData.email && profileData.email.includes('@') && !profileData.email.startsWith('@')
                            ? profileData.email
                            : t('settings.account.noEmailRegistered', 'Non renseigné (Inscription via téléphone)')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewEmail('')
                          setEmailPassword('')
                          setEmailError(null)
                          setEmailSuccess(null)
                          setShowEmailModal(true)
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors text-center ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-sm'
                        }`}
                      >
                        {profileData.email && profileData.email.includes('@') && !profileData.email.startsWith('@')
                          ? t('settings.account.changeEmailClean', "Changer l'email")
                          : t('settings.account.addEmailClean', "Ajouter une adresse email")}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Sektion Passer à Premium (Clean & Minimaliste ekzateman jan nan imaj modèl la) */}
                <div className={`p-5 sm:p-6 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.premium.title', 'Passer à Premium')}
                      </h3>
                      <p className={`text-xs sm:text-sm mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.premium.desc', 'Profitez de fonctionnalités exclusives et d\'une meilleure expérience.')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveCategory('premium'); setMobileShowContent(true); }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap active:scale-95"
                  >
                    {t('settings.premium.viewOffers', 'Voir les offres')}
                  </button>
                </div>

                {/* Zone de Danger (Pleine Largeur) */}
                <div className={`p-5 sm:p-6 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm mt-6`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                        <h3 className="text-sm font-bold">{t('settings.account.dangerZoneClean', 'Zone dangereuse')}</h3>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-200' : 'text-gray-800'}`}>
                          {t('settings.account.deleteAccountTitle', 'Supprimer le compte')}
                        </p>
                        <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {t('settings.account.dangerZoneDescClean', 'Cette action supprime définitivement votre profil, vos vidéos, vos conversations et toutes vos données.')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className={`px-4 py-2 rounded-xl border font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-red-950/40 text-red-400 border-zinc-700 hover:border-red-500/50' : 'bg-white hover:bg-red-50 text-gray-800 hover:text-red-600 border-gray-200 shadow-sm'
                      }`}
                    >
                      {t('settings.account.deleteAccount', 'Supprimer le compte')}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 2. SECTION : CONFIDENTIALITÉ & "QUI PEUT ME CONTACTER ?"     */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'privacy' && (
              <div className="space-y-6">
                
                {/* Bloc Vedette : Qui peut me contacter ? */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.privacy.whoCanContactTitle', 'Qui peut me contacter ?')}
                      </h2>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.whoCanContactDesc', "Définissez qui a le droit d'initier une nouvelle discussion privée avec vous sur Exile")}
                      </p>
                    </div>
                  </div>

                  {/* 4 Options interactives sous forme de cartes radio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
                    
                    {/* Option 1 : Tout le monde */}
                    <div
                      onClick={() => {
                        setWhoCanContact('everyone');
                        handleUpdatePrivacySetting('who_can_contact', 'everyone');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        whoCanContact === 'everyone'
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.privacy.everyone', 'Tout le monde')}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${whoCanContact === 'everyone' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                          {whoCanContact === 'everyone' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className={`text-xs mt-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.everyoneDesc', 'Tous les membres inscrits sur Exile peuvent vous envoyer un message direct.')}
                      </p>
                    </div>

                    {/* Option 2 : Abonnés uniquement */}
                    <div
                      onClick={() => {
                        setWhoCanContact('followers');
                        handleUpdatePrivacySetting('who_can_contact', 'followers');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        whoCanContact === 'followers'
                          ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.privacy.followers', 'Mes abonnés uniquement')}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${whoCanContact === 'followers' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'}`}>
                          {whoCanContact === 'followers' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className={`text-xs mt-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.followersDesc', 'Seuls les membres abonnés à votre compte peuvent vous contacter en privé.')}
                      </p>
                    </div>

                    {/* Option 3 : Professionnels vérifiés */}
                    <div
                      onClick={() => {
                        setWhoCanContact('verified_pro');
                        handleUpdatePrivacySetting('who_can_contact', 'verified_pro');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        whoCanContact === 'verified_pro'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.privacy.verifiedPro', 'Professionnels vérifiés')}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${whoCanContact === 'verified_pro' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400'}`}>
                          {whoCanContact === 'verified_pro' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className={`text-xs mt-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.verifiedProDesc', 'Seuls les profils avec un métier/titre vérifié peuvent vous envoyer des messages.')}
                      </p>
                    </div>

                    {/* Option 4 : Personne */}
                    <div
                      onClick={() => {
                        setWhoCanContact('nobody');
                        handleUpdatePrivacySetting('who_can_contact', 'nobody');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        whoCanContact === 'nobody'
                          ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <UserX className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.privacy.nobody', 'Personne (Mode Privé)')}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${whoCanContact === 'nobody' ? 'border-red-500 bg-red-500' : 'border-gray-400'}`}>
                          {whoCanContact === 'nobody' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className={`text-xs mt-2.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.nobodyDesc', 'Bloque la création de toute nouvelle discussion. Vos conversations existantes restent actives.')}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Bloc Visibilité du Profil & Statut en ligne */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5`}>
                  
                  {/* Visibilité en ligne */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div>
                      <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.privacy.onlineStatusTitle', 'Afficher mon statut en ligne')}
                      </span>
                      <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.privacy.onlineStatusDesc', 'Permet à vos contacts de voir si vous êtes actuellement actif sur la plateforme')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !isOnlineVisible;
                        setIsOnlineVisible(next);
                        handleUpdatePrivacySetting('is_online_visible', next);
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${isOnlineVisible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isOnlineVisible ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Visibilité du Profil */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('settings.privacy.profileVisibilityTitle', 'Visibilité globale de votre profil')}
                        </span>
                        <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          Contrôle qui a le droit de voir vos compétences et votre biographie
                        </p>
                      </div>
                      <select
                        value={profileVisibility}
                        onChange={(e) => {
                          const val = e.target.value as ProfileVisibilityOption;
                          setProfileVisibility(val);
                          handleUpdatePrivacySetting('profile_visibility', val);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="public">{t('settings.privacy.public', 'Public (Visible par tous les visiteurs et membres)')}</option>
                        <option value="members">{t('settings.privacy.members', 'Membres uniquement (Accessible après connexion)')}</option>
                        <option value="private">{t('settings.privacy.private', 'Privé (Visible uniquement par vos relations mutuelles)')}</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Bloc Utilisateurs Bloqués (100% Réel) */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <UserX className="w-5 h-5 text-red-500" />
                      <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.privacy.blockedUsersTitle', 'Utilisateurs bloqués')} ({blockedUsers.length})
                      </h3>
                    </div>
                  </div>

                  {loadingBlocked ? (
                    <div className="py-6 flex items-center justify-center text-xs text-zinc-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading', 'Chargement en cours...')}</span>
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <div className={`p-4 rounded-xl text-center text-xs ${resolvedTheme === 'dark' ? 'bg-zinc-800/30 text-zinc-400' : 'bg-gray-50 text-gray-500'}`}>
                      {t('settings.privacy.noBlocked', 'Aucun utilisateur bloqué dans votre liste')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map((item) => {
                        const target = item.blocked || (item as any).blocked_user || {}
                        const targetId = target.id || item.id
                        const targetName = target.full_name || target.username || 'Utilisateur'
                        const targetUsername = target.username || 'utilisateur'
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-zinc-700/20"
                          >
                            <div>
                              <p className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {targetName}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                @{targetUsername}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnblockUser(targetId)}
                              disabled={unblockingId === targetId}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs transition-colors"
                            >
                              {unblockingId === targetId ? t('common.loading', 'Déblocage...') : t('settings.privacy.unblock', 'Débloquer')}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 3. SECTION : SÉCURITÉ & SESSIONS ACTIVES                     */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'security' && (
              <div className="space-y-6">
                
                {/* 2FA */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800/60">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.security.authProtection', 'Authentification & Protection')}
                      </h2>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.security.authProtectionDesc', "Renforcez l'accès à votre compte professionnel")}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.security.twoFactor', 'Double authentification (2FA)')}
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                            twoFactorEnabled 
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {twoFactorEnabled ? t('settings.security.twoFactorActive', '2FA Activée') : t('settings.security.twoFactorInactive', '2FA Désactivée')}
                          </span>
                        </div>
                        <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {twoFactorEnabled 
                            ? (twoFactorMethod === 'totp' ? t('settings.security.twoFactorMethodTotp', 'Protégé via application d’authentification (TOTP Google / Authy).') : t('settings.security.twoFactorMethodEmail', 'Protégé via code de vérification par email.'))
                            : t('settings.security.twoFactorDesc', 'Exige un code de sécurité supplémentaire lors de toute nouvelle tentative de connexion.')}
                        </p>
                      </div>

                      {twoFactorEnabled ? (
                        <button
                          onClick={() => {
                            setTwoFactorDisablePassword('')
                            setTwoFactorDisableError(null)
                            setShow2FADisableModal(true)
                          }}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs transition-colors whitespace-nowrap"
                        >
                          {t('settings.security.twoFactorDisableBtn', 'Désactiver la 2FA')}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setTwoFactorSetupStep('choose')
                            setTwoFactorSetupError(null)
                            setTwoFactorSetupSuccess(null)
                            setTwoFactorSetupCode('')
                            setTwoFactorSetupData(null)
                            setShow2FASetupModal(true)
                          }}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>{t('settings.security.twoFactorEnableBtn', 'Activer la 2FA')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sessions Réelles */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                      <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.security.sessionsTitle', 'Sessions actives et appareils')} ({activeSessions.length})
                      </h3>
                    </div>
                    <button
                      onClick={loadSessions}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('settings.security.refresh', 'Actualiser')}</span>
                    </button>
                  </div>

                  {sessionFeedback && (
                    <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      sessionFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}>
                      {sessionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <span>{sessionFeedback.message}</span>
                    </div>
                  )}

                  {loadingSessions ? (
                    <div className="py-6 flex items-center justify-center text-xs text-zinc-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading', 'Vérification des sessions actives...')}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${session.current ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                            <div>
                              <p className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {session.device} {session.current && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">{t('settings.security.thisDevice', 'Cet appareil')}</span>}
                              </p>
                              <p className={`text-[11px] mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                IP : {session.ip} • {session.location} • {session.last_active}
                              </p>
                            </div>
                          </div>

                          {!session.current && (
                            <button
                              onClick={() => handleRevokeSession(session.id, session.device)}
                              disabled={revokingSessionId === session.id}
                              className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              title="Déconnecter cet appareil"
                            >
                              {revokingSessionId === session.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <LogOut className="w-3.5 h-3.5 rtl-flip" />
                              )}
                              <span>Déconnecter</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mot de passe et Sécurité */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('settings.security.passwordSecurityTitle', 'Mot de passe du compte')}
                        </h3>
                        <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {t('settings.security.passwordSecurityDesc', 'Votre mot de passe actuel reste strictement confidentiel et masqué par mesure de sécurité.')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError(null)
                        setPasswordSuccess(null)
                        setShowPassword(false)
                        setShowNewPassword(false)
                        setShowConfirmPassword(false)
                        setShowPasswordModal(true)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap"
                    >
                      {t('settings.account.changePassword', 'Changer le mot de passe')}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 4. SECTION : NOTIFICATIONS                                   */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'notifications' && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
                  <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.notifications.title', 'Préférences de Notifications')}
                    </h2>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.notifications.subtitle', 'Choisissez comment vous souhaitez être informé des activités')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div>
                      <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.email', 'Notifications par email')}</span>
                      <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{t('settings.notifications.emailDesc', 'Recevoir des alertes et récapitulatifs par email via le service Resend')}</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotification('email', !notificationSettings.email)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${notificationSettings.email ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.email ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div>
                      <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.push', 'Notifications push')}</span>
                      <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{t('settings.notifications.pushDesc', 'Recevoir des alertes directes sur votre navigateur ou appareil')}</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotification('push', !notificationSettings.push)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${notificationSettings.push ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.push ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div>
                      <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.inApp', 'Notifications in-app')}</span>
                      <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{t('settings.notifications.inAppDesc', "Pastilles et bannières directement affichées dans l'application Exile")}</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotification('inApp', !notificationSettings.inApp)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${notificationSettings.inApp ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.inApp ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 5. SECTION : PRÉFÉRENCES DE L'APPLICATION                    */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'app' && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
                  <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Préférences Régionales & Thème
                    </h2>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Personnalisez l'affichage visuel et la langue de l'application
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Thème */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <span className={`text-sm font-bold block mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.app.themeTitle', "Apparence de l'interface")}
                    </span>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="dark">{t('settings.app.themeDark', '🌙 Thème Sombre')}</option>
                      <option value="light">{t('settings.app.themeLight', '☀️ Thème Clair')}</option>
                      <option value="auto">{t('settings.app.themeAuto', '💻 Thème Système Automatique')}</option>
                    </select>
                  </div>

                  {/* Langue (10 Langues officielles) */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.app.languageTitle', 'Langue de la plateforme')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                        10 Langues
                      </span>
                    </div>
                    <select
                      value={i18n.language || appSettings.language}
                      onChange={(e) => handleUpdateLanguage(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    <p className={`text-[11px] mt-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.app.languageDesc', "Bascule instantanément toute l'interface dans la langue sélectionnée")}
                    </p>
                  </div>

                  {/* Fuseau horaire */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20 md:col-span-2">
                    <span className={`text-sm font-bold block mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.app.timezoneTitle', 'Fuseau horaire')}
                    </span>
                    <select
                      value={appSettings.timezone}
                      onChange={(e) => handleUpdateTimezone(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="America/New_York">America/New_York (Port-au-Prince / Haïti / Est US - UTC-5)</option>
                      <option value="Europe/Paris">Europe/Paris (France / Europe centrale - UTC+1)</option>
                      <option value="America/Montreal">America/Montreal (Canada - UTC-5)</option>
                      <option value="America/Santo_Domingo">America/Santo_Domingo (République Dominicaine - UTC-4)</option>
                      <option value="America/Sao_Paulo">America/Sao_Paulo (Brésil - UTC-3)</option>
                      <option value="Europe/Berlin">Europe/Berlin (Allemagne - UTC+1)</option>
                      <option value="Asia/Dubai">Asia/Dubai (Émirats Arabes Unis - UTC+4)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (Chine - UTC+8)</option>
                      <option value="Europe/Moscow">Europe/Moscow (Russie - UTC+3)</option>
                      <option value="Europe/Rome">Europe/Rome (Italie - UTC+1)</option>
                    </select>
                    <p className={`text-[11px] mt-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.app.timezoneDesc', 'Synchronise les heures de publication et les notifications avec votre région')}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 6. SECTION : LECTURE VIDÉO                                   */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'video' && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.video.title', "Lecture Vidéo sur l'Accueil")}
                    </h2>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.video.subtitle', "Configurez l'autoplay et la rotation automatique des extraits")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                  <div>
                    <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.video.autoplay', 'Activer la lecture aléatoire')}
                    </span>
                    <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.video.autoplayDesc', "Les vidéos joueront automatiquement sans son lors du défilement de l'accueil")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = !videoPreviewEnabled
                      setVideoPreviewEnabled(updated)
                      setPrivacyFeedback(updated ? 'Lecture automatique des vidéos activée' : 'Lecture automatique des vidéos désactivée')
                      setTimeout(() => setPrivacyFeedback(null), 3000)
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${videoPreviewEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${videoPreviewEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {videoPreviewEnabled && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                    <label className={`block text-xs sm:text-sm font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.video.interval', 'Intervalle de rotation automatique (secondes)')}
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={autoplayInterval}
                      onChange={(e) => setAutoplayInterval(Math.max(3, Math.min(30, parseInt(e.target.value) || 5)))}
                      className={`w-full max-w-xs px-3.5 py-2 rounded-xl border text-sm ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <p className={`text-[11px] mt-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.video.intervalDesc', `Les vidéos changeront toutes les ${autoplayInterval} secondes`)}
                    </p>
                  </div>
                )}

                {/* Économiseur de données (Data Saver) */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20">
                  <div className="space-y-0.5">
                    <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.video.dataSaver', 'Économiseur de données (Data Saver)')}
                    </span>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('settings.video.dataSaverDesc', 'Ajuste automatiquement la qualité de la vidéo pour réduire la consommation de votre forfait internet')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = !videoDataSaver
                      setVideoDataSaver(updated)
                      setPrivacyFeedback(updated ? 'Économiseur de données activé' : 'Économiseur de données désactivé')
                      setTimeout(() => setPrivacyFeedback(null), 3000)
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${videoDataSaver ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${videoDataSaver ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Wi-Fi / Données Mobiles */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-zinc-700/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.video.networkMode', 'Lecture réseau : Wi-Fi / Données mobiles')}
                    </span>
                  </div>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {t('settings.video.networkModeDesc', 'Définissez sur quel type de connexion autoriser le streaming en direct et la haute définition.')}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div
                      onClick={() => {
                        setVideoNetworkMode('all')
                        setPrivacyFeedback('Lecture autorisée sur Wi-Fi et données mobiles')
                        setTimeout(() => setPrivacyFeedback(null), 3000)
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        videoNetworkMode === 'all'
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800/60' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Wi-Fi + Données mobiles
                        </span>
                        <span className="text-[10px] text-zinc-400">Aucune restriction réseau</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${videoNetworkMode === 'all' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                        {videoNetworkMode === 'all' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setVideoNetworkMode('wifi_only')
                        setPrivacyFeedback('Lecture haute qualité limitée au Wi-Fi uniquement')
                        setTimeout(() => setPrivacyFeedback(null), 3000)
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        videoNetworkMode === 'wifi_only'
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800/60' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Wi-Fi uniquement
                        </span>
                        <span className="text-[10px] text-zinc-400">Économise vos mégabytes mobiles</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${videoNetworkMode === 'wifi_only' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                        {videoNetworkMode === 'wifi_only' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 7. SECTION : SUPPORT & AIDE                                  */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'support' && (
              <div className="space-y-6">
                {/* 1. Header Banner Help Center avec Barre de Recherche style Facebook */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800' : 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-blue-100'} border rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden`}>
                  <div className="relative z-10 max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <HelpCircle className="w-4 h-4" />
                      <span>{t('settings.helpCenter.badge', "Centre d'Assistance EXILE")}</span>
                    </div>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('settings.helpCenter.searchTitle', 'Comment pouvons-nous vous aider ?')}
                    </h2>
                    <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                      {t('settings.helpCenter.searchSubtitle', 'Recherchez une solution, explorez nos guides détaillés ou contactez notre équipe.')}
                    </p>

                    {/* Barre de Recherche */}
                    <div className="pt-2">
                      <div className="relative max-w-xl mx-auto">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={supportSearchQuery}
                          onChange={(e) => setSupportSearchQuery(e.target.value)}
                          placeholder={t('settings.helpCenter.searchPlaceholder', "Rechercher un sujet (ex: Natcash, nom d'utilisateur, bug, mot de passe...)")}
                          className={`w-full pl-12 pr-10 py-3.5 rounded-2xl border text-sm font-medium transition-all shadow-sm ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-800/90 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:bg-zinc-800'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                          }`}
                        />
                        {supportSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSupportSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Grille des Catégories d'Aide (Style Facebook Help Topics) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'account',
                      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
                      title: t('settings.helpCenter.catAccount', 'Compte & Sécurité'),
                      desc: t('settings.helpCenter.catAccountDesc', "Nom d'utilisateur (règle des 30j), mot de passe, 2FA et connexion.")
                    },
                    {
                      id: 'payments',
                      icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
                      title: t('settings.helpCenter.catPayments', 'Paiements & Natcash'),
                      desc: t('settings.helpCenter.catPaymentsDesc', 'Validation Natcash 4h (2,895 HTG), abonnement Premium et reçus.')
                    },
                    {
                      id: 'videos',
                      icon: <Video className="w-5 h-5 text-orange-500" />,
                      title: t('settings.helpCenter.catVideos', 'Vidéos & Visibilité'),
                      desc: t('settings.helpCenter.catVideosDesc', "Formats, feed, droits d'auteur et affichage de vos publications.")
                    },
                    {
                      id: 'events',
                      icon: <Clock className="w-5 h-5 text-purple-500" />,
                      title: t('settings.helpCenter.catEvents', 'Événements & Lives'),
                      desc: t('settings.helpCenter.catEventsDesc', 'Billetterie, webinaires, salons live et participation en direct.')
                    },
                    {
                      id: 'privacy',
                      icon: <Shield className="w-5 h-5 text-cyan-500" />,
                      title: t('settings.helpCenter.catPrivacy', 'Confidentialité & Blocages'),
                      desc: t('settings.helpCenter.catPrivacyDesc', 'Visibilité en ligne, qui peut vous contacter et modération.')
                    },
                    {
                      id: 'report',
                      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                      title: t('settings.helpCenter.catReport', 'Signalements & Bugs'),
                      desc: t('settings.helpCenter.catReportDesc', 'Transmettre un problème technique ou signaler un comportement abusif.')
                    }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedHelpCategory(selectedHelpCategory === cat.id ? null : cat.id)
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedHelpCategory === cat.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-500/5'
                          : resolvedTheme === 'dark'
                            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800">
                          {cat.icon}
                        </div>
                        <h4 className={`text-sm font-bold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {cat.title}
                        </h4>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {cat.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* 3. Section FAQ (Questions Fréquentes - Accordéon interactif) */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('settings.helpCenter.faqTitle', 'Questions fréquentes (FAQ)')}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">EXILE Help</span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                    {[
                      {
                        q: t('settings.faq.q1', "Comment puis-je modifier mon nom d'utilisateur ?"),
                        a: t('settings.faq.a1', "Vous pouvez mettre à jour votre nom d’utilisateur dès la création de votre compte dans Paramètres > Compte & Profil. Conformément à nos règles de sécurité, vous pouvez le modifier une seule fois tous les 30 jours civils."),
                        cat: 'account'
                      },
                      {
                        q: t('settings.faq.q2', 'Comment fonctionne le paiement manuel par Natcash ?'),
                        a: t('settings.faq.a2', "Effectuez un transfert de 2,895 HTG ($20 USD) au numéro EXILE PLATEFORME via *202# ou l'app Natcash. Soumettez votre numéro et l'ID de transaction. Notre équipe valide votre compte Premium en 4 heures maximum."),
                        cat: 'payments'
                      },
                      {
                        q: t('settings.faq.q3', "Pourquoi une vidéo partagée n'apparaît pas dans mon fil ?"),
                        a: t('settings.faq.a3', "Vérifiez que votre vidéo est bien publique et que l'envoi s'est terminé avec succès. Vous pouvez retrouver toutes vos vidéos publiées et brouillons dans la section \"Mes Vidéos\"."),
                        cat: 'videos'
                      },
                      {
                        q: t('settings.faq.q4', 'Qui a accès à mon profil public ?'),
                        a: t('settings.faq.a4', "Votre profil public affiche uniquement votre identifiant (@nom_utilisateur), vos compétences, votre biographie et vos vidéos publiques. Votre nom et prénom réels ne sont jamais divulgués."),
                        cat: 'privacy'
                      },
                      {
                        q: t('settings.faq.q5', 'Comment signaler un bug ou problème sur la plateforme ?'),
                        a: t('settings.faq.a5', "Cliquez sur le bouton \"Signaler un bug technique\" ci-dessous pour transmettre une capture d'écran et un descriptif directement à nos ingénieurs."),
                        cat: 'report'
                      }
                    ]
                      .filter(item => {
                        if (selectedHelpCategory && item.cat !== selectedHelpCategory) return false
                        if (supportSearchQuery) {
                          const sq = supportSearchQuery.toLowerCase()
                          return item.q.toLowerCase().includes(sq) || item.a.toLowerCase().includes(sq)
                        }
                        return true
                      })
                      .map((faq, idx) => {
                        const isOpen = expandedFaq === idx
                        return (
                          <div key={`faq-${idx}`} className="py-3.5">
                            <button
                              type="button"
                              onClick={() => setExpandedFaq(isOpen ? null : idx)}
                              className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                            >
                              <span className={`text-sm font-semibold transition-colors ${
                                isOpen ? 'text-blue-600 dark:text-blue-400' : resolvedTheme === 'dark' ? 'text-zinc-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black'
                              }`}>
                                {faq.q}
                              </span>
                              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-blue-500' : 'text-gray-400'
                              }`} />
                            </button>
                            {isOpen && (
                              <div className="pt-2.5 pr-6 animate-fadeIn">
                                <p className={`text-xs sm:text-sm leading-relaxed ${
                                  resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                                }`}>
                                  {faq.a}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* 4. Cartes d'actions rapides (Signaler un Bug & À Propos) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBugSubject('')
                      setBugDescription('')
                      setBugError(null)
                      setBugSuccess(null)
                      setShowBugModal(true)
                    }}
                    className={`p-4 rounded-2xl border flex items-center justify-between text-left transition-all group cursor-pointer ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-amber-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('settings.support.reportBug', 'Signaler un bug technique')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          {t('settings.support.reportBugDesc', "Rapport direct vers l'équipe technique")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/about')}
                    className={`p-4 rounded-2xl border flex items-center justify-between text-left transition-all group cursor-pointer ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 hover:border-blue-500/50 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('settings.support.about', "À propos d'EXILE")}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          {t('settings.support.aboutDesc', 'Vision, fondation et mission de la plateforme')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 8. SECTION : PASSER À PREMIUM (OFFRES, GESTION & PAIEMENTS)  */}
            {/* ------------------------------------------------------------ */}
            {activeCategory === 'premium' && (
              <div className="space-y-6">
                
                {/* 1. Carte Plan Actuel & Statut */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 text-amber-400' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('settings.premium.currentPlanTitle', 'Plan actuel')}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                            FREE — $0/mois
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          Pou tout moun kòmanse sou EXILE. Accès aux fonctionnalités de base.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const elem = document.getElementById('pro-plan-card')
                        elem?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-center"
                    >
                      {t('settings.premium.upgradeBtn', 'Passer à PRO ($25/mois)')}
                    </button>
                  </div>

                  {/* Renouvellement & Gestion */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className={`p-4 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-zinc-800/30 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                      <span className="text-xs text-zinc-400 block font-medium">Renouvellement automatique</span>
                      <span className={`text-sm font-bold mt-1 block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Non applicable (Plan Gratuit)
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-1">Aucune carte bancaire n'est débitée pour le plan Free.</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-zinc-800/30 border-zinc-800' : 'bg-gray-50 border-gray-200'} flex flex-col justify-between`}>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Gestion de l'abonnement</span>
                        <span className={`text-sm font-bold mt-1 block ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Actif à vie
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSettingsAlert({
                            title: 'Plan Gratuit',
                            message: "Vous êtes actuellement sur le plan gratuit. Aucun abonnement payant n'est en cours à résilier.",
                            type: 'info'
                          })
                        }}
                        className="text-[11px] text-red-500 hover:text-red-400 font-semibold text-left mt-2"
                      >
                        {t('settings.premium.cancelSubscription', 'Cancel subscription (Résilier)')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Comparatif des 2 Offres : FREE vs PRO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* CARTE 1 : FREE — $0/mois */}
                  <div className={`p-6 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm flex flex-col justify-between space-y-6`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t('settings.premium.forStarting', 'Pou kòmanse')}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {t('settings.premium.activePlan', 'Plan Aktyèl')}
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-2xl font-black ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          FREE
                        </h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-3xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$0</span>
                          <span className="text-xs text-zinc-400">/ {t('common.month', 'mwa')}</span>
                        </div>
                        <p className={`text-xs mt-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {t('settings.premium.freeDesc', 'Pou tout moun kòmanse sou EXILE.')}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featProfile', 'Pwofil pwofesyonèl')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featPublish', 'Pibliye videyo')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featFollow', 'Swiv pwofesyonèl yo')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featInteract', 'Jèm, kòmantè, pataj')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featMessaging', 'Mesajri')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featCourses', 'Aksè ak kou ak live')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featAds', 'Piblisite EXILE')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featStats', 'Estatistik de baz')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{t('settings.premium.featVisibility', 'Vizibilite nòmal')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 opacity-60">
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="line-through">{t('settings.premium.featBadge', 'Badj verifye')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 opacity-60">
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="line-through">{t('settings.premium.featPromo', 'Pwomosyon peye')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="w-full py-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 font-bold text-xs flex items-center justify-center cursor-default">
                        {t('settings.premium.activePlan', 'Plan Aktyèl')}
                      </span>
                    </div>
                  </div>

                  {/* CARTE 2 : PRO — $20/mois (Featured) */}
                  <div
                    id="pro-plan-card"
                    className={`p-6 rounded-2xl border-2 border-[#FF6B00] ${
                      resolvedTheme === 'dark' ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl shadow-[#FF6B00]/10' : 'bg-gradient-to-b from-white to-orange-50/30 shadow-xl'
                    } flex flex-col justify-between space-y-6 relative overflow-hidden`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                          {t('settings.premium.fullPower', 'Tout Pouvwa')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00] text-white">
                          {t('settings.premium.recommended', 'Rekòmande')}
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-2xl font-black flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          <span>PRO</span>
                          <span className="text-amber-400 text-xl">⭐</span>
                        </h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-3xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$20</span>
                          <span className="text-xs text-zinc-400">/ {t('common.month', 'mwa')}</span>
                        </div>
                        <p className={`text-xs mt-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                          {t('settings.premium.proDesc', 'Pou pwofesyonèl ki vle plis kredibilite ak vizibilite.')}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00]">
                          <Check className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                          <span>{t('settings.premium.allInFree', 'Tout sa ki nan Free')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold">{t('settings.premium.verifiedBadge', 'Badj Pro verifye')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold">{t('settings.premium.noAds', 'San piblisite')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.twoPromos', '2 pwomosyon / semèn')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.advancedStats', 'Estatistik avanse')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.searchPriority', 'Priyorite nan rechèch')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.contentHighlight', 'Mete kontni an valè')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.customLink', 'Lyen pwofesyonèl pèsonalize')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.prioritySupport', 'Sipò priyoritè')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{t('settings.premium.monthlyBonus', '1 bonis vizibilite / mwa')}</span>
                        </div>
                      </div>
                    </div>

                    <PayerPremiumButton montant={20.00} onSuccess={loadNatcashPayments} />
                  </div>

                </div>

                {/* 3. Historique Paiement (Clean Table) */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                    <div>
                      <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Historique paiement
                      </h3>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {t('settings.premium.invoiceDesc', 'Consultez et téléchargez vos factures et transactions passées.')}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800 text-zinc-400' : 'border-gray-200 text-gray-500'}`}>
                          <th className="py-2.5 px-3 font-semibold">{t('settings.premium.tableDate', 'Date')}</th>
                          <th className="py-2.5 px-3 font-semibold">{t('settings.premium.tablePlan', 'Plan')}</th>
                          <th className="py-2.5 px-3 font-semibold">{t('settings.premium.tableAmount', 'Montant')}</th>
                          <th className="py-2.5 px-3 font-semibold">{t('settings.premium.tableStatus', 'Statut')}</th>
                          <th className="py-2.5 px-3 font-semibold text-right">{t('settings.premium.tableInvoice', 'Facture')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Peman Natcash Manyèl soumèt pa itilizatè a */}
                        {natcashPayments.map((np) => (
                          <tr key={`np-${np.id}`} className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800/40 text-zinc-300' : 'border-gray-100 text-gray-700'}`}>
                            <td className="py-3 px-3">
                              {new Date(np.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 font-medium flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                              <span>Natcash (EXILE PRO)</span>
                            </td>
                            <td className="py-3 px-3 font-bold">
                              ${np.amount_usd} ({Number(np.amount_htg).toLocaleString()} HTG)
                            </td>
                            <td className="py-3 px-3">
                              {np.status === 'approved' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                  {t('payment.statusApproved', 'Valide')}
                                </span>
                              ) : np.status === 'rejected' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400">
                                  {t('payment.statusRejected', 'Rejte')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {t('payment.statusPending', 'An atant (Delè 4h)')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-zinc-400 text-xs">
                              {np.transaction_id}
                            </td>
                          </tr>
                        ))}

                        <tr className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800/40 text-zinc-300' : 'border-gray-100 text-gray-700'}`}>
                          <td className="py-3 px-3">{t('settings.premium.registration', 'Inscription')}</td>
                          <td className="py-3 px-3 font-medium">FREE Plan</td>
                          <td className="py-3 px-3 font-bold">$0.00</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                              {t('settings.premium.free', 'Gratuit')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-400">
                            —
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </section>

        </div>
      </main>

      {/* ================================================================== */}
      {/* MODALES D'ACTION SÉCURISÉES ET 100% CONNECTÉES À LA BASE DE DONNÉES */}
      {/* ================================================================== */}

      {/* 1. Modal Mot de Passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('settings.account.changePasswordTitle', 'Modifier le mot de passe')}</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.account.currentPasswordPlaceholder', 'Mot de passe actuel')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.account.newPasswordPlaceholder', 'Nouveau mot de passe (min 8 car.)')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.account.confirmPasswordPlaceholder', 'Confirmer le nouveau mot de passe')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('common.confirm', 'Confirmer')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Changement Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {profileData.email && profileData.email.includes('@') && !profileData.email.startsWith('@')
                  ? t('settings.account.modifyEmail', "Modifier l'adresse email")
                  : t('settings.account.addEmailTitle', "Ajouter une adresse email")}
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <span className="block text-xs font-semibold mb-1 text-zinc-400">
                  {t('settings.account.currentEmailLabel', 'Adresse email actuelle')}
                </span>
                <p className={`text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl border ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}>
                  {profileData.email && profileData.email.includes('@') && !profileData.email.startsWith('@')
                    ? profileData.email
                    : t('settings.account.noEmailRegistered', 'Aucune adresse email enregistrée')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('settings.account.newEmailLabel', 'Nouvelle adresse email')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('settings.account.newEmailPlaceholder', 'nom@exemple.com')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('settings.account.passwordConfirmLabel', 'Mot de passe de confirmation')}
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={t('settings.account.passwordConfirmPlaceholder', 'Votre mot de passe pour valider')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleEmailChange}
                disabled={emailLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('common.save', 'Enregistrer')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Suppression de Compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <h3 className="text-lg font-bold text-red-500">{t('settings.account.deleteAccount', 'Supprimer définitivement mon compte')}</h3>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
              Cette action est <strong>irréversible</strong>. Toutes vos données associées à ce compte seront effacées de la base de données.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Entrez votre mot de passe pour confirmer"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('common.delete', 'Supprimer définitivement')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Modifier le Profil */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Modifier les informations de profil</h3>
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 flex items-center justify-between">
                  <span>{t('settings.account.usernameLabel', "Nom d'utilisateur")}</span>
                  {!canModifyUsername(lastUsernameUpdate) ? (
                    <span className="text-[11px] text-amber-500 font-medium">
                      {t('settings.account.usernameLockNotice', 'Modifiable dans {{days}} jours (règle des 30 jours)', { days: daysUntilUsernameUpdate() })}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-500 font-medium">
                      {t('settings.account.usernameCanModify', 'Modifiable (1 fois tous les 30 jours)')}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={profileData.username?.replace(/^@/, '') || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
                      setProfileData({ ...profileData, username: `@${val}` })
                    }}
                    disabled={!canModifyUsername(lastUsernameUpdate)}
                    placeholder="nom_utilisateur"
                    className={`w-full pl-8 pr-3.5 py-2 rounded-xl border text-sm font-medium ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {t('settings.account.usernameHelp', 'Votre identifiant unique sur EXILE. Visible publiquement.')}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  Titre professionnel
                  {!canModifyProfession(lastProfessionUpdate) && (
                    <span className="ml-2 text-[11px] text-amber-500 font-normal">
                      (Modifiable dans {daysUntilProfessionUpdate()} jours)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={profileData.profession}
                  onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
                  disabled={!canModifyProfession(lastProfessionUpdate)}
                  placeholder="Ex : Réalisateur, Développeur..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  } disabled:opacity-60`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Biographie</label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Présentez-vous en quelques lignes..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ville</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pays</label>
                <input
                  type="text"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Site web</label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowProfileEditModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleProfileEdit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                {t('common.save', 'Sauvegarder')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Photo de Profil */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Modifier l'avatar officiel</h3>
              <button
                onClick={() => setShowPhotoUploadModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center py-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 border-2 border-blue-500/40 flex items-center justify-center shadow-lg mb-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-10 h-10 text-zinc-500" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 text-xs font-semibold transition-colors"
              >
                Choisir une image depuis l'appareil
              </button>
              <p className="text-[11px] text-zinc-500 mt-2">Formats : JPG, PNG, WEBP (Max 5 Mo)</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoUploadModal(false)
                  setUploadedPhoto('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handlePhotoSave}
                disabled={!uploadedPhoto}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Configuration 2FA */}
      {show2FASetupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-700/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold">
                  {t('settings.security.twoFactorModalTitle', 'Configuration de la Double Authentification')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShow2FASetupModal(false)
                  setTwoFactorSetupStep('choose')
                  setTwoFactorSetupData(null)
                  setTwoFactorSetupError(null)
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {twoFactorSetupError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{twoFactorSetupError}</span>
              </div>
            )}

            {twoFactorSetupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{twoFactorSetupSuccess}</span>
              </div>
            )}

            {twoFactorSetupStep === 'choose' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  {t('settings.security.twoFactorModalDesc', 'Choisissez votre méthode de double authentification :')}
                </p>

                {/* Option TOTP */}
                <button
                  type="button"
                  onClick={() => handleStart2FASetup('totp')}
                  disabled={twoFactorSetupLoading}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 hover:border-blue-500 ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800/40 border-zinc-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold block">Application d'authentification</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">Recommandé</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Google Authenticator, Authy, 1Password (100% gratuit, sécurisé et instantané)
                    </p>
                  </div>
                </button>

                {/* Option Email */}
                <button
                  type="button"
                  onClick={() => handleStart2FASetup('email')}
                  disabled={twoFactorSetupLoading}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 hover:border-blue-500 ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800/40 border-zinc-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold block">Code de vérification par Email</span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Reçoit un code temporaire à 6 chiffres sur votre adresse email enregistrée
                    </p>
                  </div>
                </button>

                {twoFactorSetupLoading && (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-blue-500 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configuration en cours...</span>
                  </div>
                )}
              </div>
            )}

            {twoFactorSetupStep === 'verify' && (
              <div className="space-y-4">
                {twoFactorMethod === 'totp' ? (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-zinc-400">
                        {t('settings.security.twoFactorScanQR', '1. Scannez ce QR Code avec Google Authenticator ou Authy :')}
                      </p>
                      <p className="text-[11px] text-emerald-500 font-medium">
                        100% Gratuit, instantané et hautement sécurisé
                      </p>
                    </div>

                    {twoFactorSetupData?.qr_code && (
                      <div className="p-3 rounded-xl bg-white flex items-center justify-center mx-auto max-w-[190px] shadow-md border border-gray-200">
                        <img
                          src={twoFactorSetupData.qr_code}
                          alt="QR Code 2FA"
                          className="w-40 h-40 object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {twoFactorSetupData?.secret && (
                      <div>
                        <span className="block text-[11px] text-zinc-400 mb-1">
                          {t('settings.security.twoFactorSecretKey', 'Ou saisissez manuellement cette clé secrète :')}
                        </span>
                        <div className={`flex items-center justify-between p-2.5 rounded-xl border font-mono text-xs ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-gray-100 border-gray-200 text-gray-800'
                        }`}>
                          <span className="truncate mr-2 font-bold tracking-wider">{twoFactorSetupData.secret}</span>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-blue-500 transition-colors flex items-center gap-1 text-[11px]"
                            title="Copier la clé"
                          >
                            {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSecret ? 'Copié' : 'Copier'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-1">
                    <p className="font-semibold">Code envoyé par email !</p>
                    <p className="text-zinc-300">
                      Veuillez consulter votre boîte de réception et saisir le code à 6 chiffres reçu pour confirmer l'activation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-zinc-300">
                    {twoFactorMethod === 'totp'
                      ? t('settings.security.twoFactorEnterCode', '2. Entrez le code à 6 chiffres généré :')
                      : 'Entrez le code à 6 chiffres reçu :'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorSetupCode}
                    onChange={(e) => {
                      setTwoFactorSetupCode(e.target.value.replace(/\D/g, ''))
                      setTwoFactorSetupError(null)
                    }}
                    placeholder="123456"
                    className={`w-full py-2.5 px-4 text-center tracking-[0.3em] font-mono text-lg font-bold rounded-xl border ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorSetupStep('choose')
                      setTwoFactorSetupData(null)
                      setTwoFactorSetupError(null)
                      setTwoFactorSetupCode('')
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm2FASetup}
                    disabled={twoFactorSetupLoading || twoFactorSetupCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {twoFactorSetupLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{t('settings.security.twoFactorVerifyBtn', 'Vérifier et Activer')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Modal Désactivation 2FA */}
      {show2FADisableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-700/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-red-500">
                  Désactiver la Double Authentification
                </h3>
              </div>
              <button
                onClick={() => setShow2FADisableModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
              Pour votre sécurité, entrez votre mot de passe pour confirmer la désactivation de la protection 2FA sur votre compte.
            </p>

            {twoFactorDisableError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{twoFactorDisableError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 text-zinc-300">Mot de passe de confirmation</label>
              <input
                type="password"
                value={twoFactorDisablePassword}
                onChange={(e) => {
                  setTwoFactorDisablePassword(e.target.value)
                  setTwoFactorDisableError(null)
                }}
                placeholder="Votre mot de passe actuel"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShow2FADisableModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleDisable2FA}
                disabled={twoFactorDisableLoading || !twoFactorDisablePassword}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {twoFactorDisableLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('settings.security.confirmDisable2FA', 'Confirmer la désactivation')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Signalement de Bug Technique (100% Connecté) */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{t('settings.support.bugModalTitle', 'Signaler un Problème Technique')}</h3>
                  <p className="text-xs text-zinc-400">{t('settings.support.bugModalSubtitle', 'Rapport direct transmis aux ingénieurs EXILE')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBugModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bugError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bugError}</span>
              </div>
            )}

            {bugSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{bugSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">{t('settings.support.bugCategoryLabel', 'Catégorie du problème')}</label>
                <select
                  value={bugCategory}
                  onChange={(e) => setBugCategory(e.target.value as any)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="video">{t('settings.support.bugCatVideo', 'Vidéos / Lecteur multimédia')}</option>
                  <option value="login">{t('settings.support.bugCatLogin', 'Connexion / Sécurité / Authentification')}</option>
                  <option value="audio">{t('settings.support.bugCatAudio', 'Audio / Son des vidéos')}</option>
                  <option value="display">{t('settings.support.bugCatDisplay', 'Affichage / Interface / Langue')}</option>
                  <option value="other">{t('settings.support.bugCatOther', 'Autre dysfonctionnement')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">{t('settings.support.bugSubjectLabel', 'Sujet résumé')}</label>
                <input
                  type="text"
                  value={bugSubject}
                  onChange={(e) => setBugSubject(e.target.value)}
                  placeholder={t('settings.support.bugSubjectPlaceholder', 'Ex: La vidéo ne se charge pas au clic')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">{t('settings.support.bugDescLabel', 'Description détaillée du bug')}</label>
                <textarea
                  rows={4}
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder={t('settings.support.bugDescPlaceholder', "Décrivez ce que vous faisiez et ce qui s'est produit...")}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleSubmitBugReport}
                disabled={bugLoading || !bugSubject.trim() || !bugDescription.trim()}
                className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {bugLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('settings.support.bugSubmitBtn', 'Transmettre le rapport')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DÉCONNEXION */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={t('common.confirmLogoutTitle', 'Déconnexion')}
        message={t('common.confirmLogout', 'Voulez-vous vraiment vous déconnecter de votre compte EXILE ?')}
        confirmText={t('common.logout', 'Se déconnecter')}
        cancelText={t('common.cancel', 'Annuler')}
        type="warning"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          logout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* CONFIRM MODAL: RÉVOQUER SESSION */}
      <ConfirmModal
        isOpen={Boolean(revokeConfirmSession)}
        title={t('settings.security.revokeSessionTitle', "Déconnexion de l'appareil")}
        message={t('settings.security.revokeSessionMsg', `Voulez-vous vraiment déconnecter l'appareil "${revokeConfirmSession?.name || 'Inconnu'}" à distance ?`)}
        confirmText={t('settings.security.disconnect', 'Déconnecter')}
        cancelText={t('common.cancel', 'Annuler')}
        type="warning"
        onConfirm={executeRevokeSession}
        onCancel={() => setRevokeConfirmSession(null)}
      />

      {/* MODAL ALERTE / INFORMATION */}
      <ConfirmModal
        isOpen={Boolean(settingsAlert)}
        title={settingsAlert?.title || t('common.information', 'Information')}
        message={settingsAlert?.message || ''}
        confirmText={t('common.ok', "D'accord")}
        isAlert={true}
        type={settingsAlert?.type || 'info'}
        onConfirm={() => {
          if (settingsAlert?.onConfirm) {
            settingsAlert.onConfirm()
          }
          setSettingsAlert(null)
        }}
      />

    </div>
  )
}

export default Settings
