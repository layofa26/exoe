import { useState } from 'react'
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react'
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Signalement envoyé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Merci pour votre signalement. Notre équipe l'examinera dans les plus brefs délais.
          </p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Flag className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Signaler un utilisateur
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {targetUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800 dark:text-orange-300">
              Les faux signalements peuvent entraîner des sanctions contre votre compte. 
              Veuillez utiliser cette fonction avec discernement.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Motif du signalement <span className="text-red-500">*</span>
            </label>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedReason === reason.value
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={() => setSelectedReason(reason.value)}
                  className="w-5 h-5 mt-0.5 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {reason.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {reason.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Détails complémentaires (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez la situation pour nous aider à mieux comprendre..."
              rows={4}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
              {description.length}/500 caractères
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              selectedReason && !isSubmitting
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Flag className="w-5 h-5" />
                Signaler
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
