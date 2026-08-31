import type { Video as FeedVideo } from '../types/video'

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')
// S'assurer que l'URL de base est toujours propre et sans double /v1
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

const getEndpoint = (path: string): string => {
  const clean = path.replace(/^\/+/, '')
  if (API_BASE_URL.endsWith('/api/v1') && clean.startsWith('v1/')) {
    return `${API_BASE_URL}/${clean.replace(/^v1\//, '')}`
  }
  return `${API_BASE_URL}/${clean}`
}

export interface VideoData {
  title: string
  description?: string
  file?: File
  cover?: File
  is_public?: boolean
  isPublic?: boolean
  category?: string
  tags?: string[]
  allowComments?: boolean
  allowAnonymousComments?: boolean
  allowSharing?: boolean
  scheduledAt?: string
}

export interface Video {
  id: number
  title: string
  description: string
  owner: number
  owner_username?: string
  owner_full_name?: string
  owner_profession?: string | null
  owner_avatar?: string | null
  file?: string
  file_url?: string | null
  cover?: string | null
  cover_url?: string | null
  mime_type?: string | null
  created_at: string
  is_public: boolean
  views?: number
  views_count?: number
  likes_count?: number
  dislikes_count?: number
  is_liked?: boolean
  is_disliked?: boolean
  is_favorite?: boolean
  subscribers_count?: number
  is_subscribed?: boolean
  video_available?: boolean
}

export interface VideoInteractionState {
  id: number
  likes_count: number
  dislikes_count: number
  views_count: number
  is_liked: boolean
  is_disliked: boolean
  is_favorite: boolean
  is_subscribed?: boolean
  subscribers_count?: number
}

export const unwrapList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data.results)) return data.results as T[]
  return []
}

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#0EA5E9']

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')
  const origin = apiBase.replace(/\/api.*$/, '').replace(/\/$/, '')
  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

export const cleanUsername = (str?: string | null): string => {
  if (!str) return 'utilisateur'
  return str.replace(/^@+/, '').trim() || 'utilisateur'
}

export const mapApiVideo = (v: Video): FeedVideo => {
  const resolvedVideoUrl = resolveMediaUrl(v.file_url || (v.file ? `/media/${v.file}` : ''))
  const resolvedThumbnailUrl = resolveMediaUrl(v.cover_url || (v.cover ? `/media/${v.cover}` : ''))
  const resolvedAvatarUrl = resolveMediaUrl(v.owner_avatar)

  const cleanName = cleanUsername(v.owner_username || v.owner_full_name || `user_${v.owner}`)
  const displayName = v.owner_full_name?.trim() || cleanName
  const authorInitials = (displayName.replace(/^@+/, '').charAt(0) || cleanName.charAt(0) || 'U').toUpperCase()
  const avatarColor = AVATAR_COLORS[Math.abs(Number(v.owner) || 0) % AVATAR_COLORS.length]

  return {
    id: String(v.id),
    title: v.title,
    description: v.description,
    videoUrl: resolvedVideoUrl,
    thumbnailUrl: resolvedThumbnailUrl,
    thumbnail: resolvedThumbnailUrl,
    views: v.views ?? v.views_count ?? 0,
    viewsCount: v.views ?? v.views_count ?? 0,
    likes: v.likes_count ?? 0,
    dislikes: v.dislikes_count ?? 0,
    commentsCount: 0,
    createdAt: v.created_at,
    postedAt: v.created_at,
    mimeType: v.mime_type || undefined,
    author: {
      id: String(v.owner),
      name: displayName,
      username: `@${cleanName}`,
      profession: v.owner_profession || '',
      avatarUrl: resolvedAvatarUrl || undefined,
      avatar: resolvedAvatarUrl || undefined,
      avatarColor,
      initials: authorInitials,
      followers: v.subscribers_count ?? 0,
      verified: false,
    },
  }
}

export const getAuthToken = (passedToken?: string): string => {
  if (passedToken && typeof passedToken === 'string' && passedToken.trim()) {
    return passedToken.trim()
  }
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('exile_token') ||
    ''
  )
}

