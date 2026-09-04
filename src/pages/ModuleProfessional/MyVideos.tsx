import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Video,
  Plus,
  Eye,
  ThumbsUp,
  MessageSquare,
  Trash2,
  Search,
  Grid3X3,
  List,
  Clock,
  ArrowLeft,
  Sparkles,
  Share2,
  Play,
  Film,
  CheckCircle2,
  FileEdit,
  X
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from '../../hooks/useQuery'
import { cacheService } from '../../services/cacheService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // SWR query avec chargement instantané (0ms) depuis le cache
  const {
    data: cachedVideos,
    isLoading: loading,
    error: queryError,
    refetch: loadVideos,
    setData: setVideos
  } = useQuery<MyVideo[]>(
    async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Vous devez être connecté pour voir vos vidéos')
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
      
      return videosData.map((video: any) => ({
        id: String(video.id),
        title: video.title,
        thumbnailUrl: video.cover_url || video.cover,
        duration: video.duration,
        viewsCount: video.views_count || video.views || 0,
        likesCount: video.likes_count || 0,
        commentsCount: video.comments_count || 0,
        status: video.is_public ? 'PUBLISHED' : 'DRAFT',
        createdAt: video.created_at,
        visibility: video.is_public ? 'public' : 'private',
        author: video.owner
      }))
    },
    {
      cacheKey: (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}');
          return `pro:videos:my:${profile?.id || localStorage.getItem('exile_client_uuid') || 'guest'}`;
        } catch {
          return 'pro:videos:my:guest';
        }
      })(),
      cacheTime: 3 * 60 * 1000,
      initialData: []
    }
  )

  const videos = cachedVideos || []
  const error = queryError ? queryError.message : null

  useEffect(() => {
    const handleVideoPublished = () => {
      loadVideos()
    }
    window.addEventListener('video-published', handleVideoPublished)
    return () => window.removeEventListener('video-published', handleVideoPublished)
  }, [loadVideos])

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
          setVideos(prev => prev ? prev.filter(v => v.id !== id) : [])
          cacheService.invalidate('pro:videos:feed')
        } else {
          alert('Erreur lors de la suppression de la vidéo')
        }
      } catch (error) {
        console.error('Error deleting video:', error)
        alert('Erreur lors de la suppression de la vidéo')
      }
    }
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} pb-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Pro Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pro/profile')}
              className={`p-2.5 rounded-xl border transition-all ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
                  : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-900'
              } shadow-sm active:scale-95`}
              title="Retour au profil"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Film className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mes vidéos</h1>
              </div>
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                Gérez, organisez et suivez la performance de vos publications
              </p>
            </div>
          </div>

          <Link
            to="/pro"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle vidéo</span>
          </Link>
        </div>

        {/* Stats Dashboard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Total Vidéos</span>
              <Film className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold">{stats.total}</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Publiées</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-500">{stats.published}</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Brouillons</span>
              <FileEdit className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-500">{stats.draft}</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Vues Totales</span>
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-extrabold text-purple-500">
              {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews}
            </p>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className={`p-3 sm:p-4 rounded-2xl border ${
          resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
        } shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`}>
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 py-2 rounded-xl text-sm border transition-colors ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Toutes', count: stats.total },
              { id: 'published', label: 'Publiées', count: stats.published },
              { id: 'draft', label: 'Brouillons', count: stats.draft }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  filter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filter === f.id
                    ? 'bg-white/20 text-white'
                    : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}

            {/* View Mode Toggle */}
            <div className={`ml-2 flex items-center p-1 rounded-xl border ${
              resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                }`}
                title="Vue grille"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                }`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Content Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`rounded-2xl border p-3 animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
              }`}>
                <div className={`w-full aspect-video rounded-xl mb-3 ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                }`} />
                <div className={`h-4 w-3/4 rounded mb-2 ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                }`} />
                <div className={`h-3 w-1/2 rounded ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {searchQuery ? 'Aucune vidéo trouvée' : 'Aucune vidéo pour le moment'}
            </h3>
            <p className={`text-xs sm:text-sm mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Modifiez vos termes de recherche pour trouver du contenu.' : 'Partagez votre première création avec votre communauté dès aujourd\'hui.'}
            </p>
            {!searchQuery && (
              <Link
                to="/pro"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Publier une vidéo</span>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`group rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } flex flex-col justify-between`}
              >
                <div>
                  {/* Thumbnail area */}
                  <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <Play className="w-10 h-10 mb-1 opacity-40" />
                        <span className="text-[11px] font-medium">Aperçu indisponible</span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-md ${
                        video.status === 'PUBLISHED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {video.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}
                      </span>
                    </div>

                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-bold backdrop-blur-xs">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        onClick={() => navigate(`/pro/video/${video.id}`)}
                        className="p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg transition-transform hover:scale-110"
                        title="Regarder"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-110"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="p-4 space-y-2">
                    <h3
                      onClick={() => navigate(`/pro/video/${video.id}`)}
                      className="font-bold text-sm sm:text-base line-clamp-2 hover:text-blue-500 cursor-pointer transition-colors"
                      title={video.title}
                    >
                      {video.title}
                    </h3>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className={`p-4 pt-0 border-t ${
                  resolvedTheme === 'dark' ? 'border-zinc-800/80' : 'border-gray-100'
                } flex items-center justify-between text-xs ${
                  resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                } mt-2`}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      {video.viewsCount}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {video.likesCount}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {video.commentsCount}
                    </span>
                  </div>
                  <span className="text-[11px]">
                    {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border divide-y overflow-hidden ${
            resolvedTheme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 divide-zinc-800'
              : 'bg-white border-gray-200 divide-gray-100'
          } shadow-sm`}>
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  resolvedTheme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-28 sm:w-36 aspect-video bg-zinc-950 rounded-xl overflow-hidden flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <Play className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-white text-[10px] font-bold">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        video.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {video.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}
                      </span>
                      <span className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                        {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3
                      onClick={() => navigate(`/pro/video/${video.id}`)}
                      className="font-bold text-sm sm:text-base truncate cursor-pointer hover:text-blue-500 transition-colors"
                    >
                      {video.title}
                    </h3>
                    <div className={`flex items-center gap-3 text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-1`}>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {video.viewsCount} vues</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {video.likesCount} likes</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {video.commentsCount} comm.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => navigate(`/pro/video/${video.id}`)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
                    title="Voir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default MyVideos
