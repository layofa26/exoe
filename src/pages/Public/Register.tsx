import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { searchProfessions, isValidProfession, ALL_PROFESSIONS } from '../../config/professions'
import { isReservedName } from '../../constants/reservedNames'
import { PhoneInput } from '../../components/common/PhoneInput'
import { validateEmail } from '../../utils/emailValidation'
import type { ProfessionValidation } from '../../types'
import {
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Briefcase,
  AlertCircle,
  ChevronDown,
  Users,
  CheckCircle
} from 'lucide-react'

interface FormData {
  fullName: string
  username: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  birthDay: string
  birthMonth: string
  birthYear: string
  gender: string
  profession: string
  specialty: string
}

export const Register = (): JSX.Element => {
  const { registerPro } = useAuth()
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    profession: 'Créateur de contenu',
    specialty: '',
  })

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [professionSuggestions, setProfessionSuggestions] = useState<string[]>([])
  const [showProfessionDropdown, setShowProfessionDropdown] = useState<boolean>(false)
  const [professionValidation, setProfessionValidation] = useState<ProfessionValidation | null>(null)
  const [isPhoneInput, setIsPhoneInput] = useState<boolean>(false)
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false)
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false)
  const [showWelcome, setShowWelcome] = useState<boolean>(false)

  useEffect(() => {
    if (formData.profession.length >= 2) {
      const suggestions = searchProfessions(formData.profession)
      setProfessionSuggestions(suggestions)
      
      const validation = isValidProfession(formData.profession)
      setProfessionValidation(validation)
    } else {
      setProfessionSuggestions([])
      setProfessionValidation(null)
    }
  }, [formData.profession])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Sanitize input to prevent XSS
    const { name, value } = e.target
    const sanitizedValue = name === 'password' || name === 'confirmPassword' || name === 'fullName' ? value : value.trim()
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }))
    setError('')

    // Validation email en temps réel
    if (name === 'email') {
      const emailValidation = validateEmail(sanitizedValue)
      setIsEmailValid(emailValidation.valid)
    }
  }

  const handleProfessionSelect = (profession: string) => {
    setFormData(prev => ({ ...prev, profession }))
    setShowProfessionDropdown(false)
  }

  const validateStep1 = (): boolean => {
    if (!formData.fullName || (!formData.email && !isPhoneInput) || (!formData.phone && isPhoneInput) || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      setError('Veuillez remplir la date de naissance complète')
      return false
    }
    if (!formData.gender) {
      setError('Veuillez sélectionner votre genre')
      return false
    }

    // Validation téléphone ou email
    if (isPhoneInput) {
      if (!formData.phone || !isPhoneValid) {
        setError('Veuillez saisir un numéro de téléphone valide')
        return false
      }
    } else {
      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.valid) {
        setError(emailValidation.error || 'Email invalide')
        return false
      }
    }

    // Validation nom complet
    const trimmedFullName = formData.fullName.trim()

    if (trimmedFullName.length < 3 || trimmedFullName.length > 100) {
      setError('Le nom complet doit contenir entre 3 et 100 caractères')
      return false
    }

    // Vérifier que le nom contient au moins deux parties (nom et prénom)
    const nameParts = trimmedFullName.split(/\s+/).filter(part => part.length > 0)
    if (nameParts.length < 2) {
      setError('Le nom complet doit contenir au moins un nom et un prénom')
      return false
    }

    // Validation nom réservé (mots interdits)
    if (nameParts.some(part => isReservedName(part))) {
      setError('Ce nom ne peut pas être utilisé')
      return false
    }
    
    // Vérifier âge minimum 18 ans
    const birthDate = new Date(`${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      setError('Vous devez avoir au moins 18 ans pour créer un compte professionnel')
      return false
    }
    if (isNaN(birthDate.getTime())) {
      setError('Date de naissance invalide')
      return false
    }
    
    // Validation mot de passe simplifiée
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.gender || !formData.profession) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    
    // Validation simple: profession non vide
    if (formData.profession.trim().length < 2) {
      setError('La profession doit contenir au moins 2 caractères')
      return false
    }
    
    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setError('')

    const birthDateStr = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`

    const result = await registerPro({
      fullName: formData.fullName,
      email: !isPhoneInput ? formData.email : '',
      phone: isPhoneInput ? formData.phone : '',
      password: formData.password,
      birthDate: birthDateStr,
      gender: formData.gender,
      profession: formData.profession,
      specialty: formData.specialty,
      country: '',
      city: '',
    })
    
    if (!result.success) {
      setError(result.error || 'Une erreur est survenue')
      setLoading(false)
    } else {
      // Afficher message de bienvenue et rediriger vers l'accueil professionnel
      setShowWelcome(true)
      setTimeout(() => {
        navigate('/pro')
      }, 3000)
    }
  }

  return (
    <div className={`min-h-screen py-4 sm:py-8 md:py-12 px-3 sm:px-6 relative overflow-hidden flex flex-col justify-center items-center ${
      resolvedTheme === 'dark' 
        ? 'bg-slate-900' 
        : 'bg-gray-50'
    }`}>
      {/* Animated Background with Color Mixing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 animate-gradient-x" style={{
          background: `linear-gradient(45deg, 
            ${resolvedTheme === 'dark' ? '#1e3a8a' : '#3b82f6'}, 
            ${resolvedTheme === 'dark' ? '#7c3aed' : '#8b5cf6'}, 
            ${resolvedTheme === 'dark' ? '#059669' : '#10b981'}, 
            ${resolvedTheme === 'dark' ? '#dc2626' : '#ef4444'}
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }} />
        
        <div className="absolute top-20 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-40 right-10 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-lg animate-spin" style={{ animationDuration: '10s' }} />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10 my-auto pt-16 sm:pt-20 pb-8">
        <div className={`rounded-2xl shadow-2xl p-5 sm:p-8 backdrop-blur-md transition-all ${
          resolvedTheme === 'dark' 
            ? 'bg-slate-800/90 border border-slate-700/80 shadow-black/40' 
            : 'bg-white/90 border border-gray-200/80 shadow-slate-200/60'
        }`}>
          <div className="text-center mb-5 sm:mb-7">
            <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5`}>
              Créer un compte Professionnel
            </h1>
            <p className={`text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              Rejoignez la communauté d'experts EXILE
            </p>
          </div>

          {error && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg flex items-center space-x-2`}>
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
              <span className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
            </div>
          )}

          {showWelcome && (
            <div className={`mb-4 sm:mb-6 p-4 sm:p-6 ${resolvedTheme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border rounded-lg text-center`}>
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-3 animate-bounce" />
              <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                Bienvenue sur EXILE !
              </h2>
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                Votre compte professionnel a été créé avec succès. Redirection en cours...
              </p>
            </div>
          )}

          {!showWelcome && (
            <>
              {/* Step indicator */}
              <div className="flex items-center justify-center mb-6 sm:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                    step >= 1 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-8 sm:w-12 h-1 rounded ${
                    step >= 2 ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                    step >= 2 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-3 sm:space-y-4">
                  {/* Nom complet */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1 sm:mb-1.5`}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Nom et prénom (ex: Toot Diaman)"
                    />
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1 sm:mb-1.5`}>
                      Date de naissance * (vous devez avoir au moins 18 ans)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <select
                          name="birthDay"
                          value={formData.birthDay}
                          onChange={handleChange}
                          required
                          className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-xs sm:text-sm ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Jour</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day.toString()}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          name="birthMonth"
                          value={formData.birthMonth}
                          onChange={handleChange}
                          required
                          className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-xs sm:text-sm ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Mois</option>
                          <option value="1">Janvier</option>
                          <option value="2">Février</option>
                          <option value="3">Mars</option>
                          <option value="4">Avril</option>
                          <option value="5">Mai</option>
                          <option value="6">Juin</option>
                          <option value="7">Juillet</option>
                          <option value="8">Août</option>
                          <option value="9">Septembre</option>
                          <option value="10">Octobre</option>
                          <option value="11">Novembre</option>
                          <option value="12">Décembre</option>
                        </select>
                      </div>
                      <div>
                        <select
                          name="birthYear"
                          value={formData.birthYear}
                          onChange={handleChange}
                          required
                          className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-xs sm:text-sm ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Année</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Genre *
                    </label>
                    <div className="relative">
                      <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none transition-colors text-sm sm:text-base ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="masculin">Masculin</option>
                        <option value="feminin">Féminin</option>
                        <option value="personnalise">Personnaliser</option>
                      </select>
                      <ChevronDown className={`absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5 pointer-events-none`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Numéro de mobile ou adresse e-mail *
                    </label>
                    
                    {/* Toggle Email/Téléphone */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhoneInput(false)
                          setError('')
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !isPhoneInput
                            ? 'bg-blue-600 text-white'
                            : resolvedTheme === 'dark'
                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhoneInput(true)
                          setError('')
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isPhoneInput
                            ? 'bg-blue-600 text-white'
                            : resolvedTheme === 'dark'
                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Téléphone
                      </button>
                    </div>

                    {/* Input Email */}
                    {!isPhoneInput && (
                      <div className="relative">
                        <Smartphone className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={`w-full pl-9 sm:pl-10 pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                            error && !isEmailValid ? 'border-red-500' : isEmailValid ? 'border-green-500' : 'border-gray-300 dark:border-zinc-700'
                          } ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-800 text-white placeholder-zinc-500'
                              : 'bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="votre@email.com"
                        />
                        {isEmailValid && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">
                            ✓
                          </div>
                        )}
                        {error && !isEmailValid && formData.email && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">
                            ✕
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input Téléphone avec libphonenumber-js */}
                    {isPhoneInput && (
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value: string, isValid: boolean) => {
                          setFormData(prev => ({ ...prev, phone: value }))
                          setIsPhoneValid(isValid)
                          if (isValid) {
                            setError('')
                          }
                        }}
                        error={error && !isPhoneValid ? error : ''}
                        defaultCountryCode="509"
                        showHelpText={true}
                        className={`w-full ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800 text-white placeholder-zinc-500'
                            : 'bg-white text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="8 caractères minimum"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Répétez le mot de passe"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-primary text-white font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow text-sm sm:text-base"
                  >
                    Continuer
                  </button>
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Profession Input with Dropdown */}
                  <div className="relative">
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Profession *
                    </label>
                    <div className="relative">
                      <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
                      <input
                        type="text"
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        onFocus={() => setShowProfessionDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProfessionDropdown(false), 250)}
                        required
                        className={`w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Tapez ou sélectionnez une profession..."
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfessionDropdown(prev => !prev)}
                        className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        title="Ouvrir la liste"
                      >
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${showProfessionDropdown ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {showProfessionDropdown && (
                      <div className={`absolute z-20 w-full mt-1 border rounded-xl shadow-xl max-h-60 overflow-auto ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                        {ALL_PROFESSIONS.sort().filter(p => 
                          p.toLowerCase().includes((formData.profession || '').toLowerCase())
                        ).slice(0, 15).map((profession) => (
                          <button
                            key={profession}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleProfessionSelect(profession)
                            }}
                            className={`w-full text-left px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-blue-50 text-gray-900'}`}
                          >
                            {profession}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
                      Spécialité (optionnel)
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white'
                      }`}
                      placeholder="Ex: React, Marketing digital..."
                    />
                  </div>

              <div className="flex space-x-3 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || (isPhoneInput && !isPhoneValid)}
                  className="flex-1 bg-primary text-white font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}
          </>
          )}

          {!showWelcome && (
            <div className="mt-6 sm:mt-8 text-center">
              <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                Déjà un compte ?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Register
