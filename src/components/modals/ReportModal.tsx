import { useState } from 'react'
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import type { ReportReason } from '../../types/requests'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: {
    id: string
    name: string
    avatar?: string | null
  }
  context?: 'profile' | 'request' | 'conversation'
  contextId?: string
  onReport: (targetUserId: string, reason: ReportReason, description: string) => void
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'harassment',
    label: 'Harcèlement',
    description: 'Comportement abusif, menaces ou intimidation'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Messages non sollicités ou publicité répétée'
  },
  {
    value: 'inappropriate',
    label: 'Contenu inapproprié',
    description: 'Langage offensant, contenu choquant ou NSFW'
  },
  {
    value: 'fake',
    label: 'Fausse identité',
    description: 'Profil frauduleux ou usurpation d\'identité'
  },
  {
    value: 'scam',
    label: 'Arnaque/Fraude',
    description: 'Tentative d\'escroquerie ou demande d\'argent'
  },
  {
    value: 'other',
    label: 'Autre',
    description: 'Toute autre raison non listée ci-dessus'
  }
]

export const ReportModal = ({
  isOpen,
  onClose,
  targetUser,
  onReport
}: ReportModalProps) => {
  const { resolvedTheme } = useTheme()
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedReason) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onReport(targetUser.id, selectedReason, description)
    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDescription('')
    setIsSubmitted(false)
    onClose()
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <div className={`${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 text-center animate-fadeIn`}>
          <div className={`w-16 h-16 sm:w-20 sm:h-20 ${resolvedTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
            <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <h3 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>
            Signalement envoyé
          </h3>
          <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4 sm:mb-6`}>
            Merci pour votre signalement. Notre équipe l'examinera dans les plus brefs délais.
          </p>
          <button
            onClick={handleClose}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className={`${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fadeIn`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-xl ${resolvedTheme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
              <Flag className={`w-5 h-5 sm:w-6 sm:h-6 ${resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <h2 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Signaler un utilisateur
              </h2>
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {targetUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-xl transition-colors`}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* Warning */}
          <div className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-xl mb-4 sm:mb-6 ${resolvedTheme === 'dark' ? 'bg-orange-900/20 border-orange-800 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            <p className="text-xs sm:text-sm">
              Les faux signalements peuvent entraîner des sanctions contre votre compte. 
              Veuillez utiliser cette fonction avec discernement.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2 sm:space-y-3">
            <label className={`block text-xs sm:text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2 sm:mb-3`}>
              Motif du signalement <span className="text-red-500">*</span>
            </label>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedReason === reason.value
                    ? 'border-primary bg-primary/5'
                    : resolvedTheme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={() => setSelectedReason(reason.value)}
                  className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <p className={`font-semibold text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {reason.label}
                  </p>
                  <p className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {reason.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Description */}
          <div className="mt-4 sm:mt-6">
            <label className={`block text-xs sm:text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
              Détails complémentaires (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez la situation pour nous aider à mieux comprendre..."
              rows={4}
              className={`w-full p-3 sm:p-4 border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                resolvedTheme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <p className={`text-[10px] sm:text-xs mt-1 text-right ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {description.length}/500 caractères
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex gap-2 sm:gap-3 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleClose}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${resolvedTheme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
              selectedReason && !isSubmitting
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                Signaler
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
