import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'

// Layout
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import ProSidebar from './components/common/ProSidebar'
import ProSubHeader from './components/common/ProSubHeader'
import ProtectedRoute from './components/common/ProtectedRoute'
import { DraftDetectionModal } from './components/common/DraftDetectionModal'
import { ThemeProvider } from './contexts/ThemeContext'

// Public Pages
import Landing from './pages/Public/Landing'
import Login from './pages/Public/Login'
import Register from './pages/Public/Register'
import Pricing from './pages/Public/Pricing'
import ForgotPasswordPage from './pages/Public/ForgotPasswordPage'
import ResetPasswordPage from './pages/Public/ResetPasswordPage'
import ForgotEmailPage from './pages/Public/ForgotEmailPage'

// Module Professional
import VideoFeed from './pages/ModuleProfessional/VideoFeed'
import VideoPage from './pages/ModuleProfessional/VideoPage'
import Subscriptions from './pages/ModuleProfessional/Subscriptions'
import EventsPro from './pages/ModuleProfessional/EventsPro'
import EventPreview from './pages/ModuleProfessional/EventPreview'
import LiveRoom from './pages/ModuleProfessional/LiveRoom'
import Requests from './pages/ModuleProfessional/Requests'
import { ConversationPage } from './pages/ModuleProfessional/Conversation'
import Conversations from './pages/ModuleProfessional/Conversations'
import BlockedUsers from './pages/ModuleProfessional/BlockedUsers'
import ImportantMessages from './pages/ModuleProfessional/ImportantMessages'
import MyVideos from './pages/ModuleProfessional/MyVideos'
import Subscribers from './pages/ModuleProfessional/Subscribers'
import Statistics from './pages/ModuleProfessional/Statistics'
import Calendar from './pages/ModuleProfessional/Calendar'
import Profile from './pages/ModuleProfessional/Profile'
import { PublicProfile } from './pages/ModuleProfessional/PublicProfile'
import Settings from './pages/ModuleProfessional/Settings'
import PrivacySettings from './pages/ModuleProfessional/PrivacySettings'
import { MyDrafts } from './pages/ModuleProfessional/MyDrafts'
import AdDashboard from './pages/PUB/AdDashboard'

// Module Social
import SocialFeed from './pages/ModuleSocial/SocialFeed'
import InstitutionRequest from './pages/ModuleSocial/InstitutionRequest'
import InstitutionPlans from './pages/ModuleSocial/InstitutionPlans'
import InstitutionProfile from './pages/ModuleSocial/InstitutionProfile'
import InstitutionDashboard from './pages/ModuleSocial/InstitutionDashboard'
import SocialEvents from './pages/ModuleSocial/SocialEvents'
import EventRegistration from './pages/ModuleSocial/EventRegistration'
import { SocialSidebar } from './components/social/SocialSidebar'

// Loading fallback
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

// Scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])
  return null
}

