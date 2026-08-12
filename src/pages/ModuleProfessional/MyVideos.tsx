import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Video,
  Plus,
  Eye,
  ThumbsUp,
  MessageSquare,
  Edit3,
  Trash2,
  Search,
  Grid3X3,
  List,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface MyVideo {
  id: string
  title: string
  thumbnailUrl?: string
  duration?: number
  viewsCount: number
  likesCount: number
  commentsCount: number
  status: string
  createdAt: string
  visibility: string
  author?: {
    id: string
    username: string
    fullName: string
    avatarUrl?: string
  }
}

export const MyVideos = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<MyVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        
        if (!token) {
          setError('Vous devez être connecté pour voir vos vidéos')
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/accueil/videos/my_videos/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        const videosData = Array.isArray(data) ? data : (data.results || [])
        
        setVideos(videosData.map((video: any) => ({
          id: video.id,
          title: video.title,
          thumbnailUrl: video.cover_url,
          duration: video.duration,
          viewsCount: video.views_count || 0,
          likesCount: video.likes_count || 0,
          commentsCount: video.comments_count || 0,
          status: video.is_public ? 'PUBLISHED' : 'DRAFT',
          createdAt: video.created_at,
          visibility: video.is_public ? 'public' : 'private',
          author: video.owner
        })))
      } catch (error) {
        console.error('Error loading videos:', error)
        setError('Erreur lors du chargement des vidéos')
      } finally {
        setLoading(false)
      }
    }
    loadVideos()

    // Écouter l'événement de publication de vidéo pour rafraîchir la liste
    const handleVideoPublished = () => {
      console.log('📢 Video published event received in MyVideos, refreshing...')
      loadVideos()
    }

    window.addEventListener('video-published', handleVideoPublished)

    return () => {
      window.removeEventListener('video-published', handleVideoPublished)
    }
  }, [])

  const filteredVideos = videos.filter(video => {
    const matchesFilter = filter === 'all' || 
      (filter === 'published' && video.status === 'PUBLISHED') ||
      (filter === 'draft' && video.status === 'DRAFT')
    const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: videos.length,
    published: videos.filter(v => v.status === 'PUBLISHED').length,
    draft: videos.filter(v => v.status === 'DRAFT').length,
    totalViews: videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0),
    totalLikes: videos.reduce((acc, v) => acc + (v.likesCount || 0), 0)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        
        const response = await fetch(`${API_BASE_URL}/accueil/videos/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          setVideos(videos.filter(v => v.id !== id))
        } else {
          alert('Erreur lors de la suppression de la vidéo')
        }
      } catch (error) {
        console.error('Error deleting video:', error)
        alert('Erreur lors de la suppression de la vidéo')
      }
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center p-8">
          <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 mb-6 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pro/profile')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mes vidéos</h1>
                <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez et organisez votre contenu</p>
              </div>
              <Link
                to="/pro"
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouvelle vidéo
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>Total vidéos</p>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>Publiées</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>Brouillons</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.draft}</p>
          </div>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 shadow-sm border`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>Vues totales</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(stats.totalViews / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-4 mb-6 border`}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher une vidéo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${resolvedTheme === 'dark' ? 'border-zinc-600 bg-zinc-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'published', label: 'Publiées' },
                { id: 'draft', label: 'Brouillons' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* View Mode */}
            <div className={`flex gap-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-lg p-1`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-600 shadow-sm text-primary' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-600 shadow-sm text-primary' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

        {/* Videos */}
        {filteredVideos.length === 0 ? (
          <div className={`text-center py-16 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
            <Video className={`w-16 h-16 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              {searchQuery ? 'Aucune vidéo trouvée' : 'Aucune vidéo pour l\'instant'}
            </h3>
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-6`}>
              {searchQuery ? 'Essayez une autre recherche' : 'Importez votre première vidéo pour commencer'}
            </p>
            {!searchQuery && (
              <Link
                to="/pro"
                className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Importer une vidéo
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View - Responsive: Mobile 1 col, Tablet 2 cols, Laptop 2 cols, Desktop 3 cols
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div key={video.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm overflow-hidden group border`}>
                {/* Thumbnail */}
                <div className={`relative aspect-video ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  {video.status === 'PROCESSING' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>Traitement en cours...</span>
                    </div>
                  ) : video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className={`w-12 h-12 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                  {video.status !== 'PROCESSING' && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration ? formatDuration(video.duration) : '00:00'}
                    </span>
                  )}
                  {video.status === 'DRAFT' && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Brouillon
                    </span>
                  )}
                  {video.status === 'PROCESSING' && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                      Traitement
                    </span>
                  )}

                  {/* Hover Actions - Only show if not processing */}
                  {video.status !== 'PROCESSING' && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Link
                        to={`/pro/video/${video.id}`}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 bg-white rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 line-clamp-2`}>{video.title}</h3>
                  <div className={`flex items-center gap-4 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.viewsCount?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {video.likesCount?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {video.commentsCount?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} mt-2`}>
                    {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm overflow-hidden border`}>
            {filteredVideos.map((video, index) => (
              <div
                key={video.id}
                className={`flex items-center gap-4 p-4 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700 border-zinc-700' : 'hover:bg-gray-50 border-gray-100'} transition-colors ${index !== filteredVideos.length - 1 ? 'border-b' : ''}`}
              >
                {/* Thumbnail */}
                <div className={`relative w-40 aspect-video ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-lg overflow-hidden flex-shrink-0`}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className={`w-8 h-8 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration ? formatDuration(video.duration) : '00:00'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>{video.title}</h3>
                  <div className={`flex items-center gap-4 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.viewsCount?.toLocaleString() || 0} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {video.likesCount?.toLocaleString() || 0} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {video.commentsCount?.toLocaleString() || 0} commentaires
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Status */}
                {video.status === 'DRAFT' && (
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                    Brouillon
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/pro/video/${video.id}`}
                    className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} hover:text-primary rounded-lg transition-colors`}
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700' : 'text-gray-500 hover:bg-gray-100'} hover:text-primary rounded-lg transition-colors`}>
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className={`p-2 ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format duration in seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default MyVideos
