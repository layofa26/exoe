import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

interface JWTPayload {
  sub: string
  email: string
  username: string
  roles: string[]
  type: 'professional' | 'institution'
  legacyPro?: boolean
  institutionPlan?: string
  exp: number
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token)
        if (decoded.exp * 1000 > Date.now()) {
          const userData: User = {
            id: decoded.sub,
            email: decoded.email,
            username: decoded.username,
            fullName: '',
            roles: decoded.roles,
            type: decoded.type,
            legacyPro: decoded.legacyPro,
            institutionPlan: decoded.institutionPlan as User['institutionPlan']
          }
          setUser(userData)
          setIsAuthenticated(true)
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) throw new Error('Login failed')
      
      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      
      const decoded = jwtDecode<JWTPayload>(data.accessToken)
      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.username,
        fullName: '',
        roles: decoded.roles,
        type: decoded.type,
        legacyPro: decoded.legacyPro,
        institutionPlan: decoded.institutionPlan as User['institutionPlan']
      }
      setUser(userData)
      setIsAuthenticated(true)
      
      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  const registerPro = async (userData: ProRegistrationData): Promise<RegisterResult> => {
    try {
      const response = await fetch('/api/auth/register/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          type: 'professional',
          legacyPro: true,
          funnyAccessDate: null
        })
      })
      
      if (!response.ok) throw new Error('Registration failed')
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  const registerInstitution = async (
    step1Data: InstitutionStep1, 
    step2Data: InstitutionStep2
  ): Promise<RegisterResult> => {
    try {
      const response = await fetch('/api/auth/register/institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...step1Data,
          ...step2Data,
          type: 'institution',
          status: 'pending_verification'
        })
      })
      
      if (!response.ok) throw new Error('Registration failed')
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  const logout = (): void => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false
  }

  const hasModuleAccess = (module: 'pro' | 'social' | 'funny'): boolean => {
    if (!isAuthenticated) return false
    if (module === 'pro') return hasRole('pro') || hasRole('professional')
    if (module === 'social') return hasRole('social') || hasRole('institution')
    if (module === 'funny') {
      return hasRole('funny') || (hasRole('pro') && user?.legacyPro)
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
    registerPro,
    registerInstitution,
    logout,
    hasRole,
    hasModuleAccess,
    canPublishAsInstitution,
    isVisitor: !isAuthenticated || false
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
