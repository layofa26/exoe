import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  AlertTriangle,
  Briefcase,
  Video as VideoIcon,
  Calendar,
  Building2,
  TrendingUp,
  FileText,
  ShieldCheck,
  Send,
  Lock
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export interface CreatedPublicationItem {
  id: string
  type: 'urgency' | 'health' | 'recruitment' | 'announcement' | 'event' | 'video' | 'promotion'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  institution: {
    name: string
    verified: boolean
    avatar?: string
  }
  isBoosted: boolean
  createdAt: string
  stats: {
    views: number
    shares: number
    comments: number
  }
  videoUrl?: string
  eventDate?: string
  eventLocation?: string
  recruitmentDetails?: {
    contractType: string
    location: string
    deadline: string
    rhEmail: string
  }
}

interface CreatePublicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: CreatedPublicationItem) => void
  initialType?: 'alert' | 'job' | 'video' | 'event'
}

export function CreatePublicationModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'alert'
}: CreatePublicationModalProps): JSX.Element | null {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = resolvedTheme === 'dark'

  // Tab sélectionnée : 'alert' | 'job' | 'video' | 'event'
  const [activeType, setActiveType] = useState<'alert' | 'job' | 'video' | 'event'>(initialType)

  // Simulation garde institutionnelle : certifiée vs visiteur
  const [isVerifiedInstitution, setIsVerifiedInstitution] = useState(true)

  // Quotas du plan Standard (20$/mois)
  const [quotas, setQuotas] = useState({
    alertsRemaining: 2,
    alertsTotal: 3,
    jobsRemaining: 2,
    jobsTotal: 3,
    videosRemaining: 1,
    videosTotal: 2,
    eventsRemaining: 1,
    eventsTotal: 2,
  })

  // États Formulaire Alerte
  const [alertForm, setAlertForm] = useState({
    subType: 'urgency' as 'urgency' | 'health' | 'announcement',
    priority: 'high' as 'high' | 'medium' | 'low',
    title: '',
    institutionName: 'Direction Générale de la Protection Civile (DGPC)',
    message: '',
    scope: 'Nationale',
    officialRef: 'DGPC-URG-2026-104',
    isBoosted: false
  })

  // États Formulaire Recrutement
  const [jobForm, setJobForm] = useState({
    title: '',
    institutionName: 'Hôpital Universitaire d\'État (HUEH)',
    contractType: 'CDI - Plein temps',
    location: 'Port-au-Prince',
    deadline: '',
    missions: '',
    requirements: '',
    rhEmail: 'recrutement.officiel@hueh.gouv.ht',
    isBoosted: false
  })

  // États Formulaire Vidéo
  const [videoForm, setVideoForm] = useState({
    title: '',
    category: 'Allocution Officielle',
    institutionName: 'Ministère de la Santé Publique et de la Population (MSPP)',
    description: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    allowComments: false,
    isBoosted: false
  })

  // États Formulaire Événement
  const [eventForm, setEventForm] = useState({
    title: '',
    format: 'hybrid' as 'in-person' | 'virtual' | 'hybrid',
    institutionName: 'Banque de la République d\'Haïti (BRH)',
    startDate: '',
    capacity: 250,
    city: 'Pétion-Ville',
    speaker: 'Gouverneur & Experts Financiers',
    isFree: true,
    isBoosted: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Vérification gardien d'accès
    if (!isVerifiedInstitution) {
      setErrorMessage("La publication officielle requiert la certification préalable de votre institution.")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      let createdItem: CreatedPublicationItem

      if (activeType === 'alert') {
        if (!alertForm.title.trim() || !alertForm.message.trim()) {
          setErrorMessage("Veuillez renseigner le titre et le message de l'alerte.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `alert-custom-${Date.now()}`,
          type: alertForm.subType,
          priority: alertForm.priority,
          title: alertForm.title,
          description: `${alertForm.message}\n\n[Portée : ${alertForm.scope} • Réf : ${alertForm.officialRef}]`,
          institution: {
            name: alertForm.institutionName,
            verified: true
          },
          isBoosted: alertForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 }
        }

        setQuotas(q => ({ ...q, alertsRemaining: Math.max(0, q.alertsRemaining - 1) }))
      } else if (activeType === 'job') {
        if (!jobForm.title.trim() || !jobForm.missions.trim()) {
          setErrorMessage("Veuillez indiquer l'intitulé du poste et les missions.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `job-custom-${Date.now()}`,
          type: 'recruitment',
          priority: 'medium',
          title: jobForm.title,
          description: `${jobForm.missions}\n\nExigences : ${jobForm.requirements || 'Diplôme d\'État ou équivalent'}\nDate limite : ${jobForm.deadline || '30 jours'}\nContact RH : ${jobForm.rhEmail}`,
          institution: {
            name: jobForm.institutionName,
            verified: true
          },
          isBoosted: jobForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          recruitmentDetails: {
            contractType: jobForm.contractType,
            location: jobForm.location,
            deadline: jobForm.deadline || 'Sous 30 jours',
            rhEmail: jobForm.rhEmail
          }
        }

        setQuotas(q => ({ ...q, jobsRemaining: Math.max(0, q.jobsRemaining - 1) }))
      } else if (activeType === 'video') {
        if (!videoForm.title.trim() || !videoForm.description.trim()) {
          setErrorMessage("Veuillez renseigner le titre et la description de la vidéo.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `video-custom-${Date.now()}`,
          type: 'video',
          priority: 'low',
          title: videoForm.title,
          description: videoForm.description,
          institution: {
            name: videoForm.institutionName,
            verified: true
          },
          isBoosted: videoForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          videoUrl: videoForm.videoUrl
        }

        setQuotas(q => ({ ...q, videosRemaining: Math.max(0, q.videosRemaining - 1) }))
      } else {
        // Event
        if (!eventForm.title.trim()) {
          setErrorMessage("Veuillez indiquer le titre de l'événement.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `evt-custom-${Date.now()}`,
          type: 'event',
          priority: 'medium',
          title: eventForm.title,
          description: `Sommet / Événement officiel organisé par ${eventForm.institutionName}. Capacité : ${eventForm.capacity} participants. Orateur principal : ${eventForm.speaker}.`,
          institution: {
            name: eventForm.institutionName,
            verified: true
          },
          isBoosted: eventForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          eventDate: eventForm.startDate || 'Prochainement',
          eventLocation: eventForm.city
        }

        setQuotas(q => ({ ...q, eventsRemaining: Math.max(0, q.eventsRemaining - 1) }))
      }

      // Sauvegarder dans localStorage pour persistance hors-backend
      try {
        const existing = JSON.parse(localStorage.getItem('exile_social_custom_feed') || '[]')
        localStorage.setItem('exile_social_custom_feed', JSON.stringify([createdItem, ...existing]))
      } catch (err) {
        console.warn('Could not save to localStorage', err)
      }

      setIsSubmitting(false)
      onSuccess(createdItem)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden my-auto ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/90'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Nouvelle Émission Institutionnelle</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Diffusion officielle selon la feuille de route EXILE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional Status Banner */}
        <div className={`px-5 py-2.5 text-xs border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              Compte Institutionnel Certifié
            </span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>•</span>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Diffusion officielle validée
            </span>
          </div>

          {/* Switcher pour simuler institution vérifiée ou refus */}
          <button
            type="button"
            onClick={() => setIsVerifiedInstitution(!isVerifiedInstitution)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              isVerifiedInstitution
                ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                : 'border-amber-500/40 text-amber-500 bg-amber-500/10'
            }`}
            title="Cliquez pour simuler le comportement selon le statut de certification"
          >
            Statut : {isVerifiedInstitution ? 'Certifié ✓' : 'Non certifié (simulation)'}
          </button>
        </div>

        {/* Access Guard Screen si non vérifié */}
        {!isVerifiedInstitution ? (
          <div className="p-8 text-center space-y-4 flex-1 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">Publication Réservée aux Institutions Vérifiées</h3>
            <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Afin de préserver l'authenticité et la crédibilité des annonces publiques sur EXILE Social, seules les institutions certifiées (Ministères, Hôpitaux, Universités, ONG, Entreprises enregistrées) sont autorisées à émettre.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/social/institution/request')
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Demander la certification institutionnelle
              </button>
              <button
                type="button"
                onClick={() => setIsVerifiedInstitution(true)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Simuler en tant qu'institution certifiée
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 4 Type Selectors (Tabs) */}
            <div className={`p-3 border-b flex gap-1.5 overflow-x-auto scrollbar-hide ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-slate-50'}`}>
              {[
                { id: 'alert' as const, label: 'Alerte Officielle', icon: AlertTriangle, color: 'text-red-500', activeBg: 'bg-red-500 text-white' },
                { id: 'job' as const, label: 'Offre Recrutement', icon: Briefcase, color: 'text-blue-500', activeBg: 'bg-blue-600 text-white' },
                { id: 'video' as const, label: 'Vidéo / Allocution', icon: VideoIcon, color: 'text-emerald-500', activeBg: 'bg-emerald-600 text-white' },
                { id: 'event' as const, label: 'Événement / Sommet', icon: Calendar, color: 'text-purple-500', activeBg: 'bg-purple-600 text-white' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveType(tab.id)
                    setErrorMessage(null)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                    activeType === tab.id
                      ? tab.activeBg
                      : isDark
                      ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ---------------- 1. FORMULAIRE ALERTE ---------------- */}
              {activeType === 'alert' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'urgency' as const, label: 'Urgence Civile', desc: 'Priorité absolue, pas de comm.', border: 'border-red-500' },
                      { id: 'health' as const, label: 'Santé Publique', desc: 'Modération stricte', border: 'border-emerald-500' },
                      { id: 'announcement' as const, label: 'Avis Officiel', desc: 'Circulaire d\'intérêt public', border: 'border-blue-500' },
                    ].map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setAlertForm({ ...alertForm, subType: sub.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          alertForm.subType === sub.id
                            ? `${sub.border} ${isDark ? 'bg-zinc-800 shadow-md' : 'bg-slate-50 shadow-sm'}`
                            : isDark ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-current">{sub.label}</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{sub.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de l'alerte officielle *
                    </label>
                    <input
                      type="text"
                      required
                      value={alertForm.title}
                      onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
                      placeholder="Ex: Alerte vigilance rouge - Évacuation préventive zone Sud"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Institution émettrice
                      </label>
                      <input
                        type="text"
                        value={alertForm.institutionName}
                        onChange={e => setAlertForm({ ...alertForm, institutionName: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Portée géographique
                      </label>
                      <select
                        value={alertForm.scope}
                        onChange={e => setAlertForm({ ...alertForm, scope: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Nationale">Territoire National</option>
                        <option value="Département de l'Ouest">Département de l'Ouest</option>
                        <option value="Zone Métropolitaine">Zone Métropolitaine (Port-au-Prince)</option>
                        <option value="Département du Sud">Département du Sud</option>
                        <option value="Grand Nord">Grand Nord (Cap-Haïtien)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Message & Directives officielles *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={alertForm.message}
                      onChange={e => setAlertForm({ ...alertForm, message: e.target.value })}
                      placeholder="Indiquez clairement la situation, les consignes de sécurité et les numéros d'urgence..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Référence administrative de l'arrêté
                      </label>
                      <input
                        type="text"
                        value={alertForm.officialRef}
                        onChange={e => setAlertForm({ ...alertForm, officialRef: e.target.value })}
                        placeholder="Ex: DGPC-2026-089"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer mt-5 ${
                      alertForm.isBoosted
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : isDark ? 'border-zinc-800 bg-zinc-800/40' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={alertForm.isBoosted}
                        onChange={e => setAlertForm({ ...alertForm, isBoosted: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <p className="text-xs font-bold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                          Activer le Boost d'urgence (Optionnel)
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Propulse en tête du fil citoyen
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* ---------------- 2. FORMULAIRE RECRUTEMENT ---------------- */}
              {activeType === 'job' && (
                <>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Intitulé du poste officiel *
                    </label>
                    <input
                      type="text"
                      required
                      value={jobForm.title}
                      onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                      placeholder="Ex: Médecin Spécialiste en Réanimation / Cardiologie"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Contrat
                      </label>
                      <select
                        value={jobForm.contractType}
                        onChange={e => setJobForm({ ...jobForm, contractType: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="CDI - Temps plein">CDI - Temps plein</option>
                        <option value="CDD - 12 mois">CDD - 12 mois</option>
                        <option value="Concours Fonction Publique">Concours Fonction Publique</option>
                        <option value="Stage Académique">Stage Académique</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lieu / Ville
                      </label>
                      <input
                        type="text"
                        value={jobForm.location}
                        onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date limite
                      </label>
                      <input
                        type="date"
                        value={jobForm.deadline}
                        onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Missions & Description du poste *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={jobForm.missions}
                      onChange={e => setJobForm({ ...jobForm, missions: e.target.value })}
                      placeholder="Décrivez les responsabilités principales, le contexte institutionnel..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Email officiel RH de réception
                    </label>
                    <input
                      type="email"
                      required
                      value={jobForm.rhEmail}
                      onChange={e => setJobForm({ ...jobForm, rhEmail: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <p className={`text-[10px] mt-1 flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      <FileText className="w-3 h-3 text-emerald-500" />
                      Les candidats postulent directement avec leur CV au format PDF obligatoire.
                    </p>
                  </div>
                </>
              )}

              {/* ---------------- 3. FORMULAIRE VIDÉO ---------------- */}
              {activeType === 'video' && (
                <>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de la communication officielle *
                    </label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="Ex: Allocution sur les mesures de renforcement sanitaire"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Catégorie
                      </label>
                      <select
                        value={videoForm.category}
                        onChange={e => setVideoForm({ ...videoForm, category: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Allocution Officielle">Allocution Officielle</option>
                        <option value="Conférence de Presse">Conférence de Presse</option>
                        <option value="Rapport Annuel & Bilan">Rapport Annuel & Bilan</option>
                        <option value="Campagne de Prévention">Campagne de Prévention</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lien de diffusion (URL vidéo ou source)
                      </label>
                      <input
                        type="url"
                        value={videoForm.videoUrl}
                        onChange={e => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description & Sommaire de la vidéo *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={videoForm.description}
                      onChange={e => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Présentez les points clés abordés dans cette prise de parole..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* ---------------- 4. FORMULAIRE ÉVÉNEMENT ---------------- */}
              {activeType === 'event' && (
                <>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre du sommet / événement officiel *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Ex: Conférence Nationale sur la Transformation Numérique Publique"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Format
                      </label>
                      <select
                        value={eventForm.format}
                        onChange={e => setEventForm({ ...eventForm, format: e.target.value as any })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="hybrid">Hybride (Présentiel + WebRTC)</option>
                        <option value="virtual">En Ligne (Live Webinaire)</option>
                        <option value="in-person">Présentiel</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date & Heure
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Capacité
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={eventForm.capacity}
                        onChange={e => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 100 })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lieu / Ville
                      </label>
                      <input
                        type="text"
                        value={eventForm.city}
                        onChange={e => setEventForm({ ...eventForm, city: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Intervenant / Orateur
                      </label>
                      <input
                        type="text"
                        value={eventForm.speaker}
                        onChange={e => setEventForm({ ...eventForm, speaker: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800/40">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Diffusion en cours...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Diffuser officiellement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default CreatePublicationModal
