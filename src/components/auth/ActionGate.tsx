import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { ActionGateProps } from '../../types'
import { X, Lock } from 'lucide-react'

export const ActionGate = ({ 
  children, 
  action = 'generic',
  fallback = null,
  showModal = true,
  onRequireAuth
}: ActionGateProps): JSX.Element | null => {
  const { isAuthenticated } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false)

  if (isAuthenticated) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const actionLabels: Record<string, string> = {
    like: 'aimer cette vidéo',
    comment: 'laisser un commentaire',
    follow: 'suivre cette institution',
    apply: 'postuler à cette offre',
    message: 'envoyer un message',
    request: 'envoyer une demande',
    share: 'partager ce contenu',
    view_history: 'accéder à votre historique',
    view_requests: 'voir vos demandes',
    create_video: 'créer ou importer une vidéo',
    view_notifications: 'voir vos notifications',
    generic: 'effectuer cette action'
  }

  const handleClick = (): void => {
    if (showModal) {
      setShowLoginModal(true)
    }
    if (onRequireAuth) {
      onRequireAuth()
    }
  }

  const LockedAction = (): JSX.Element => (
    <button
      onClick={handleClick}
      className="flex items-center space-x-1 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <Lock className="w-4 h-4" />
      <span className="text-sm">Connexion requise</span>
    </button>
  )

  return (
    <>
      <LockedAction />
      
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Action réservée aux membres
              </h3>
              <p className="text-gray-600">
                Connectez-vous pour {actionLabels[action] || actionLabels.generic}
              </p>
            </div>
            
            <div className="space-y-3">
              <a
                href="/login"
                className="w-full block text-center bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </a>
              
              <a
                href="/register"
                className="w-full block text-center border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Créer un compte gratuitement
              </a>
            </div>
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700"
            >
              Continuer en visiteur
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ActionGate
