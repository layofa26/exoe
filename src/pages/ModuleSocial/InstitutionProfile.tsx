import { useState, useEffect, useRef } from 'react'
import { Users, Calendar, AlertTriangle, Briefcase, Video, Settings, Edit, CheckCircle, Check, TrendingUp, Eye, Share2, MessageCircle, ChevronDown, ChevronUp, Play, Radio, CreditCard, Lock, Shield, History, Trash2, Mail, Megaphone, Building2, X, Upload } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { SocialHeader } from '../../components/social/SocialHeader'
import { VideoPlayer } from '../../components/video/VideoPlayer'

interface InstitutionProfileType {
  id: string
  name: string
  type: string
  verified: boolean
  plan: string
  email: string
  phone: string
  address: string
  website: string
  description: string
  avatar?: string
  coverImage?: string
  bannerColor?: string
  followers: number
  following: number
  stats: {
    alerts: number
    recruitments: number
    events: number
    videos: number
    totalViews: number
  }
  createdAt: string
  registrationNumber: string
  countryCode: string
  // Nouveaux champs pour les améliorations
  themeColor?: string // Couleur de marque personnalisée (ex: #1e3a8a)
  featuredContent?: {
    type: 'video' | 'live' | 'announcement'
    title: string
    description: string
    thumbnail?: string
    url?: string
    liveRoomName?: string
    isPinned: boolean
  }
  faculties?: Faculty[]
  videos?: Video[]
  lives?: Live[]
  alerts?: Alert[]
}

interface Faculty {
  id: string
  name: string
  dean: string
  studentCount: number
  departments: string[]
}

interface Video {
  id: string
  title: string
  description: string
  thumbnail?: string
  url: string
  views: number
  shares: number
  createdAt: string
  duration: string
}

interface Live {
  id: string
  title: string
  description: string
  thumbnail?: string
  liveRoomName: string
  views: number
  shares: number
  createdAt: string
  status: 'at_coming' | 'live' | 'ended'
  participantsCount: number
}

interface Alert {
  id: string
  type: 'urgency' | 'health' | 'recruitment' | 'announcement' | 'event' | 'promotion'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  views: number
  shares: number
  createdAt: string
  isBoosted: boolean
}

const DEMO_INSTITUTION: InstitutionProfileType = {
  id: 'inst-1',
  name: 'Ministère de la Santé Publique',
  type: 'government',
  verified: true,
  plan: 'standard',
  email: 'contact@sante.gouv.ht',
  phone: '+509 2244 5566',
  address: 'Port-au-Prince, Haïti',
  website: 'https://sante.gouv.ht',
  description: 'Le Ministère de la Santé Publique est responsable de la formulation et de la mise en œuvre des politiques de santé en Haïti.',
  avatar: undefined,
  coverImage: undefined,
  followers: 15420,
  following: 0,
  stats: {
    alerts: 234,
    recruitments: 45,
    events: 12,
    videos: 89,
    totalViews: 125000,
  },
  createdAt: '2023-01-15',
  registrationNumber: '1234567890',
  countryCode: 'HT',
  // Nouveaux champs démo
  themeColor: '#1e3a8a',
  featuredContent: {
    type: 'live',
    title: 'Conférence de Presse: Plan de Vaccination 2024',
    description: 'Direct du Ministère de la Santé pour présenter le plan de vaccination nationale.',
    liveRoomName: 'plan-vaccination-2024',
    isPinned: true
  },
  faculties: [
    {
      id: 'fac-1',
      name: 'Faculté de Médecine',
      dean: 'Dr. Jean Pierre',
      studentCount: 2500,
      departments: ['Médecine Générale', 'Chirurgie', 'Pédiatrie']
    },
    {
      id: 'fac-2',
      name: 'Faculté de Santé Publique',
      dean: 'Dr. Marie Claude',
      studentCount: 1800,
      departments: ['Épidémiologie', 'Politiques de Santé', 'Nutrition']
    },
    {
      id: 'fac-3',
      name: 'Faculté de Pharmacie',
      dean: 'Dr. Paul Michel',
      studentCount: 1200,
      departments: ['Pharmacie Clinique', 'Chimie', 'Biologie']
    }
  ],
  videos: [
    {
      id: 'vid-1',
      title: 'Présentation des nouveaux services hospitaliers',
      description: 'Vidéo présentant les nouveaux services et équipements du Centre Hospitalier Universitaire.',
      url: 'https://example.com/video1',
      views: 2340,
      shares: 156,
      createdAt: 'Il y a 3j',
      duration: '12:34'
    },
    {
      id: 'vid-2',
      title: 'Campagne de vaccination',
      description: 'Informations importantes sur la campagne de vaccination nationale.',
      url: 'https://example.com/video2',
      views: 5670,
      shares: 289,
      createdAt: 'Il y a 1s',
      duration: '8:45'
    },
    {
      id: 'vid-3',
      title: 'Guide des premiers secours',
      description: 'Apprenez les gestes de premiers secours essentiels.',
      url: 'https://example.com/video3',
      views: 8900,
      shares: 445,
      createdAt: 'Il y a 2s',
      duration: '15:20'
    }
  ],
  lives: [
    {
      id: 'live-1',
      title: 'Conférence de Presse: Plan de Vaccination 2024',
      description: 'Direct du Ministère de la Santé pour présenter le plan de vaccination nationale.',
      liveRoomName: 'plan-vaccination-2024',
      views: 12500,
      shares: 678,
      createdAt: 'Il y a 2h',
      status: 'live',
      participantsCount: 450
    },
    {
      id: 'live-2',
      title: 'Webinaire: Innovations en santé numérique',
      description: 'Discussion sur les nouvelles technologies dans le secteur de la santé.',
      jitsiRoom: 'innovation-sante-2024',
      views: 8900,
      shares: 345,
      createdAt: 'Il y a 1j',
      status: 'ended',
      participantsCount: 320
    },
    {
      id: 'live-3',
      title: 'Briefing quotidien COVID-19',
      description: 'Mise à jour quotidienne sur la situation épidémiologique.',
      jitsiRoom: 'covid-briefing-daily',
      views: 0,
      shares: 0,
      createdAt: 'Demain à 10h',
      status: 'at_coming',
      participantsCount: 0
    }
  ],
  alerts: [
    {
      id: 'alert-1',
      type: 'urgency',
      title: 'Urgence: Fermeture route nationale #1',
      description: 'En raison de travaux de réparation majeurs, la route nationale #1 sera fermée entre Port-au-Prince et Cap-Haïtien du 15 au 20 mai.',
      priority: 'high',
      views: 1250,
      shares: 89,
      createdAt: 'Il y a 2h',
      isBoosted: true
    },
    {
      id: 'alert-2',
      type: 'health',
      title: 'Campagne de vaccination contre la grippe',
      description: 'Le ministère de la Santé lance une campagne de vaccination gratuite dans tous les centres de santé du pays.',
      priority: 'high',
      views: 890,
      shares: 45,
      createdAt: 'Il y a 5h',
      isBoosted: false
    },
    {
      id: 'alert-3',
      type: 'recruitment',
      title: 'Recrutement: Développeur Web Senior',
      description: 'L\'Hôpital Saint-Jean recherche un développeur web senior pour moderniser son système informatique.',
      priority: 'medium',
      views: 456,
      shares: 12,
      createdAt: 'Il y a 1j',
      isBoosted: false
    },
    {
      id: 'alert-4',
      type: 'event',
      title: 'Conférence: Innovation en santé numérique',
      description: 'L\'Université d\'État organise une conférence sur l\'innovation dans le secteur de la santé numérique.',
      priority: 'low',
      views: 678,
      shares: 34,
      createdAt: 'Il y a 2j',
      isBoosted: true
    },
    {
      id: 'alert-5',
      type: 'announcement',
      title: 'Nouveau système de rendez-vous en ligne',
      description: 'Le ministère met en place un nouveau système de prise de rendez-vous en ligne pour tous les services publics.',
      priority: 'medium',
      views: 567,
      shares: 28,
      createdAt: 'Il y a 4j',
      isBoosted: false
    },
    {
      id: 'alert-6',
      type: 'promotion',
      title: 'Offre spéciale: Check-up gratuit',
      description: 'Profitez d\'un check-up médical gratuit dans tous les centres de santé partenaires ce mois-ci.',
      priority: 'low',
      views: 345,
      shares: 15,
      createdAt: 'Il y a 5j',
      isBoosted: false
    }
  ]
}

