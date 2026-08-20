import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Video,
  CalendarPlus,
  Camera
} from 'lucide-react'
import { UploadVideo } from '../video/UploadVideo'
import CameraRecord from '../video/CameraRecord'
import { useAuth } from '../../contexts/AuthContext'

const ProSubHeader = (): JSX.Element | null => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [cameraVideoData, setCameraVideoData] = useState<{ videoFile: File, videoUrl: string, thumbnail: string } | null>(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)

  const handleCameraRecordComplete = (videoData: { videoFile: File, videoUrl: string, thumbnail: string }) => {
    setCameraVideoData(videoData)
    setIsCameraModalOpen(false)
    setIsUploadModalOpen(true)
  }

  // Fonction de navigation avec stockage de la page d'origine
  const handleNavigate = (path: string) => {
    localStorage.setItem('exile_previous_page', location.pathname)
    navigate(path)
  }

  // Vérifier l'authentification avant d'ouvrir les modals
  const checkAuthAndOpen = (action: () => void) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    action()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 fixed top-[56px] sm:top-[64px] left-0 right-0 z-[90] w-full">
      <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          {/* Gauche: Bouton Créer avec menu déroulant - Desktop uniquement (lg+) */}
          <div className="hidden lg:flex lg:relative lg:flex-shrink-0">
            <button 
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-pro text-white rounded-md hover:bg-pro/90 transition-colors text-xs sm:text-sm font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="inline text-xs">Créer</span>
            </button>
            
            {/* Create Menu - Desktop uniquement (lg+): Regular dropdown */}
            {showCreateMenu && (
              <div className="hidden lg:block fixed inset-0 z-50" onClick={() => setShowCreateMenu(false)}>
                <div className="absolute left-4 top-16 mt-2 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {/* Section Vidéos */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-zinc-800">
                    Vidéos
                  </div>
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsUploadModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <Video className="w-4 h-4 text-blue-500" />
                    Importer une vidéo
                  </button>
                  <button
                    onClick={() => checkAuthAndOpen(() => { setIsCameraModalOpen(true); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <Camera className="w-4 h-4 text-green-500" />
                    Enregistrer avec caméra
                  </button>

                  {/* Section Événements */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-zinc-800">
                    Événements
                  </div>
                  <button
                    onClick={() => checkAuthAndOpen(() => { handleNavigate('/pro/events?create=true'); setShowCreateMenu(false); })}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                  >
                    <CalendarPlus className="w-4 h-4 text-purple-500" />
                    Créer un événement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadVideo
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          initialVideoData={cameraVideoData ?? undefined}
        />
      )}

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

export default ProSubHeader

