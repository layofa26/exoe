import { LoginResponseSchema, RegisterResponseSchema, ApiErrorSchema } from '../schemas/authSchemas'
import { API_BASE_URL as CONFIG_API_BASE_URL } from '../config/api'

const FINAL_API_BASE_URL = CONFIG_API_BASE_URL.replace(/\/+$/, '')
const API_TIMEOUT = 45000 // 45 seconds timeout (handles Render cold start seamlessly)

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
    const cleanUsername = username.trim()
    const cleanPassword = password

    const doFetch = async (baseUrl: string) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
      try {
        const response = await fetch(`${baseUrl}/users/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
          signal: controller.signal,
          credentials: 'include',
        })
        clearTimeout(timeoutId)
        return response
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    }

    try {
      const response = await doFetch(FINAL_API_BASE_URL)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        let errorMsg = "Identifiants incorrects. Vérifiez votre nom d'utilisateur ou mot de passe."
        if (errorData.detail) {
          errorMsg = Array.isArray(errorData.detail) ? errorData.detail[0] : errorData.detail
        } else if (errorData.error) {
          errorMsg = Array.isArray(errorData.error) ? errorData.error[0] : errorData.error
        } else if (errorData.non_field_errors) {
          errorMsg = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors
        } else if (errorData.password) {
          errorMsg = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
        }

        return { success: false, error: errorMsg }
      }

      const rawData: any = await response.json()

      if (rawData.requires_2fa) {
        return {
          success: true,
          requires2FA: true,
          sessionTemp: rawData.session_temp,
          twoFactorMethod: rawData.two_factor_method || 'totp',
          emailMasked: rawData.email_masked
        }
      }

      const validatedData = LoginResponseSchema.parse(rawData)

      setCookie('access_token', validatedData.access, 1)
      setCookie('refresh_token', validatedData.refresh, 7)
      localStorage.setItem('accessToken', validatedData.access)

      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Délai de connexion dépassé. Le serveur se réveille, veuillez réessayer dans quelques secondes.'
        }
      }
      return {
        success: false,
        error: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.'
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
  },

  async verify2FALogin(sessionTemp: string, code: string): Promise<{ success: boolean; error?: string; data?: LoginResponse }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/2fa/verify-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_temp: sessionTemp, code }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || 'Code de vérification invalide ou expiré.' }
      }

      const validatedData = LoginResponseSchema.parse(data)
      setCookie('access_token', validatedData.access, 1)
      setCookie('refresh_token', validatedData.refresh, 7)
      localStorage.setItem('accessToken', validatedData.access)

      return { success: true, data: validatedData }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async resend2FAOtp(sessionTemp: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/2fa/resend-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_temp: sessionTemp }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || "Erreur lors de l'envoi du code." }
      }
      return { success: true, message: data.message }
    } catch (err) {
      return { success: false, error: 'Erreur réseau.' }
    }
  },

  async setup2FA(method: 'totp' | 'email'): Promise<{ success: boolean; error?: string; data?: any }> {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/2fa/setup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur lors de la configuration de la 2FA.' }
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async confirm2FASetup(code: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/2fa/confirm-setup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || 'Code invalide ou expiré.' }
      }
      return { success: true, message: data.message }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async disable2FA(params: { password?: string; code?: string }): Promise<{ success: boolean; error?: string; message?: string }> {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/2fa/disable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || 'Impossible de désactiver la 2FA.' }
      }
      return { success: true, message: data.message }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async getSessions(): Promise<{ success: boolean; error?: string; sessions?: any[] }> {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/sessions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || 'Impossible de charger les sessions.' }
      }
      return { success: true, sessions: data.sessions || [] }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async revokeSession(sessionId: number): Promise<{ success: boolean; error?: string; message?: string }> {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/sessions/revoke/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || "Impossible de déconnecter l'appareil." }
      }
      return { success: true, message: data.message }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  },

  async logout(): Promise<{ success: boolean; error?: string }> {
    const token = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (token && refreshToken) {
        await fetch(`${FINAL_API_BASE_URL}/users/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        })
      }
      return { success: true }
    } catch (err) {
      return { success: true }
    }
  },

  async confirmChangeEmail(verificationToken: string): Promise<{ success: boolean; error?: string; message?: string; email?: string }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/users/change-email/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationToken })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data.error || "Lien de confirmation invalide ou expiré." }
      }
      return { success: true, message: data.message, email: data.email }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur.' }
    }
  }
}


