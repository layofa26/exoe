import { useState, useEffect } from 'react'
import { 
  X, 
  Send, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Clock,
  Ban,
  CheckCircle2,
  Tag
} from 'lucide-react'
import { MAX_DAILY_REQUESTS, REQUEST_CATEGORIES, MESSAGE_TEMPLATES } from '../../types/requests'
import type { UserAvailability } from '../../types/requests'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  receiver: {
    id: string
    name: string
    avatar: string | null
    profession: string
  }
  sender: {
    id: string
    name: string
    avatar: string | null
    profession: string
  }
  dailyRequestCount: number
  onSendRequest: (message: string, category?: string) => { success: boolean; error?: string }
}

export const ContactModal = ({
  isOpen,
  onClose,
  receiver,
  sender,
  dailyRequestCount,
  onSendRequest
}: ContactModalProps): JSX.Element | null => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [receiverAvailability, setReceiverAvailability] = useState<UserAvailability | null>(null)

  // Check receiver availability on open
  useEffect(() => {
    if (!isOpen) return
    
    const savedAvailability = localStorage.getItem('exile_availability')
    if (savedAvailability) {
      const allAvailability: UserAvailability[] = JSON.parse(savedAvailability)
      const receiverStatus = allAvailability.find(a => a.userId === receiver.id)
      setReceiverAvailability(receiverStatus || null)
    }
  }, [isOpen, receiver.id])

  if (!isOpen) return null

  const remainingRequests = MAX_DAILY_REQUESTS - dailyRequestCount
  const hasReachedLimit = dailyRequestCount >= MAX_DAILY_REQUESTS

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setMessage(template.content)
      console.log('Template sélectionné:', template.content)
      console.log('Message après sélection:', template.content)
    }
  }

  const handleSubmit = async () => {
    if (!message.trim() || hasReachedLimit) return

    // Tcheke si itilizatè a ap eseye voye ba li menm
    if (sender.id === receiver.id) {
      setResult({
        success: false,
        message: 'Vous ne pouvez pas envoyer de demande à vous-même.'
      })
      return
    }

    // Check if receiver is available
    if (receiverAvailability?.status === 'offline' || receiverAvailability?.status === 'busy') {
      const autoReply = receiverAvailability.autoReply?.message
      setResult({ 
        success: false, 
        message: autoReply || `Cet utilisateur est actuellement ${receiverAvailability.status}. Veuillez réessayer plus tard.` 
      })
      return
    }

    setIsSubmitting(true)
    const response = onSendRequest(message.trim(), selectedCategory || undefined)
    
    if (response.success) {
      setResult({ success: true, message: 'Demande envoyée avec succès!' })
      setTimeout(() => {
        onClose()
        setResult(null)
        setMessage('')
        setSelectedCategory('')
      }, 2000)
    } else {
      setResult({ success: false, message: response.error || 'Une erreur est survenue' })
    }
    setIsSubmitting(false)
  }

  // Get availability display info
  const getAvailabilityInfo = () => {
    if (!receiverAvailability) return { status: 'available', label: 'Disponible', color: 'green', icon: CheckCircle2 }
    
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      available: { label: 'Disponible', color: 'green', icon: CheckCircle2 },
      busy: { label: 'Occupé', color: 'red', icon: Ban },
      away: { label: 'Absent', color: 'amber', icon: Clock },
      offline: { label: 'Hors ligne', color: 'gray', icon: Ban }
    }
    
    return statusConfig[receiverAvailability.status]
  }

  const availabilityInfo = getAvailabilityInfo()
  const isReceiverAvailable = receiverAvailability?.status === 'available' || !receiverAvailability

  // Fonksyon pou anpeche klik pwopaje
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Koulè disponibilite (pa itilize template string nan Tailwind)
  const getAvailabilityClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'green': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'red': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'amber': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      'gray': 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-400'
    }
    return colorMap[color] || colorMap['green']
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={handleContainerClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Contacter</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{receiver.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info du destinataire avec disponibilité */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {receiver.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{receiver.name}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{receiver.profession}</p>
            </div>
            {/* Availability Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getAvailabilityClasses(availabilityInfo.color)}`}>
              <availabilityInfo.icon className="w-3.5 h-3.5" />
              {availabilityInfo.label}
            </div>
          </div>

          {/* Auto-reply message if unavailable */}
          {receiverAvailability?.autoReply?.enabled && receiverAvailability?.autoReply?.message && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-amber-800 dark:text-amber-300">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Message automatique</p>
                <p className="text-amber-700 dark:text-amber-300">{receiverAvailability.autoReply.message}</p>
                {receiverAvailability.autoReply.schedule && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Actif du {receiverAvailability.autoReply.schedule.startTime} au {receiverAvailability.autoReply.schedule.endTime}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Limite quotidienne */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            hasReachedLimit
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : remainingRequests <= 3
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {hasReachedLimit
                ? `Limite de ${MAX_DAILY_REQUESTS} demandes atteinte pour aujourd'hui`
                : `${remainingRequests} demande${remainingRequests > 1 ? 's' : ''} restante${remainingRequests > 1 ? 's' : ''} aujourd'hui`
              }
            </span>
          </div>

          {/* Résultat */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              result.success ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {result.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          {!hasReachedLimit && !result?.success && (
            <>
              {/* Catégories - Horizontal pour desktop, vertical pour mobile */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Catégorie de la demande
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {REQUEST_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors text-gray-700 dark:text-zinc-300 ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates - Horizontal pour desktop, vertical pour mobile */}
              {selectedCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Modèles de message
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {MESSAGE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`p-3 text-left text-xs rounded-lg border transition-colors ${
                            selectedTemplate === template.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="font-medium mb-1">{template.label}</div>
                          <div className="text-gray-500 dark:text-zinc-400 line-clamp-2">{template.content}</div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Message - Horizontal Layout pour desktop */}
              <div className="flex flex-col lg:flex-row gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Votre message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isReceiverAvailable ? "Écrivez votre message..." : "Utilisateur non disponible..."}
                    style={{ color: '#111827' }}
                    rows={4}
                    disabled={!isReceiverAvailable}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder-zinc-500 ${
                      !isReceiverAvailable ? 'bg-gray-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                    }`}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 text-right">
                    {message.length}/500
                  </p>
                </div>

                {/* Bouton anvwa - desktop horizontal, mobile vertical */}
                <div className="lg:flex-shrink-0">
                  {/* Desktop: bouton sou menm liy ak message */}
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="flex-1">
                      <button
                        onClick={handleSubmit}
                        disabled={!message.trim() || isSubmitting || !isReceiverAvailable}
                        className="w-full items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        Envoyer
                      </button>
                    </div>
                  </div>

                  {/* Mobile: bouton anba message */}
                  <div className="lg:hidden">
                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || isSubmitting || !isReceiverAvailable}
                      className="w-full items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Envoyer la demande
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - sèlman bouton Annuler */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
