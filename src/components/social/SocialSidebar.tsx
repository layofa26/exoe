import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Building2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const SOCIAL_NAV_ITEMS = [
  { to: '/social', label: 'Accueil', icon: Home, end: true },
  { to: '/social/events', label: 'Événements', icon: Calendar, end: true },
  { to: '/social/institution', label: 'Mon Inst.', icon: Building2, end: true },
  { to: '/social/institution/request', label: 'Créer compte', icon: Building2, end: true },
]

export function SocialSidebar() {
  const { resolvedTheme } = useTheme()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    const checkModalState = () => {
      const modalState = localStorage.getItem('exile_social_modal_open')
      setIsModalOpen(modalState === 'true')
    }

    // Réinitialiser localStorage au chargement pour éviter que le menu reste caché
    localStorage.setItem('exile_social_modal_open', 'false')
    checkModalState()
    window.addEventListener('storage', checkModalState)
    return () => window.removeEventListener('storage', checkModalState)
  }, [])

  // Mobile: Bottom navigation bar (comme ProSidebar)
  // Masquer sur la page /social/plans et /social/institution/request
  if (isMobile && !isModalOpen && !location.pathname.startsWith('/social/plans') && !location.pathname.startsWith('/social/institution/request')) {
    return (
      <div className={`md:hidden fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl z-[10000] safe-area-pb backdrop-blur-md shadow-lg`}>
        <nav className="flex justify-around items-center h-14 sm:h-16 px-2 sm:px-4">
          {SOCIAL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-2 sm:px-3 flex-1 min-w-0 rounded-xl transition-all ${
                  isActive
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs mt-1 font-medium truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  // Desktop: Sidebar fixe à gauche
  return (
    <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 w-56 lg:w-64 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-r z-40 flex flex-col`}>
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-social" />
          <span className="font-bold text-base sm:text-lg">EXILE Social</span>
        </div>
        <nav className="space-y-1 sm:space-y-2">
          {SOCIAL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark'
                    ? 'text-zinc-300 hover:bg-zinc-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default SocialSidebar
