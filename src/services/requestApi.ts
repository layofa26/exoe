const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
  ? API_BASE_URL.replace('/api', '/api/v1') 
  : API_BASE_URL

export interface Demande {
  id: number
  sender: string
  receiver: string
  message: string
  status: 'envoye' | 'refuse' | 'accepte' | 'bloque'
  created_at: string
}

export interface CreateDemandeRequest {
  receiver: string
  message: string
}

export const requestApi = {
  // Récupérer les demandes de l'utilisateur connecté
  getDemandes: async (status?: string, search?: string): Promise<{ success: boolean; data?: Demande[]; error?: string }> => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

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
      const token = localStorage.getItem('accessToken')

      // Récupérer le profil utilisateur pour obtenir le username
      const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
      const senderUsername = userProfile.username || userProfile.name

      if (!senderUsername) {
        return { success: false, error: 'Utilisateur non connecté' }
      }

      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver: request.receiver,
          message: request.message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || `Erreur HTTP: ${response.status}`)
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
      const token = localStorage.getItem('accessToken')

      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
      const token = localStorage.getItem('accessToken')

      const response = await fetch(`${FINAL_API_BASE_URL}/demandes/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

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
