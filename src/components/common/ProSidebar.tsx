import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Calendar, Inbox, Heart, Plus, Video, Camera, X
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { UploadVideo } from '../video/UploadVideo'
import CameraRecord from '../video/CameraRecord'
import { getCurrentUserId } from '../../services/apiClient'
import { requestApi } from '../../services/requestApi'

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
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [cameraVideoData, setCameraVideoData] = useState<{ videoFile: File, videoUrl: string, thumbnail: string } | null>(null)

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

  // Écouter l'événement de vidéo uploadée pour s'assurer que le sidebar reste visible
  useEffect(() => {
    const handleVideoUploaded = () => {
      console.log('Video uploaded event detected in ProSidebar')
      setIsUploadingVideo(false)
    }

    window.addEventListener('video-uploaded', handleVideoUploaded)
    return () => window.removeEventListener('video-uploaded', handleVideoUploaded)
  }, [])

  useEffect(() => {
    const loadUnreadRequests = async () => {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        setNewRequestsCount(0)
        return
      }

      const token = localStorage.getItem('accessToken')
      if (!token) return

      const result = await requestApi.getDemandes()
      if (!result.success || !result.data) {
        setNewRequestsCount(0)
        return
      }

      const storedProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
      const myUsername = storedProfile.username
      setNewRequestsCount(
        result.data.filter(r => r.receiver === myUsername && r.status === 'envoye').length
      )
    }

    loadUnreadRequests()
  }, [location.pathname])

  const handleLogout = () => {
    logout()
  }

  // Fonction de navigation avec stockage de la page d'origine
  const handleNavigate = (path: string) => {
    localStorage.setItem('exile_previous_page', '/pro')
    navigate(path)
  }

  const isManagementPage = [
    '/pro/profile',
    '/pro/statistics',
    '/pro/calendar',
    '/pro/my-videos',
    '/pro/drafts'
  ].some(path => location.pathname.startsWith(path))

  const isLiveRoom = location.pathname.includes('/live')
  const isPreviewPage = location.pathname.includes('/preview')

  // FIX: Kache ak CSS olye return null pou evite re-render ki redirijte
  const shouldHide = isManagementPage || isLiveRoom || isCreatingEvent || isUploadingVideo || isPreviewPage

  const handleCameraRecordComplete = (videoData: { videoFile: File, videoUrl: string, thumbnail: string }) => {
    setCameraVideoData(videoData)
    setIsCameraModalOpen(false)
    setIsUploadModalOpen(true)
  }

  // Vérifier l'authentification avant d'ouvrir les modals
  const checkAuthAndOpen = (action: () => void) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    action()
  }

  const navItems: NavItem[] = [
    { to: '/pro', label: 'Accueil', icon: Home },
    { to: '/pro/requests', label: 'Demandes', icon: Inbox },
  ]

  const navItemsRight: NavItem[] = [
    { to: '/pro/events', label: 'Événements', icon: Calendar },
    { to: '/pro/subscriptions', label: 'Abonnement', icon: Heart },
  ]

  return (
    <div style={{ display: shouldHide ? 'none' : 'contents' }}>
      {/* Mobile & Tablet: Bottom navigation - 4 carrés style YouTube mobile */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-t z-[10000]`}>
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.to}
              onClick={() => handleNavigate(item.to)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                location.pathname === item.to || (item.to === '/pro' && location.pathname === '/pro')
                  ? 'text-orange-500'
                  : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.to === '/pro/requests' && newRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {newRequestsCount > 9 ? '9+' : newRequestsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          ))}

          {/* Bouton Créer - Au centre */}
          <div className="relative flex flex-col items-center justify-center flex-1 h-full">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className={`flex flex-col items-center justify-center transition-all`}
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] mt-1 font-medium text-orange-500">Créer</span>
            </button>

            {/* Create Menu Dropdown - Mobile simple */}
            {showCreateMenu && (
              <div className={`fixed bottom-16 left-0 right-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t z-[10001] p-4`}>
                <div className="space-y-2">
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsUploadModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Video className="w-6 h-6 text-blue-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Importer vidéo</span>
                  </button>
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsCameraModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-green-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Caméra</span>
                  </button>
                  <button
                    onClick={() => checkAuthAndOpen(() => { handleNavigate('/pro/events?create=true'); setShowCreateMenu(false); })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Calendar className="w-6 h-6 text-purple-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Créer événement</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {navItemsRight.map((item) => (
            <button
              key={item.to}
              onClick={() => handleNavigate(item.to)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                location.pathname === item.to
                  ? 'text-orange-500'
                  : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop: Bottom horizontal navigation */}
      <div className={`hidden md:flex fixed bottom-0 left-0 right-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t z-[10000] shadow-lg`}>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <nav className="flex items-center justify-center gap-1 sm:gap-2 flex-1">
            {navItems.map((item) => (
              <button
                key={item.to}
                onClick={() => handleNavigate(item.to)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl transition-all ${
                  location.pathname === item.to || (item.to === '/pro' && location.pathname === '/pro')
                    ? 'bg-orange-500 text-white'
                    : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {item.to === '/pro/requests' && newRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {newRequestsCount > 9 ? '9+' : newRequestsCount}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </button>
            ))}

            {/* Bouton Créer - Tablette uniquement (md) - Après Événements */}
            <div className="relative hidden md:block lg:hidden">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl transition-all`}
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-orange-500">Créer</span>
              </button>

              {/* Create Menu Dropdown - Tablette uniquement */}
              {showCreateMenu && (
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 rounded-lg shadow-lg py-2 z-[10001] max-h-[80vh] overflow-y-auto ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                }`}>
                  {/* Section Vidéos */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                    Vidéos
                  </div>
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsUploadModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                  >
                    <Video className="w-4 h-4 text-blue-500" />
                    Importer une vidéo
                  </button>
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsCameraModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                  >
                    <Camera className="w-4 h-4 text-green-500" />
                    Enregistrer avec caméra
                  </button>

                  {/* Section Événements */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase border-t border-gray-200 dark:border-zinc-700 mt-2">
                    Événements
                  </div>
                  <button
                    onClick={() => checkAuthAndOpen(() => { handleNavigate('/pro/events?create=true'); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                  >
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Créer un événement
                  </button>
                </div>
              )}
            </div>

            {navItemsRight.map((item) => (
              <button
                key={item.to}
                onClick={() => handleNavigate(item.to)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl transition-all ${
                  location.pathname === item.to
                    ? 'bg-orange-500 text-white'
                    : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side: Theme Toggle only for desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Video Upload Modal */}
      {isUploadModalOpen && (
        <UploadVideo
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          initialVideoData={cameraVideoData ?? undefined}
        />
      )}

      {/* Camera Record Modal */}
      {isCameraModalOpen && (
        <CameraRecord
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onRecordComplete={handleCameraRecordComplete}
        />
      )}
    </div>
  )
}

export default ProSidebar