export const videoApi = {
  async getVideos(passedToken?: string, filters?: { owner?: string | number; search?: string }): Promise<{ success: boolean; data?: Video[]; error?: string }> {
    try {
      const token = getAuthToken(passedToken)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const params = new URLSearchParams()
      if (filters?.owner) params.append('owner', String(filters.owner))
      if (filters?.search) params.append('search', filters.search)
      const queryString = params.toString() ? `?${params.toString()}` : ''

      const response = await fetch(getEndpoint(`accueil/videos/${queryString}`), {
        method: 'GET',
        headers,
      })
      if (!response.ok) {
        return { success: false, error: 'Erreur lors de la récupération des vidéos' }
      }
      const data = await response.json()
      return { success: true, data: unwrapList<Video>(data) }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async getVideo(id: number): Promise<{ success: boolean; data?: Video; error?: string }> {
    try {
      const token = getAuthToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(getEndpoint(`accueil/videos/${id}/`), {
        method: 'GET',
        headers,
      })
      if (!response.ok) {
        return { success: false, error: 'Vidéo introuvable' }
      }
      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async getMyVideos(passedToken?: string): Promise<{ success: boolean; data?: Video[]; error?: string }> {
    try {
      const token = getAuthToken(passedToken)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(getEndpoint('accueil/videos/my_videos/'), {
        method: 'GET',
        headers,
      })
      if (!response.ok) {
        return { success: false, error: 'Erreur lors de la récupération de vos vidéos' }
      }
      const data = await response.json()
      return { success: true, data: unwrapList<Video>(data) }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async uploadVideo(
    videoData: VideoData | any,
    tokenOrProgress?: string | ((progress: number) => void),
    onProgressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; data?: Video; error?: string }> {
    try {
      let token = ''
      let onProgress: ((progress: number) => void) | undefined

      if (typeof tokenOrProgress === 'function') {
        onProgress = tokenOrProgress
        token = getAuthToken()
      } else {
        token = getAuthToken(tokenOrProgress)
        onProgress = onProgressCallback
      }

      const formData = new FormData()
      formData.append('title', videoData.title || '')
      if (videoData.description) formData.append('description', videoData.description)

      const isPublic = videoData.is_public !== undefined ? videoData.is_public : videoData.isPublic
      if (isPublic !== undefined) formData.append('is_public', isPublic.toString())

      if (videoData.file) formData.append('file', videoData.file)
      if (videoData.cover) {
        formData.append('cover', videoData.cover)
        formData.append('thumbnail', videoData.cover)
      } else if (videoData.thumbnail) {
        formData.append('cover', videoData.thumbnail)
        formData.append('thumbnail', videoData.thumbnail)
      }

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100)
            onProgress(percent)
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve({ success: true, data })
            } catch {
              resolve({ success: true })
            }
          } else {
            let errorMsg = 'Erreur lors de l\'upload de la vidéo'
            try {
              const errorData = JSON.parse(xhr.responseText)
              errorMsg = errorData.error || errorData.detail || errorMsg
            } catch {}
            resolve({ success: false, error: errorMsg })
          }
        })
        xhr.addEventListener('error', () => {
          resolve({ success: false, error: 'Erreur réseau lors de l\'upload' })
        })
        xhr.open('POST', getEndpoint('accueil/videos/'))
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.send(formData)
      })
    } catch {
      return { success: false, error: 'Erreur lors de la préparation de l\'upload' }
    }
  },

  async deleteVideo(id: number, passedToken?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = getAuthToken(passedToken)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(getEndpoint(`accueil/videos/${id}/`), {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) return { success: false, error: 'Erreur lors de la suppression' }
      return { success: true }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // INTERACTIONS OFFICIELLES BACKEND DJANGO (ZÉRO DUPLICATION)
  // ───────────────────────────────────────────────────────────────────────────

  async incrementView(id: number, token?: string): Promise<{ success: boolean; error?: string; views?: number }> {
    try {
      const authToken = getAuthToken(token)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const response = await fetch(getEndpoint(`accueil/videos/${id}/view/`), {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        return { success: false, error: 'Erreur lors de l\'incrémentation' }
      }

      const data = await response.json()
      return { success: true, views: data.views }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async likeVideo(videoId: number, passedToken?: string): Promise<{ success: boolean; error?: string; data?: VideoInteractionState }> {
    try {
      const token = getAuthToken(passedToken)
      if (!token) return { success: false, error: 'Connexion requise' }

      const response = await fetch(getEndpoint(`accueil/videos/${videoId}/like/`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        return { success: false, error: 'Impossible d\'enregistrer le like' }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async dislikeVideo(videoId: number, passedToken?: string): Promise<{ success: boolean; error?: string; data?: VideoInteractionState }> {
    try {
      const token = getAuthToken(passedToken)
      if (!token) return { success: false, error: 'Connexion requise' }

      const response = await fetch(getEndpoint(`accueil/videos/${videoId}/dislike/`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        return { success: false, error: 'Impossible d\'enregistrer le dislike' }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async favoriteVideo(videoId: number, passedToken?: string): Promise<{ success: boolean; error?: string; data?: { id: number; is_favorite: boolean; favorites_count: number } }> {
    try {
      const token = getAuthToken(passedToken)
      if (!token) return { success: false, error: 'Connexion requise' }

      const response = await fetch(getEndpoint(`accueil/videos/${videoId}/favorite/`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        return { success: false, error: 'Impossible d\'enregistrer le favori' }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async getVideoInteractions(videoId: number, passedToken?: string): Promise<{ success: boolean; error?: string; data?: VideoInteractionState }> {
    try {
      const token = getAuthToken(passedToken)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(getEndpoint(`accueil/videos/${videoId}/interactions/`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return { success: false, error: 'Erreur récupération interactions' }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async toggleSubscription(professionnelId: string | number, passedToken?: string): Promise<{ success: boolean; error?: string; data?: { is_subscribed: boolean; subscribers_count: number } }> {
    try {
      const token = getAuthToken(passedToken)
      if (!token) return { success: false, error: 'Connexion requise' }

      const response = await fetch(getEndpoint('abonnement/abonnements/toggle/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ professionnel_id: professionnelId })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        return {
          success: false,
          error: errJson?.error || errJson?.detail || 'Erreur lors de la modification de l\'abonnement'
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  // ── COMMENTAIRES ──
  async getComments(videoId: number, _token?: string): Promise<{ success: boolean; error?: string; data?: any[] }> {
    try {
      const localKey = `exile_comments_video_${videoId}`
      const localData = JSON.parse(localStorage.getItem(localKey) || '[]')
      return { success: true, data: localData }
    } catch {
      return { success: true, data: [] }
    }
  },

  async createComment(
    videoId: number,
    text: string,
    parentId?: number,
    isAnonymous?: boolean,
    _token?: string
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
      const localKey = `exile_comments_video_${videoId}`
      const currentComments: any[] = JSON.parse(localStorage.getItem(localKey) || '[]')

      const newComment = {
        id: Date.now(),
        text,
        is_anonymous: isAnonymous || false,
        user_username: isAnonymous ? 'Anonyme' : (userProfile?.username || userProfile?.name || 'Moi'),
        created_at: new Date().toISOString(),
        likes_count: 0,
        parent_id: parentId || null,
        replies: [],
      }

      if (parentId) {
        const updated = currentComments.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] }
          }
          return c
        })
        localStorage.setItem(localKey, JSON.stringify(updated))
      } else {
        const updated = [newComment, ...currentComments]
        localStorage.setItem(localKey, JSON.stringify(updated))
      }

      return { success: true, data: newComment }
    } catch {
      return { success: false, error: 'Impossible d\'enregistrer le commentaire' }
    }
  },

  async updateComment(commentId: number, text: string, _token: string): Promise<{ success: boolean; error?: string; data?: any }> {
    return { success: true, data: { id: commentId, text } }
  },

  async deleteComment(commentId: number, _token: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },

  async likeComment(commentId: number, _token: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },

  async dislikeComment(commentId: number, _token: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },

  async removeCommentReaction(commentId: number, _token: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },
}
