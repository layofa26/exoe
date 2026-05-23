import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'

// Layout
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import ProSidebar from './components/common/ProSidebar'
import ProSubHeader from './components/common/ProSubHeader'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'

// Public Pages
import Landing from './pages/Public/Landing'
import Login from './pages/Public/Login'
import Register from './pages/Public/Register'
import Pricing from './pages/Public/Pricing'

// Module Professional
import VideoFeed from './pages/ModuleProfessional/VideoFeed'
import Subscriptions from './pages/ModuleProfessional/Subscriptions'
import EventsPro from './pages/ModuleProfessional/EventsPro'
import EventPreview from './pages/ModuleProfessional/EventPreview'
import LiveRoom from './pages/ModuleProfessional/LiveRoom'
import Requests from './pages/ModuleProfessional/Requests'
import { ConversationPage } from './pages/ModuleProfessional/Conversation'
import MyVideos from './pages/ModuleProfessional/MyVideos'
import Subscribers from './pages/ModuleProfessional/Subscribers'
import Statistics from './pages/ModuleProfessional/Statistics'
import Dashboard from './pages/ModuleProfessional/EventDashboard'
import Calendar from './pages/ModuleProfessional/Calendar'
import AdDashboard from './pages/PUB/AdDashboard'

// Module Social
import SocialFeed from './pages/ModuleSocial/SocialFeed'
import InstitutionRequest from './pages/ModuleSocial/InstitutionRequest'
import InstitutionPlans from './pages/ModuleSocial/InstitutionPlans'
import RecruitmentBoard from './pages/ModuleSocial/RecruitmentBoard'
import JobApplication from './pages/ModuleSocial/JobApplication'

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
  
  // Detekte si nou nan modil Pro
  const isProRoute = location.pathname.startsWith('/pro')
  
  // Detekte si itilizatè a nan mitan yon Live pou n kache Sidebar ak Header pwofesyonèl yo
  const isLiveRoom = location.pathname.includes('/live')
  
  // Detekte si nou nan paj ki pa dwe gen header (evenements, demandes, abonnements)
  const isNoHeaderPage = location.pathname === '/pro/events' || location.pathname === '/pro/requests' || location.pathname === '/pro/subscriptions'
  
  // Detekte si modal upload video la louvri pou kache ProSidebar
  useEffect(() => {
    const checkUploading = () => {
      try {
        setIsUploadingVideo(localStorage.getItem('exile_uploading_video') === 'true')
      } catch (e) {
        setIsUploadingVideo(false)
      }
    }
    
    checkUploading()
    
    // Listen for storage changes
    const handleStorageChange = () => {
      checkUploading()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Poll localStorage every 100ms to detect changes from same window
    const interval = setInterval(checkUploading, 100)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <ThemeProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
        {/* Kache Header piblik la si se yon Live ou si se yon paj san header */}
        {!isLiveRoom && !isNoHeaderPage && <Header />}

        {/* Sidebar parèt sèlman si se yon wout Pro epi li pa nan yon Live epi li pa nan upload video */}
        {isProRoute && !isLiveRoom && !isUploadingVideo && <ProSidebar />}

        {/* SubHeader parèt sèlman si se yon wout Pro epi li pa nan yon Live epi li pa nan upload video epi li pa nan paj san header */}
        {isProRoute && !isLiveRoom && !isUploadingVideo && !isNoHeaderPage && <ProSubHeader />}

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {/* Ajiste padding yo sèlman si nou nan wout Pro regilye epi li pa nan upload video epi li pa nan paj san header */}
            <div className={isProRoute && !isLiveRoom && !isUploadingVideo && !isNoHeaderPage ? 'pt-[128px] pb-24 md:pb-0' : ''}>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pricing" element={<Pricing />} />
                  
                  {/* Module Professional */}
                  <Route path="/pro/dashboard" element={<Dashboard />} />
                  <Route path="/pro/requests" element={<Requests />} />
                  <Route path="/pro/my-videos" element={<MyVideos />} />
                  <Route path="/pro/subscribers" element={<Subscribers />} />
                  <Route path="/pro/statistics" element={<Statistics />} />
                  <Route path="/pro/calendar" element={<Calendar />} />
                  <Route path="/pro/subscriptions" element={<Subscriptions />} />
                  <Route path="/pro/events" element={<EventsPro />} />
                  <Route path="/pro/events/:eventId/preview" element={<EventPreview />} />
                  <Route path="/pro/events/:eventId/live" element={<LiveRoom />} />
                  <Route path="/pro/conversations/:id" element={<ConversationPage />} />
                  <Route path="/pro/ads" element={<AdDashboard />} />
                  <Route path="/pro" element={<VideoFeed />} />
                  
                  {/* Module Social */}
                  <Route path="/social" element={<SocialFeed />} />
                  <Route path="/social/jobs" element={<RecruitmentBoard />} />
                  <Route path="/social/jobs/apply/:jobId" element={<JobApplication />} />
                  <Route path="/social/institution/request" element={<InstitutionRequest />} />
                  <Route path="/social/plans" element={<InstitutionPlans />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <div className="p-8">Mon Profil (à implémenter)</div>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Catch all */}
                  <Route path="*" element={<div className="p-8 text-center dark:text-white">Page non trouvée</div>} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
        
        {!isLiveRoom && <Footer />}
      </div>
    </ThemeProvider>
  )
}

export default App