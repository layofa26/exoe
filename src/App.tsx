import { Routes, Route, useLocation, Outlet, useOutlet } from 'react-router-dom'
import { Suspense, useEffect, useState, useMemo } from 'react'

// Layout
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import ProSidebar from './components/common/ProSidebar'
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

// Professional module layout with caching
const ProLayout = () => {
  return (
    <div className="w-full h-full">
      <Outlet />
    </div>
  )
}

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
  
  // Detekte si nou nan modil PUB
  const isPubRoute = location.pathname.startsWith('/pub') || location.pathname.startsWith('/pro/ads')

  // Pages sans Header principal (accueil header masqué sur events, subscriptions, requests, pub dashboard, etc.)
  const isNoHeaderPage = location.pathname.startsWith('/pro/conversations') || 
                           location.pathname.startsWith('/pro/profile') ||
                           location.pathname.startsWith('/pro/subscribers') ||
                           location.pathname.startsWith('/pro/calendar') ||
                           location.pathname.startsWith('/pro/settings') ||
                           location.pathname.startsWith('/pro/requests') ||
                           location.pathname.startsWith('/pro/demandes') ||
                           location.pathname.startsWith('/pro/my-videos') ||
                           location.pathname.startsWith('/pro/videos') ||
                           location.pathname.startsWith('/pro/events') ||
                           location.pathname.startsWith('/pro/subscriptions') ||
                           isPubRoute

  // Pages où le ProSidebar doit être masqué (demande, evenement, abonnement)
  const isNoSidebarPage = 
    location.pathname.startsWith('/pro/conversations') ||
    location.pathname.startsWith('/pro/requests') ||
    location.pathname.startsWith('/pro/demandes') ||
    location.pathname.startsWith('/pro/events') ||
    location.pathname.startsWith('/pro/evenements') ||
    location.pathname.startsWith('/pro/subscriptions') ||
    location.pathname.startsWith('/pro/subscribers') ||
    location.pathname.startsWith('/pro/abonnement')

  // Cacher header et sous-module sur mobile pour page détails vidéo uniquement
  const isVideoDetailPage = location.pathname.startsWith('/pro/video')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const shouldHideHeaderOnVideoDetail = isMobile && isVideoDetailPage
  const shouldHideHeaderOnMobileUpload = isMobile && isUploadingVideo

  // Always show main header for module navigation
  const showMainHeader = !isLiveRoom && !isNoHeaderPage

  // Detekte si nou nan paj ki pa dwe gen SubHeader (events, requests, subscriptions)
  const isNoSubHeaderPage = location.pathname.startsWith('/pro/events') ||
                               location.pathname.startsWith('/pro/requests') ||
                               location.pathname.startsWith('/pro/subscriptions')
  
  // Cacher SubHeader sur mobile pour page détails vidéo
  const shouldHideSubHeaderOnVideoDetail = isMobile && isVideoDetailPage
  
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

    checkUploading()
    checkVideoPlayer()

    // Listen for storage changes
    const handleStorageChange = () => {
      checkUploading()
      checkVideoPlayer()
    }

    window.addEventListener('storage', handleStorageChange)

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
      {showMainHeader && !shouldHideHeaderOnMobileUpload && !shouldHideHeaderOnVideoDetail && <Header />}

      {/* ProSidebar parèt toujou sou wout Pro, y konpri sou Demandes */}
      {isProRoute && !isLiveRoom && !isUploadingVideo && !isNoSidebarPage && !isVideoPlayerActive && !shouldHideHeaderOnMobileUpload && !shouldHideHeaderOnVideoDetail && <ProSidebar />}

      {/* SocialSidebar parèt sèlman si se yon wout Social epi li pa nan mobile search */}
      {isSocialRoute && !isLiveRoom && <SocialSidebar />}

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className={`flex-1 flex flex-col min-h-0 ${showMainHeader && !shouldHideHeaderOnMobileUpload && !shouldHideHeaderOnVideoDetail ? 'pt-14 sm:pt-16' : 'pt-0'} ${isProRoute && !isLiveRoom && !isUploadingVideo && !isNoSidebarPage ? 'pb-16 md:pb-0' : isSocialRoute ? 'md:pl-64' : ''}`}>
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
                
                {/* Module Professional - with caching */}
                <Route path="/pro" element={<ProLayout />}>
                  <Route index element={<VideoFeed />} />
                  <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="profile/:id" element={<PublicProfile />} />
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
                  <Route path="requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
                  <Route path="conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
                  <Route path="conversations/:id" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
                  <Route path="blocked-users" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
                  <Route path="important-messages" element={<ProtectedRoute><ImportantMessages /></ProtectedRoute>} />
                  <Route path="my-videos" element={<ProtectedRoute><MyVideos /></ProtectedRoute>} />
                  <Route path="drafts" element={<ProtectedRoute><MyDrafts /></ProtectedRoute>} />
                  <Route path="subscribers" element={<ProtectedRoute><Subscribers /></ProtectedRoute>} />
                  <Route path="statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                  <Route path="calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
                  <Route path="events" element={<EventsPro />} />
                  <Route path="events/:eventId/preview" element={<EventPreview />} />
                  <Route path="events/:eventId/live" element={<LiveRoom />} />
                  <Route path="ads" element={<ProtectedRoute><AdDashboard /></ProtectedRoute>} />
                  <Route path="video/:videoId" element={<VideoPage />} />
                </Route>
                
                {/* Module PUB (Sécurisé) */}
                <Route path="/pub" element={<ProtectedRoute><AdDashboard /></ProtectedRoute>} />
                <Route path="/pub/d4sh-m4n4g3r_adm!n99" element={<ProtectedRoute><AdDashboard /></ProtectedRoute>} />
                <Route path="/pub/ads" element={<ProtectedRoute><AdDashboard /></ProtectedRoute>} />

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