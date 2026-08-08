import { useState, useEffect } from 'react'
import { Building2, ArrowRight, ArrowLeft, CheckCircle, Upload, FileText, User, Shield } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { SUPPORTED_COUNTRIES, validateRegistrationNumber } from '../../config/institutionCountries'
import { InstitutionStep1, InstitutionStep2, InstitutionType, InstitutionPlan } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { PhoneInput } from '../../components/common/PhoneInput'
import { validateEmail } from '../../utils/emailValidation'
import {
  validateInstitutionName,
  validateLegalDocument,
} from '../../constants/institutionValidation'

const INSTITUTION_TYPES: { value: InstitutionType; label: string; icon: string }[] = [
  { value: 'school', label: 'École / Université', icon: '🎓' },
  { value: 'hospital', label: 'Hôpital / Centre de santé', icon: '🏥' },
  { value: 'bank', label: 'Banque / Institution financière', icon: '🏦' },
  { value: 'ngo', label: 'ONG / Organisation à but non lucratif', icon: '🤝' },
  { value: 'company', label: 'Entreprise privée', icon: '🏢' },
  { value: 'government', label: 'Gouvernement / Administration publique', icon: '🏛️' },
  { value: 'religious', label: 'Institution religieuse', icon: '⛪' },
  { value: 'media', label: 'Média / Presse', icon: '📰' },
  { value: 'training_center', label: 'Centre de formation', icon: '📚' },
  { value: 'association', label: 'Association', icon: '🤝' },
  { value: 'other', label: 'Autre', icon: '📋' },
]

const PLANS: { value: InstitutionPlan; label: string; price: string; features: string[]; available: boolean }[] = [
  {
    value: 'verified',
    label: 'Verified',
    price: 'Gratuit',
    features: ['Validation de base', 'Publication d\'alertes', 'Recrutement limité (5 offres/mois)', 'Support email'],
    available: true
  },
  {
    value: 'standard',
    label: 'Standard',
    price: 'Bientôt disponible',
    features: ['Validation complète', 'Publication illimitée', 'Recrutement illimité', 'Événements', 'Vidéos', 'Support prioritaire', 'Analytics'],
    available: false
  },
  {
    value: 'premium',
    label: 'Premium',
    price: 'Bientôt disponible',
    features: ['Tout Standard', 'Boost de visibilité', 'Alertes push automatiques', 'API accès', 'Account manager dédié', 'Personnalisation'],
    available: false
  },
]

