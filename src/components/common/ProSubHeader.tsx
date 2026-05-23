import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Video,
  Search,
  Bell,
  Filter,
  CalendarPlus,
  X,
  Camera
} from 'lucide-react'
import VideoUpload from '../video/VideoUpload'
import CameraRecord from '../video/CameraRecord'

const ProSubHeader = (): JSX.Element | null => {
  const navigate = useNavigate()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [cameraVideoData, setCameraVideoData] = useState<{ videoFile: File, videoUrl: string, thumbnail: string } | null>(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)

  // État pour la recherche avec filtre
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'professional'>('all')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [searchResults, setSearchResults] = useState<{professionals: any[], videos: any[]}>({ professionals: [], videos: [] })
  const searchRef = useRef<HTMLDivElement>(null)

  // État pour les notifications
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount] = useState(2)
  const notifRef = useRef<HTMLDivElement>(null)

  const handleCameraRecordComplete = (videoData: { videoFile: File, videoUrl: string, thumbnail: string }) => {
    setCameraVideoData(videoData)
    setIsCameraModalOpen(false)
    setIsUploadModalOpen(true)
  }

  const handleVideoUpload = async (data: { title: string, description: string, thumbnail: string, videoFile: File }) => {
    console.log('Vidéo uploadée:', data)
    
    const videoId = Date.now().toString()
    const userProfile = JSON.parse(localStorage.getItem('exile_profile') || '{}')
    const userName = userProfile?.name || 'Moi'
    const userProfession = userProfile?.profession || 'Professionnel'
    const avatarUrl = userProfile?.avatar || ''
    const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'M'
    const avatarColor = userProfile?.avatarColor || '#F97316'
    
    const newVideo = {
      id: videoId,
      title: data.title,
      author: {
        id: userProfile?.id || videoId,
        name: userName,
        profession: userProfession,
        location: userProfile?.location || '',
        initials: initials,
        avatarColor: avatarColor,
        avatarUrl: avatarUrl,
      },
      username: '@moi',
      views: 0,
      likes: 0,
      comments: [],
      duration: '00:00',
      description: data.description,
      thumbnail: data.thumbnail,
      videoUrl: '',
      isLive: false,
      postedAt: new Date().toISOString(),
      category: 'Vidéo',
      categoryColor: 'bg-blue-600',
      gradient: 'from-blue-700 to-blue-900',
      tags: [],
    }
    
    try {
      const existingVideos = JSON.parse(localStorage.getItem('exile_videos') || '[]')
      const updatedVideos = [newVideo, ...existingVideos]
      localStorage.setItem('exile_videos', JSON.stringify(updatedVideos))
      console.log('✅ Vidéo sauvegardée:', newVideo.id)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    }
    
    alert(`Vidéo "${data.title}" publiée avec succès!`)
    window.location.reload()
  }

  // Fermer dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
        setShowFilterMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fonction de recherche avec filtre
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setShowSearchResults(false)
      return
    }

    const lowerQuery = query.toLowerCase()
    
    let filteredProfessionals: any[] = []
    let filteredVideos: any[] = []
    
    if (filterType === 'all' || filterType === 'professional') {
      const savedProfessionals = localStorage.getItem('exile_professionals')
      const professionals = savedProfessionals ? JSON.parse(savedProfessionals) : []
      filteredProfessionals = professionals.filter((p: any) => 
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.username?.toLowerCase().includes(lowerQuery) ||
        p.profession?.toLowerCase().includes(lowerQuery)
      ).slice(0, 3)
    }
    
    if (filterType === 'all' || filterType === 'video') {
      const savedVideos = localStorage.getItem('exile_videos')
      const videos = savedVideos ? JSON.parse(savedVideos) : []
      filteredVideos = videos.filter((v: any) =>
        v.title?.toLowerCase().includes(lowerQuery) ||
        v.description?.toLowerCase().includes(lowerQuery) ||
        v.author?.toLowerCase().includes(lowerQuery)
      ).slice(0, 3)
    }

    setSearchResults({ professionals: filteredProfessionals, videos: filteredVideos })
    setShowSearchResults(true)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 fixed top-[64px] left-0 right-0 z-[90] w-full">
      <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          
          {/* Gauche: Bouton Créer avec menu déroulant */}
          <div className="relative flex-shrink-0">
            <button 
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-pro text-white rounded-md hover:bg-pro/90 transition-colors text-xs sm:text-sm font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="inline text-xs">Créer</span>
            </button>
            
            {/* Create Menu - Portal pour priorité absolue */}
            {showCreateMenu && createPortal(
              <div className="fixed inset-0 z-[30000] flex flex-col bg-white dark:bg-[#0f0f0f] md:bg-transparent md:dark:bg-transparent md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:w-60">
                {/* Overlay background on mobile */}
                <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Créer</h2>
                  <button onClick={() => setShowCreateMenu(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 md:bg-white md:dark:bg-zinc-900 md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 md:dark:border-zinc-800 overflow-hidden">
                  {/* Section Vidéos */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    Vidéos
                  </div>
                  <button 
                    onClick={() => { setIsUploadModalOpen(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-4 md:py-2.5 text-lg md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <Video className="w-6 h-6 md:w-4 md:h-4 text-blue-500" />
                    Importation
                  </button>
                  <button 
                    onClick={() => { setIsCameraModalOpen(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-4 md:py-2.5 text-lg md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <Camera className="w-6 h-6 md:w-4 md:h-4 text-green-500" />
                    Enregistrer avec caméra
                  </button>
                  
                  {/* Section Événements */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    Événements
                  </div>
                  <button 
                    onClick={() => { navigate('/pro/events?create=true'); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-4 md:py-2.5 text-lg md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <CalendarPlus className="w-6 h-6 md:w-4 md:h-4 text-purple-500" />
                    Créer un événement
                  </button>
                </div>
              </div>, document.body)}
          </div>

            {/* Barre de recherche kole ak bouton Créer */}
            <div className="w-48 sm:w-64 md:w-80" ref={searchRef}>
            <div className="relative">
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-full overflow-hidden">
                <Search className="ml-3 w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={`Rechercher ${filterType === 'all' ? '...' : filterType === 'video' ? 'des vidéos...' : 'des professionnels...'}`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`px-3 py-1.5 border-l border-gray-200 ${showFilterMenu ? 'bg-gray-200' : 'hover:bg-gray-200'} transition-colors`}
                >
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>

              {/* Menu filtre */}
              {showFilterMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={() => { setFilterType('all'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                    className={`w-full px-4 py-2 text-left text-sm ${filterType === 'all' ? 'bg-gray-50 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => { setFilterType('video'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                    className={`w-full px-4 py-2 text-left text-sm ${filterType === 'video' ? 'bg-gray-50 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Vidéos
                  </button>
                  <button
                    onClick={() => { setFilterType('professional'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                    className={`w-full px-4 py-2 text-left text-sm ${filterType === 'professional' ? 'bg-gray-50 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Professionnels
                  </button>
                </div>
              )}

              {/* Résultats de recherche */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {searchResults.professionals.length === 0 && searchResults.videos.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      Aucun résultat trouvé
                    </div>
                  ) : (
                    <>
                      {searchResults.professionals.length > 0 && (
                        <div className="border-b border-gray-100">
                          <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                            Professionnels
                          </div>
                          {searchResults.professionals.map((pro: any) => (
                            <button
                              key={pro.id}
                              onClick={() => {
                                navigate(`/pro/profile/${pro.username}`)
                                setShowSearchResults(false)
                                setSearchQuery('')
                              }}
                              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left"
                            >
                              <div className="w-7 h-7 bg-gradient-to-br from-pro to-emerald-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{pro.name?.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{pro.name}</p>
                                <p className="text-xs text-gray-500 truncate">{pro.profession}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.videos.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                            Vidéos
                          </div>
                          {searchResults.videos.map((video: any) => (
                            <button
                              key={video.id}
                              onClick={() => {
                                navigate(`/pro/video/${video.id}`)
                                setShowSearchResults(false)
                                setSearchQuery('')
                              }}
                              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left"
                            >
                              <div className="w-10 h-7 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                {video.thumbnail ? (
                                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <Video className="w-3 h-3 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                                <p className="text-xs text-gray-500">{video.views} vues</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Droite: Notification + Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            {/* Notification */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {typeof unreadCount === 'number' && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifications */}
              {showNotifications && (
                <div className="fixed inset-0 z-[9999] md:absolute md:right-0 md:top-full md:mt-2 md:w-72 md:rounded-lg md:shadow-lg md:border md:border-gray-200 dark:md:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  {/* Mobile Header with Back Button */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                    <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
                  </div>

                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="p-4 text-center text-gray-500 dark:text-zinc-400 text-sm">
                    Notifications du module Professionnel
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Upload Modal */}
      {isUploadModalOpen && createPortal(
        <VideoUpload
          isOpen={isUploadModalOpen}
          onClose={() => { setIsUploadModalOpen(false); setCameraVideoData(null); }}
          onUpload={handleVideoUpload}
          initialVideoData={cameraVideoData}
        />,
        document.body
      )}
      
      {/* Camera Record Modal */}
      {isCameraModalOpen && createPortal(
        <CameraRecord
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onRecordComplete={handleCameraRecordComplete}
        />,
        document.body
      )}
    </div>
  )
}

export default ProSubHeader
