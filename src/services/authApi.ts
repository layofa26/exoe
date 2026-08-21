import { LoginResponseSchema, RegisterResponseSchema, ApiErrorSchema } from '../schemas/authSchemas'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const PROD_API_BASE_URL = 'https://exile-backend-9q6o.onrender.com/api/v1'
const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
  ? API_BASE_URL.replace('/api', '/api/v1') 
  : API_BASE_URL
const API_TIMEOUT = 30000 // 30 seconds timeout for better connectivity

// Helper functions for cookie management (for reading httpOnly cookies set by backend)
const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

// For development/fallback only - not httpOnly
const setCookie = (name: string, value: string, days: number = 7): void => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  const cookieValue = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  document.cookie = cookieValue
}

const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

interface LoginResponse {
  access: string
  refresh: string
}

interface RegisterData {
  full_name: string
  username?: string
  email: string
  password: string
  confirm_password: string
  phone_number?: string
  birth_date: string
  profession: string
  speciality?: string
  country?: string
  city?: string
}

interface RegisterResponse {
  id: number
  full_name: string
  username: string
  email: string
  phone_number?: string
  birth_date: string
  profession: string
  speciality?: string
  country?: string
  city?: string
}

interface UserProfile {
  id: number
  full_name: string
  username: string
  email: string
  phone_number?: string
  birth_date: string
  profession: string
  speciality?: string
  country?: string
  city?: string
  last_login_time?: string
  last_login_ip?: string
}

export const authApi = {
  async login(username: string, password: string): Promise<{ success: boolean; error?: string; data?: LoginResponse }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const url = `${FINAL_API_BASE_URL}/users/login/`
      console.log('Tentative de connexion vers:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
        credentials: 'include' // Important for httpOnly cookies
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erreur backend connexion:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        // Handle specific error messages from Django
        if (errorData.detail) {
          return { success: false, error: errorData.detail }
        }
        if (errorData.error) {
          return { success: false, error: errorData.error }
        }
        
        return {
          success: false,
          error: 'Identifiants incorrects'
        }
      }

      const data: LoginResponse = await response.json()
      console.log('Connexion réussie')
      
      // Validate response data with Zod
      const validatedData = LoginResponseSchema.parse(data)
      
      // Tokens are now set as httpOnly cookies by the backend
      // Only store in localStorage as fallback for development
      setCookie('access_token', validatedData.access, 1) // 1 day
      setCookie('refresh_token', validatedData.refresh, 7) // 7 days
      localStorage.setItem('accessToken', validatedData.access) // Fallback
      
      return { success: true, data: validatedData }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Délai de connexion dépassé. Veuillez réessayer.'
        }
      }
      console.error('Erreur de connexion:', error)
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async register(userData: RegisterData): Promise<{ success: boolean; error?: string; data?: RegisterResponse }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const url = `${FINAL_API_BASE_URL}/users/register/`
      console.log('Tentative d\'inscription vers:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erreur backend inscription:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        // Handle specific error messages from Django
        if (errorData.error) {
          return { success: false, error: errorData.error }
        }
        if (errorData.detail) {
          return { success: false, error: errorData.detail }
        }
        if (errorData.password) {
          return { success: false, error: Array.isArray(errorData.password) ? errorData.password[0] : errorData.password }
        }
        if (errorData.email) {
          return { success: false, error: Array.isArray(errorData.email) ? errorData.email[0] : errorData.email }
        }
        if (errorData.phone_number) {
          return { success: false, error: Array.isArray(errorData.phone_number) ? errorData.phone_number[0] : errorData.phone_number }
        }
        if (errorData.birth_date) {
          return { success: false, error: Array.isArray(errorData.birth_date) ? errorData.birth_date[0] : errorData.birth_date }
        }
        if (errorData.non_field_errors) {
          return { success: false, error: Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors }
        }
        
        return {
          success: false,
          error: `Erreur ${response.status}: ${JSON.stringify(errorData)}`
        }
      }

      const data: RegisterResponse = await response.json()
      console.log('Inscription réussie:', data)
      
      // Validate response data with Zod
      const validatedData = RegisterResponseSchema.parse(data)
      
      return { success: true, data: validatedData }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Délai de connexion dépassé. Veuillez réessayer.'
        }
      }
      console.error('Erreur de connexion:', error)
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async getProfile(token: string): Promise<{ success: boolean; error?: string; data?: UserProfile }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la récupération du profil'
        }
      }

      const data: UserProfile = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async refreshToken(refreshToken: string): Promise<{ success: boolean; error?: string; data?: LoginResponse }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors du rafraîchissement du token'
        }
      }

      const data: LoginResponse = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  }
}