export const InstitutionRequest = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { msg: toastMsg, show: showToast } = useToast()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [institutionCount, setInstitutionCount] = useState(0)
  const [isPhoneValid, setIsPhoneValid] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState(false)

  const [step1Data, setStep1Data] = useState<InstitutionStep1>({
    institutionName: '',
    institutionType: 'company',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    description: '',
  })

  const [step2Data, setStep2Data] = useState<InstitutionStep2>({
    countryCode: '',
    registrationNumber: '',
    registrationType: '',
    legalDocument: null,
  })

  const [registrationValidation, setRegistrationValidation] = useState<{
    valid: boolean
    format?: string
    example?: string
    error?: string | null
    country?: string
  } | null>(null)

  // Vérifier que l'utilisateur a un compte professionnel (via localStorage pour MVP)
  useEffect(() => {
    const userType = localStorage.getItem('exile_user_type')
    const isAuthenticated = localStorage.getItem('exile_token')
    
    // Pour le test, permettre l'affichage du formulaire même sans vérification stricte
    // À décommenter en production
    /*
    if (!isAuthenticated) {
      showToast('Vous devez être connecté pour créer une institution')
      navigate('/login')
      return
    }
    
    if (userType !== 'professional') {
      showToast('Seuls les comptes professionnels peuvent créer des institutions')
      navigate('/social')
      return
    }
    */

    // Simuler le comptage d'institutions (à remplacer par appel API réel)
    setInstitutionCount(0)
  }, [navigate, showToast])

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Validation nom institution avec validation avancée
    if (!step1Data.institutionName.trim()) {
      newErrors.institutionName = 'Le nom de l\'institution est requis'
    } else {
      const nameValidation = validateInstitutionName(step1Data.institutionName)
      if (!nameValidation.valid) {
        newErrors.institutionName = nameValidation.error || 'Nom invalide'
      }
    }

    // Validation email institutionnel
    if (!step1Data.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else {
      const emailValidation = validateEmail(step1Data.email)
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error || 'Email invalide'
      }
    }

    if (!step1Data.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis'
    } else if (!isPhoneValid) {
      newErrors.phone = 'Numéro de téléphone invalide'
    }

    if (!step1Data.address.trim()) {
      newErrors.address = 'L\'adresse est requise'
    }

    if (!step1Data.city.trim()) {
      newErrors.city = 'La ville est requise'
    }

    if (!step1Data.country.trim()) {
      newErrors.country = 'Le pays est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!step2Data.countryCode) {
      newErrors.countryCode = 'Le pays est requis'
    }

    if (!step2Data.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Le numéro d\'enregistrement est requis'
    }

    if (!step2Data.legalDocument) {
      newErrors.legalDocument = 'Le document légal est requis'
    } else {
      const documentValidation = validateLegalDocument(step2Data.legalDocument)
      if (!documentValidation.valid) {
        newErrors.legalDocument = documentValidation.error || 'Document invalide'
      }
    }

    if (step2Data.registrationNumber && step2Data.countryCode) {
      const validation = validateRegistrationNumber(step2Data.countryCode, step2Data.registrationNumber)
      setRegistrationValidation(validation)
      if (!validation.valid) {
        newErrors.registrationNumber = validation.error || 'Format invalide'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier la limite de 3 institutions
    if (institutionCount >= 3) {
      showToast('Maximum de 3 institutions par compte professionnel atteint')
      return
    }
    
    if (validateStep2()) {
      setIsSubmitting(true)
      try {
        // Simuler l'envoi (à remplacer par appel API réel)
        setTimeout(() => {
          setIsSubmitting(false)
          showToast('Votre institution a été soumise pour vérification')
          navigate('/social/institution/dashboard')
        }, 2000)
      } catch (error) {
        setIsSubmitting(false)
        showToast('Erreur lors de la soumission')
      }
    }
  }

  const handleBack = () => {
    if (step === 1) {
      navigate('/social')
    } else {
      setStep(1)
    }
  }

  const handleRegistrationNumberChange = (value: string) => {
    setStep2Data({ ...step2Data, registrationNumber: value })
    if (step2Data.countryCode) {
      const validation = validateRegistrationNumber(step2Data.countryCode, value)
      setRegistrationValidation(validation)
    }
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'} py-6 md:py-8 px-4`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header - Minimalist */}
        <div className="text-center mb-1 md:mb-8 mt-8">
          <h1 className={`text-xl md:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
            Créer un compte institutionnel
          </h1>
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            Rejoignez le module institutionnel d'EXILE
          </p>
        </div>

        {/* Progress Steps - Minimalist */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-social' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 1 ? 'bg-social text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-medium text-xs hidden sm:inline">Informations</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-social' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-social' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 2 ? 'bg-social text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium text-xs hidden sm:inline">Validation</span>
            </div>
          </div>
        </div>

        {/* Form - Minimalist */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-xl border p-4 md:p-6 shadow-lg`}>
          {step === 1 ? (
            <form onSubmit={handleStep1Submit}>
              <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Étape 1: Informations de base
              </h2>

              <div className="space-y-4">
                {/* Institution Name */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Nom de l'institution *
                  </label>
                  <input
                    type="text"
                    value={step1Data.institutionName}
                    onChange={(e) => setStep1Data({ ...step1Data, institutionName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Ex: Hôpital Saint-Jean"
                  />
                  {errors.institutionName && <p className="text-red-500 text-xs mt-1">{errors.institutionName}</p>}
                </div>

                {/* Institution Type */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Type d'institution *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INSTITUTION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setStep1Data({ ...step1Data, institutionType: type.value })}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          step1Data.institutionType === type.value
                            ? 'border-social bg-social/10'
                            : resolvedTheme === 'dark'
                            ? 'border-zinc-600 hover:border-zinc-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-0.5">{type.icon}</div>
                        <div className={`text-[9px] font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                          {type.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Email institutionnel *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={step1Data.email}
                      onChange={(e) => {
                        setStep1Data({ ...step1Data, email: e.target.value })
                        const emailValidation = validateEmail(e.target.value)
                        setIsEmailValid(emailValidation.valid)
                      }}
                      className={`w-full px-3 py-2 pr-10 rounded-lg text-sm ${
                        errors.email && !isEmailValid ? 'border-red-500' : isEmailValid ? 'border-green-500' : 'border-gray-300 dark:border-zinc-600'
                      } ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 text-white'
                          : 'bg-gray-50 text-gray-900'
                      } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                      placeholder="contact@institution.com"
                    />
                    {isEmailValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        ✓
                      </div>
                    )}
                    {errors.email && !isEmailValid && step1Data.email && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        ✕
                      </div>
                    )}
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Phone - avec libphonenumber-js */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Téléphone institutionnel *
                  </label>
                  <PhoneInput
                    value={step1Data.phone}
                    onChange={(value: string, isValid: boolean) => {
                      setStep1Data({ ...step1Data, phone: value })
                      setIsPhoneValid(isValid)
                    }}
                    error={errors.phone}
                    defaultCountryCode="509"
                    showHelpText={true}
                    className={`w-full ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Adresse *
                  </label>
                  <textarea
                    value={step1Data.address}
                    onChange={(e) => setStep1Data({ ...step1Data, address: e.target.value })}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all resize-none`}
                    placeholder="Adresse complète"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                {/* City */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={step1Data.city}
                    onChange={(e) => setStep1Data({ ...step1Data, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Port-au-Prince"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Pays *
                  </label>
                  <input
                    type="text"
                    value={step1Data.country}
                    onChange={(e) => setStep1Data({ ...step1Data, country: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Haïti"
                  />
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>

                {/* Website */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Site web (optionnel)
                  </label>
                  <input
                    type="url"
                    value={step1Data.website}
                    onChange={(e) => setStep1Data({ ...step1Data, website: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="https://www.institution.com"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Description courte (optionnel)
                  </label>
                  <textarea
                    value={step1Data.description}
                    onChange={(e) => setStep1Data({ ...step1Data, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all resize-none`}
                    placeholder="Décrivez votre institution en quelques mots..."
                  />
                </div>

                {/* Responsible Info - Read Only from Professional Account */}
                <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center gap-2`}>
                    <User className="w-4 h-4" />
                    Responsable principal
                  </h3>
                  <div className={`p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-white'} space-y-2`}>
                    <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Nom complet:</span> {localStorage.getItem('exile_user_fullname') || 'Non disponible'}
                    </div>
                    <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Profession:</span> {localStorage.getItem('exile_user_profession') || 'Non disponible'}
                    </div>
                    <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Email:</span> {localStorage.getItem('exile_user_email') || 'Non disponible'}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <Shield className="w-3 h-3" />
                      Compte professionnel vérifié
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-sm font-medium hover:bg-social/90 transition-colors"
                >
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit}>
              <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Étape 2: Validation légale
              </h2>

              <div className="space-y-4">
                {/* Country Selection */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Pays d'enregistrement *
                  </label>
                  <select
                    value={step2Data.countryCode}
                    onChange={(e) => {
                      setStep2Data({ ...step2Data, countryCode: e.target.value })
                      setRegistrationValidation(null)
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                  >
                    <option value="">Sélectionner un pays</option>
                    {SUPPORTED_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.countryCode && <p className="text-red-500 text-xs mt-1">{errors.countryCode}</p>}
                </div>

                {/* Registration Number */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Numéro d'enregistrement *
                  </label>
                  {step2Data.countryCode && (
                    <p className={`text-xs mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Format: {SUPPORTED_COUNTRIES.find((c) => c.code === step2Data.countryCode)?.registrationName} •
                      Ex: {SUPPORTED_COUNTRIES.find((c) => c.code === step2Data.countryCode)?.example}
                    </p>
                  )}
                  <input
                    type="text"
                    value={step2Data.registrationNumber}
                    onChange={(e) => handleRegistrationNumberChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Entrez votre numéro d'enregistrement"
                  />
                  {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                  {registrationValidation && (
                    <div className={`mt-2 p-2 rounded-lg text-xs ${
                      registrationValidation.valid
                        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                        : 'bg-red-900/30 text-red-400 border-red-800'
                    } border`}>
                      {registrationValidation.valid ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>Format valide pour {registrationValidation.country}</span>
                        </div>
                      ) : (
                        <span>{registrationValidation.error}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Registration Type */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Type d'enregistrement *
                  </label>
                  <input
                    type="text"
                    value={step2Data.registrationType}
                    onChange={(e) => setStep2Data({ ...step2Data, registrationType: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Ex: RCCM, IF, RNC, SIRET"
                  />
                  {errors.registrationType && <p className="text-red-500 text-xs mt-1">{errors.registrationType}</p>}
                </div>

                {/* Legal Document */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Document légal *
                  </label>
                  {step2Data.countryCode && (
                    <p className={`text-xs mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Document requis: {SUPPORTED_COUNTRIES.find((c) => c.code === step2Data.countryCode)?.documentRequired}
                    </p>
                  )}
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'
                  } transition-colors`}>
                    <input
                      type="file"
                      id="legalDocument"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setStep2Data({ ...step2Data, legalDocument: file })
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="legalDocument" className="cursor-pointer">
                      <Upload className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                        {step2Data.legalDocument ? step2Data.legalDocument.name : 'Cliquez pour uploader'}
                      </p>
                      <p className={`text-[10px] mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                        PDF, JPG, PNG (max 5MB)
                      </p>
                    </label>
                  </div>
                  {errors.legalDocument && <p className="text-red-500 text-xs mt-1">{errors.legalDocument}</p>}
                </div>

                {/* Plan Selection - Compact */}
                <div>
                  <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-2`}>
                    Plan d'abonnement *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {PLANS.map((plan) => (
                      <button
                        key={plan.value}
                        type="button"
                        disabled={!plan.available}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          plan.value === 'verified'
                            ? 'border-social bg-social/10 cursor-pointer'
                            : !plan.available
                            ? resolvedTheme === 'dark'
                              ? 'border-zinc-700 bg-zinc-800 opacity-50 cursor-not-allowed'
                              : 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                            : resolvedTheme === 'dark'
                            ? 'border-zinc-600 hover:border-zinc-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {plan.label}
                        </div>
                        <div className={`text-xs font-semibold ${plan.available ? 'text-social' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
                          {plan.price}
                        </div>
                        <ul className={`text-[10px] space-y-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                          {plan.features.slice(0, 3).map((feature) => (
                            <li key={feature} className="flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {!plan.available && (
                          <div className={`text-[10px] font-semibold mt-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Bientôt disponible
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className={`text-[10px] mt-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    * Seul le plan Verified est disponible actuellement
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-sm font-medium hover:bg-social/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Soumettre'}
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstitutionRequest
