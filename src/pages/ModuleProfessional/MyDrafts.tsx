import { useNavigate } from 'react-router-dom'
import { Play, Edit, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface Draft {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: 'DRAFT' | 'UPLOADING' | 'FAILED' | 'READY'
  uploadProgress: number
  createdAt: string
  tags: string[]
  category: string | null
}

export const MyDrafts = () => {
  const navigate = useNavigate()

  const {
    data: cachedDrafts,
    isLoading: loading,
    error: queryError,
    refetch: loadDrafts,
    setData: setDrafts
  } = useQuery<Draft[]>(
    async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (!token) return []

      const response = await fetch(`${API_BASE_URL}/accueil/videos/drafts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        return data.results || data || []
      }
      return []
    },
    {
      cacheKey: 'pro:videos:drafts',
      cacheTime: 3 * 60 * 1000,
      initialData: []
    }
  )

  const drafts = cachedDrafts || []
  const error = queryError ? queryError.message : null

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
        loadDrafts()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Error deleting draft:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEdit = (draft: Draft) => {
    // Navigate to upload page with draft data
    navigate('/pro/upload', { state: { draft } })
  }

  const handleContinue = (draft: Draft) => {
    // Resume upload
    navigate('/pro/upload', { state: { draft, resume: true } })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'UPLOADING':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'READY':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon'
      case 'UPLOADING':
        return 'Upload en cours'
      case 'FAILED':
        return 'Échec'
      case 'READY':
        return 'Prêt à publier'
      default:
        return 'Inconnu'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'UPLOADING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'FAILED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'READY':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pro"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Brouillons</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gérez vos vidéos en cours de création
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun brouillon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Commencez à créer une vidéo pour voir vos brouillons ici
            </p>
            <button
              onClick={() => navigate('/pro/upload')}
              className="px-6 py-3 bg-pro text-white rounded-lg hover:bg-pro/90"
            >
              Créer une vidéo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 dark:bg-zinc-700 relative">
                  {draft.thumbnailUrl ? (
                    <img
                      src={draft.thumbnailUrl}
                      alt={draft.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                      {getStatusIcon(draft.status)}
                      {getStatusText(draft.status)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  {draft.status === 'UPLOADING' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-zinc-600">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${draft.uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                    {draft.title || 'Sans titre'}
                  </h3>
                  {draft.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {draft.description}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {draft.tags && draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {draft.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-pro/10 text-pro rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {draft.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{draft.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category */}
                  {draft.category && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {draft.category}
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {new Date(draft.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {draft.status === 'UPLOADING' ? (
                      <button
                        onClick={() => handleContinue(draft)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Continuer
                      </button>
                    ) : draft.status === 'READY' ? (
                      <button
                        onClick={() => handleContinue(draft)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Publier
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(draft)}
                        className="flex-1 px-3 py-2 bg-pro text-white rounded-lg hover:bg-pro/90 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
