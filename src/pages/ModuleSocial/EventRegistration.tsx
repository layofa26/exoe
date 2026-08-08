import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, CheckCircle, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../hooks/useToast'

interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  dateOfBirth: string
  occupation: string
  organization?: string
}

export const EventRegistration = (): JSX.Element => {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { msg: toastMsg, show: showToast } = useToast()
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    dateOfBirth: '',
    occupation: '',
    organization: ''
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis'
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis'
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise'
    if (!formData.city.trim()) newErrors.city = 'La ville est requise'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'La date de naissance est requise'
    if (!formData.occupation.trim()) newErrors.occupation = 'L\'occupation est requise'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      // Simulate API call
      setTimeout(() => {
        // Save registration to localStorage
        const registrations = JSON.parse(localStorage.getItem('exile_event_registrations') || '[]')
        registrations.push({
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('exile_event_registrations', JSON.stringify(registrations))
        
        setIsSubmitting(false)
        showToast('Inscription réussie!')
        navigate('/social/events')
      }, 1500)
    }
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pt-24 pb-24 md:pl-64`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <button
          onClick={() => navigate('/social/events')}
          className={`flex items-center gap-2 mb-6 text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </button>

        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 md:p-8`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-social to-blue-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              Inscription aux événements
            </h1>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              Remplissez vos informations pour vous inscrire aux événements institutionnels
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Jean"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Dupont"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="jean.dupont@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="+509 1234 5678"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Adresse
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="123 Rue de la République"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Port-au-Prince"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Informations additionnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Profession, Étudiant..."
                  />
                  {errors.occupation && <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Organisation (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-600 border-zinc-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Nom de votre organisation"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/social/events')}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi en cours...' : 'S\'inscrire'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventRegistration
