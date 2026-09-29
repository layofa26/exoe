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
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUserId } from '../../services/apiClient'
import { UploadVideo } from '../video/UploadVideo'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const ProSidebar = (): JSX.Element | null => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const isDark = resolvedTheme === 'dark'
  
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  const [showMobileActionMenu, setShowMobileActionMenu] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Badge demandes reçues (pending) en temps réel
  useEffect(() => {
    let isMounted = true
    const loadUnreadRequests = async () => {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        if (isMounted) setNewRequestsCount(0)
        return
      }
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/demandes/?type=recues&status=envoye`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        const raw: any[] = Array.isArray(data) ? data : (data.results || [])
        const count = typeof data.count === 'number' ? data.count : raw.length
        if (isMounted) {
          setNewRequestsCount(count)
        }
      } catch {
        if (isMounted) setNewRequestsCount(0)
      }
    }

    loadUnreadRequests()

    const handleUpdate = () => {
      loadUnreadRequests()
    }

    window.addEventListener('exile_demande_created', handleUpdate)
    window.addEventListener('exile_demande_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    const interval = setInterval(loadUnreadRequests, 3500)

    return () => {
      isMounted = false
      window.removeEventListener('exile_demande_created', handleUpdate)
      window.removeEventListener('exile_demande_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      clearInterval(interval)
    }
  }, [location.pathname])

  const handleNavigate = (path: string) => {
    localStorage.setItem('exile_previous_page', '/pro')
    navigate(path)
  }

  const [isInMobileConversation, setIsInMobileConversation] = useState(() => {
    try {
      return localStorage.getItem('exile_in_mobile_conversation') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleMobileConvChange = (e: any) => {
      setIsInMobileConversation(Boolean(e.detail?.inConversation))
    }
    const handleStorage = () => {
      try {
        setIsInMobileConversation(localStorage.getItem('exile_in_mobile_conversation') === 'true')
      } catch {
        setIsInMobileConversation(false)
      }
    }
    window.addEventListener('exile_mobile_conversation_change', handleMobileConvChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('exile_mobile_conversation_change', handleMobileConvChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const isManagementPage = [
    '/pro/profile',
    '/pro/statistics',
    '/pro/my-videos',
    '/pro/drafts',
    '/pro/settings'
  ].some(path => location.pathname.startsWith(path))

  const isLiveRoom = location.pathname.includes('/live')
  const isPreviewPage = location.pathname.includes('/preview')
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false

  const shouldHide = isManagementPage || isLiveRoom || isPreviewPage || (isMobile && isInMobileConversation && location.pathname !== '/pro/conversations')

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
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('pro.sidebar.createTitle', 'Créer & Publier')}</p>
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
                <p className="text-sm font-bold">{t('pro.sidebar.publishVideo', 'Publier une Vidéo')}</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('pro.sidebar.publishVideoDesc', 'Tutoriel, expertise, étude de cas')}</p>
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
                <p className="text-sm font-bold">{t('pro.sidebar.createEvent', 'Créer un Événement')}</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('pro.sidebar.createEventDesc', 'Webinaire, atelier, conférence')}</p>
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
                  <p className="text-sm font-bold">{t('pro.sidebar.startLive', 'Lancer un Live')}</p>
                  <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded uppercase">{t('pro.sidebar.liveBadge', 'Direct')}</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('pro.sidebar.startLiveDesc', 'Masterclass en direct & chat interactif')}</p>
              </div>
            </button>

            {/* 4. Campagne Publicitaire (PUB) */}
            <button
              onClick={() => {
                setShowMobileActionMenu(false)
                navigate('/pub/demande')
              }}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{t('pro.sidebar.pubCampaign', 'Campagne Publicitaire (PUB)')}</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('pro.sidebar.pubCampaignDesc', 'Promouvoir vos produits & services')}</p>
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
            <span className="text-[10px] mt-0.5">{t('pro.sidebar.home', 'Accueil')}</span>
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
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-pulse select-none">
                  {newRequestsCount > 9 ? '9+' : newRequestsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{t('pro.sidebar.requests', 'Demandes')}</span>
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
              title={t('pro.sidebar.publish', 'Publier')}
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
            <span className="text-[10px] mt-0.5">{t('pro.sidebar.events', 'Événements')}</span>
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
            <span className="text-[10px] mt-0.5">{t('pro.sidebar.subscriptions', 'Abonnement')}</span>
          </button>
        </nav>
      </div>

      {/* Desktop: Bottom horizontal bar */}
      <div className={`hidden md:flex fixed bottom-0 left-0 right-0 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t z-[10000] shadow-lg`}>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3">
          {[
            { to: '/pro', label: t('pro.sidebar.home', 'Accueil'), icon: Home },
            { to: '/pro/requests', label: t('pro.sidebar.requests', 'Demandes'), icon: Inbox, badge: newRequestsCount },
            { to: '/pro/events', label: t('pro.sidebar.events', 'Événements'), icon: Calendar },
            { to: '/pro/subscriptions', label: t('pro.sidebar.subscriptions', 'Abonnement'), icon: Heart }
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
                    <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 animate-pulse select-none">
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