function App(): JSX.Element {
  const location = useLocation()
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isVideoPlayerActive, setIsVideoPlayerActive] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  
  // Detekte si nou nan modil Pro
  const isProRoute = location.pathname.startsWith('/pro')
  
  // Detekte si nou nan modil Social
  const isSocialRoute = location.pathname.startsWith('/social')
  
  // Detekte si itilizatè a nan mitan yon Live pou n kache Sidebar ak Header pwofesyonèl yo
  const isLiveRoom = location.pathname.includes('/live')
  
  // Detekte si nou nan paj ki pa dwe gen header (conversations, profile, subscribers, calendar, settings)
  const isNoHeaderPage = location.pathname.startsWith('/pro/conversations') || 
                           location.pathname.startsWith('/pro/profile') ||
                           location.pathname.startsWith('/pro/subscribers') ||
                           location.pathname.startsWith('/pro/calendar') ||
                           location.pathname.startsWith('/pro/settings')
  
  // Always show main header for module navigation
  const showMainHeader = !isLiveRoom && !isNoHeaderPage

  // Cacher header et prosidebar sur mobile lors upload vidéo et pages de gestion
  const isMobile = window.innerWidth < 1024
  const isManagementPage = location.pathname.startsWith('/pro/my-videos') || 
                           location.pathname.startsWith('/pro/drafts')
  const shouldHideHeaderOnMobileUpload = isMobile && (isUploadingVideo || isManagementPage)

  // Detekte si nou nan paj ki pa dwe gen SubHeader (events, requests, subscriptions)
  const isNoSubHeaderPage = location.pathname.startsWith('/pro/events') ||
                               location.pathname.startsWith('/pro/requests') ||
                               location.pathname.startsWith('/pro/subscriptions')
  
  // Detekte si modal upload video la louvri pou kache ProSidebar
  useEffect(() => {
    const checkUploading = () => {
      try {
        setIsUploadingVideo(localStorage.getItem('exile_uploading_video') === 'true')
      } catch (e) {
        setIsUploadingVideo(false)
      }
    }

    const checkVideoPlayer = () => {
      try {
        setIsVideoPlayerActive(localStorage.getItem('exile_video_player_active') === 'true')
      } catch (e) {
        setIsVideoPlayerActive(false)
      }
    }

    const checkDrafts = async () => {
      try {
        // Only check drafts on pro routes and if user hasn't dismissed it
        if (!isProRoute) return

        const dismissed = localStorage.getItem('exile_drafts_dismissed')
        if (dismissed === 'true') return

        const token = localStorage.getItem('accessToken')
        if (token) {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
          const response = await fetch(`${API_BASE_URL}/v1/videos/drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            const pendingDrafts = (data.data || data || []).filter(
              (d: any) => d.status === 'DRAFT' || d.status === 'UPLOADING' || d.status === 'FAILED'
            )
            if (pendingDrafts.length > 0) {
              setShowDraftModal(true)
            }
          }
        }
      } catch (e) {
        console.error('Error checking drafts:', e)
      }
    }

    checkUploading()
    checkVideoPlayer()
    checkDrafts()

    // Listen for storage changes
    const handleStorageChange = () => {
      checkUploading()
      checkVideoPlayer()
    }

    window.addEventListener('storage', handleStorageChange)

    // Poll localStorage every 1 SECOND (reduced from 100ms) to detect changes from same window
    // Note: This is still not ideal, consider using a custom event or state management instead
    const interval = setInterval(() => {
      checkUploading()
      checkVideoPlayer()
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <ThemeProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Always show main header for module navigation between Pro and Social */}
      {showMainHeader && !shouldHideHeaderOnMobileUpload && <Header />}

      {/* Sidebar parèt sèlman si se yon wout Pro epi li pa nan yon Live epi li pa nan upload video epi li pa nan paj san header epi li pa nan video player */}
      {isProRoute && !isLiveRoom && !isUploadingVideo && !isNoHeaderPage && !isVideoPlayerActive && !shouldHideHeaderOnMobileUpload && <ProSidebar />}

      {/* SocialSidebar parèt sèlman si se yon wout Social epi li pa nan mobile search */}
      {isSocialRoute && !isLiveRoom && <SocialSidebar />}

      {/* SubHeader parèt sèlman si se yon wout Pro epi li pa nan yon Live epi li pa nan upload video epi li pa nan paj san header epi li pa nan video player epi li pa nan paj san SubHeader */}
      {isProRoute && !isLiveRoom && !isUploadingVideo && !isNoHeaderPage && !isVideoPlayerActive && !isNoSubHeaderPage && <ProSubHeader />}

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Ajiste padding yo sèlman si nou nan wout Pro regilye epi li pa nan upload video epi li pa nan paj san header */}
          <div className={isProRoute && !isLiveRoom && !isUploadingVideo && !isNoHeaderPage ? 'pt-0 pb-24 md:pb-0' : isSocialRoute ? 'pt-0 md:pl-64' : ''}>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/forgot-email" element={<ForgotEmailPage />} />
                
                {/* Module Professional */}
                <Route path="/pro/profile" element={<Profile />} />
                <Route path="/pro/profile/:id" element={<PublicProfile />} />
                <Route path="/pro/settings" element={<Settings />} />
                <Route path="/pro/settings/privacy" element={<PrivacySettings />} />
                <Route path="/pro/requests" element={<Requests />} />
                <Route path="/pro/conversations" element={<Conversations />} />
                <Route path="/pro/blocked-users" element={<BlockedUsers />} />
                <Route path="/pro/important-messages" element={<ImportantMessages />} />
                <Route path="/pro/my-videos" element={<MyVideos />} />
                <Route path="/pro/drafts" element={<MyDrafts />} />
                <Route path="/pro/subscribers" element={<Subscribers />} />
                <Route path="/pro/statistics" element={<Statistics />} />
                <Route path="/pro/calendar" element={<Calendar />} />
                <Route path="/pro/subscriptions" element={<Subscriptions />} />
                <Route path="/pro/events" element={<EventsPro />} />
                <Route path="/pro/events/:eventId/preview" element={<EventPreview />} />
                <Route path="/pro/events/:eventId/live" element={<LiveRoom />} />
                <Route path="/pro/conversations/:id" element={<ConversationPage />} />
                <Route path="/pro/ads" element={<AdDashboard />} />
                <Route path="/pro/video/:videoId" element={<VideoPage />} />
                <Route path="/pro" element={<VideoFeed />} />
                
                {/* Module Social */}
                <Route path="/social" element={<SocialFeed />} />
                <Route path="/social/events" element={<SocialEvents />} />
                <Route path="/social/events/register" element={<EventRegistration />} />
                <Route path="/social/institution/request" element={<InstitutionRequest />} />
                <Route path="/social/plans" element={<InstitutionPlans />} />
                <Route path="/social/institution" element={<InstitutionProfile />} />
                <Route path="/social/institution/dashboard" element={<InstitutionDashboard />} />
                
                {/* Protected routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <div className="p-4 sm:p-6 md:p-8 text-center dark:text-white">Mon Profil (à implémenter)</div>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch all */}
                <Route path="*" element={<div className="p-4 sm:p-6 md:p-8 text-center dark:text-white">Page non trouvée</div>} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      
      {!isLiveRoom && <Footer />}
    </div>
    
    {/* Draft Detection Modal */}
    <DraftDetectionModal
      isOpen={showDraftModal}
      onClose={() => setShowDraftModal(false)}
    />
  </ThemeProvider>
  )
}

export default App