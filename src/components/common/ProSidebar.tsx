import { useState, useEffect, useRef } from 'react'
import { useLocation, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Home, Calendar, Inbox, Heart
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

export const ProSidebar = (): JSX.Element | null => {
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedTheme, theme, setTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [newRequestsCount, setNewRequestsCount] = useState(0)

  useEffect(() => {
    const checkGlobalUIState = () => {
      const creating = localStorage.getItem('exile_creating_event') === 'true'
      const uploading = localStorage.getItem('exile_uploading_video') === 'true'
      setIsCreatingEvent(creating)
      setIsUploadingVideo(uploading)
    }

    checkGlobalUIState()
    window.addEventListener('storage', checkGlobalUIState)
    
    // Poll localStorage every 100ms to detect changes from same window
    const interval = setInterval(checkGlobalUIState, 100)
    
    return () => {
      window.removeEventListener('storage', checkGlobalUIState)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const loadUnreadRequests = () => {
      const savedRequests = localStorage.getItem('exile_requests')
      if (savedRequests) {
        const requests = JSON.parse(savedRequests)
        const currentUserId = 'current-user-123'
        const pendingCount = requests.filter((r: any) =>
          r.receiverId === currentUserId && r.status === 'pending'
        ).length
        setNewRequestsCount(pendingCount)
      }
    }

    loadUnreadRequests()
    window.addEventListener('storage', loadUnreadRequests)
    return () => window.removeEventListener('storage', loadUnreadRequests)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
  }

  const isManagementPage = [
    '/pro/profile',
    '/pro/dashboard',
    '/pro/statistics',
    '/pro/calendar',
    '/pro/my-videos'
  ].some(path => location.pathname.startsWith(path))

  const isLiveRoom = location.pathname.includes('/live')
  const isPreviewPage = location.pathname.includes('/preview')

  // FIX: Kache ak CSS olye return null pou evite re-render ki redirijte
  const shouldHide = isManagementPage || isLiveRoom || isCreatingEvent || isUploadingVideo || isPreviewPage

  const navItems: NavItem[] = [
    { to: '/pro', label: 'Accueil', icon: Home },
    { to: '/pro/events', label: 'Événements', icon: Calendar },
  ]

  const navItemsRight: NavItem[] = [
    { to: '/pro/requests', label: 'Demandes', icon: Inbox },
    { to: '/pro/subscriptions', label: 'Abonnement', icon: Heart },
  ]

  return (
    <div style={{ display: shouldHide ? 'none' : 'contents' }}>
      {/* Mobile: Bottom navigation */}
      <div className={`md:hidden fixed bottom-4 left-4 right-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl z-[10000] safe-area-pb backdrop-blur-md shadow-lg`}>
        <nav className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/pro'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 min-w-[70px] rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-white'
                    : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}

          {navItemsRight.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 min-w-[70px] rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-white'
                    : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop: Bottom horizontal navigation */}
      <div className={`hidden md:flex fixed bottom-0 left-0 right-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t z-[10000] shadow-lg`}>
        <div className="flex-1 max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center justify-center gap-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/pro'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}

            {navItemsRight.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Side: Theme Toggle only for desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProSidebar