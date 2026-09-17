import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ShieldCheck, Calendar, Briefcase, User, Award, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

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

  const [birthDate, setBirthDate] = useState(user?.birthDate || '')
  const [gender, setGender] = useState(user?.gender || 'M')
  const [profession, setProfession] = useState(user?.profession || '')
  const [speciality, setSpeciality] = useState(user?.speciality || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const calculateAge = (dateString: string): number => {
    if (!dateString) return 0
    const birth = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!birthDate) {
      setError(t('verification.errors.birthDate', 'Veuillez renseigner votre date de naissance.'))
      return
    }

    const age = calculateAge(birthDate)
    if (age < 18) {
      setError(t('verification.errors.underage', 'Vous devez avoir au moins 18 ans pour vérifier votre profil.'))
      return
    }

    if (!profession.trim()) {
      setError(t('verification.errors.profession', 'Veuillez indiquer votre profession.'))
      return
    }

    setLoading(true)
    try {
      const res = await completeProfile({
        birth_date: birthDate,
        gender,
        profession: profession.trim(),
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
      setError(err?.message || t('verification.errors.network', 'Erreur réseau. Veuillez réessayer.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('verification.title', 'Vérification du Compte')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('verification.subtitle', 'Complétez vos informations obligatoires')}
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

        {/* Message d'explication si requis pour une action */}
        {reasonMessage && (
          <div className={`px-5 py-3 border-b text-xs flex items-center gap-2 ${
            isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{reasonMessage}</span>
          </div>
        )}

        {/* Formulaire */}
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
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date de naissance */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.birthDateLabel', 'Date de naissance * (18 ans et plus)')}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                />
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
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  <option value="M">{t('common.genderMale', 'Masculin')}</option>
                  <option value="F">{t('common.genderFemale', 'Féminin')}</option>
                  <option value="O">{t('common.genderOther', 'Autre')}</option>
                </select>
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-zinc-300">
                {t('verification.professionLabel', 'Profession *')}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder={t('verification.professionPlaceholder', 'ex: Avocat, Ingénieur, Développeur...')}
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
              </div>
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
                  placeholder={t('verification.specialityPlaceholder', 'ex: Droit des Affaires, Fullstack...')}
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
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
                    <span>{t('common.saving', 'Enregistrement...')}</span>
                  </>
                ) : (
                  <span>{t('verification.submit', 'Valider et Vérifier')}</span>
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
