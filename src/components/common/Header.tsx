import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import type { NavLinkType } from '../../types'
import {
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Briefcase
} from 'lucide-react'

export const Header = (): JSX.Element => {
  const { isAuthenticated, user, logout, hasModuleAccess } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  // État pour le menu profil
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // État pour les demandes (badge)
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  
  // Charger demandes non lues depuis localStorage
  useEffect(() => {
    const loadUnreadRequests = () => {
      const savedRequests = localStorage.getItem('exile_requests')
      if (savedRequests) {
        const requests = JSON.parse(savedRequests)
        const currentUserId = 'current-user-123' // À remplacer par vraie auth
        const pendingCount = requests.filter((r: any) => 
          r.receiverId === currentUserId && r.status === 'pending'
        ).length
        setNewRequestsCount(pendingCount)
      }
    }

    loadUnreadRequests()
    
    // Écouter changements localStorage
    window.addEventListener('storage', loadUnreadRequests)
    return () => window.removeEventListener('storage', loadUnreadRequests)
  }, [location.pathname]) // Recharger quand on change de page
  
  // État pour le statut en ligne
  const [isOnline, setIsOnline] = useState(true)

  const isActive = (path: string): boolean => location.pathname.startsWith(path)

  const handleLogout = (): void => {
    logout()
    navigate('/')
  }

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Toggle mode sombre
  const toggleDarkMode = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const navLinks: NavLinkType[] = [
    { to: '/pro', label: 'Professionnel', icon: Briefcase, show: true, module: 'pro' },
    { to: '/social', label: 'Social', icon: Building2, show: true, module: 'social' },
  ]

  return (
    <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-[100] w-full">
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Gauche avec flex-1 pour équilibrer */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="flex items-center">
              <img src="/logo_exile_SVG.svg" alt="EXILE" className="w-14 h-14 md:w-12 md:h-12" />
            </Link>
          </div>

          {/* Navigation - Desktop & Mobile - Centrés */}
          <nav className="flex items-center justify-center space-x-4 md:space-x-8">
            {navLinks.map((link) => (
              link.show && (
                <div key={link.to} className="relative group">
                  <Link
                    to={link.disabled ? '#' : link.to}
                    className={`relative py-2 text-xs sm:text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'text-primary'
                        : link.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                    onClick={(e: React.MouseEvent) => link.disabled && e.preventDefault()}
                  >
                    <span className="hidden sm:inline">{link.label}</span>
                    <span className="sm:hidden">{link.label.slice(0, 4)}</span>
                    {isActive(link.to) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                    {link.disabled && (
                      <span className="ml-1 text-xs text-orange-500">(soon)</span>
                    )}
                  </Link>
                  {link.disabled && link.tooltip && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {link.tooltip}
                    </div>
                  )}
                </div>
              )
            ))}
          </nav>

          {/* Right Side - Login/Register buttons only */}
          <div className="flex-1 flex items-center justify-end space-x-1 md:space-x-2">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="hidden sm:block text-xs md:text-sm font-medium text-gray-600 hover:text-primary"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:block text-xs md:text-sm font-medium bg-primary text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg hover:bg-primary/90"
                >
                  Créer un compte
                </Link>
              </div>
            ) : null}

            {/* Mobile Menu Button - Hidden on desktop */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Settings Menu - Mobile Only */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              {!isAuthenticated ? (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Créer un compte
                  </Link>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-sm font-medium text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mon profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
