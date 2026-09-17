import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  X, ShieldCheck, Briefcase, User, 
  Award, Loader2, AlertCircle, CheckCircle2, ChevronDown 
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { ALL_PROFESSIONS } from '../../config/professions'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  reasonMessage?: string
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reasonMessage
}) => {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const { completeProfile, user } = useAuth()

  // Parsing existing birthDate if present (YYYY-MM-DD)
  const initialDate = user?.birthDate ? new Date(user.birthDate) : null
  const [birthDay, setBirthDay] = useState(initialDate && !isNaN(initialDate.getTime()) ? String(initialDate.getDate()) : '')
  const [birthMonth, setBirthMonth] = useState(initialDate && !isNaN(initialDate.getTime()) ? String(initialDate.getMonth() + 1) : '')
  const [birthYear, setBirthYear] = useState(initialDate && !isNaN(initialDate.getTime()) ? String(initialDate.getFullYear()) : '')

  const [gender, setGender] = useState(user?.gender || 'masculin')
  const [profession, setProfession] = useState(user?.profession || 'Créateur de contenu')
  const [speciality, setSpeciality] = useState(user?.speciality || '')
  
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      if (user.birthDate) {
        const d = new Date(user.birthDate)
        if (!isNaN(d.getTime())) {
          setBirthDay(String(d.getDate()))
          setBirthMonth(String(d.getMonth() + 1))
          setBirthYear(String(d.getFullYear()))
        }
      }
      if (user.gender) setGender(user.gender)
      if (user.profession) setProfession(user.profession)
      if (user.speciality) setSpeciality(user.speciality)
      setError(null)
      setSuccessMsg(null)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleProfessionSelect = (selected: string) => {
    setProfession(selected)
    setShowProfessionDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 1. Validation de la date de naissance complète
    if (!birthDay || !birthMonth || !birthYear) {
      setError(t('verification.errors.birthDate', 'Veuillez renseigner la date de naissance complète (Jour, Mois, Année).'))
      return
    }

    const day = parseInt(birthDay, 10)
    const month = parseInt(birthMonth, 10)
    const year = parseInt(birthYear, 10)

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      setError(t('verification.errors.birthDate', 'Date de naissance invalide.'))
      return
    }

    const birthDateObj = new Date(year, month - 1, day)
    if (isNaN(birthDateObj.getTime()) || birthDateObj.getFullYear() !== year) {
      setError(t('verification.errors.birthDate', 'Date de naissance invalide.'))
      return
    }

    // Calcul précis de l'âge
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    // Contrainte stricte 18 ans
    if (age < 18) {
      setError(t('verification.errors.underage', 'Vous devez obligatoirement avoir au moins 18 ans pour certifier et utiliser un compte professionnel EXILE.'))
      return
    }

    // 2. Validation Genre
    if (!gender) {
      setError(t('verification.errors.gender', 'Veuillez sélectionner votre genre.'))
      return
    }

    // 3. Validation Profession
    const trimmedProfession = profession.trim()
    if (!trimmedProfession) {
      setError(t('verification.errors.profession', 'Veuillez sélectionner ou renseigner une profession valide.'))
      return
    }

    // Formatage YYYY-MM-DD
    const formattedMonth = String(month).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const isoBirthDate = `${year}-${formattedMonth}-${formattedDay}`

    setLoading(true)
    try {
      const res = await completeProfile({
        birth_date: isoBirthDate,
        gender,
        profession: trimmedProfession,
        speciality: speciality.trim()
      })

      if (res.success) {
        setSuccessMsg(t('verification.success', 'Votre compte a été vérifié avec succès !'))
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1200)
      } else {
        setError(res.error || t('verification.errors.generic', 'Erreur lors de la vérification.'))
      }
    } catch (err: any) {
      setError(err?.message || t('verification.errors.network', 'Erreur réseau. Veuillez vérifier votre connexion.'))
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ]

  const currentYear = new Date().getFullYear()
  const filteredProfessions = ALL_PROFESSIONS.filter(p =>
    !profession || p.toLowerCase().includes(profession.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className={`w-full max-w-lg my-auto rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-zinc-800 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-snug">
                {t('verification.title', 'Vérification du Compte')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('verification.subtitle', 'Conformité légale & Sécurité de la plateforme EXILE')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Raison légale convaincante & avertissement */}
        <div className={`px-4 sm:px-5 py-3 border-b text-xs leading-relaxed flex items-start gap-2.5 ${
          isDark 
            ? 'bg-blue-500/10 border-blue-500/20 text-zinc-300' 
            : 'bg-blue-50/70 border-blue-100 text-zinc-700'
        }`}>
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>
            {reasonMessage || t('verification.legalNotice', 'Conformément aux réglementations internationales relatives à la protection des mineurs et à la sécurité des transactions sur les plateformes professionnelles, tout utilisateur doit obligatoirement attester avoir 18 ans révolus et certifier son statut professionnel avant de pouvoir activer des abonnements ou publier des transactions financières.')}
          </p>
        </div>

        {/* Formulaire ou succès */}
        {successMsg ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {successMsg}
            </h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {error && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date de naissance (Triple Sélecteur comme sur la page Créer un Compte) */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.birthDateLabel', 'Date de naissance * (Vous devez avoir au moins 18 ans)')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    required
                    className={`w-full px-2.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDark
                        ? 'bg-zinc-800/90 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Jour</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day.toString()}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    required
                    className={`w-full px-2.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDark
                        ? 'bg-zinc-800/90 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Mois</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    required
                    className={`w-full px-2.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDark
                        ? 'bg-zinc-800/90 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Année</option>
                    {Array.from({ length: 100 }, (_, i) => currentYear - 18 - i).map((yr) => (
                      <option key={yr} value={yr.toString()}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.genderLabel', 'Genre *')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className={`w-full pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/90 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  <option value="masculin">{t('verification.genderMale', 'Masculin')}</option>
                  <option value="feminin">{t('verification.genderFemale', 'Féminin')}</option>
                  <option value="personnalise">{t('verification.genderOther', 'Autre')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Profession Dynamique (avec auto-complétion et dropdown identique à Register) */}
            <div className="relative">
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.professionLabel', 'Profession *')}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => {
                    setProfession(e.target.value)
                    setShowProfessionDropdown(true)
                  }}
                  onClick={() => setShowProfessionDropdown(true)}
                  onFocus={() => setShowProfessionDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProfessionDropdown(false), 250)}
                  required
                  autoComplete="off"
                  placeholder={t('verification.professionPlaceholder', 'Tapez ou cliquez pour choisir une profession...')}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/90 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setShowProfessionDropdown(prev => !prev)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProfessionDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Suggestions */}
              {showProfessionDropdown && (
                <div className={`absolute z-30 w-full mt-1 border rounded-xl shadow-2xl max-h-56 overflow-auto divide-y divide-zinc-200/50 dark:divide-zinc-700/50 ${
                  isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
                }`}>
                  {filteredProfessions.length > 0 ? (
                    filteredProfessions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleProfessionSelect(item)
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                          profession === item
                            ? 'bg-blue-500/10 text-blue-500 font-bold'
                            : isDark
                            ? 'hover:bg-zinc-700 text-white'
                            : 'hover:bg-blue-50 text-gray-900'
                        }`}
                      >
                        <span>{item}</span>
                        {profession === item && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-zinc-400">
                      {t('verification.noProfessionMatch', 'Aucune profession correspondante. Vous pouvez valider')} "{profession}".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Spécialité */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.specialityLabel', 'Spécialité (Optionnel)')}
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder={t('verification.specialityPlaceholder', 'ex: Droit des Affaires, Fullstack, Cardiologie...')}
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/90 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('verification.saving', 'Vérification en cours...')}</span>
                  </>
                ) : (
                  <span>{t('verification.submit', 'Valider et Vérifier mon Compte')}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default VerificationModal
