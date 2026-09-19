import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  Lock,
  Heart,
  Megaphone,
  Sparkles,
  Paperclip,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Percent,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Search,
  Loader2,
  Check,
  Mail,
  Clock,
  User
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
  visibility?: 'public' | 'private'
  targetScope?: 'worldwide' | 'targeted'
  targetedLocation?: {
    name: string
    lat?: string
    lon?: string
    radius?: string
    city?: string
    state?: string
    country?: string
    countryCode?: string
    targetLevel?: 'city' | 'state' | 'country' | 'radius'
  }
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

type ModalTab = 'urgency' | 'health' | 'recruitment' | 'announcement' | 'promotion' | 'video' | 'event'

interface CreatePublicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: CreatedPublicationItem) => void
  initialType?: 'alert' | 'job' | 'video' | 'event' | 'urgency' | 'health' | 'announcement' | 'promotion'
}

export function CreatePublicationModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'urgency'
}: CreatePublicationModalProps): JSX.Element | null {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = resolvedTheme === 'dark'

  // Mapper le initialType vers l'une des tabs
  const getInitialTab = (type: string): ModalTab => {
    if (type === 'alert') return 'urgency'
    if (type === 'job') return 'recruitment'
    if (type === 'video') return 'video'
    if (type === 'event') return 'event'
    if (['urgency', 'health', 'recruitment', 'announcement', 'promotion'].includes(type)) {
      return type as ModalTab
    }
    return 'urgency'
  }

  const [activeTab, setActiveTab] = useState<ModalTab>(getInitialTab(initialType))
  const [isVerifiedInstitution, setIsVerifiedInstitution] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // -------------------------------------------------------------
  // Paramètres de Visibilité & Ciblage Géographique (OpenStreetMap 100% Gratuit)
  // -------------------------------------------------------------
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [targetScope, setTargetScope] = useState<'worldwide' | 'targeted'>('worldwide')
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      country?: string;
      country_code?: string;
      state?: string;
      province?: string;
      department?: string;
      county?: string;
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
    };
  }>>([])
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: string;
    lon: string;
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
  } | null>(null)
  const [targetLevel, setTargetLevel] = useState<'city' | 'state' | 'country'>('city')
  const [locationRadius, setLocationRadius] = useState<'10km' | '30km' | 'region' | 'country'>('30km')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Recherche OpenStreetMap Nominatim 100% Gratuite avec debounce
  useEffect(() => {
    if (targetScope !== 'targeted' || !locationSearchQuery.trim() || (selectedLocation && selectedLocation.name === locationSearchQuery)) {
      setLocationSuggestions([])
      setIsSearchingLocation(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearchQuery)}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'Accept-Language': 'fr,ht,en'
            }
          }
        )
        if (res.ok) {
          const data = await res.json()
          setLocationSuggestions(data || [])
          setShowLocationDropdown(true)
        }
      } catch (err) {
        console.warn('Erreur de recherche OpenStreetMap:', err)
      } finally {
        setIsSearchingLocation(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [locationSearchQuery, targetScope, selectedLocation])


  // -------------------------------------------------------------
  // 1. FORMULAIRE URGENCE
  // -------------------------------------------------------------
  const [urgencyForm, setUrgencyForm] = useState({
    title: '',
    urgencyType: 'Séisme',
    description: '',
    urgencyLevel: 'Élevé' as 'Faible' | 'Moyen' | 'Élevé' | 'Critique',
    location: 'Zone Métropolitaine (Port-au-Prince)',
    dateTime: '',
    contactPerson: 'Coordination Opérationnelle DGPC',
    phone: '+509 3111 0114',
    allowComments: false,
    institutionName: 'Direction Générale de la Protection Civile (DGPC)',
    isBoosted: false,
    attachmentNames: [] as string[]
  })

  // -------------------------------------------------------------
  // 2. FORMULAIRE SANTÉ
  // -------------------------------------------------------------
  const [healthForm, setHealthForm] = useState({
    title: '',
    category: 'Campagne de vaccination',
    description: '',
    facility: 'Hôpital de l\'Université d\'État d\'Haïti (HUEH)',
    address: 'Rue Monseigneur Guilloux, Port-au-Prince',
    date: '',
    time: '08:30',
    phone: '+509 2813 0000',
    email: 'contact@mspp.gouv.ht',
    externalLink: '',
    institutionName: 'Ministère de la Santé Publique et de la Population (MSPP)',
    isBoosted: false,
    imageName: ''
  })

  // -------------------------------------------------------------
  // 3. FORMULAIRE RECRUTEMENT
  // -------------------------------------------------------------
  const [recruitmentForm, setRecruitmentForm] = useState({
    title: '',
    company: 'Banque de la République d\'Haïti (BRH)',
    description: '',
    contractType: 'CDI - Temps plein',
    domain: 'Finance & Économie',
    studyLevel: 'Licence (Bac+3/4)',
    experience: '3-5 ans',
    salary: 'Selon grille officielle',
    location: 'Angle Rues Pavée et du Quai, Port-au-Prince',
    deadline: '',
    email: 'recrutement@brh.ht',
    phone: '+509 2299 1000',
    website: 'https://www.brh.ht',
    isBoosted: false,
    logoName: '',
    pdfName: ''
  })

  // -------------------------------------------------------------
  // 4. FORMULAIRE ANNONCE
  // -------------------------------------------------------------
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    category: 'Avis officiel au public',
    description: '',
    date: '',
    location: 'National / Tout Haïti',
    organizer: 'Ministère de l\'Éducation Nationale (MENFP)',
    phone: '+509 2816 1120',
    email: 'direction.generale@menfp.gouv.ht',
    externalLink: '',
    institutionName: 'Ministère de l\'Éducation Nationale et de la Formation Professionnelle',
    isBoosted: false,
    imageName: '',
    documentNames: [] as string[]
  })

  // -------------------------------------------------------------
  // 5. FORMULAIRE PROMOTION
  // -------------------------------------------------------------
  const [promotionForm, setPromotionForm] = useState({
    promoName: '',
    productOrService: '',
    description: '',
    regularPrice: '',
    promoPrice: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    company: 'Entreprise Nationale Télécom (Natcom)',
    address: 'Boutilliers, Port-au-Prince',
    phone: '+509 2222 8888',
    videoUrl: '',
    productLink: '',
    institutionName: 'Natcom S.A.',
    isBoosted: false,
    imageName: ''
  })

  // -------------------------------------------------------------
  // 6. FORMULAIRE VIDÉO
  // -------------------------------------------------------------
  const [videoForm, setVideoForm] = useState({
    title: '',
    category: 'Allocution Officielle',
    institutionName: 'Primature de la République d\'Haïti',
    description: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isBoosted: false
  })

  // -------------------------------------------------------------
  // 7. FORMULAIRE ÉVÉNEMENT
  // -------------------------------------------------------------
  const [eventForm, setEventForm] = useState({
    title: '',
    format: 'hybrid' as 'in-person' | 'virtual' | 'hybrid',
    institutionName: 'Chambre de Commerce et d\'Industrie d\'Haïti (CCIH)',
    startDate: '',
    capacity: 200,
    city: 'Pétion-Ville',
    speaker: 'Intervenants Institutionnels & Invités d\'Honneur',
    isBoosted: false
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Mise à jour automatique de la remise (%) en promotion
  const handlePriceChange = (field: 'regular' | 'promo', value: string) => {
    let reg = field === 'regular' ? parseFloat(value) : parseFloat(promotionForm.regularPrice)
    let pro = field === 'promo' ? parseFloat(value) : parseFloat(promotionForm.promoPrice)

    let discount = promotionForm.discountPercentage
    if (!isNaN(reg) && !isNaN(pro) && reg > 0 && pro >= 0 && pro <= reg) {
      discount = `${Math.round(((reg - pro) / reg) * 100)}%`
    }

    setPromotionForm(prev => ({
      ...prev,
      regularPrice: field === 'regular' ? value : prev.regularPrice,
      promoPrice: field === 'promo' ? value : prev.promoPrice,
      discountPercentage: discount
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!isVerifiedInstitution) {
      setErrorMessage("La publication officielle requiert la certification préalable de votre compte.")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      let createdItem: CreatedPublicationItem

      const scopeLabel = targetScope === 'worldwide' ? '🌍 Diffusion Mondiale' : `📍 Ciblage : ${selectedLocation?.name || locationSearchQuery || 'Zone ciblée'} (${locationRadius})`
      const visibilityLabel = visibility === 'public' ? '🌐 Public' : '🔒 Privé (Membres & Abonnés)'
      const geoMeta = `\n\n[${visibilityLabel} • ${scopeLabel}]`
      const targetLocationObj = targetScope === 'targeted' ? {
        name: selectedLocation?.name || locationSearchQuery || 'Zone ciblée',
        lat: selectedLocation?.lat,
        lon: selectedLocation?.lon,
        radius: locationRadius,
        city: selectedLocation?.city,
        state: selectedLocation?.state,
        country: selectedLocation?.country,
        countryCode: selectedLocation?.countryCode,
        targetLevel: targetLevel
      } : undefined


      if (activeTab === 'urgency') {
        if (!urgencyForm.title.trim() || !urgencyForm.description.trim()) {
          setErrorMessage("Veuillez renseigner au moins le titre et la description de l'urgence.")
          setIsSubmitting(false)
          return
        }

        const priorityMap = {
          'Critique': 'high' as const,
          'Élevé': 'high' as const,
          'Moyen': 'medium' as const,
          'Faible': 'low' as const
        }

        createdItem = {
          id: `urgency-${Date.now()}`,
          type: 'urgency',
          priority: priorityMap[urgencyForm.urgencyLevel] || 'high',
          title: `[${urgencyForm.urgencyType.toUpperCase()}] ${urgencyForm.title}`,
          description: `${urgencyForm.description}\n\n📍 Lieu : ${urgencyForm.location || 'Territoire concerné'} • ⏱ Date : ${urgencyForm.dateTime || 'Immédiate'}\n📞 Contact : ${urgencyForm.contactPerson} (${urgencyForm.phone})${urgencyForm.attachmentNames.length > 0 ? `\n📎 Fichiers joints : ${urgencyForm.attachmentNames.join(', ')}` : ''}`,
          institution: {
            name: urgencyForm.institutionName,
            verified: true
          },
          isBoosted: urgencyForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: urgencyForm.allowComments ? 0 : 0 },
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      } else if (activeTab === 'health') {
        if (!healthForm.title.trim() || !healthForm.description.trim()) {
          setErrorMessage("Veuillez renseigner le titre et la description pour la communication santé.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `health-${Date.now()}`,
          type: 'health',
          priority: 'high',
          title: `[${healthForm.category}] ${healthForm.title}`,
          description: `${healthForm.description}\n\n🏥 Établissement : ${healthForm.facility} (${healthForm.address})\n📅 Date : ${healthForm.date || 'En cours'} à ${healthForm.time || '08:30'}\n📞 Contact : ${healthForm.phone} | ✉️ ${healthForm.email}${healthForm.externalLink ? `\n🌐 Lien : ${healthForm.externalLink}` : ''}`,
          institution: {
            name: healthForm.institutionName,
            verified: true
          },
          isBoosted: healthForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      } else if (activeTab === 'recruitment') {
        if (!recruitmentForm.title.trim() || !recruitmentForm.description.trim()) {
          setErrorMessage("Veuillez renseigner l'intitulé du poste et les détails de l'offre.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `job-${Date.now()}`,
          type: 'recruitment',
          priority: 'medium',
          title: recruitmentForm.title,
          description: `${recruitmentForm.description}\n\n🏢 Entreprise : ${recruitmentForm.company}\n📋 Contrat : ${recruitmentForm.contractType} • Domaine : ${recruitmentForm.domain}\n🎓 Niveau : ${recruitmentForm.studyLevel} • Expérience : ${recruitmentForm.experience}\n💰 Salaire : ${recruitmentForm.salary || 'Non spécifié'}\n📍 Lieu : ${recruitmentForm.location}\n⏳ Date limite : ${recruitmentForm.deadline || 'Sous 30 jours'}\n✉️ Dépôt CV (PDF) : ${recruitmentForm.email} | 📞 ${recruitmentForm.phone}${recruitmentForm.pdfName ? `\n📄 Fiche de poste jointe : ${recruitmentForm.pdfName}` : ''}`,
          institution: {
            name: recruitmentForm.company || 'Institution Recruteuse',
            verified: true
          },
          isBoosted: recruitmentForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          visibility,
          targetScope,
          targetedLocation: targetLocationObj,
          recruitmentDetails: {
            contractType: recruitmentForm.contractType,
            location: recruitmentForm.location,
            deadline: recruitmentForm.deadline || 'Sous 30 jours',
            rhEmail: recruitmentForm.email
          }
        }
      } else if (activeTab === 'announcement') {
        if (!announcementForm.title.trim() || !announcementForm.description.trim()) {
          setErrorMessage("Veuillez renseigner le titre et le contenu de l'annonce.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `announcement-${Date.now()}`,
          type: 'announcement',
          priority: 'medium',
          title: `[${announcementForm.category}] ${announcementForm.title}`,
          description: `${announcementForm.description}\n\n🏛 Organisateur : ${announcementForm.organizer}\n📍 Lieu : ${announcementForm.location} • 📅 Date : ${announcementForm.date || 'Immédiate'}\n📞 Info : ${announcementForm.phone} • ✉️ ${announcementForm.email}${announcementForm.externalLink ? `\n🌐 Lien officiel : ${announcementForm.externalLink}` : ''}${announcementForm.documentNames.length > 0 ? `\n📂 Documents joints : ${announcementForm.documentNames.join(', ')}` : ''}`,
          institution: {
            name: announcementForm.institutionName || announcementForm.organizer,
            verified: true
          },
          isBoosted: announcementForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      } else if (activeTab === 'promotion') {
        if (!promotionForm.promoName.trim() || !promotionForm.productOrService.trim()) {
          setErrorMessage("Veuillez indiquer le nom de la promotion et le produit ou service concerné.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `promo-${Date.now()}`,
          type: 'promotion',
          priority: 'low',
          title: `🎉 ${promotionForm.promoName} : ${promotionForm.productOrService}`,
          description: `${promotionForm.description}\n\n🏷 Offre Spéciale : ${promotionForm.promoPrice || 'Tarif réduit'} (Prix normal : ${promotionForm.regularPrice || 'Standard'})${promotionForm.discountPercentage ? ` • Remise : ${promotionForm.discountPercentage}` : ''}\n📅 Validité : du ${promotionForm.startDate || 'Aujourd\'hui'} au ${promotionForm.endDate || 'Fin de campagne'}\n🏢 Entreprise : ${promotionForm.company}\n📍 Adresse : ${promotionForm.address} • 📞 ${promotionForm.phone}${promotionForm.productLink ? `\n🔗 Découvrir l\'offre : ${promotionForm.productLink}` : ''}`,
          institution: {
            name: promotionForm.company || promotionForm.institutionName,
            verified: true
          },
          isBoosted: promotionForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          videoUrl: promotionForm.videoUrl || undefined,
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      } else if (activeTab === 'video') {
        if (!videoForm.title.trim() || !videoForm.description.trim()) {
          setErrorMessage("Veuillez renseigner le titre et la description de la vidéo.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `video-${Date.now()}`,
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
          videoUrl: videoForm.videoUrl,
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      } else {
        // Event
        if (!eventForm.title.trim()) {
          setErrorMessage("Veuillez renseigner le titre de l'événement.")
          setIsSubmitting(false)
          return
        }

        createdItem = {
          id: `event-${Date.now()}`,
          type: 'event',
          priority: 'medium',
          title: eventForm.title,
          description: `Événement officiel : ${eventForm.title}.\nOrganisé par ${eventForm.institutionName}.\nIntervenant : ${eventForm.speaker}.\nFormat : ${eventForm.format} • Capacité : ${eventForm.capacity} participants.`,
          institution: {
            name: eventForm.institutionName,
            verified: true
          },
          isBoosted: eventForm.isBoosted,
          createdAt: 'À l\'instant',
          stats: { views: 1, shares: 0, comments: 0 },
          eventDate: eventForm.startDate || 'Prochainement',
          eventLocation: eventForm.city,
          visibility,
          targetScope,
          targetedLocation: targetLocationObj
        }
      }

      // Sauvegarde persistante dans le localStorage pour le fil en direct
      try {
        const existing = JSON.parse(localStorage.getItem('exile_social_custom_feed') || '[]')
        localStorage.setItem('exile_social_custom_feed', JSON.stringify([createdItem, ...existing]))
      } catch (err) {
        console.warn('Could not save to localStorage', err)
      }

      setIsSubmitting(false)
      onSuccess(createdItem)
      onClose()
    }, 500)
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/80 sm:backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-2xl border-0 sm:border shadow-2xl overflow-hidden my-0 sm:my-auto ${
          isDark ? 'bg-zinc-900 sm:border-zinc-700 text-white' : 'bg-white sm:border-slate-200 text-slate-900'
        }`}
      >
        {/* En-tête sobre et clair */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Créer une Publication Institutionnelle</h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Diffusion officielle vérifiée sur le réseau EXILE Social
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

        {/* Bannière de certification */}
        <div className={`px-4 sm:px-6 py-2 text-xs border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-emerald-500">Compte Certifié</span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>•</span>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Publication habilitée avec badge officiel
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsVerifiedInstitution(!isVerifiedInstitution)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              isVerifiedInstitution
                ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                : 'border-amber-500/40 text-amber-500 bg-amber-500/10'
            }`}
            title="Basculer le statut pour simuler"
          >
            Statut : {isVerifiedInstitution ? 'Certifié ✓' : 'Non certifié (Simulation)'}
          </button>
        </div>

        {/* Écran si non certifié */}
        {!isVerifiedInstitution ? (
          <div className="p-8 text-center space-y-4 flex-1 overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold">Certification Requise</h3>
            <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Pour garantir la véracité des alertes et informations publiques, seules les institutions enregistrées et validées peuvent diffuser des publications officielles.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/social/institution/request')
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                Demander la certification
              </button>
              <button
                type="button"
                onClick={() => setIsVerifiedInstitution(true)}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Simuler en tant qu'institution vérifiée
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 5 Catégories d'alerte / publication demandées par l'utilisateur + Vidéo / Sommet */}
            <div className={`p-2 sm:p-3 border-b flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-100 bg-slate-50'}`}>
              {[
                { id: 'urgency' as const, label: 'Urgence', icon: AlertTriangle, color: 'text-red-500' },
                { id: 'health' as const, label: 'Santé', icon: Heart, color: 'text-emerald-500' },
                { id: 'recruitment' as const, label: 'Recrutement', icon: Briefcase, color: 'text-blue-500' },
                { id: 'announcement' as const, label: 'Annonce', icon: Megaphone, color: 'text-amber-500' },
                { id: 'promotion' as const, label: 'Promotion', icon: Sparkles, color: 'text-purple-500' },
                { id: 'video' as const, label: 'Vidéo', icon: VideoIcon, color: 'text-pink-500' },
                { id: 'event' as const, label: 'Événement', icon: Calendar, color: 'text-indigo-500' },
              ].map(tab => {
                const isSelected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setErrorMessage(null)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                          : 'bg-white text-slate-900 border border-slate-300 shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Contenu dynamique des formulaires */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ---------------- 1. FORMULAIRE URGENCE ---------------- */}
              {activeTab === 'urgency' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de l'alerte d'urgence *
                    </label>
                    <input
                      type="text"
                      required
                      value={urgencyForm.title}
                      onChange={e => setUrgencyForm({ ...urgencyForm, title: e.target.value })}
                      placeholder="Ex: Alerte vigilance rouge - Inondations imminentes"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Type d'urgence *
                      </label>
                      <select
                        value={urgencyForm.urgencyType}
                        onChange={e => setUrgencyForm({ ...urgencyForm, urgencyType: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Séisme">Séisme / Tremblement de terre</option>
                        <option value="Inondation">Inondation / Crue soudaine</option>
                        <option value="Incendie">Incendie majeur</option>
                        <option value="Trouble public">Trouble public / Sécurité civile</option>
                        <option value="Alerte météo">Alerte météo / Ouragan</option>
                        <option value="Accident majeur">Accident de transport majeur</option>
                        <option value="Autre">Autre situation d'urgence</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Niveau d'urgence *
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['Faible', 'Moyen', 'Élevé', 'Critique'] as const).map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setUrgencyForm({ ...urgencyForm, urgencyLevel: lvl })}
                            className={`py-2 text-xs rounded-xl font-medium border text-center transition-all ${
                              urgencyForm.urgencyLevel === lvl
                                ? lvl === 'Critique'
                                  ? 'bg-red-500/20 text-red-500 border-red-500 font-bold'
                                  : lvl === 'Élevé'
                                  ? 'bg-orange-500/20 text-orange-500 border-orange-500 font-bold'
                                  : 'bg-zinc-700 text-white border-zinc-500 font-bold'
                                : isDark
                                ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description des faits et consignes de sécurité *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={urgencyForm.description}
                      onChange={e => setUrgencyForm({ ...urgencyForm, description: e.target.value })}
                      placeholder="Décrivez précisément la situation, les secteurs touchés et les mesures de précaution..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lieu / Zone concernée
                      </label>
                      <input
                        type="text"
                        value={urgencyForm.location}
                        onChange={e => setUrgencyForm({ ...urgencyForm, location: e.target.value })}
                        placeholder="Ex: Commune de Léogâne, Route Nationale 2"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date et heure
                      </label>
                      <input
                        type="datetime-local"
                        value={urgencyForm.dateTime}
                        onChange={e => setUrgencyForm({ ...urgencyForm, dateTime: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Personne ou cellule à contacter
                      </label>
                      <input
                        type="text"
                        value={urgencyForm.contactPerson}
                        onChange={e => setUrgencyForm({ ...urgencyForm, contactPerson: e.target.value })}
                        placeholder="Ex: Centre d'Opérations d'Urgence"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Téléphone d'urgence
                      </label>
                      <input
                        type="tel"
                        value={urgencyForm.phone}
                        onChange={e => setUrgencyForm({ ...urgencyForm, phone: e.target.value })}
                        placeholder="Ex: +509 3111 0114"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Pièces jointes & Commentaires */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Pièces jointes (photo, vidéo, document)
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <Paperclip className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {urgencyForm.attachmentNames.length > 0
                            ? `${urgencyForm.attachmentNames.length} fichier(s) sélectionné(s)`
                            : 'Ajouter une pièce jointe'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files || [])
                            setUrgencyForm({ ...urgencyForm, attachmentNames: files.map(f => f.name) })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Autoriser les commentaires (Par défaut : Non)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUrgencyForm({ ...urgencyForm, allowComments: false })}
                          className={`flex-1 py-2 text-xs rounded-xl font-semibold border transition-all ${
                            !urgencyForm.allowComments
                              ? isDark ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-slate-200 text-slate-900 border-slate-400'
                              : isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          Non (Recommandé)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgencyForm({ ...urgencyForm, allowComments: true })}
                          className={`flex-1 py-2 text-xs rounded-xl font-semibold border transition-all ${
                            urgencyForm.allowComments
                              ? 'bg-orange-500/20 text-orange-500 border-orange-500'
                              : isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          Oui
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 2. FORMULAIRE SANTÉ ---------------- */}
              {activeTab === 'health' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de l'action / alerte santé *
                    </label>
                    <input
                      type="text"
                      required
                      value={healthForm.title}
                      onChange={e => setHealthForm({ ...healthForm, title: e.target.value })}
                      placeholder="Ex: Campagne d'Urgence : Don de sang O- et B-"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Catégorie santé *
                      </label>
                      <select
                        value={healthForm.category}
                        onChange={e => setHealthForm({ ...healthForm, category: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Don de sang">Don de sang</option>
                        <option value="Consultation">Consultation médicale gratuite</option>
                        <option value="Vaccination">Campagne de vaccination</option>
                        <option value="Médicament">Disponibilité / Pénurie de médicament</option>
                        <option value="Dépistage">Séance de dépistage</option>
                        <option value="Prévention épidémique">Alerte sanitaire / Prévention épidémique</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Établissement concerné *
                      </label>
                      <input
                        type="text"
                        required
                        value={healthForm.facility}
                        onChange={e => setHealthForm({ ...healthForm, facility: e.target.value })}
                        placeholder="Ex: Centre National de Transfusion Sanguine"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description des soins ou consignes *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={healthForm.description}
                      onChange={e => setHealthForm({ ...healthForm, description: e.target.value })}
                      placeholder="Détaillez les conditions d'accès, les horaires, les documents requis..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Adresse exacte de l'établissement
                    </label>
                    <input
                      type="text"
                      value={healthForm.address}
                      onChange={e => setHealthForm({ ...healthForm, address: e.target.value })}
                      placeholder="Ex: Rue Monseigneur Guilloux, Port-au-Prince"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={healthForm.date}
                        onChange={e => setHealthForm({ ...healthForm, date: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Heure
                      </label>
                      <input
                        type="time"
                        value={healthForm.time}
                        onChange={e => setHealthForm({ ...healthForm, time: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={healthForm.phone}
                        onChange={e => setHealthForm({ ...healthForm, phone: e.target.value })}
                        placeholder="+509 2813 0000"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={healthForm.email}
                        onChange={e => setHealthForm({ ...healthForm, email: e.target.value })}
                        placeholder="sante@institution.gouv.ht"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Image / Affiche officielle
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {healthForm.imageName || 'Sélectionner une affiche'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setHealthForm({ ...healthForm, imageName: f.name })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lien externe (optionnel)
                      </label>
                      <input
                        type="url"
                        value={healthForm.externalLink}
                        onChange={e => setHealthForm({ ...healthForm, externalLink: e.target.value })}
                        placeholder="https://mspp.gouv.ht/..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 3. FORMULAIRE RECRUTEMENT ---------------- */}
              {activeTab === 'recruitment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Intitulé du poste *
                      </label>
                      <input
                        type="text"
                        required
                        value={recruitmentForm.title}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, title: e.target.value })}
                        placeholder="Ex: Auditeur Interne Senior"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Entreprise / Institution *
                      </label>
                      <input
                        type="text"
                        required
                        value={recruitmentForm.company}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, company: e.target.value })}
                        placeholder="Ex: Banque de la République d'Haïti"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description des missions *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={recruitmentForm.description}
                      onChange={e => setRecruitmentForm({ ...recruitmentForm, description: e.target.value })}
                      placeholder="Décrivez les responsabilités principales, le profil recherché et les objectifs du poste..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Type de contrat
                      </label>
                      <select
                        value={recruitmentForm.contractType}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, contractType: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="CDI - Temps plein">CDI - Temps plein</option>
                        <option value="CDD - Durée déterminée">CDD - Durée déterminée</option>
                        <option value="Stage Académique / Pro">Stage Académique / Pro</option>
                        <option value="Consultation / Mission">Consultation / Mission</option>
                        <option value="Temps partiel">Temps partiel</option>
                        <option value="Concours Fonction Publique">Concours Fonction Publique</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Domaine d'activité
                      </label>
                      <select
                        value={recruitmentForm.domain}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, domain: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Finance & Économie">Finance & Économie</option>
                        <option value="Informatique & Tech">Informatique & Tech</option>
                        <option value="Santé & Médical">Santé & Médical</option>
                        <option value="Administration & Juridique">Administration & Juridique</option>
                        <option value="Éducation & Formation">Éducation & Formation</option>
                        <option value="Logistique & Transport">Logistique & Transport</option>
                        <option value="Ingénierie & BTP">Ingénierie & BTP</option>
                        <option value="Autre">Autre domaine</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Niveau d'étude
                      </label>
                      <select
                        value={recruitmentForm.studyLevel}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, studyLevel: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Baccalauréat">Baccalauréat</option>
                        <option value="Bac+2 (DUT / BTS)">Bac+2 (DUT / BTS)</option>
                        <option value="Licence (Bac+3/4)">Licence (Bac+3/4)</option>
                        <option value="Master / Ingénieur (Bac+5)">Master / Ingénieur (Bac+5)</option>
                        <option value="Doctorat / PhD">Doctorat / PhD</option>
                        <option value="Sans diplôme requis">Sans diplôme requis</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Expérience requise
                      </label>
                      <select
                        value={recruitmentForm.experience}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, experience: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Débutant (0-1 an)">Débutant (0-1 an)</option>
                        <option value="1 à 3 ans">1 à 3 ans</option>
                        <option value="3 à 5 ans">3 à 5 ans</option>
                        <option value="+5 ans (Confirmé)">+5 ans (Confirmé)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Salaire (optionnel)
                      </label>
                      <input
                        type="text"
                        value={recruitmentForm.salary}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, salary: e.target.value })}
                        placeholder="Ex: Selon grille ou confidentiel"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date limite de dépôt
                      </label>
                      <input
                        type="date"
                        value={recruitmentForm.deadline}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, deadline: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Localisation du poste
                      </label>
                      <input
                        type="text"
                        value={recruitmentForm.location}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, location: e.target.value })}
                        placeholder="Ex: Port-au-Prince / Télétravail"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Email RH de réception des CV *
                      </label>
                      <input
                        type="email"
                        required
                        value={recruitmentForm.email}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, email: e.target.value })}
                        placeholder="rh@institution.ht"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={recruitmentForm.phone}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, phone: e.target.value })}
                        placeholder="+509 2299 1000"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Site web officiel
                      </label>
                      <input
                        type="url"
                        value={recruitmentForm.website}
                        onChange={e => setRecruitmentForm({ ...recruitmentForm, website: e.target.value })}
                        placeholder="https://..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Logo de l'institution
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {recruitmentForm.logoName || 'Sélectionner le logo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setRecruitmentForm({ ...recruitmentForm, logoName: f.name })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Fiche de poste (PDF)
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {recruitmentForm.pdfName || 'Joindre un PDF'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setRecruitmentForm({ ...recruitmentForm, pdfName: f.name })
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 4. FORMULAIRE ANNONCE ---------------- */}
              {activeTab === 'announcement' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de l'annonce officielle *
                    </label>
                    <input
                      type="text"
                      required
                      value={announcementForm.title}
                      onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="Ex: Calendrier National des Concours et Examens d'État 2026"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Catégorie *
                      </label>
                      <select
                        value={announcementForm.category}
                        onChange={e => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Avis officiel au public">Avis officiel au public</option>
                        <option value="Circulaire ministérielle">Circulaire ministérielle</option>
                        <option value="Fermeture administrative">Fermeture administrative / Jours fériés</option>
                        <option value="Concours & Bourses">Concours & Bourses d'excellence</option>
                        <option value="Réforme réglementaire">Réforme réglementaire / Décret</option>
                        <option value="Événement civique">Événement civique & Commémoration</option>
                        <option value="Autre">Autre annonce</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Organisateur / Émetteur
                      </label>
                      <input
                        type="text"
                        value={announcementForm.organizer}
                        onChange={e => setAnnouncementForm({ ...announcementForm, organizer: e.target.value })}
                        placeholder="Ex: Ministère de l'Éducation Nationale"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description du communiqué *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={announcementForm.description}
                      onChange={e => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                      placeholder="Détaillez le contenu officiel, les dispositions administratives et les dates clés..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={announcementForm.date}
                        onChange={e => setAnnouncementForm({ ...announcementForm, date: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lieu
                      </label>
                      <input
                        type="text"
                        value={announcementForm.location}
                        onChange={e => setAnnouncementForm({ ...announcementForm, location: e.target.value })}
                        placeholder="Ex: Port-au-Prince / National"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={announcementForm.phone}
                        onChange={e => setAnnouncementForm({ ...announcementForm, phone: e.target.value })}
                        placeholder="+509 2816 1120"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={announcementForm.email}
                        onChange={e => setAnnouncementForm({ ...announcementForm, email: e.target.value })}
                        placeholder="contact@menfp.gouv.ht"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Image d'illustration
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {announcementForm.imageName || 'Sélectionner une image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setAnnouncementForm({ ...announcementForm, imageName: f.name })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Documents joints
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <Paperclip className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {announcementForm.documentNames.length > 0
                            ? `${announcementForm.documentNames.length} document(s)`
                            : 'Arrêté / Décret PDF'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files || [])
                            setAnnouncementForm({ ...announcementForm, documentNames: files.map(f => f.name) })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lien externe
                      </label>
                      <input
                        type="url"
                        value={announcementForm.externalLink}
                        onChange={e => setAnnouncementForm({ ...announcementForm, externalLink: e.target.value })}
                        placeholder="https://..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 5. FORMULAIRE PROMOTION ---------------- */}
              {activeTab === 'promotion' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Nom de la promotion *
                      </label>
                      <input
                        type="text"
                        required
                        value={promotionForm.promoName}
                        onChange={e => setPromotionForm({ ...promotionForm, promoName: e.target.value })}
                        placeholder="Ex: Forfait Rentrée Scolaire Connectée"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Produit ou service concerné *
                      </label>
                      <input
                        type="text"
                        required
                        value={promotionForm.productOrService}
                        onChange={e => setPromotionForm({ ...promotionForm, productOrService: e.target.value })}
                        placeholder="Ex: Box Fibre Optique 100 Mbps"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Description de l'offre promotionnelle
                    </label>
                    <textarea
                      rows={2}
                      value={promotionForm.description}
                      onChange={e => setPromotionForm({ ...promotionForm, description: e.target.value })}
                      placeholder="Détails de l'avantage, conditions d'éligibilité et durée de validité..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Prix normal
                      </label>
                      <input
                        type="text"
                        value={promotionForm.regularPrice}
                        onChange={e => handlePriceChange('regular', e.target.value)}
                        placeholder="Ex: 50 USD / 6500 HTG"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Prix promotionnel
                      </label>
                      <input
                        type="text"
                        value={promotionForm.promoPrice}
                        onChange={e => handlePriceChange('promo', e.target.value)}
                        placeholder="Ex: 25 USD / 3250 HTG"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Réduction (%)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={promotionForm.discountPercentage}
                          onChange={e => setPromotionForm({ ...promotionForm, discountPercentage: e.target.value })}
                          placeholder="Ex: -50%"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
                        <Percent className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={promotionForm.startDate}
                        onChange={e => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={promotionForm.endDate}
                        onChange={e => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Entreprise émettrice
                      </label>
                      <input
                        type="text"
                        value={promotionForm.company}
                        onChange={e => setPromotionForm({ ...promotionForm, company: e.target.value })}
                        placeholder="Ex: Entreprise S.A."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Adresse / Point de vente
                      </label>
                      <input
                        type="text"
                        value={promotionForm.address}
                        onChange={e => setPromotionForm({ ...promotionForm, address: e.target.value })}
                        placeholder="Ex: Rue Panaméricaine, Pétion-Ville"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={promotionForm.phone}
                        onChange={e => setPromotionForm({ ...promotionForm, phone: e.target.value })}
                        placeholder="+509 2222 8888"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Image promotionnelle
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${
                        isDark ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span className="truncate flex-1">
                          {promotionForm.imageName || 'Bannière / Visuel'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setPromotionForm({ ...promotionForm, imageName: f.name })
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lien vidéo (optionnel)
                      </label>
                      <input
                        type="url"
                        value={promotionForm.videoUrl}
                        onChange={e => setPromotionForm({ ...promotionForm, videoUrl: e.target.value })}
                        placeholder="https://..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Lien vers le produit / commande
                      </label>
                      <input
                        type="url"
                        value={promotionForm.productLink}
                        onChange={e => setPromotionForm({ ...promotionForm, productLink: e.target.value })}
                        placeholder="https://natcom.ht/offre"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 6. FORMULAIRE VIDÉO ---------------- */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre de l'allocution ou vidéo institutionnelle *
                    </label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="Ex: Allocution sur les mesures de sécurité et de secours"
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
                        Lien de diffusion (URL vidéo MP4 ou source)
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
                      Description & Points clés de la vidéo *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={videoForm.description}
                      onChange={e => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Présentez les thèmes majeurs et les annonces faites durant la vidéo..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* ---------------- 7. FORMULAIRE ÉVÉNEMENT ---------------- */}
              {activeTab === 'event' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Titre du sommet ou événement officiel *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Ex: Forum National de la Relance Économique"
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
                        <option value="virtual">En Ligne (Live)</option>
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
                        min="1"
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
                        placeholder="Ex: Pétion-Ville, Haïti"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Intervenants / Invités d'honneur
                      </label>
                      <input
                        type="text"
                        value={eventForm.speaker}
                        onChange={e => setEventForm({ ...eventForm, speaker: e.target.value })}
                        placeholder="Ex: Ministres, Ambassadeurs, Experts"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* ---------------- SECTION COMMUNE : VISIBILITÉ & CIBLAGE GÉOGRAPHIQUE MONDIAL (100% GRATUIT) ---------------- */}
              <div className={`p-4 rounded-2xl border transition-all mt-4 ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50/90 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-[#FF6B00]" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Paramètres de Diffusion & Ciblage Géographique (OpenStreetMap Gratuit)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Visibilité : Public vs Privé */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Visibilité de la publication
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          visibility === 'public'
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-500 font-bold shadow-sm'
                            : isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs leading-tight">Public</p>
                          <p className="text-[10px] opacity-75 leading-tight mt-0.5">Visible par tous</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVisibility('private')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          visibility === 'private'
                            ? 'border-amber-500/60 bg-amber-500/10 text-amber-500 font-bold shadow-sm'
                            : isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs leading-tight">Privé</p>
                          <p className="text-[10px] opacity-75 leading-tight mt-0.5">Abonnés & certifiés</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Ciblage : Mondial vs Lieu Ciblé */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Zone de diffusion géographique
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetScope('worldwide')
                          setSelectedLocation(null)
                          setLocationSearchQuery('')
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          targetScope === 'worldwide'
                            ? 'border-orange-500/60 bg-orange-500/10 text-orange-500 font-bold shadow-sm'
                            : isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs leading-tight">Mondial</p>
                          <p className="text-[10px] opacity-75 leading-tight mt-0.5">Partout sur EXILE</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetScope('targeted')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          targetScope === 'targeted'
                            ? 'border-blue-500/60 bg-blue-500/10 text-blue-500 font-bold shadow-sm'
                            : isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs leading-tight">Lieu ciblé</p>
                          <p className="text-[10px] opacity-75 leading-tight mt-0.5">Zone spécifique</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Si "Lieu ciblé" est sélectionné : Option B Mòd Entèlijan (Rechèch + Deteksyon Peyi, Eta/Depatman, Vil) */}
                {targetScope === 'targeted' && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/40 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                    <div className="relative">
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Rechercher un lieu dans le monde (OpenStreetMap Gratuit) *
                      </label>
                      <div className="relative">
                        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <input
                          type="text"
                          value={locationSearchQuery}
                          onChange={e => {
                            setLocationSearchQuery(e.target.value)
                            if (selectedLocation) setSelectedLocation(null)
                          }}
                          placeholder="Tapez une ville, état, département ou pays (ex: Port-au-Prince, Miami, Paris, Montréal, Santiago...)"
                          className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm ${
                            isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                        {isSearchingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                        ) : locationSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setLocationSearchQuery('')
                              setSelectedLocation(null)
                              setLocationSuggestions([])
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown des résultats OpenStreetMap Nominatim */}
                      {showLocationDropdown && locationSuggestions.length > 0 && (
                        <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-xl z-50 max-h-56 overflow-y-auto ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          <div className="p-2 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                            <span>Lieux détectés (OpenStreetMap Gratuit)</span>
                            <button
                              type="button"
                              onClick={() => setShowLocationDropdown(false)}
                              className="text-zinc-400 hover:text-zinc-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {locationSuggestions.map((item, idx) => {
                            const addr = item.address || {}
                            const cCountry = addr.country || ''
                            const cState = addr.state || addr.province || addr.department || addr.county || ''
                            const cCity = addr.city || addr.town || addr.village || addr.municipality || ''
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedLocation({
                                    name: item.display_name,
                                    lat: item.lat,
                                    lon: item.lon,
                                    country: cCountry,
                                    countryCode: (addr.country_code || '').toUpperCase(),
                                    state: cState,
                                    city: cCity
                                  })
                                  setTargetLevel(cCity ? 'city' : cState ? 'state' : 'country')
                                  setLocationSearchQuery(item.display_name)
                                  setShowLocationDropdown(false)
                                }}
                                className={`w-full p-2.5 text-left text-xs hover:bg-orange-500/10 hover:text-orange-500 flex items-start gap-2 border-b last:border-0 ${
                                  isDark ? 'border-zinc-800' : 'border-slate-100'
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate font-medium">{item.display_name}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                                    {cCity && <span>📍 {cCity}</span>}
                                    {cState && <span>• 🏛️ {cState}</span>}
                                    {cCountry && <span>• 🌍 {cCountry}</span>}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Décomposition Automatique en Badges (Option B) */}
                      {selectedLocation && (
                        <div className={`mt-3 p-3 rounded-xl border ${
                          isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Lieu identifié avec succès
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Lat: {parseFloat(selectedLocation.lat).toFixed(3)}, Lon: {parseFloat(selectedLocation.lon).toFixed(3)}
                            </span>
                          </div>

                          {/* 3 Niveaux Détectés : Pays, État/Département, Ville */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            {selectedLocation.country && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Globe className="w-3 h-3" />
                                <span>Pays : {selectedLocation.country}</span>
                              </span>
                            )}
                            {selectedLocation.state && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <Building2 className="w-3 h-3" />
                                <span>État / Dép. : {selectedLocation.state}</span>
                              </span>
                            )}
                            {selectedLocation.city && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                <MapPin className="w-3 h-3" />
                                <span>Ville : {selectedLocation.city}</span>
                              </span>
                            )}
                          </div>

                          {/* Sélecteur de Portée du Ciblage selon les niveaux détectés */}
                          <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              Niveau de diffusion ciblé :
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {selectedLocation.city && (
                                <button
                                  type="button"
                                  onClick={() => setTargetLevel('city')}
                                  className={`p-2 rounded-xl border text-left transition-all ${
                                    targetLevel === 'city'
                                      ? 'border-orange-500 bg-orange-500/15 text-orange-500 font-bold shadow-sm'
                                      : isDark ? 'border-zinc-800 bg-zinc-800/40 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <p className="text-xs font-bold flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Cette Ville uniquement
                                  </p>
                                  <p className="text-[10px] opacity-75 truncate mt-0.5">{selectedLocation.city}</p>
                                </button>
                              )}

                              {selectedLocation.state && (
                                <button
                                  type="button"
                                  onClick={() => setTargetLevel('state')}
                                  className={`p-2 rounded-xl border text-left transition-all ${
                                    targetLevel === 'state'
                                      ? 'border-blue-500 bg-blue-500/15 text-blue-500 font-bold shadow-sm'
                                      : isDark ? 'border-zinc-800 bg-zinc-800/40 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <p className="text-xs font-bold flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    Tout l'État / Département
                                  </p>
                                  <p className="text-[10px] opacity-75 truncate mt-0.5">{selectedLocation.state}</p>
                                </button>
                              )}

                              {selectedLocation.country && (
                                <button
                                  type="button"
                                  onClick={() => setTargetLevel('country')}
                                  className={`p-2 rounded-xl border text-left transition-all ${
                                    targetLevel === 'country'
                                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500 font-bold shadow-sm'
                                      : isDark ? 'border-zinc-800 bg-zinc-800/40 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <p className="text-xs font-bold flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    Tout le Pays
                                  </p>
                                  <p className="text-[10px] opacity-75 truncate mt-0.5">{selectedLocation.country}</p>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Sélecteur de Rayon si niveau ville ou local */}
                          {targetLevel === 'city' && (
                            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60 dark:border-zinc-800">
                              <label className={`block text-[10px] font-semibold mb-1 text-zinc-400`}>
                                Périmètre de diffusion autour de la ville :
                              </label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { id: '10km', label: '10 km' },
                                  { id: '30km', label: '30 km' },
                                  { id: '50km', label: '50 km' },
                                  { id: 'region', label: 'Agglomération' },
                                ].map(r => (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setLocationRadius(r.id as any)}
                                    className={`py-1.5 text-xs rounded-lg border text-center transition-all ${
                                      locationRadius === r.id
                                        ? 'border-orange-500/70 bg-orange-500/15 text-orange-500 font-bold'
                                        : isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {r.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton d'action et Annuler */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Diffusion en cours...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publier officiellement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

export default CreatePublicationModal
