import type { Video as FeedVideo } from '../types/video'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
  ? API_BASE_URL.replace('/api', '/api/v1') 
  : API_BASE_URL

export interface VideoData {
  title: string
  description?: string
  file?: File
  cover?: File
  is_public?: boolean
}

/**
 * Forme réelle renvoyée par VideoSerializer (backend Django).
 */
export interface Video {
  id: number
  title: string
  description: string
  owner: number
  owner_username?: string
  owner_full_name?: string
  owner_avatar?: string | null
  file?: string
  file_url?: string | null
  cover?: string | null
  cover_url?: string | null
  mime_type?: string | null
  created_at: string
  is_public: boolean
  views?: number
  video_available?: boolean
}

/**
 * DRF peut renvoyer une liste simple ou une réponse paginée.
 */
export const unwrapList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data.results)) return data.results as T[]
  return []
}

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#0EA5E9']

/**
 * Convertit une vidéo de l'API en vidéo utilisée par l'UI.
 * L'auteur affiché est toujours le propriétaire de la vidéo.
 */
export const mapApiVideo = (apiVideo: Video): FeedVideo => {
  const authorName =
    apiVideo.owner_full_name || apiVideo.owner_username || 'Utilisateur'
  const authorId = apiVideo.owner != null ? String(apiVideo.owner) : ''
  const colorIndex = Math.abs(Number(apiVideo.owner) || 0) % AVATAR_COLORS.length
  const videoUrl = apiVideo.file_url || ''
  const thumbnail = apiVideo.cover_url || ''

  return {
    id: String(apiVideo.id),
    title: apiVideo.title,
    description: apiVideo.description || '',
    videoUrl,
    mimeType: apiVideo.mime_type || undefined,
    thumbnail,
    thumbnailUrl: thumbnail,
    videoAvailable: Boolean(apiVideo.video_available ?? videoUrl),
    author: {
      id: authorId,
      name: authorName,
      profession: 'Professionnel',
      location: '',
      initials: authorName.charAt(0).toUpperCase(),
      avatarColor: AVATAR_COLORS[colorIndex],
      avatarUrl: apiVideo.owner_avatar || undefined,
    },
    views: apiVideo.views ?? 0,
    viewsCount: apiVideo.views ?? 0,
    likes: 0,
    comments: [],
    postedAt: apiVideo.created_at,
    createdAt: apiVideo.created_at,
    category: 'Vidéo',
    visibility: apiVideo.is_public ? 'PUBLIC' : 'PRIVATE',
    status: 'PUBLISHED',
    allowComments: true,
    allowLikes: true,
    allowShares: true,
  }
}

const getStoredToken = (token?: string): string | null =>
  token ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('access_token')

export interface UploadVideoInput {
  file: File
  title: string
  description?: string
  isPublic?: boolean
  cover?: File | null
}

