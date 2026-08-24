const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
  ? API_BASE_URL.replace('/api', '/api/v1') 
  : API_BASE_URL

// Le backend expose les demandes soit a la racine, soit sous le prefixe de l'app
const DEMANDE_PATHS = ['/demandes', '/demande/demandes']

const demandeFetch = async (suffix: string, init: RequestInit): Promise<Response> => {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let lastResponse: Response | null = null
  for (const basePath of DEMANDE_PATHS) {
    const response = await fetch(`${FINAL_API_BASE_URL}${basePath}${suffix}`, { ...init, headers })
    if (response.status !== 404) return response
    lastResponse = response
  }
  return lastResponse as Response
}

export interface Demande {
  id: number
  sender: string
  sender_full_name?: string
  receiver: string
  receiver_full_name?: string
  message: string
  status: 'envoye' | 'refuse' | 'accepte' | 'bloque'
  created_at: string
}

export interface CreateDemandeRequest {
  receiver_username: string
  message: string
}

export const requestApi = {
  // Récupérer les demandes de l'utilisateur connecté
  getDemandes: async (status?: string, search?: string): Promise<{ success: boolean; data?: Demande[]; error?: string }> => {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      const response = await demandeFetch(`/?${params.toString()}`, { method: 'GET' })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error)
      return { success: false, error: 'Impossible de récupérer les demandes' }
    }
  },

  // Créer une nouvelle demande
  createDemande: async (request: CreateDemandeRequest): Promise<{ success: boolean; data?: Demande; error?: string }> => {
    try {
      if (!localStorage.getItem('accessToken')) {
        return { success: false, error: 'Vous devez être connecté pour contacter un professionnel.' }
      }

      const response = await demandeFetch('/', {
        method: 'POST',
        body: JSON.stringify({
          receiver_username: request.receiver_username,
          message: request.message
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend error details:', errorData)
        const fieldError = Array.isArray(errorData.receiver) ? errorData.receiver[0] : errorData.receiver
        throw new Error(fieldError || errorData.detail || errorData.message || `Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Impossible de créer la demande' }
    }
  },

  // Mettre à jour le statut d'une demande
  updateDemande: async (id: number, status: string): Promise<{ success: boolean; data?: Demande; error?: string }> => {
    try {
      const response = await demandeFetch(`/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error)
      return { success: false, error: 'Impossible de mettre à jour la demande' }
    }
  },

  // Supprimer une demande
  deleteDemande: async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await demandeFetch(`/${id}/`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la suppression de la demande:', error)
      return { success: false, error: 'Impossible de supprimer la demande' }
    }
  }
}
