import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Calendar,
  Inbox,
  Heart,
  Plus,
  Video as VideoIcon,
  CalendarPlus,
  Radio,
  X,
  Megaphone
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUserId } from '../../services/apiClient'
import { UploadVideo } from '../video/UploadVideo'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const ProSidebar = (): JSX.Element | null => {
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const isDark = resolvedTheme === 'dark'
  
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  const [showMobileActionMenu, setShowMobileActionMenu] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Badge demandes reçues (pending)
  useEffect(() => {
    const loadUnreadRequests = async () => {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) { setNewRequestsCount(0); return }
      const token = localStorage.getItem('accessToken')
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/demandes/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        const raw: any[] = Array.isArray(data) ? data : (data.results || [])
        setNewRequestsCount(raw.filter(r => String(r.receiver?.id || r.receiver_id) === currentUserId && r.status === 'envoye').length)
      } catch { setNewRequestsCount(0) }
    }
    loadUnreadRequests()
  }, [location.pathname])

  const handleNavigate = (path: string) => {
    localStorage.setItem('exile_previous_page', '/pro')
    navigate(path)
  }

  const isManagementPage = [
    '/pro/profile',
    '/pro/statistics',
    '/pro/calendar',
    '/pro/my-videos',
    '/pro/drafts',
    '/pro/subscribers',
    '/pro/settings',
    '/pro/conversations'
  ].some(path => location.pathname.startsWith(path))

  const isLiveRoom = location.pathname.includes('/live')
  const isPreviewPage = location.pathname.includes('/preview')

  const shouldHide = isManagementPage || isLiveRoom || isPreviewPage

  return (
    <div style={{ display: shouldHide ? 'none' : 'contents' }}>
      {/* Mobile Action Sheet Backdrop - Clean & Minimalist */}
      {showMobileActionMenu && (
        <div
          className="fixed inset-0 z-[19999] bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-150 flex items-end"
          onClick={() => setShowMobileActionMenu(false)}
        >
          <div
            className={`w-full ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} rounded-t-3xl border-t p-5 pb-8 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle / Title */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-700/60" />
              <div className="w-full flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Créer & Publier</p>
                <button onClick={() => setShowMobileActionMenu(false)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 1. Publier une Vidéo */}
            <button
              onClick={() => {
                setShowMobileActionMenu(false)
                setIsUploadModalOpen(true)
              }}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Publier une Vidéo</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tutoriel, expertise, étude de cas</p>
              </div>
            </button>

            {/* 2. Créer un Événement */}
            <button
              onClick={() => {
                setShowMobileActionMenu(false)
                navigate('/pro/events?create=true')
              }}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Créer un Événement</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Webinaire, atelier, conférence</p>
              </div>
            </button>

            {/* 3. Lancer un Live */}
            <button
              onClick={() => {
                setShowMobileActionMenu(false)
                navigate('/pro/events?create=true&live=true')
              }}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">Lancer un Live</p>
                  <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded uppercase">Direct</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Masterclass en direct & chat interactif</p>
              </div>
            </button>

            {/* 4. Campagne Publicitaire (PUB) */}
            <button
              onClick={() => {
                setShowMobileActionMenu(false)
                navigate('/pub/d4sh-m4n4g3r_adm!n99')
              }}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Campagne Publicitaire (PUB)</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Promouvoir vos produits & services</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mobile: Bottom Navigation avec 5 items (Center + Prominent Button) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-t z-[10000] px-2 py-1`}>
        <nav className="flex items-center justify-around h-14">
          {/* 1. Accueil */}
          <button
            onClick={() => handleNavigate('/pro')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              location.pathname === '/pro'
                ? 'text-[#FF6B00] font-bold'
                : isDark ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Accueil</span>
          </button>

          {/* 2. Demandes */}
          <button
            onClick={() => handleNavigate('/pro/requests')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              location.pathname === '/pro/requests'
                ? 'text-[#FF6B00] font-bold'
                : isDark ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            <div className="relative">
              <Inbox className="w-5 h-5" />
              {newRequestsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {newRequestsCount > 9 ? '9+' : newRequestsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Demandes</span>
          </button>

          {/* 3. CENTER + BUTTON (PUBLIER - Exact EXILE Orange #FF6B00) */}
          <div className="flex-1 flex items-center justify-center -mt-5">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login')
                  return
                }
                setShowMobileActionMenu(!showMobileActionMenu)
              }}
              className="w-12 h-12 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 active:scale-95 transition-transform"
              title="Publier"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Événements */}
          <button
            onClick={() => handleNavigate('/pro/events')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              location.pathname.startsWith('/pro/events')
                ? 'text-[#FF6B00] font-bold'
                : isDark ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Événements</span>
          </button>

          {/* 5. Abonnement */}
          <button
            onClick={() => handleNavigate('/pro/subscriptions')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              location.pathname.startsWith('/pro/subscriptions')
                ? 'text-[#FF6B00] font-bold'
                : isDark ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Abonnement</span>
          </button>
        </nav>
      </div>

      {/* Desktop: Bottom horizontal bar */}
      <div className={`hidden md:flex fixed bottom-0 left-0 right-0 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t z-[10000] shadow-lg`}>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3">
          {[
            { to: '/pro', label: 'Accueil', icon: Home },
            { to: '/pro/requests', label: 'Demandes', icon: Inbox, badge: newRequestsCount },
            { to: '/pro/events', label: 'Événements', icon: Calendar },
            { to: '/pro/subscriptions', label: 'Abonnement', icon: Heart }
          ].map((item) => {
            const isItemActive = location.pathname === item.to || (item.to === '/pro' && location.pathname === '/pro')
            return (
              <button
                key={item.to}
                onClick={() => handleNavigate(item.to)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${
                  isItemActive
                    ? 'bg-[#FF6B00] text-white font-semibold shadow-sm'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upload Video Modal Triggered from ProSidebar Mobile */}
      {isUploadModalOpen && (
        <UploadVideo
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  )
}

export default ProSidebar