const TABS = ['Profil', 'Vidéos', 'Lives', 'Alertes', 'Statistiques', 'Abonnés', 'Paramètres'] as const

export const InstitutionProfile = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Profil')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'video' | 'live' | 'alert', id: string } | null>(null)
  const [alertFilter, setAlertFilter] = useState<'all' | 'urgency' | 'health' | 'recruitment' | 'announcement' | 'event' | 'promotion'>('all')
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showLiveModal, setShowLiveModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [selectedAlertType, setSelectedAlertType] = useState<'urgency' | 'health' | 'recruitment' | 'announcement' | 'event' | 'promotion' | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Wrapper functions to update localStorage when modals open/close
  const handleSetShowVideoModal = (value: boolean) => {
    setShowVideoModal(value)
    localStorage.setItem('exile_social_modal_open', value.toString())
  }

  const handleSetShowLiveModal = (value: boolean) => {
    setShowLiveModal(value)
    localStorage.setItem('exile_social_modal_open', value.toString())
  }

  const handleSetShowAlertModal = (value: boolean) => {
    setShowAlertModal(value)
    localStorage.setItem('exile_social_modal_open', value.toString())
  }

  const handleSetShowProfileSettingsModal = (value: boolean) => {
    setShowProfileSettingsModal(value)
    localStorage.setItem('exile_social_modal_open', value.toString())
  }

  // Hashtag management functions
  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !videoForm.hashtags.includes(hashtagInput.trim())) {
      setVideoForm({ ...videoForm, hashtags: [...videoForm.hashtags, hashtagInput.trim()] })
      setHashtagInput('')
    }
  }

  const handleRemoveHashtag = (hashtag: string) => {
    setVideoForm({ ...videoForm, hashtags: videoForm.hashtags.filter(h => h !== hashtag) })
  }

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddHashtag()
    }
  }

  const [videoForm, setVideoForm] = useState({ title: '', description: '', hashtags: [] as string[] })
  const [hashtagInput, setHashtagInput] = useState('')
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [isBackgroundAnimated, setIsBackgroundAnimated] = useState(false)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [bio, setBio] = useState(DEMO_INSTITUTION.description)
  const [lastLogoUpdate, setLastLogoUpdate] = useState<Date | null>(null)
  const [lastNameUpdate, setLastNameUpdate] = useState<Date | null>(null)
  const [institutionName, setInstitutionName] = useState(DEMO_INSTITUTION.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [savedBackground, setSavedBackground] = useState<string | null>(null)

  // Charger le background sauvegardé depuis localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('institutionBackground')
    const savedBgImage = localStorage.getItem('institutionBackgroundImage')
    const savedBgAnimated = localStorage.getItem('institutionBackgroundAnimated')

    if (savedBgImage) {
      setBackgroundPreviewUrl(savedBgImage)
      setSavedBackground(savedBgImage)
      setSelectedBackground(savedBgImage)
      setIsBackgroundAnimated(false)
    } else if (savedBg) {
      // Migrer les anciennes classes Tailwind vers des dégradés CSS valides
      const gradientMap: Record<string, string> = {
        'bg-gradient-to-br from-purple-600 via-pink-500 to-red-500': 'linear-gradient(135deg, #9333ea, #ec4899, #ef4444)',
        'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500': 'linear-gradient(135deg, #2563eb, #06b6d4, #14b8a6)',
        'bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500': 'linear-gradient(135deg, #16a34a, #10b981, #84cc16)',
        'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500': 'linear-gradient(135deg, #ea580c, #f59e0b, #eab308)',
        'bg-gradient-to-br from-indigo-600 via-violet-500 to-purple-500': 'linear-gradient(135deg, #4f46e5, #8b5cf6, #a855f7)',
        'bg-gradient-to-br from-slate-900 to-zinc-700': 'linear-gradient(135deg, #0f172a, #3f3f46)',
        'bg-gradient-to-br from-gray-900 to-gray-700': 'linear-gradient(135deg, #111827, #374151)',
        'bg-gradient-to-br from-blue-900 to-blue-700': 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
        'bg-gradient-to-br from-emerald-900 to-emerald-700': 'linear-gradient(135deg, #064e3b, #047857)',
        'bg-gradient-to-br from-rose-900 to-rose-700': 'linear-gradient(135deg, #881337, #be123c)',
      }

      const cssGradient = gradientMap[savedBg] || savedBg
      setSavedBackground(cssGradient)
      setSelectedBackground(cssGradient)
      setIsBackgroundAnimated(savedBgAnimated === 'true')

      // Mettre à jour localStorage avec la nouvelle valeur si nécessaire
      if (gradientMap[savedBg]) {
        localStorage.setItem('institutionBackground', cssGradient)
      }
    }
  }, [])

  // Simulation du chargement
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500)
  }, [])

  // Couleur de marque personnalisée
  const themeColor = DEMO_INSTITUTION.themeColor || '#1e3a8a'

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreviewUrl(url)
    }
  }

  const handleRemoveVideo = () => {
    setSelectedVideoFile(null)
    setVideoPreviewUrl(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const url = URL.createObjectURL(file)
      setLogoPreviewUrl(url)
      setShowCropModal(true)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreviewUrl(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBackgroundFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setBackgroundPreviewUrl(base64)
        setSelectedBackground(base64)
        setSavedBackground(base64)
        localStorage.setItem('institutionBackgroundImage', base64)
        localStorage.removeItem('institutionBackground')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveBackground = () => {
    setBackgroundFile(null)
    setBackgroundPreviewUrl(null)
    setSelectedBackground(null)
    setSavedBackground(null)
    localStorage.removeItem('institutionBackgroundImage')
    localStorage.removeItem('institutionBackground')
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = ''
    }
  }

  const handleBackgroundSelect = (background: string, isAnimated: boolean = false) => {
    // Convertir les classes Tailwind en dégradés CSS valides
    const gradientMap: Record<string, string> = {
      'bg-gradient-to-br from-purple-600 via-pink-500 to-red-500': 'linear-gradient(135deg, #9333ea, #ec4899, #ef4444)',
      'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500': 'linear-gradient(135deg, #2563eb, #06b6d4, #14b8a6)',
      'bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500': 'linear-gradient(135deg, #16a34a, #10b981, #84cc16)',
      'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500': 'linear-gradient(135deg, #ea580c, #f59e0b, #eab308)',
      'bg-gradient-to-br from-indigo-600 via-violet-500 to-purple-500': 'linear-gradient(135deg, #4f46e5, #8b5cf6, #a855f7)',
      'bg-gradient-to-br from-slate-900 to-zinc-700': 'linear-gradient(135deg, #0f172a, #3f3f46)',
      'bg-gradient-to-br from-gray-900 to-gray-700': 'linear-gradient(135deg, #111827, #374151)',
      'bg-gradient-to-br from-blue-900 to-blue-700': 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
      'bg-gradient-to-br from-emerald-900 to-emerald-700': 'linear-gradient(135deg, #064e3b, #047857)',
      'bg-gradient-to-br from-rose-900 to-rose-700': 'linear-gradient(135deg, #881337, #be123c)',
    }

    const cssGradient = gradientMap[background] || background
    setSelectedBackground(cssGradient)
    setIsBackgroundAnimated(isAnimated)
    // Appliquer immédiatement le background
    setSavedBackground(cssGradient)
    localStorage.setItem('institutionBackground', cssGradient)
    localStorage.setItem('institutionBackgroundAnimated', isAnimated.toString())
    // Supprimer l'image personnalisée si un gradient est sélectionné
    localStorage.removeItem('institutionBackgroundImage')
    setBackgroundPreviewUrl(null)
    setBackgroundFile(null)
  }

  const handleSaveProfileSettings = () => {
    setLastLogoUpdate(new Date())
    setLastNameUpdate(new Date())
    handleSetShowProfileSettingsModal(false)
  }

  const canUpdateLogo = () => {
    if (!lastLogoUpdate) return true
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return lastLogoUpdate < oneMonthAgo
  }

  const canUpdateName = () => {
    if (!lastNameUpdate) return true
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return lastNameUpdate < oneMonthAgo
  }

  const handleDelete = (type: 'video' | 'live' | 'alert', id: string) => {
    setDeleteConfirm({ type, id })
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      console.log(`Deleting ${deleteConfirm.type} with id: ${deleteConfirm.id}`)
      setDeleteConfirm(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  const getAlertTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      urgency: 'Urgences',
      health: 'Santé',
      recruitment: 'Recrutement',
      announcement: 'Annonces',
      event: 'Événements',
      promotion: 'Promotions'
    }
    return labels[type] || type
  }

  const getAlertTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      urgency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      recruitment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      announcement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      event: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      promotion: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
    }
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
      <SocialHeader title="Mon Institution" showSearch={false} showCreateButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Header - Premium Design */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden mb-8 shadow-2xl`}>
          {/* Bannière à Couleur Dynamique - Étendue sur toute la hauteur */}
          <div
            className="relative min-h-[200px] sm:min-h-[250px] lg:min-h-[450px] transition-all duration-500"
            style={{
              background: selectedBackground || savedBackground || DEMO_INSTITUTION.bannerColor || themeColor,
              animation: isBackgroundAnimated ? 'slowPulse 4s ease-in-out infinite' : 'none'
            }}
          >
            {/* Voile sombre en bas */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {/* Bouton d'édition de la bannière */}
            <button
              onClick={() => handleSetShowProfileSettingsModal(true)}
              className="absolute top-4 right-4 p-4 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-black/60 transition-all hover:scale-105 shadow-lg z-10"
            >
              <Edit className="w-6 h-6" />
            </button>

            {/* Profile Info - Superposé sur le background */}
            <div className="relative z-10 px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-16 sm:pt-20 lg:pt-28">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 lg:gap-10">
                {/* Logo en Chevauchement (Overlap) */}
                <div
                  className="w-20 h-20 sm:w-28 sm:h-28 lg:w-44 lg:h-44 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-6xl font-bold border-4 border-white dark:border-zinc-950 shadow-2xl flex-shrink-0 mx-auto lg:ml-0 hover:scale-105 transition-transform duration-300 cursor-pointer relative group"
                  style={{ background: `linear-gradient(to bottom right, ${themeColor}, ${themeColor}cc)` }}
                  onClick={() => handleSetShowProfileSettingsModal(true)}
                >
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="Logo" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    DEMO_INSTITUTION.name.charAt(0)
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>

                {/* Typographie et Badge */}
                <div className="flex-1 min-w-0 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                    {isEditingName && canUpdateName() ? (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-3 rounded-xl text-lg sm:text-2xl lg:text-4xl font-extrabold text-white bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:border-white w-full sm:w-auto`}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setLastNameUpdate(new Date())
                              setIsEditingName(false)
                            }}
                            className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>
                          <button
                            onClick={() => {
                              setInstitutionName(DEMO_INSTITUTION.name)
                              setIsEditingName(false)
                            }}
                            className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                        <h1 className={`text-lg sm:text-2xl lg:text-5xl font-extrabold text-white transition-all duration-500`}>
                          {institutionName}
                        </h1>
                        {DEMO_INSTITUTION.verified && (
                          <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 lg:w-9 lg:h-9 text-emerald-400 flex-shrink-0" />
                        )}
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                      </div>
                    )}
                    {!canUpdateName() && (
                      <span className={`text-xs sm:text-sm lg:text-base text-amber-400`}>
                        Modifiable dans {Math.ceil((lastNameUpdate!.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))} jours
                      </span>
                    )}
                  </div>

                  {/* Badge Type d'Institution */}
                  <div className="inline-block mb-2 sm:mb-3 lg:mb-4">
                    <span className="px-3 py-1 sm:px-4 sm:py-1.5 lg:px-5 lg:py-2 rounded-full bg-white/20 text-white text-xs sm:text-sm lg:text-base tracking-wider font-semibold uppercase backdrop-blur-sm border border-white/10">
                      {DEMO_INSTITUTION.type}
                    </span>
                  </div>
                  <p className={`text-sm sm:text-base lg:text-lg text-white/90 line-clamp-2`}>
                    {bio}
                  </p>
                </div>

                {/* Stats et Actions - Stack sur mobile */}
                <div className="flex flex-col items-center gap-3 sm:gap-4 lg:mt-44 mt-4">
                  {/* Stats */}
                  <div className="flex gap-4 sm:gap-6 lg:gap-10 text-center">
                    <div>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                        {DEMO_INSTITUTION.followers.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm lg:text-base text-white/70">Abonnés</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                        {DEMO_INSTITUTION.stats.totalViews.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm lg:text-base text-white/70">Vues</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
                    <button
                      onClick={handleFollow}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl text-sm sm:text-base lg:text-lg font-medium transition-all hover:scale-105 ${
                        isFollowing
                          ? resolvedTheme === 'dark'
                            ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : resolvedTheme === 'dark'
                            ? 'bg-social text-white hover:bg-social/90'
                            : 'bg-social text-white hover:bg-social/90'
                      }`}
                    >
                      {isFollowing ? 'Abonné' : 'Suivre'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className={`mb-6 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border`}>
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            <button
              onClick={() => navigate('/social')}
              className={`px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all ${
                resolvedTheme === 'dark'
                  ? 'text-zinc-300 hover:bg-zinc-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => navigate('/social/events')}
              className={`px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all ${
                resolvedTheme === 'dark'
                  ? 'text-zinc-300 hover:bg-zinc-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Événements
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`mb-6 ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border`}>
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'text-white'
                    : resolvedTheme === 'dark'
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ backgroundColor: activeTab === tab ? themeColor : undefined }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'Profil' && (
            <>
              {/* Skeleton Screen pendant le chargement */}
              {isLoading ? (
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-6 space-y-4`}>
                  <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ) : (
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-4`}>
                  <h2 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                    À propos
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Type d'institution</label>
                      <p className={`text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Gouvernement
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Site web</label>
                      <a href={DEMO_INSTITUTION.website} className={`text-base text-social hover:underline`}>
                        {DEMO_INSTITUTION.website}
                      </a>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Numéro d'enregistrement</label>
                      <p className={`text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {DEMO_INSTITUTION.registrationNumber}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Membre depuis</label>
                      <p className={`text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(DEMO_INSTITUTION.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Annuaire des Facultés / Départements */}
              {DEMO_INSTITUTION.faculties && DEMO_INSTITUTION.faculties.length > 0 && (
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-6 mt-6`}>
                  <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
                    Facultés & Départements
                  </h2>
                  <div className="space-y-3">
                    {DEMO_INSTITUTION.faculties.map((faculty) => (
                      <div
                        key={faculty.id}
                        className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'} rounded-lg overflow-hidden`}
                      >
                        <button
                          onClick={() => setExpandedFaculty(expandedFaculty === faculty.id ? null : faculty.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-zinc-600/50 dark:hover:bg-zinc-600/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: themeColor }}>
                              {faculty.name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <h3 className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {faculty.name}
                              </h3>
                              <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                {faculty.studentCount.toLocaleString()} étudiants • Doyen: {faculty.dean}
                              </p>
                            </div>
                          </div>
                          {expandedFaculty === faculty.id ? (
                            <ChevronUp className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
                          )}
                        </button>
                        {expandedFaculty === faculty.id && (
                          <div className="p-4 pt-0 border-t border-zinc-600 dark:border-zinc-600">
                            <div className="mt-3">
                              <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2`}>
                                Départements:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {faculty.departments.map((dept) => (
                                  <span
                                    key={dept}
                                    className={`px-3 py-1 text-xs rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300' : 'bg-gray-200 text-gray-700'}`}
                                  >
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'Vidéos' && (
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Vidéos ({DEMO_INSTITUTION.videos?.length || 0})
              </h2>
              <button className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105`} style={{ backgroundColor: themeColor }} onClick={() => handleSetShowVideoModal(true)}>
                + Ajouter une vidéo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_INSTITUTION.videos?.map((video) => (
                <div key={video.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'} rounded-lg overflow-hidden group`}>
                  <VideoPlayer
                    src={video.url}
                    poster={video.thumbnail}
                    autoplay={false}
                    className="h-32"
                  />
                  <div className="p-3">
                    <h3 className={`font-medium text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 line-clamp-2`}>
                      {video.title}
                    </h3>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2 line-clamp-2`}>
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        👁 {video.views.toLocaleString()} vues
                      </span>
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        {video.createdAt}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105 ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Share2 className="w-4 h-4 inline mr-1" />
                        Partager
                      </button>
                      <button
                        onClick={() => handleDelete('video', video.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105 bg-red-500/10 text-red-500 hover:bg-red-500/20`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeTab === 'Lives' && (
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Lives ({DEMO_INSTITUTION.lives?.length || 0})
              </h2>
              <button className={`px-4 py-2 rounded-lg text-base font-medium text-white transition-all hover:scale-105`} style={{ backgroundColor: themeColor }} onClick={() => handleSetShowLiveModal(true)}>
                + Créer un live
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_INSTITUTION.lives?.map((live) => (
                <div key={live.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'} rounded-xl overflow-hidden group`}>
                  <div className="relative h-40 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Radio className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
                    {live.status === 'live' && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        EN DIRECT
                      </div>
                    )}
                    {live.status === 'at_coming' && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-social text-white text-xs font-bold rounded-full">
                        À venir
                      </div>
                    )}
                    {live.status === 'ended' && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">
                        Terminé
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      👁 {live.participantsCount}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className={`font-medium text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 line-clamp-2`}>
                      {live.title}
                    </h3>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2 line-clamp-2`}>
                      {live.description}
                    </p>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        👁 {live.views.toLocaleString()} vues
                      </span>
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        {live.createdAt}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105 ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Share2 className="w-4 h-4 inline mr-1" />
                        Partager
                      </button>
                      <button
                        onClick={() => handleDelete('live', live.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105 bg-red-500/10 text-red-500 hover:bg-red-500/20`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeTab === 'Alertes' && (
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Alertes ({DEMO_INSTITUTION.alerts?.length || 0})
              </h2>
              <button className={`px-4 py-2 rounded-lg text-base font-medium text-white transition-all hover:scale-105`} style={{ backgroundColor: themeColor }} onClick={() => handleSetShowAlertModal(true)}>
                + Créer une alerte
              </button>
            </div>
            
            {/* Alert Type Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setAlertFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  alertFilter === 'all'
                    ? 'text-white'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: alertFilter === 'all' ? themeColor : undefined }}
              >
                Tous
              </button>
              {['urgency', 'health', 'recruitment', 'announcement', 'event', 'promotion'].map((type) => (
                <button
                  key={type}
                  onClick={() => setAlertFilter(type as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    alertFilter === type
                      ? 'text-white'
                      : resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: alertFilter === type ? themeColor : undefined }}
                >
                  {getAlertTypeLabel(type)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {DEMO_INSTITUTION.alerts
                ?.filter(alert => alertFilter === 'all' || alert.type === alertFilter)
                .map((alert) => (
                <div key={alert.id} className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'} rounded-xl p-4 group`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getAlertTypeColor(alert.type)}`}>
                      {alert.type === 'urgency' && <AlertTriangle className="w-5 h-5" />}
                      {alert.type === 'health' && <CheckCircle className="w-5 h-5" />}
                      {alert.type === 'recruitment' && <Briefcase className="w-5 h-5" />}
                      {alert.type === 'announcement' && <Megaphone className="w-5 h-5" />}
                      {alert.type === 'event' && <Calendar className="w-5 h-5" />}
                      {alert.type === 'promotion' && <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                          {alert.title}
                        </h3>
                        {alert.isBoosted && (
                          <TrendingUp className="w-4 h-4 text-social flex-shrink-0" />
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getAlertTypeColor(alert.type)}`}>
                          {getAlertTypeLabel(alert.type)}
                        </span>
                      </div>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2 line-clamp-2`}>
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                            👁 {alert.views.toLocaleString()} vues
                          </span>
                          <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                            {alert.createdAt}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button className={`p-2 rounded-lg transition-all hover:scale-110 ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('alert', alert.id)}
                            className={`p-2 rounded-lg transition-all hover:scale-110 bg-red-500/10 text-red-500 hover:bg-red-500/20`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeTab === 'Statistiques' && (
            <>
              {/* Stats Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Alertes', value: DEMO_INSTITUTION.stats.alerts, icon: AlertTriangle, color: 'text-red-500', change: '+12%' },
                  { label: 'Recrutements', value: DEMO_INSTITUTION.stats.recruitments, icon: Briefcase, color: 'text-blue-500', change: '+8%' },
                  { label: 'Événements', value: DEMO_INSTITUTION.stats.events, icon: Calendar, color: 'text-purple-500', change: '+5%' },
                  { label: 'Vidéos', value: DEMO_INSTITUTION.stats.videos, icon: Video, color: 'text-pink-500', change: '+15%' },
                ].map((stat) => (
                  <div key={stat.label} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-3 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-1">
                      <span className={`text-[10px] font-medium ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                    <div className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </div>
                    <div className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Engagement Chart Placeholder */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                    Engagement sur 30 jours
                  </h3>
                  <div className="h-32 flex items-end gap-1">
                    {[65, 80, 45, 90, 75, 60, 85, 70, 55, 95, 80, 65, 90, 75, 60, 85, 70, 55, 80, 65, 90, 75, 60, 85, 70, 55, 80, 65, 90, 75].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all hover:opacity-80"
                        style={{
                          height: `${height}%`,
                          backgroundColor: themeColor,
                          opacity: 0.6 + (height / 200)
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>1er jour</span>
                    <span>30 jours</span>
                  </div>
                </div>

                {/* Top Performing Content */}
                <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                    Contenu le plus performant
                  </h3>
                  <div className="space-y-2">
                    {[
                      { title: 'Campagne vaccination', views: 12500, type: 'Alerte' },
                      { title: 'Conférence santé', views: 8900, type: 'Événement' },
                      { title: 'Recrutement médecins', views: 6700, type: 'Recrutement' },
                      { title: 'Présentation services', views: 5400, type: 'Vidéo' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-2 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {item.title}
                          </p>
                          <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {item.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {item.views.toLocaleString()}
                          </p>
                          <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>vues</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Stats Table */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mt-3`}>
                <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Statistiques détaillées
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-base`}>
                        <th className="text-left pb-3">Type</th>
                        <th className="text-left pb-3">Total</th>
                        <th className="text-left pb-3">Ce mois</th>
                        <th className="text-left pb-3">Taux de conversion</th>
                        <th className="text-left pb-3">Tendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'Alertes', total: 234, month: 45, conversion: '12%', trend: '+8%' },
                        { type: 'Recrutements', total: 45, month: 12, conversion: '8%', trend: '+5%' },
                        { type: 'Événements', total: 12, month: 3, conversion: '25%', trend: '+15%' },
                        { type: 'Vidéos', total: 89, month: 15, conversion: '18%', trend: '+12%' },
                      ].map((row, i) => (
                        <tr key={i} className={`border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                          <td className={`py-3 text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{row.type}</td>
                          <td className={`py-3 text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{row.total}</td>
                          <td className={`py-3 text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{row.month}</td>
                          <td className={`py-3 text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{row.conversion}</td>
                          <td className={`py-3 text-base font-medium ${row.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{row.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Abonnés' && (
            <>
              {/* Followers Overview */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Abonnés
                  </h2>
                  <div className="flex gap-2">
                    <button className={`px-2 py-1 rounded text-xs ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Tous
                    </button>
                    <button className={`px-2 py-1 rounded text-xs ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Récents
                    </button>
                    <button className={`px-3 py-1 rounded-lg text-base ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Actifs
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`p-3 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {DEMO_INSTITUTION.followers.toLocaleString()}
                    </div>
                    <div className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Total</div>
                  </div>
                  <div className={`p-3 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>+234</div>
                    <div className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Ce mois</div>
                  </div>
                  <div className={`p-3 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>+12%</div>
                    <div className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Croissance</div>
                  </div>
                </div>
              </div>

              {/* Followers List */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                <div className="space-y-2">
                  {[
                    { name: 'Jean Pierre', avatar: 'JP', joined: 'Il y a 2j', activity: 'Actif' },
                    { name: 'Marie Claude', avatar: 'MC', joined: 'Il y a 5j', activity: 'Actif' },
                    { name: 'Paul Michel', avatar: 'PM', joined: 'Il y a 1s', activity: 'Inactif' },
                    { name: 'Anne Sophie', avatar: 'AS', joined: 'Il y a 3s', activity: 'Actif' },
                    { name: 'Charles Louis', avatar: 'CL', joined: 'Il y a 1w', activity: 'Actif' },
                  ].map((follower, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'} hover:bg-zinc-600/50 dark:hover:bg-zinc-600/50 transition-colors`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: themeColor }}>
                          {follower.avatar}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {follower.name}
                          </p>
                          <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {follower.joined}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${follower.activity === 'Actif' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-500/20 text-gray-500'}`}>
                          {follower.activity}
                        </span>
                        <button className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Paramètres' && (
            <>
              {/* Profile Settings */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-4`}>
                <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Profil
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modifier le profil</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gérer l'équipe</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Documents de vérification</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Plan Settings */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-4`}>
                <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Abonnement
                </h3>
                <div className={`p-3 rounded mb-3 ${resolvedTheme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Plan actuel</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium`} style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                      {DEMO_INSTITUTION.plan}
                    </span>
                  </div>
                  <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Renouvellement automatique le 15 juin 2024
                  </p>
                </div>
                <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gérer le plan</span>
                  </div>
                  <Edit className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Méthode de paiement</span>
                  </div>
                  <Edit className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Notification Settings */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-4`}>
                <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Notifications
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications push</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors`} style={{ backgroundColor: themeColor }}>
                      <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications email</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors`} style={{ backgroundColor: themeColor }}>
                      <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications SMS</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300'}`}>
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-4`}>
                <h3 className={`text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Sécurité
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Changer le mot de passe</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Authentification 2FA</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Historique de connexion</span>
                    </div>
                    <Edit className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className={`${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} rounded-lg border p-4`}>
                <h3 className={`text-base font-semibold text-red-500 mb-3`}>
                  Zone de danger
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 rounded hover:bg-red-900/30 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500">Désactiver le compte</span>
                    </div>
                    <Edit className="w-5 h-5 text-red-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-red-900/30 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span className="text-red-500">Supprimer le compte</span>
                    </div>
                    <Edit className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Video Import Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-4xl w-full border max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Importer une vidéo institutionnelle
                  </h2>
                  <p className={`text-base mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Réservé aux institutions (Universités, Écoles, Entreprises)
                  </p>
                </div>
                <button
                  onClick={() => handleSetShowVideoModal(false)}
                  className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Upload Section */}
                {videoPreviewUrl ? (
                  <div className={`border-2 rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'}`}>
                    <div className="relative">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-64 object-cover"
                      />
                      <button
                        onClick={handleRemoveVideo}
                        className={`absolute top-2 right-2 p-2 rounded-full ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/80'
                        } hover:bg-red-500 hover:text-white transition-colors`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                      <p className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVideoFile?.name}
                      </p>
                      <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {(selectedVideoFile?.size ? (selectedVideoFile.size / (1024 * 1024)).toFixed(2) : '0')} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'} transition-colors`}>
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                    <p className={`text-base mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Glissez une vidéo ici ou cliquez pour sélectionner
                    </p>
                    <p className={`text-xs mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                      MP4, MOV, AVI (MAX. 500MB)
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      id="videoInput"
                      ref={videoInputRef}
                      onChange={handleVideoFileChange}
                    />
                    <label
                      htmlFor="videoInput"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-base font-medium hover:bg-social/90 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Choisir une vidéo
                    </label>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Graduation Promotion 2021-2025"
                      maxLength={100}
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:ring-2 focus:ring-social focus:border-social`}
                    />
                    <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Max 100 caractères</p>
                  </div>

                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Communiqué ou note officielle..."
                      rows={3}
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:ring-2 focus:ring-social focus:border-social`}
                    />
                  </div>

                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Hashtags
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyPress={handleHashtagKeyPress}
                        placeholder="#annonce"
                        className={`flex-1 px-4 py-3 rounded-lg border ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:ring-2 focus:ring-social focus:border-social`}
                      />
                      <button
                        type="button"
                        onClick={handleAddHashtag}
                        className="px-4 py-3 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {videoForm.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {videoForm.hashtags.map((hashtag, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                              resolvedTheme === 'dark'
                                ? 'bg-zinc-700 text-zinc-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span className="text-sm font-medium">#{hashtag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHashtag(hashtag)}
                              className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Département (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sciences Informatiques, Gestion"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:ring-2 focus:ring-social focus:border-social`}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                <h3 className={`text-base font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Options supplémentaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Visibilité
                    </label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                        <input type="radio" name="visibility" value="public" defaultChecked className="text-social focus:ring-social" />
                        Public
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                        <input type="radio" name="visibility" value="interne" className="text-social focus:ring-social" />
                        Interne (membres uniquement)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      Commentaires
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      <input type="checkbox" defaultChecked className="text-social focus:ring-social rounded" />
                      Autoriser les commentaires
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => handleSetShowVideoModal(false)}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSetShowVideoModal(false)}
                  disabled={!selectedVideoFile || !videoForm.title.trim() || !videoForm.description.trim()}
                  className={`flex-1 py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Publier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Video Modal */}
        {showLiveModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-2xl w-full border`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Créer un live vidéo
                </h2>
                <button
                  onClick={() => handleSetShowLiveModal(false)}
                  className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-300'}`}>
                <Radio className={`w-12 h-12 mx-auto mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <p className={`text-base mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Utiliser votre caméra pour créer un live
                </p>
                <p className={`text-xs mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                  Accès caméra et microphone requis
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-base font-medium hover:bg-social/90 transition-colors">
                  <Radio className="w-4 h-4" />
                  Démarrer le live
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-2xl w-full border`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Créer une alerte
                </h2>
                <button
                  onClick={() => handleSetShowAlertModal(false)}
                  className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setSelectedAlertType('urgency')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-red-600 hover:border-red-500 bg-red-900/20'
                      : 'border-red-300 hover:border-red-400 bg-red-50'
                  } transition-colors text-center`}
                >
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Urgence</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAlertType('health')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-emerald-600 hover:border-emerald-500 bg-emerald-900/20'
                      : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50'
                  } transition-colors text-center`}
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Santé</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAlertType('recruitment')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-blue-600 hover:border-blue-500 bg-blue-900/20'
                      : 'border-blue-300 hover:border-blue-400 bg-blue-50'
                  } transition-colors text-center`}
                >
                  <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Recrutement</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAlertType('announcement')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-purple-600 hover:border-purple-500 bg-purple-900/20'
                      : 'border-purple-300 hover:border-purple-400 bg-purple-50'
                  } transition-colors text-center`}
                >
                  <Megaphone className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Annonce</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAlertType('event')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-orange-600 hover:border-orange-500 bg-orange-900/20'
                      : 'border-orange-300 hover:border-orange-400 bg-orange-50'
                  } transition-colors text-center`}
                >
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Événement</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAlertType('promotion')
                    handleSetShowAlertModal(false)
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-pink-600 hover:border-pink-500 bg-pink-900/20'
                      : 'border-pink-300 hover:border-pink-400 bg-pink-50'
                  } transition-colors text-center`}
                >
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <span className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Promotion</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Creation Modal */}
        {selectedAlertType && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-2xl w-full border max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Créer une alerte {selectedAlertType === 'urgency' && 'd\'urgence'}
                  {selectedAlertType === 'health' && 'de santé'}
                  {selectedAlertType === 'recruitment' && 'de recrutement'}
                  {selectedAlertType === 'announcement' && 'd\'annonce'}
                  {selectedAlertType === 'event' && 'd\'événement'}
                  {selectedAlertType === 'promotion' && 'de promotion'}
                </h2>
                <button
                  onClick={() => setSelectedAlertType(null)}
                  className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Titre
                  </label>
                  <input
                    type="text"
                    placeholder="Titre de l'alerte..."
                    className={`w-full px-4 py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                </div>

                <div>
                  <label className={`block text-base font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    placeholder="Description détaillée de l'alerte..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedAlertType(null)}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  onClick={() => setSelectedAlertType(null)}
                  className={`flex-1 py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors`}
                >
                  Publier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 max-w-md w-full`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Confirmer la suppression
                </h3>
              </div>
              <p className={`text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-6`}>
                Êtes-vous sûr de vouloir supprimer ce {deleteConfirm.type} ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className={`flex-1 px-4 py-2 rounded-lg text-base font-medium transition-all ${
                    resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg text-base font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Modal */}
        {showProfileSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-4xl w-full border max-h-[90vh] overflow-y-auto shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Personnaliser le profil
                  </h2>
                  <p className={`text-base mt-2 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Mettez à jour votre logo et votre background
                  </p>
                </div>
                <button
                  onClick={() => handleSetShowProfileSettingsModal(false)}
                  className={`p-3 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logo Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Logo de l'institution
                    </h3>
                    {!canUpdateLogo() && (
                      <span className={`text-base text-amber-500`}>
                        Modifiable dans {Math.ceil((lastLogoUpdate!.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))} jours
                      </span>
                    )}
                  </div>
                  {logoPreviewUrl ? (
                    <div className={`border-2 rounded-2xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'}`}>
                      <div className="relative">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo preview"
                          className="w-full h-72 object-cover"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className={`absolute top-4 right-4 p-3 rounded-full ${
                            resolvedTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/80'
                          } hover:bg-red-500 hover:text-white transition-colors`}
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className={`p-6 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                        <p className={`text-lg font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {logoFile?.name}
                        </p>
                        <p className={`text-base mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {(logoFile?.size ? (logoFile.size / (1024 * 1024)).toFixed(2) : '0')} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-2xl p-14 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'} transition-colors ${!canUpdateLogo() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className={`w-28 h-28 mx-auto mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                      <p className={`text-lg mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                        Glissez un logo ici ou cliquez pour sélectionner
                      </p>
                      <p className={`text-base mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        PNG, JPG, SVG (MAX. 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logoInput"
                        ref={logoInputRef}
                        onChange={handleLogoFileChange}
                        disabled={!canUpdateLogo()}
                      />
                      <label
                        htmlFor="logoInput"
                        className={`inline-flex items-center gap-3 px-8 py-4 bg-social text-white rounded-xl text-lg font-medium hover:bg-social/90 transition-colors cursor-pointer ${!canUpdateLogo() ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        <Upload className="w-5 h-5" />
                        Choisir un logo
                      </label>
                    </div>
                  )}
                </div>

                {/* Background Selection */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Background premium
                  </h3>

                  {/* Custom Image Upload */}
                  <div className="mb-6">
                    <p className={`text-base font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Image personnalisée</p>
                    {backgroundPreviewUrl ? (
                      <div className={`border-2 rounded-2xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'}`}>
                        <div className="relative">
                          <img
                            src={backgroundPreviewUrl}
                            alt="Background preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={handleRemoveBackground}
                            className={`absolute top-4 right-4 p-3 rounded-full ${
                              resolvedTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/80'
                            } hover:bg-red-500 hover:text-white transition-colors`}
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                          <p className={`text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {backgroundFile?.name}
                          </p>
                          <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {(backgroundFile?.size ? (backgroundFile.size / (1024 * 1024)).toFixed(2) : '0')} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 border-dashed rounded-2xl p-8 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'} transition-colors`}>
                        <Upload className={`w-16 h-16 mx-auto mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                        <p className={`text-base mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                          Glissez une image ici ou cliquez pour sélectionner
                        </p>
                        <p className={`text-xs mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                          PNG, JPG, WEBP (MAX. 10MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="backgroundInput"
                          ref={backgroundInputRef}
                          onChange={handleBackgroundFileChange}
                        />
                        <label
                          htmlFor="backgroundInput"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-base font-medium hover:bg-social/90 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          Choisir une image
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Animated Backgrounds */}
                  <div className="mb-6">
                    <p className={`text-base font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Animés</p>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { id: 'animated-1', gradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-red-500', animated: true },
                        { id: 'animated-2', gradient: 'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500', animated: true },
                        { id: 'animated-3', gradient: 'bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500', animated: true },
                        { id: 'animated-4', gradient: 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500', animated: true },
                        { id: 'animated-5', gradient: 'bg-gradient-to-br from-indigo-600 via-violet-500 to-purple-500', animated: true },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => handleBackgroundSelect(bg.gradient, bg.animated)}
                          className={`w-full aspect-square rounded-xl ${bg.gradient} ${bg.animated ? 'animate-pulse' : ''} hover:scale-105 transition-transform border-2 ${selectedBackground === bg.gradient ? 'border-white' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Static Backgrounds */}
                  <div>
                    <p className={`text-base font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Statiques</p>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { id: 'static-1', gradient: 'bg-gradient-to-br from-slate-900 to-zinc-700', animated: false },
                        { id: 'static-2', gradient: 'bg-gradient-to-br from-gray-900 to-gray-700', animated: false },
                        { id: 'static-3', gradient: 'bg-gradient-to-br from-blue-900 to-blue-700', animated: false },
                        { id: 'static-4', gradient: 'bg-gradient-to-br from-emerald-900 to-emerald-700', animated: false },
                        { id: 'static-5', gradient: 'bg-gradient-to-br from-rose-900 to-rose-700', animated: false },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => handleBackgroundSelect(bg.gradient)}
                          className={`w-full aspect-square rounded-xl ${bg.gradient} hover:scale-105 transition-transform border-2 ${selectedBackground === bg.gradient ? 'border-white' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bio Update Section */}
                <div className="lg:col-span-2">
                  <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Bio de l'institution
                  </h3>
                  <div className={`rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'} border`}>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      placeholder="Décrivez votre institution..."
                      rows={4}
                      className={`w-full px-4 py-3 bg-transparent text-base ${
                        resolvedTheme === 'dark'
                          ? 'text-white placeholder-zinc-500'
                          : 'text-gray-900 placeholder-gray-400'
                      } focus:outline-none resize-none`}
                    />
                    <div className={`flex items-center justify-between px-4 py-3 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                      <span className={`text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {bio.length}/500 caractères
                      </span>
                      <span className={`text-base ${bio.length >= 500 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {bio.length >= 500 ? 'Limite atteinte' : 'Caractères disponibles'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Institution Name Update Section */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Nom de l'institution
                    </h3>
                    {!canUpdateName() && (
                      <span className={`text-base text-amber-500`}>
                        Modifiable dans {Math.ceil((lastNameUpdate!.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))} jours
                      </span>
                    )}
                  </div>
                  <div className={`rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'} border`}>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      disabled={!canUpdateName()}
                      placeholder="Nom de l'institution..."
                      className={`w-full px-4 py-3 bg-transparent text-base ${
                        resolvedTheme === 'dark'
                          ? 'text-white placeholder-zinc-500'
                          : 'text-gray-900 placeholder-gray-400'
                      } focus:outline-none ${!canUpdateName() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => handleSetShowProfileSettingsModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfileSettings}
                  className={`flex-1 py-3 rounded-xl font-medium bg-social text-white hover:bg-social/90 transition-colors text-base`}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logo Crop Modal */}
        {showCropModal && logoPreviewUrl && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-3xl w-full border`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Recadrer le logo
                  </h2>
                  <p className={`text-base mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Ajustez le cadre pour recadrer votre logo
                  </p>
                </div>
                <button
                  onClick={() => setShowCropModal(false)}
                  className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-white dark:border-zinc-700 shadow-2xl">
                  <img
                    src={logoPreviewUrl}
                    alt="Logo to crop"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center' }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setShowCropModal(false)}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowCropModal(false)
                  }}
                  className={`flex-1 py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors`}
                >
                  Confirmer
                </button>
              </div>

              <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <p className={`text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                  💡 Le logo sera automatiquement ajusté pour s'afficher en cercle sur votre profil.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstitutionProfile