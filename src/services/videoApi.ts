const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export interface VideoData {
  title: string
  description?: string
  file?: File
  cover?: File
  is_public?: boolean
}

export interface Video {
  id: number
  title: string
  description: string
  uploader: number
  uploader_name?: string
  uploader_avatar?: string
  slug: string
  supabase_storage_path: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  mime_type?: string
  processing_status: string
  visibility: string
  created_at: string
  updated_at: string
  published_at?: string
  stats?: {
    views: number
    likes: number
    dislikes: number
    comments_count: number
    shares: number
  }
}

export const videoApi = {
  async getVideos(token?: string, params?: { uploader?: string; visibility?: string; search?: string }): Promise<{ success: boolean; error?: string; data?: Video[] }> {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const queryParams = new URLSearchParams()
      if (params?.uploader) queryParams.append('uploader', params.uploader)
      if (params?.visibility) queryParams.append('visibility', params.visibility)
      if (params?.search) queryParams.append('search', params.search)

      const url = `${API_BASE_URL}/videos/videos/${queryParams.toString() ? '?' + queryParams.toString() : ''}`

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

      const data: Video[] = await response.json()
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
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/videos/videos/${id}/`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur lors de la récupération de la vidéo'
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

      const response = await fetch(`${API_BASE_URL}/videos/videos/${id}/`, {
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
      const response = await fetch(`${API_BASE_URL}/videos/videos/${id}/`, {
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

      const response = await fetch(`${API_BASE_URL}/videos/videos/${id}/increment_view/`, {
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
      const response = await fetch(`${API_BASE_URL}/v1/videos/likes/`, {
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
      const response = await fetch(`${API_BASE_URL}/v1/videos/likes/${likeId}/`, {
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
      const response = await fetch(`${API_BASE_URL}/v1/videos/dislikes/`, {
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
      const response = await fetch(`${API_BASE_URL}/v1/videos/dislikes/${dislikeId}/`, {
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

      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/?video=${videoId}`, {
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

      const response = await fetch(`${API_BASE_URL}/v1/videos/comments/`, {
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