export const videoApi = {
  /**
   * Upload multipart vers /accueil/videos/ avec progression réelle (XHR).
   */
  uploadVideo(
    input: UploadVideoInput,
    onProgress?: (percent: number) => void,
    token?: string
  ): Promise<{ success: boolean; error?: string; data?: Video }> {
    return new Promise((resolve) => {
      const authToken = getStoredToken(token)
      if (!authToken) {
        resolve({ success: false, error: 'Vous devez être connecté pour publier une vidéo' })
        return
      }

      const formData = new FormData()
      formData.append('file', input.file)
      formData.append('title', input.title)
      formData.append('description', input.description || '')
      formData.append('is_public', input.isPublic === false ? 'false' : 'true')
      if (input.cover) {
        formData.append('cover', input.cover)
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${FINAL_API_BASE_URL}/accueil/videos/`)
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        let payload: any = null
        try {
          payload = JSON.parse(xhr.responseText)
        } catch {
          payload = null
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, data: payload as Video })
        } else {
          resolve({
            success: false,
            error:
              payload?.error ||
              payload?.detail ||
              `Erreur lors de l'upload (code ${xhr.status})`,
          })
        }
      }

      xhr.onerror = () => resolve({ success: false, error: 'Erreur de connexion au serveur' })
      xhr.onabort = () => resolve({ success: false, error: 'Upload annulé' })

      xhr.send(formData)
    })
  },

  /**
   * Vidéos de l'utilisateur connecté (publiques et privées).
   */
  async getMyVideos(token?: string): Promise<{ success: boolean; error?: string; data?: Video[] }> {
    try {
      const authToken = getStoredToken(token)
      if (!authToken) {
        return { success: false, error: 'Non authentifié' }
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/accueil/videos/my_videos/`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!response.ok) {
        return { success: false, error: 'Erreur lors de la récupération de vos vidéos' }
      }

      return { success: true, data: unwrapList<Video>(await response.json()) }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  },

  async getVideos(token?: string, params?: { owner?: string; search?: string }): Promise<{ success: boolean; error?: string; data?: Video[] }> {
    try {
      const headers: Record<string, string> = {}
      const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const queryParams = new URLSearchParams()
      if (params?.owner) queryParams.append('owner', params.owner)
      if (params?.search) queryParams.append('search', params.search)

      const url = `${FINAL_API_BASE_URL}/accueil/videos/${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des vidéos'
        }
      }

      const data = unwrapList<Video>(await response.json())
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async getVideo(id: number, token?: string): Promise<{ success: boolean; error?: string; data?: Video }> {
    try {
      const headers: Record<string, string> = {}
      const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/accueil/videos/${id}/`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          error: response.status === 404
            ? 'Cette vidéo n\'existe pas ou n\'est plus disponible'
            : 'Erreur lors de la récupération de la vidéo'
        }
      }

      const data: Video = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async updateVideo(id: number, videoData: Partial<VideoData>, token: string): Promise<{ success: boolean; error?: string; data?: Video }> {
    try {
      const formData = new FormData()
      
      if (videoData.title) {
        formData.append('title', videoData.title)
      }
      
      if (videoData.description) {
        formData.append('description', videoData.description)
      }
      
      if (videoData.is_public !== undefined) {
        formData.append('visibility', videoData.is_public ? 'public' : 'private')
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/accueil/videos/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || errorData.error || 'Erreur lors de la mise à jour de la vidéo'
        }
      }

      const data: Video = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async deleteVideo(id: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/accueil/videos/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la suppression de la vidéo'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async incrementView(id: number, token?: string): Promise<{ success: boolean; error?: string; views?: number }> {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/accueil/videos/${id}/view/`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de l\'incrémentation des vues'
        }
      }

      const data = await response.json()
      return { success: true, views: data.views }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async likeVideo(videoId: number, token: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/likes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video: videoId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || 'Erreur lors du like'
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async unlikeVideo(likeId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/likes/${likeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors du unlike'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async dislikeVideo(videoId: number, token: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/dislikes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video: videoId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || 'Erreur lors du dislike'
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async undislikeVideo(dislikeId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/dislikes/${dislikeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors du undislike'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async getComments(videoId: number, token?: string): Promise<{ success: boolean; error?: string; data?: any[] }> {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/comments/?video=${videoId}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des commentaires'
        }
      }

      const data = await response.json()
      return { success: true, data: data.results || data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async createComment(videoId: number, text: string, parentId?: number, isAnonymous?: boolean, token?: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const body: any = {
        video_id: videoId,
        text,
        is_anonymous: isAnonymous || false,
      }
      if (parentId) {
        body.parent_id = parentId
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/v1/videos/comments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || 'Erreur lors de la création du commentaire'
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async updateComment(commentId: number, text: string, token: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/${commentId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || 'Erreur lors de la modification du commentaire'
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async deleteComment(commentId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la suppression du commentaire'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async likeComment(commentId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/${commentId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors du like du commentaire'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async dislikeComment(commentId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/${commentId}/dislike/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors du dislike du commentaire'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },

  async removeCommentReaction(commentId: number, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/${commentId}/remove_reaction/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la suppression de la réaction'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  },
}
