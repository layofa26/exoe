import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { ProtectedRouteProps, User } from '../../types'

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  allowedModules = [] 
}: ProtectedRouteProps): JSX.Element => {
  const { isAuthenticated, loading, hasRole, hasModuleAccess, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check specific roles
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasRole(role))
    if (!hasAllowedRole) {
      return <Navigate to="/" replace />
    }
  }

  // Check module access
  if (allowedModules.length > 0) {
    const hasAllowedModule = allowedModules.some(module => hasModuleAccess(module as 'pro' | 'social' | 'funny'))
    if (!hasAllowedModule) {
      return <Navigate to="/" replace />
    }
  }

  // Special check for institution publishing
  if (allowedModules.includes('social-publish')) {
    const typedUser = user as User | null
    if (!typedUser?.institutionPlan || typedUser.institutionPlan === 'verified') {
      return <Navigate to="/social/plans" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
