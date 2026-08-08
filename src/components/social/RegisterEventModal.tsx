import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface RegisterEventModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  isHybrid?: boolean
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  status: 'student' | 'professor' | 'external'
  matricule: string
  mode: 'in-person' | 'online'
  question: string
}

export function RegisterEventModal({ isOpen, onClose, eventTitle, isHybrid = false }: RegisterEventModalProps) {
  const { resolvedTheme } = useTheme()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    status: 'student',
    matricule: '',
    mode: 'in-person',
    question: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simuler l'envoi du formulaire
    console.log('Inscription envoyée:', formData)
    setIsSubmitted(true)
  }

  const handleClose = () => {
    setIsSubmitted(false)
    setFormData({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      status: 'student',
      matricule: '',
      mode: 'in-person',
      question: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Inscription à l'événement
            </h2>
            <p className={`text-sm mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {eventTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Success State */}
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              Inscription validée !
            </h3>
            <p className={`text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              Un rappel vous sera envoyé avant l'événement.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-3 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pré-rempli: Nom */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName}
                disabled
                className={`w-full px-4 py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
              />
            </div>

            {/* Pré-rempli: Prénom */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName}
                disabled
                className={`w-full px-4 py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
              />
            </div>

            {/* Pré-rempli: Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className={`w-full px-4 py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
              />
            </div>

            {/* Statut */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Statut <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any, matricule: '' })}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-social`}
              >
                <option value="student">Étudiant</option>
                <option value="professor">Professeur</option>
                <option value="external">Externe</option>
              </select>
            </div>

            {/* Matricule (conditionnel) */}
            {(formData.status === 'student' || formData.status === 'professor') && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Matricule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="Entrez votre matricule"
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-social`}
                />
              </div>
            )}

            {/* Mode (si événement hybride) */}
            {isHybrid && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Mode de participation <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="in-person"
                      checked={formData.mode === 'in-person'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                      className="text-social focus:ring-social"
                    />
                    Présentiel
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={formData.mode === 'online'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                      className="text-social focus:ring-social"
                    />
                    En ligne (Live)
                  </label>
                </div>
              </div>
            )}

            {/* Question optionnelle */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Une question pour l'intervenant ?
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Posez votre question ici..."
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-social resize-none`}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors"
              >
                S'inscrire
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default RegisterEventModal
