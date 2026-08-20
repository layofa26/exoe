import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, X } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface Draft {
  id: string
  title: string
  status: 'DRAFT' | 'UPLOADING' | 'FAILED' | 'READY'
  uploadProgress: number
  createdAt: string
}

interface DraftDetectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DraftDetectionModal = ({ isOpen, onClose }: DraftDetectionModalProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      checkDrafts()
    }
  }, [isOpen])

  const checkDrafts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Token non trouvé')
        return
      }

      const response = await fetch(`${API_BASE_URL}/accueil/videos/drafts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDrafts(data.results || data)
      } else {
        setError('Impossible de charger les brouillons')
      }
    } catch (error) {
      console.error('Error checking drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = (draft: Draft) => {
    onClose()
    navigate('/pro/upload', { state: { draft, resume: true } })
  }

  const handleDelete = async (draftId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ?')) return

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/accueil/videos/${draftId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        alert('Brouillon supprimé avec succès')
        checkDrafts()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleViewAll = () => {
    localStorage.setItem('exile_drafts_dismissed', 'true')
    onClose()
    navigate('/pro/drafts')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[40000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Brouillons en attente
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vous avez {drafts.length} brouillon{drafts.length > 1 ? 's' : ''} en attente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pro"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucun brouillon en attente
              </p>
            </div>
          ) : (
            <>
              {/* Drafts List */}
              <div className="space-y-3 mb-6">
                {drafts.slice(0, 3).map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {draft.title || 'Sans titre'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {draft.status === 'UPLOADING' && 'Upload en cours'}
                            {draft.status === 'DRAFT' && 'Brouillon'}
                            {draft.status === 'FAILED' && 'Échec'}
                          </span>
                          {draft.status === 'UPLOADING' && (
                            <span>• {draft.uploadProgress}%</span>
                          )}
                        </div>
                      </div>
                      {draft.status === 'FAILED' && (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContinue(draft)}
                        className="flex-1 px-3 py-2 bg-pro text-white rounded-lg hover:bg-pro/90 text-sm font-medium"
                      >
                        {draft.status === 'UPLOADING' ? 'Continuer' : 'Modifier'}
                      </button>
                      <button
                        onClick={() => handleDelete(draft.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {drafts.length > 3 && (
                <button
                  onClick={handleViewAll}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-medium"
                >
                  Voir tous les brouillons ({drafts.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
