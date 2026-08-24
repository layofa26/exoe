import { useState } from 'react'
import { 
  X, 
  Send, 
  MessageSquare, 
  Check, 
  AlertCircle
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { requestApi, CreateDemandeRequest } from '../../services/requestApi'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  receiver: {
    id: string
    name: string
    username?: string
    avatar: string | null
    profession: string
  }
  sender: {
    id: string
    name: string
    avatar: string | null
    profession: string
  }
}

export const ContactModal = ({
  isOpen,
  onClose,
  receiver,
  sender
}: ContactModalProps): JSX.Element | null => {
  const { resolvedTheme } = useTheme()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) return

    // Vérifier si l'utilisateur essaie de s'envoyer à lui-même
    if (sender.id === receiver.id) {
      setResult({
        success: false,
        message: 'Vous ne pouvez pas envoyer de demande à vous-même.'
      })
      return
    }

    setIsSubmitting(true)
    
    const request: CreateDemandeRequest = {
      receiver_username: receiver.username || receiver.name, // Backend identifie le destinataire par username
      message: message.trim()
    }

    const response = await requestApi.createDemande(request)
    
    if (response.success) {
      setResult({ success: true, message: 'Demande envoyée avec succès!' })
      setTimeout(() => {
        onClose()
        setResult(null)
        setMessage('')
      }, 2000)
    } else {
      setResult({ success: false, message: response.error || 'Une erreur est survenue' })
    }
    setIsSubmitting(false)
  }

  // Fonction pour empêcher la propagation du clic
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto`}
        onClick={handleContainerClick}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className={`font-semibold text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Contacter un professionnel</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Info du destinataire */}
          <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
            {receiver.avatar ? (
              <img
                src={receiver.avatar}
                alt={receiver.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                {receiver.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className={`font-medium text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{receiver.name}</p>
              <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{receiver.profession}</p>
            </div>
          </div>

          {/* Résultat */}
          {result && (
            <div className={`flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${
              result.success 
                ? resolvedTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
                : resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              {result.success ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {result.message}
            </div>
          )}

          {!result?.success && (
            <>
              {/* Message */}
              <div className="space-y-2 sm:space-y-3">
                <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Votre message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  rows={4}
                  disabled={isSubmitting}
                  className={`w-full px-2.5 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
                    resolvedTheme === 'dark' 
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } ${isSubmitting ? (resolvedTheme === 'dark' ? 'bg-zinc-800 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed') : ''}`}
                  maxLength={500}
                />
                <p className={`text-[10px] sm:text-xs mt-0.5 text-right ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {message.length}/500
                </p>
              </div>

              {/* Bouton envoyer */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className="w-full items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Envoyer la demande
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
