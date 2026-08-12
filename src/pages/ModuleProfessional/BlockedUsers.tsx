import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UserX,
  Shield,
  Check,
  Loader2
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { getCurrentUserId } from '../../services/apiClient'

interface BlockedUser {
  id: string
  blockerId: string
  blockedId: string
  blocked: {
    id: string
    username: string
    fullName: string
    avatarUrl?: string
    professionalProfile?: {
      profession: string
    }
  }
  createdAt: string
}

export const BlockedUsers = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const handleBack = () => {
    navigate('/pro/requests')
  }

  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }
        
        const userId = getCurrentUserId()
        
        // Load blocked users from backend
        const result = await api.get('/v1/blocked/blocked/')
        
        if (result.success && result.data) {
          const blockedUsersData = (result.data.results || result.data).map((block: any) => ({
            id: String(block.id),
            blockerId: String(block.blocker),
            blockedId: String(block.blocked),
            blocked: block.blocked_user || {},
            createdAt: block.created_at
          }))
          setBlockedUsers(blockedUsersData)
        }
      } catch (err) {
        console.error('Error loading blocked users:', err)
        setError('Erreur lors du chargement des utilisateurs bloqués')
      } finally {
        setLoading(false)
      }
    }
    
    loadBlockedUsers()
  }, [navigate])

  const handleUnblock = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Token non trouvé. Veuillez vous reconnecter.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/blocked/blocked-users/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blocked_user: userId })
      })

      if (response.ok) {
        setToast('Utilisateur débloqué avec succès')
        setTimeout(() => setToast(''), 3000)
        // Reload the blocked users list
        loadBlockedUsers()
      } else {
        throw new Error('Erreur lors du déblocage')
      }
    } catch (err) {
      console.error('Error unblocking user:', err)
      setToast('Erreur lors du déblocage')
      setTimeout(() => setToast(''), 3000)
    }
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg flex items-center gap-1.5 sm:gap-2">
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-[100] md:mt-0 w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-2`}>
        <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Utilisateurs Bloqués</h1>
              <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez vos utilisateurs bloqués</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pt-44 sm:pt-52 md:pt-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <UserX className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3 sm:mb-4`} />
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucun utilisateur bloqué</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {blockedUsers.map((blockedUser) => (
              <div key={blockedUser.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-2.5 sm:p-3 shadow-sm`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      {blockedUser.blocked.avatarUrl ? (
                        <img 
                          src={blockedUser.blocked.avatarUrl} 
                          alt={blockedUser.blocked.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                          {blockedUser.blocked.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                        {blockedUser.blocked.fullName}
                      </h3>
                      <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>
                        {blockedUser.blocked.professionalProfile?.profession || blockedUser.blocked.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                      Bloqué le {new Date(blockedUser.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleUnblock(blockedUser.blockedId)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-emerald-700 transition-colors mt-1 sm:mt-2"
                  >
                    Débloquer
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

export default BlockedUsers
