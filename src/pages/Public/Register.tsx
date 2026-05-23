import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchProfessions, isValidProfession } from '../../config/professions'
import type { ProfessionValidation } from '../../types'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone,
  Briefcase,
  AlertCircle,
  ChevronDown,
  Users
} from 'lucide-react'

interface FormData {
  firstName: string
  lastName: string
  username: string
  contact: string
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
  
  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    contact: '',
    password: '',
    confirmPassword: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    profession: '',
    specialty: '',
  })
  
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [professionSuggestions, setProfessionSuggestions] = useState<string[]>([])
  const [showProfessionDropdown, setShowProfessionDropdown] = useState<boolean>(false)
  const [professionValidation, setProfessionValidation] = useState<ProfessionValidation | null>(null)

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleProfessionSelect = (profession: string) => {
    setFormData({ ...formData, profession })
    setShowProfessionDropdown(false)
  }

  const validateStep1 = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.contact || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      setError('Veuillez remplir la date de naissance complète')
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
      setError('Vous devez avoir au moins 18 ans pour créer un compte')
      return false
    }
    if (isNaN(birthDate.getTime())) {
      setError('Date de naissance invalide')
      return false
    }
    
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
    
    const validation = isValidProfession(formData.profession)
    if (!validation.valid) {
      setError(validation.error || 'Profession invalide')
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

    // Générer un username automatiquement basé sur le nom et prénom
    const generatedUsername = `${formData.firstName.toLowerCase().replace(/\s/g, '')}_${formData.lastName.toLowerCase().replace(/\s/g, '')}`
    const birthDateStr = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`
    
    const result = await registerPro({
      fullName: `${formData.firstName} ${formData.lastName}`,
      username: generatedUsername,
      email: formData.contact.includes('@') ? formData.contact : '',
      phone: formData.contact.includes('@') ? '' : formData.contact,
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
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Créer un compte Professionnel
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              Rejoignez la communauté d'experts EXILE
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form className="space-y-6">
              {/* Nom et Prénom sur la même ligne */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Jean"
                  />
                </div>
              </div>

              {/* Date de naissance - 3 champs alignés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance * (vous devez avoir au moins 18 ans)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <select
                      name="birthDay"
                      value={formData.birthDay}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white transition-colors"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="masculin">Masculin</option>
                    <option value="feminin">Féminin</option>
                    <option value="personnalise">Personnaliser</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de mobile ou adresse e-mail *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="votre@email.com ou +509 34 56 78 90"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vous pouvez utiliser votre email ou votre numéro de téléphone
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="8 caractères minimum"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Répétez le mot de passe"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
              >
                Continuer
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profession with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profession *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    onFocus={() => setShowProfessionDropdown(true)}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      professionValidation?.valid ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="Commencez à taper..."
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                
                {professionValidation && (
                  <div className={`text-xs mt-1 ${professionValidation.valid ? 'text-green-600' : 'text-orange-500'}`}>
                    {professionValidation.type === 'known' && '✓ Profession reconnue'}
                    {professionValidation.type === 'suggestion' && 'Suggestions disponibles'}
                    {professionValidation.type === 'new' && '⚠ Sera soumis à validation'}
                  </div>
                )}

                {showProfessionDropdown && professionSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {professionSuggestions.map((profession) => (
                      <button
                        key={profession}
                        type="button"
                        onClick={() => handleProfessionSelect(profession)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        {profession}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité (optionnel)
                </label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-colors"
                  placeholder="Ex: React, Marketing digital..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
