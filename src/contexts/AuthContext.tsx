import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import type {
  User,
  AuthContextType,
  LoginResult,
  RegisterResult,
  ProRegistrationData,
  InstitutionStep1,
  InstitutionStep2
} from '../types'
import { useNotifications } from './NotificationContext'
import { authApi } from '../services/authApi'

// Clear all old data on login
const clearOldData = () => {
  // Clear specific keys that might contain old user data
  const keysToClear = [
    'exile_uploading_video',
    'exile_video_player_active',
    'exile_mobile_search_active',
    'exile_draft_data',
    'exile_liked_videos',
    'exile_disliked_videos',
    'exile_saved_videos',
    'exile_subscriptions',
    'exile_requests',
    'exile_user_id'
  ]

  keysToClear.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Failed to clear ${key}:`, e)
    }
  })

  // Clear sessionStorage
  try {
    sessionStorage.clear()
  } catch (e) {
    console.warn('Failed to clear sessionStorage:', e)
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

interface JWTPayload {
  id: string
  user_id?: string
  email: string
  username: string
  full_name?: string
  type: 'PROFESSIONAL' | 'INSTITUTION' | 'ADMIN'
  exp: number
}

import { resolveMediaUrl } from '../utils/mediaUtils'

function resolveAvatarUrl(photo: string | null | undefined): string | undefined {
  if (!photo || typeof photo !== 'string') return undefined
  const clean = photo.trim()
  if (!clean || clean === 'null' || clean === 'undefined') return undefined
  const resolved = resolveMediaUrl(clean)
  return resolved || undefined
}


export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const navigate = useNavigate()
  const { showLogoutSuccess } = useNotifications()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfileAvatar = async (tokenStr: string, currentUserId: string | number) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')
      const headers = { Authorization: `Bearer ${tokenStr}` }
      const res = await fetch(`${API_BASE}/profil/profils/me/`, { headers }).catch(() => null)
      let profileData: any = null
      if (res && res.ok) {
        profileData = await res.json()
      } else {
        const res2 = await fetch(`${API_BASE}/profil/profils/`, { headers }).catch(() => null)
        if (res2 && res2.ok) {
          const list = await res2.json()
          const items = Array.isArray(list) ? list : (list.results || [])
          profileData = items.find((p: any) => String(p.user) === String(currentUserId) || String(p.id) === String(currentUserId)) || items[0]
        }
      }

      if (profileData) {
        const rawPhoto = profileData.photo_url || profileData.photo || profileData.avatar
        const avatar = resolveAvatarUrl(rawPhoto)
        if (avatar) {
          setUser(prev => prev ? { ...prev, avatarUrl: avatar, fullName: profileData.full_name || prev.fullName } : prev)
        }
      }
    } catch {}
  }

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      const avatarUrl = e?.detail?.avatarUrl
      if (avatarUrl) {
        setUser(prev => prev ? { ...prev, avatarUrl } : prev)
      }
    }
    window.addEventListener('exile_profile_updated', handleProfileUpdated)
    return () => window.removeEventListener('exile_profile_updated', handleProfileUpdated)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const decoded = jwtDecode<Partial<JWTPayload>>(token)
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          const storedProfile = JSON.parse(
            localStorage.getItem('exile_user_profile') || '{}'
          )
          const userId = decoded.id || decoded.user_id || storedProfile.id || 0
          const avatar = resolveAvatarUrl(storedProfile.photo || storedProfile.avatar_url || storedProfile.avatar)
          const userData: User = {
            id: userId,
            email: decoded.email || storedProfile.email || '',
            username: decoded.username || storedProfile.username || '',
            fullName: decoded.full_name || storedProfile.name || storedProfile.full_name || '',
            avatarUrl: avatar,
            roles: [],
            type: (decoded.type || 'PROFESSIONAL').toLowerCase() as 'professional' | 'institution',
            legacyPro: false,
            institutionPlan: undefined
          }
          setUser(userData)
          setIsAuthenticated(true)
          fetchProfileAvatar(token, userId)
        } else {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      } catch (error) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }, [])

  const completeLoginSession = (access: string, refresh: string, usernameFallback: string): LoginResult => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    
    try {
      const decoded = jwtDecode<any>(access)
      const userId = decoded.user_id || decoded.id || decoded.sub || 0
      const userData: User = {
        id: userId,
        email: decoded.email || '',
        username: decoded.username || usernameFallback,
        fullName: decoded.full_name || '',
        avatarUrl: undefined,
        roles: [],
        type: (decoded.type || 'PROFESSIONAL').toLowerCase() as 'professional' | 'institution',
        legacyPro: false,
        institutionPlan: undefined
      }
      setUser(userData)
      setIsAuthenticated(true)

      clearOldData()
      fetchProfileAvatar(access, userId)

      const userProfileData = {
        id: userData.id,
        name: userData.fullName || '',
        username: userData.username,
        email: userData.email,
        profession: '',
        speciality: '',
        photo: null
      }
      localStorage.setItem('exile_user_profile', JSON.stringify(userProfileData))
      navigate('/pro')
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error)
      const userData: User = {
        id: '0',
        email: '',
        username: usernameFallback,
        fullName: '',
        avatarUrl: undefined,
        roles: [],
        type: 'professional',
        legacyPro: false,
        institutionPlan: undefined
      }
      setUser(userData)
      setIsAuthenticated(true)
      clearOldData()
      navigate('/pro')
      return { success: true }
    }
  }

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const result = await authApi.login(username, password)
    
    if ((result as any).requires2FA) {
      return {
        success: false,
        requires2FA: true,
        sessionTemp: (result as any).sessionTemp,
        twoFactorMethod: (result as any).twoFactorMethod,
        emailMasked: (result as any).emailMasked
      }
    }

    if (result.success && result.data) {
      return completeLoginSession(result.data.access, result.data.refresh, username)
    }
    
    return { success: false, error: result.error }
  }

  const verify2FA = async (sessionTemp: string, code: string): Promise<LoginResult> => {
    const result = await authApi.verify2FALogin(sessionTemp, code)
    if (result.success && result.data) {
      return completeLoginSession(result.data.access, result.data.refresh, 'utilisateur')
    }
    return { success: false, error: result.error || 'Code invalide.' }
  }

  const resend2FAOtp = async (sessionTemp: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    return authApi.resend2FAOtp(sessionTemp)
  }

  const registerPro = async (userData: ProRegistrationData): Promise<RegisterResult> => {
    // Prepare data for Django API
    const registerData: any = {
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.password, // Django expects confirm_password
      birth_date: userData.birthDate,
      profession: userData.profession,
    }

    // Only add optional fields if they have values
    if (userData.phone) {
      registerData.phone_number = userData.phone
    }
    if (userData.gender) {
      registerData.gender = userData.gender
    }
    if (userData.specialty) {
      registerData.speciality = userData.specialty
    }
    if (userData.country) {
      registerData.country = userData.country
    }
    if (userData.city) {
      registerData.city = userData.city
    }

    const result = await authApi.register(registerData)
    
    console.log('Résultat inscription:', result)
    
    if (result.success) {
      // After successful registration, automatically login with the username from registration response
      const usernameToUse = result.data?.username || userData.email
      console.log('Tentative de login avec username:', usernameToUse)
      
      const loginResult = await authApi.login(usernameToUse, userData.password)
      console.log('Résultat login après inscription:', loginResult)
      
      if (loginResult.success && loginResult.data) {
        // Store tokens
        localStorage.setItem('accessToken', loginResult.data.access)
        localStorage.setItem('refreshToken', loginResult.data.refresh)
        
        // Decode token to get user info
        try {
          console.log('Token access:', loginResult.data.access)
          const decoded = jwtDecode<any>(loginResult.data.access)
          console.log('Token décodé:', decoded)
          
          // Use a fallback user object if token decoding fails
          const userObj: User = {
            id: decoded.user_id || decoded.id || decoded.sub || 0,
            email: decoded.email || userData.email || '',
            username: decoded.username || usernameToUse || '',
            fullName: userData.fullName || '',
            avatarUrl: undefined,
            roles: [],
            type: (decoded.type || 'PROFESSIONAL').toLowerCase() as 'professional' | 'institution',
            legacyPro: false,
            institutionPlan: undefined
          }
          setUser(userObj)
          setIsAuthenticated(true)

          // Store user profile in localStorage
          localStorage.setItem('exile_user_profile', JSON.stringify({
            id: userObj.id,
            name: userData.fullName || '',
            username: userObj.username,
            email: userObj.email,
            profession: userData.profession || '',
            speciality: userData.specialty || '',
            photo: null
          }))
          
          // Clear old data on successful registration
          clearOldData()
          
          return { success: true }
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error)
          // Even if token decoding fails, still consider login successful
          // and use the data we have
          const userObj: User = {
            id: '0',
            email: userData.email || '',
            username: usernameToUse || '',
            fullName: userData.fullName || '',
            avatarUrl: undefined,
            roles: [],
            type: 'professional',
            legacyPro: false,
            institutionPlan: undefined
          }
          setUser(userObj)
          setIsAuthenticated(true)
          clearOldData()
          return { success: true }
        }
      }

      return {
        success: false,
        error: loginResult.error || 'Compte créé, mais la connexion automatique a échoué. Connectez-vous manuellement.'
      }
    }

    return { success: false, error: result.error }
  }

  const registerInstitution = async (
    _step1Data: InstitutionStep1, 
    _step2Data: InstitutionStep2
  ): Promise<RegisterResult> => {
    try {
      const response = await authApi.registerPro(_step1Data, _step2Data)
      return response
    } catch (error) {
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = (): void => {
    try {
      // Invalider le token JWT côté serveur via la Blacklist
      authApi.logout().catch(e => console.warn('Server logout notice:', e))

      // Clear all authentication tokens from localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')

      // Clear cached user credentials & profile to prevent any invalid network requests
      localStorage.removeItem('exile_cached_avatar')
      localStorage.removeItem('exile_cached_banner')
      localStorage.removeItem('exile_user_profile')
      localStorage.removeItem('exile_user_id')

      // Clear all sessionStorage data
      sessionStorage.clear()

      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      })

      // Notify other components to clear avatar & user info immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exile_profile_updated', { detail: { avatarUrl: null } }))
      }

      // Reset user state
      setUser(null)
      setIsAuthenticated(false)

      // Navigate to login page
      navigate('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('exile_cached_avatar')
      localStorage.removeItem('exile_user_profile')
      sessionStorage.clear()
      setUser(null)
      setIsAuthenticated(false)
      navigate('/login')
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false
  }

  const hasModuleAccess = (module: 'pro' | 'social' | 'funny'): boolean => {
    if (!isAuthenticated) return false
    if (module === 'pro') return hasRole('pro') || hasRole('professional')
    if (module === 'social') return hasRole('social') || hasRole('institution')
    if (module === 'funny') {
      return hasRole('funny') || (hasRole('pro') && !!user?.legacyPro)
    }
    return false
  }

  const canPublishAsInstitution = (): boolean => {
    if (!hasRole('institution')) return false
    const plan = user?.institutionPlan
    return plan !== undefined && plan !== 'verified'
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    verify2FA,
    resend2FAOtp,
    registerPro,
    registerInstitution,
    logout,
    hasRole,
    hasModuleAccess,
    canPublishAsInstitution,
    isVisitor: !isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
