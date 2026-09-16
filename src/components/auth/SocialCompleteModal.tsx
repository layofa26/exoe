import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Users, Briefcase, AlertCircle, CheckCircle, ShieldCheck, Loader2, Sparkles, ChevronDown, Search } from 'lucide-react'
import { ALL_PROFESSIONS, PROFESSIONS_DATABASE } from '../../config/professions'
import { GoogleIcon } from './SocialButtons'

export interface SocialUserData {
  provider: 'google'
  email: string
  fullName: string
  avatarUrl?: string
  idToken?: string
}

export interface CompleteProfileData {
  birthDate: string
  gender: string
  profession: string
  specialty?: string
}

interface SocialCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  socialUser: SocialUserData
  isDark?: boolean
  onSubmit: (data: CompleteProfileData) => Promise<{ success: boolean; error?: string }>
}

export const SocialCompleteModal: React.FC<SocialCompleteModalProps> = ({
  isOpen,
  onClose,
  socialUser,
  isDark = true,
  onSubmit
}) => {
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [profession, setProfession] = useState('Créateur de contenu')
  const [specialty, setSpecialty] = useState('')
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false)
  const [searchProfessionQuery, setSearchProfessionQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const professionDropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (professionDropdownRef.current && !professionDropdownRef.current.contains(event.target as Node)) {
        setShowProfessionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOpen) return null

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const day = parseInt(birthDay, 10)
    const month = parseInt(birthMonth, 10)
    const year = parseInt(birthYear, 10)

    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      setError('Veuillez sélectionner votre jour, mois et année de naissance.')
      return
    }

    const birthDateObj = new Date(year, month - 1, day)
    if (isNaN(birthDateObj.getTime()) || birthDateObj.getFullYear() !== year) {
      setError('Date de naissance invalide.')
      return
    }

    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    if (age < 18) {
      setError('Vous devez avoir au moins 18 ans pour créer un compte professionnel.')
      return
    }

    if (!gender) {
      setError('Veuillez sélectionner votre genre.')
      return
    }

    if (!profession.trim() || profession.trim().length < 2) {
      setError('Veuillez sélectionner ou saisir votre profession.')
      return
    }

    setLoading(true)
    const birthDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const res = await onSubmit({
      birthDate: birthDateStr,
      gender,
      profession: profession.trim(),
      specialty: specialty.trim()
    })

    if (!res.success) {
      setError(res.error || 'Une erreur est survenue lors de la finalisation.')
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
      {/* Même arrière-plan animé coloré exact que la création de compte */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 animate-gradient-x" 
          style={{
            background: `linear-gradient(45deg, 
              ${isDark ? '#1e3a8a' : '#3b82f6'}, 
              ${isDark ? '#7c3aed' : '#8b5cf6'}, 
              ${isDark ? '#059669' : '#10b981'}, 
              ${isDark ? '#dc2626' : '#ef4444'}
            )`,
            backgroundSize: '400% 400%',
            animation: 'gradient 15s ease infinite',
          }} 
        />
        {/* Cercles animés identiques à la création de compte */}
        <div className="absolute top-20 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-40 right-10 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-lg animate-spin" style={{ animationDuration: '10s' }} />
      </div>

      <div 
        className={`w-full max-w-xl md:max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-8 md:p-9 relative z-10 backdrop-blur-md my-auto max-h-[95vh] overflow-y-auto ${
          isDark ? 'bg-slate-800/95 border-slate-700/80 shadow-black/60 text-white' : 'bg-white/95 border-gray-200/90 shadow-slate-300/60 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-zinc-200 dark:border-zinc-700/80">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
              <GoogleIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-2xl tracking-tight text-white">Finaliser votre compte Pro</h3>
                <Sparkles className="w-5 h-5 text-[#FF6B00] flex-shrink-0" />
              </div>
              <p className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400 font-medium mt-0.5">
                Compte Google vérifié avec succès
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Identity Summary Card */}
        <div className="flex items-center gap-4 p-4 sm:p-5 my-5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md ring-2 ring-blue-500/30">
            {socialUser.avatarUrl ? (
              <img src={socialUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (socialUser.fullName || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base sm:text-lg font-bold truncate text-white">{socialUser.fullName || 'Nouvel Utilisateur'}</p>
            <p className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400 truncate flex items-center gap-2 mt-0.5">
              <span>{socialUser.email}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </p>
          </div>
          <span className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            Email vérifié
          </span>
        </div>

        <p className="text-sm sm:text-base text-zinc-200 dark:text-zinc-300 mb-5 leading-relaxed font-normal">
          Pour compléter votre profil sur la communauté d'experts EXILE, veuillez renseigner les <strong className="text-white font-bold">3 informations requises</strong> ci-dessous :
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFinalize} className="space-y-5">
          {/* 1. Date de naissance */}
          <div>
            <label className="block text-sm sm:text-base font-bold mb-2 text-zinc-100 dark:text-zinc-200">
              1. Date de naissance * <span className="text-xs sm:text-sm font-normal text-zinc-400">(Minimum 18 ans)</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                required
                className={`px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
              >
                <option value="">Jour</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>

              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                required
                className={`px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
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

              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                required
                className={`px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
              >
                <option value="">Année</option>
                {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Genre */}
          <div>
            <label className="block text-sm sm:text-base font-bold mb-2 text-zinc-100 dark:text-zinc-200">
              2. Genre *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className={`w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
            >
              <option value="">Sélectionnez votre genre...</option>
              <option value="masculin">Masculin</option>
              <option value="feminin">Féminin</option>
              <option value="personnalise">Personnaliser</option>
            </select>
          </div>

          {/* 3. Profession & Spécialité */}
          <div className="relative" ref={professionDropdownRef}>
            <label className="block text-sm sm:text-base font-bold mb-2 text-zinc-100 dark:text-zinc-200">
              3. Profession *
            </label>
            <div className="relative">
              <Briefcase className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-zinc-400' : 'text-gray-400'} w-5 h-5`} />
              <input
                type="text"
                value={profession}
                onChange={(e) => {
                  setProfession(e.target.value)
                  setShowProfessionDropdown(true)
                }}
                onClick={() => setShowProfessionDropdown(true)}
                onFocus={() => setShowProfessionDropdown(true)}
                required
                autoComplete="off"
                placeholder="Tapez ou choisissez une profession (ex: Développeur Web)..."
                className={`w-full pl-12 pr-12 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium transition-all ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
              />
              <button
                type="button"
                onClick={() => setShowProfessionDropdown(prev => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                title="Ouvrir la liste des professions"
              >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showProfessionDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Menu déroulant de suggestions et liste complète */}
            {showProfessionDropdown && (
              <div 
                className={`absolute left-0 right-0 z-50 mt-1.5 border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl divide-y divide-zinc-100 dark:divide-zinc-800 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="max-h-60 overflow-y-auto p-1.5">
                  {ALL_PROFESSIONS.filter(p => 
                    !profession.trim() || p.toLowerCase().includes(profession.trim().toLowerCase())
                  ).length > 0 ? (
                    ALL_PROFESSIONS.filter(p => 
                      !profession.trim() || p.toLowerCase().includes(profession.trim().toLowerCase())
                    ).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setProfession(p)
                          setShowProfessionDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          profession === p
                            ? 'bg-[#FF6B00]/20 text-[#FF6B00] font-bold'
                            : isDark
                            ? 'hover:bg-zinc-800 text-zinc-200 hover:text-white'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <span>{p}</span>
                        {profession === p && (
                          <CheckCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-zinc-400">
                      <p>Aucune suggestion exacte pour "{profession}".</p>
                      <button
                        type="button"
                        onClick={() => setShowProfessionDropdown(false)}
                        className="mt-2 px-4 py-1.5 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] font-bold hover:bg-[#FF6B00]/30 text-sm cursor-pointer"
                      >
                        Conserver "{profession}"
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm sm:text-base font-bold mb-2 text-zinc-100 dark:text-zinc-200">
              Spécialité <span className="text-xs sm:text-sm font-normal text-zinc-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: React, Droit des affaires, Cardiologie..."
              className={`w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border font-medium ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-300 text-slate-900'
              } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/60`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-[#FF6B00] hover:brightness-110 shadow-xl shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mt-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            <span>Finaliser et Accéder à mon compte</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
export default SocialCompleteModal
