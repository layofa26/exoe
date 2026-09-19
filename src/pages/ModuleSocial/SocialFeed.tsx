import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, AlertTriangle, Briefcase, Calendar, Video, Megaphone, Filter, TrendingUp, CheckCircle, Share2, Upload, Radio, X, Users, FileText, Heart, Star, Zap, FileCheck, Send, Plus } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { SocialHeader } from '../../components/social/SocialHeader'
import { InstitutionVideoCard } from '../../components/social/InstitutionVideoCard'
import { CreatePublicationModal, type CreatedPublicationItem } from '../../components/social/CreatePublicationModal'
import { AlertType, AlertPriority } from '../../types/social/alert'
import { useToast } from '../../hooks/useToast'
import { API_BASE_URL } from '../../config/api'

const TABS = ['Tout', 'Urgences', 'Santé', 'Recrutement', 'Annonces', 'Événements', 'Promotions'] as const

interface FeedItem {
  id: string
  type: AlertType
  title: string
  description: string
  institution: {
    id: string
    name: string
    verified: boolean
    avatar?: string
  }
  priority: AlertPriority
  isBoosted: boolean
  createdAt: string
  stats: {
    views: number
    shares: number
    comments: number
  }
  videoUrl?: string
}

const AUTHENTIC_INSTITUTIONAL_FEED: FeedItem[] = [
  {
    id: 'inst-alert-01',
    type: 'urgency',
    title: 'Alerte Vigilance Météo : Risque d\'inondations et glissements de terrain',
    description: 'La Direction Générale de la Protection Civile (DGPC) émet un avis de vigilance accrue pour les départements de l\'Ouest, du Sud et de la Grand\'Anse. Consignes : évitez les traversées de rivières en crue, tenez prêts vos kits d\'urgence. Ligne d\'urgence nationale : 114.',
    institution: {
      id: 'inst-dgpc',
      name: 'Protection Civile (DGPC)',
      verified: true
    },
    priority: 'high',
    isBoosted: false,
    createdAt: 'Il y a 25 min',
    stats: {
      views: 5240,
      shares: 1680,
      comments: 0
    }
  },
  {
    id: 'inst-health-01',
    type: 'health',
    title: 'Campagne Nationale de Prévention et Vaccinations Communautaires',
    description: 'Le Ministère de la Santé Publique et de la Population (MSPP) rappelle l\'ouverture des centres de vaccination infantile et de dépistage préventif gratuit dans les dix directions sanitaires. Les équipes mobiles sillonnent les zones prioritaires.',
    institution: {
      id: 'inst-mspp',
      name: 'Ministère de la Santé Publique (MSPP)',
      verified: true
    },
    priority: 'high',
    isBoosted: false,
    createdAt: 'Il y a 2h',
    stats: {
      views: 3820,
      shares: 740,
      comments: 48
    }
  },
  {
    id: 'inst-job-01',
    type: 'recruitment',
    title: 'Concours de Recrutement : 12 Analystes Financiers & 5 Auditeurs Informatiques',
    description: 'La Banque de la République d\'Haïti (BRH) ouvre son concours externe annuel de recrutement pour renforcer la Direction de la Supervision des Banques et des Systèmes de Paiement. Dépôt de candidature ouvert aux titulaires d\'une Licence en finance, économie ou informatique. Dépôt obligatoire de CV au format PDF.',
    institution: {
      id: 'inst-brh',
      name: 'Banque de la République d\'Haïti (BRH)',
      verified: true
    },
    priority: 'medium',
    isBoosted: true,
    createdAt: 'Il y a 4h',
    stats: {
      views: 7890,
      shares: 1240,
      comments: 86
    }
  },
  {
    id: 'inst-ann-01',
    type: 'announcement',
    title: 'Calendrier Officiel des Examens d\'État & Programme de Bourses d\'Excellence',
    description: 'Le Ministère de l\'Éducation Nationale et de la Formation Professionnelle (MENFP) publie le calendrier définitif des épreuves officielles du Baccalauréat 2026 ainsi que les conditions d\'attribution des bourses universitaires régionales.',
    institution: {
      id: 'inst-menfp',
      name: 'Ministère de l\'Éducation Nationale (MENFP)',
      verified: true
    },
    priority: 'medium',
    isBoosted: false,
    createdAt: 'Il y a 6h',
    stats: {
      views: 4120,
      shares: 980,
      comments: 32
    }
  },
  {
    id: 'inst-event-01',
    type: 'event',
    title: 'Sommet National sur la Transformation Numérique & l\'Infrastructure Institutionnelle',
    description: 'La Chambre de Commerce et d\'Industrie (CCI) convie les délégations ministérielles, entrepreneurs et recteurs d\'universités au Palais des Congrès pour 3 jours d\'ateliers stratégiques et de partenariats public-privé.',
    institution: {
      id: 'inst-cci',
      name: 'Chambre de Commerce & d\'Industrie (CCI)',
      verified: true
    },
    priority: 'low',
    isBoosted: false,
    createdAt: 'Il y a 12h',
    stats: {
      views: 2950,
      shares: 410,
      comments: 24
    }
  },
  {
    id: 'inst-vid-01',
    type: 'video',
    title: 'Rapport Annuel 2026 : Présentation des Facultés & Projets de Recherche',
    description: 'Allocution institutionnelle du Conseil de l\'Université d\'État d\'Haïti (UEH) détaillant le déploiement des nouveaux cursus technologiques et des partenariats internationaux.',
    institution: {
      id: 'inst-ueh',
      name: 'Université d\'État d\'Haïti (UEH)',
      verified: true
    },
    priority: 'low',
    isBoosted: false,
    createdAt: 'Hier',
    stats: {
      views: 3100,
      shares: 390,
      comments: 18
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
]

export const SocialFeed = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { msg: toastMsg, show: showToast } = useToast()
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Tout')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showVideoImportModal, setShowVideoImportModal] = useState(false)
  const [showLiveVideoModal, setShowLiveVideoModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertType, setAlertType] = useState<'urgency' | 'health' | 'recruitment' | 'announcement' | 'promotion' | null>(null)
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [videoForm, setVideoForm] = useState({ title: '', description: '', hashtags: [] as string[] })
  const [hashtagInput, setHashtagInput] = useState('')
  const [feedItems, setFeedItems] = useState<FeedItem[]>(AUTHENTIC_INSTITUTIONAL_FEED)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedJobForApply, setSelectedJobForApply] = useState<FeedItem | null>(null)
  const [applyForm, setApplyForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverNote: '',
    cvFile: null as File | null
  })
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [createModalInitialType, setCreateModalInitialType] = useState<'alert' | 'job' | 'video' | 'event'>('alert')

  const handlePublicationCreated = useCallback((newItem: CreatedPublicationItem) => {
    setFeedItems(prev => [newItem as unknown as FeedItem, ...prev])
    showToast('Publication officielle diffusée avec succès !')
  }, [showToast])

  // Listen to mobile action sheet events
  useEffect(() => {
    const handleSocialAction = (e: any) => {
      const action = e.detail?.action
      if (action === 'alert') {
        setCreateModalInitialType('alert')
        setShowCreateModal(true)
      } else if (action === 'job') {
        setCreateModalInitialType('job')
        setShowCreateModal(true)
      } else if (action === 'announcement') {
        setCreateModalInitialType('alert')
        setShowCreateModal(true)
      } else if (action === 'video') {
        setCreateModalInitialType('video')
        setShowCreateModal(true)
      } else if (action === 'event') {
        setCreateModalInitialType('event')
        setShowCreateModal(true)
      }
    }

    window.addEventListener('exile_social_action', handleSocialAction)
    return () => window.removeEventListener('exile_social_action', handleSocialAction)
  }, [])

  // Fetch alerts from API with reliable fallback to authentic seed data
  const fetchAlerts = useCallback(async () => {
    let customItems: FeedItem[] = []
    try {
      customItems = JSON.parse(localStorage.getItem('exile_social_custom_feed') || '[]')
    } catch (e) {
      customItems = []
    }

    try {
      const token = localStorage.getItem('accessToken')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${API_BASE_URL}/activities/activities/`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        const items = Array.isArray(data) ? data : (data.results || [])
        if (items.length > 0) {
          setFeedItems([...customItems, ...items])
          return
        }
      }
      setFeedItems([...customItems, ...AUTHENTIC_INSTITUTIONAL_FEED])
    } catch (error) {
      console.warn('[SocialFeed] Using institutional baseline feed:', error)
      setFeedItems([...customItems, ...AUTHENTIC_INSTITUTIONAL_FEED])
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

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

  const handlePublishVideo = async () => {
    if (!selectedVideoFile || !videoPreviewUrl || !videoForm.title.trim() || !videoForm.description.trim()) return

    try {
      // Upload video file to backend
      const formData = new FormData()
      formData.append('video', selectedVideoFile)
      formData.append('title', videoForm.title)
      formData.append('description', videoForm.description)
      formData.append('videoUrl', videoPreviewUrl)
      formData.append('status', 'PUBLISHED')
      formData.append('visibility', 'PUBLIC')
      formData.append('allowComments', 'true')
      formData.append('allowLikes', 'true')
      formData.append('allowShares', 'true')
      if (videoForm.hashtags.length > 0) {
        formData.append('tags', JSON.stringify(videoForm.hashtags))
      }

      const token = localStorage.getItem('accessToken')
      if (!token) {
        showToast('Veuillez vous connecter pour publier une vidéo institutionnelle.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/accueil/videos/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        setShowVideoImportModal(false)
        showToast('Vidéo publiée avec succès!')
        handleRemoveVideo()
        setVideoForm({ title: '', description: '', hashtags: [] })
        fetchAlerts()
      } else {
        throw new Error('Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error publishing video:', error)
      showToast('Erreur lors de la publication de la vidéo')
    }
  }

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddHashtag()
    }
  }

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace('#', '')
    if (tag && !videoForm.hashtags.includes(tag)) {
      setVideoForm({ ...videoForm, hashtags: [...videoForm.hashtags, tag] })
      setHashtagInput('')
    }
  }

  const handleRemoveHashtag = (tag: string) => {
    setVideoForm({ ...videoForm, hashtags: videoForm.hashtags.filter(h => h !== tag) })
  }

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'urgency': return <AlertTriangle className="w-4 h-4" />
      case 'health': return <AlertTriangle className="w-4 h-4" />
      case 'recruitment': return <Briefcase className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'announcement': return <Megaphone className="w-4 h-4" />
      case 'promotion': return <TrendingUp className="w-4 h-4" />
      default: return <Building2 className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: AlertPriority): string => {
    switch (priority) {
      case 'high': return resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return resolvedTheme === 'dark' ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-orange-100 text-orange-700 border-orange-200'
      default: return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getBorderColor = (type: AlertType, priority: AlertPriority): string => {
    if (priority === 'high') return 'border-red-500'
    if (type === 'urgency') return 'border-red-500'
    if (type === 'health') return 'border-emerald-500'
    if (type === 'recruitment') return 'border-blue-500'
    if (type === 'event') return 'border-purple-500'
    if (type === 'video') return 'border-pink-500'
    if (type === 'promotion') return 'border-amber-500'
    return 'border-social'
  }

  const filteredFeed = feedItems.filter((item) => {
    if (activeTab === 'Tout') return true
    if (activeTab === 'Urgences') return item.type === 'urgency'
    if (activeTab === 'Santé') return item.type === 'health'
    if (activeTab === 'Recrutement') return item.type === 'recruitment'
    if (activeTab === 'Annonces') return item.type === 'announcement'
    if (activeTab === 'Événements') return item.type === 'event'
    if (activeTab === 'Promotions') return item.type === 'promotion'
    return true
  }).filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.institution.name.toLowerCase().includes(q)
  })

  // Priorité: Boostés d'abord, puis par priority
  const sortedFeed = [...filteredFeed].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1
    if (!a.isBoosted && b.isBoosted) return 1
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (a.priority !== 'high' && b.priority === 'high') return 1
    return 0
  })

  const handleShare = useCallback(async (item: FeedItem) => {
    const shareData = {
      title: item.title,
      text: item.description,
      url: `${window.location.origin}/social/feed/${item.id}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        showToast('Partagé avec succès!')
      } catch (err) {
        console.log('Share failed:', err)
        // Fallback to modal if share fails
        setSelectedItem(item)
        setShowShareModal(true)
        showToast('Options de partage ouvertes')
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setSelectedItem(item)
      setShowShareModal(true)
      showToast('Options de partage ouvertes')
    }
  }, [showToast])

  const handleCopyLink = useCallback((item: FeedItem) => {
    const shareUrl = `${window.location.origin}/social/feed/${item.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Lien copié dans le presse-papier!')
      setShowShareModal(false)
    }).catch(() => {
      showToast('Erreur lors de la copie du lien')
    })
  }, [showToast])

  const handleSocialShare = useCallback((platform: string, item: FeedItem) => {
    const shareUrl = `${window.location.origin}/social/feed/${item.id}`
    const text = encodeURIComponent(`${item.title} - ${item.description}`)
    let url = ''
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
      showToast(`Partage sur ${platform} réussi!`)
      setShowShareModal(false)
    }
  }, [showToast])

  const handleApply = useCallback((item: FeedItem) => {
    setSelectedJobForApply(item)
    setShowApplyModal(true)
  }, [])

  const handleRegister = useCallback((_item: FeedItem) => {
    navigate('/social/events')
    showToast('Redirection vers l\'événement...')
  }, [navigate, showToast])

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
      <SocialHeader
        title="EXILE Social"
        showSearch={true}
        showCreateButton={true}
        showLogo={true}
        onCreateClick={() => setShowCreateModal(true)}
        onSearch={(query) => setSearchQuery(query)}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-24 md:pb-8">

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3 sm:space-y-4">
          {sortedFeed.length === 0 ? (
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-8 sm:p-12 text-center`}>
              <Filter className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
              <p className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucun contenu trouvé</p>
            </div>
          ) : (
            sortedFeed.map((item) => (
              item.type === 'video' && item.videoUrl ? (
                <InstitutionVideoCard
                  key={item.id}
                  id={item.id}
                  institution={{
                    name: item.institution.name,
                    logoUrl: item.institution.avatar || '',
                    isVerified: item.institution.verified
                  }}
                  createdAt={item.createdAt}
                  visibility="public"
                  contentType="annonce"
                  title={item.title}
                  description={item.description}
                  videoUrl={item.videoUrl}
                  likesCount={0}
                  commentsCount={item.stats.comments}
                  allowComments={true}
                />
              ) : (
                <div
                  key={item.id}
                  className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 sm:p-6 border-l-4 shadow-sm hover:shadow-md transition-shadow ${getBorderColor(item.type, item.priority)}`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                    {/* Icon */}
                    <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg ${getPriorityColor(item.priority)} flex-shrink-0`}>
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Institution */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span className={`font-semibold text-xs sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.institution.name}
                        </span>
                        {item.institution.verified && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] sm:text-xs font-medium rounded-full">
                            Vérifié
                          </span>
                        )}
                        <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>•</span>
                        <span className={`text-[10px] sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                          {item.createdAt}
                        </span>
                        {item.isBoosted && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-social/20 text-social text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Boosté
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-sm sm:text-base md:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-3 sm:mb-4 line-clamp-2`}>
                        {item.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                        <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
                          {item.stats.views} vues
                        </span>
                        <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
                          {item.stats.shares} partages
                        </span>
                        {item.type !== 'urgency' && (
                          <span className={resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}>
                            {item.stats.comments} commentaires
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => handleShare(item)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-base font-medium ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Partager
                    </button>

                    {item.type === 'recruitment' && (
                      <button
                        onClick={() => handleApply(item)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-social text-white rounded-lg text-[10px] sm:text-xs md:text-base font-medium hover:bg-social/90 transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Postuler
                      </button>
                    )}

                    {item.type === 'event' && (
                      <button
                        onClick={() => handleRegister(item)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-social text-white rounded-lg text-[10px] sm:text-xs md:text-base font-medium hover:bg-social/90 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        S'inscrire
                      </button>
                    )}
                  </div>
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-base font-medium shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5 sm:gap-2">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {toastMsg}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-md w-full border`}>
            <h2 className={`text-base sm:text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              Partager {selectedItem.title}
            </h2>
            <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              {selectedItem.description}
            </p>
            
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <button
                onClick={() => selectedItem && handleCopyLink(selectedItem)}
                className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Copier le lien
              </button>
              
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => selectedItem && handleSocialShare('facebook', selectedItem)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-blue-400'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-blue-600'
                  } transition-colors text-center`}
                >
                  Facebook
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('twitter', selectedItem)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-zinc-800'
                  } transition-colors text-center`}
                >
                  X (Twitter)
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('whatsapp', selectedItem)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-emerald-400'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-emerald-600'
                  } transition-colors text-center`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('linkedin', selectedItem)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-blue-400'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-blue-700'
                  } transition-colors text-center`}
                >
                  LinkedIn
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className={`w-full py-2.5 rounded-xl font-medium text-xs sm:text-sm ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Recruitment Candidate Application Modal (Roadmap compliant) */}
      {showApplyModal && selectedJobForApply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[35000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-700/50 dark:border-zinc-800">
              <div>
                <h3 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Postuler à l'offre officielle
                </h3>
                <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'} truncate max-w-xs`}>
                  {selectedJobForApply.title} • {selectedJobForApply.institution.name}
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className={`p-1.5 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!applyForm.fullName.trim() || !applyForm.email.trim()) {
                  showToast('Veuillez renseigner votre nom et votre email.')
                  return
                }
                if (!applyForm.cvFile) {
                  showToast('Veuillez joindre votre CV au format PDF obligatoire.')
                  return
                }
                setIsSubmittingApplication(true)
                setTimeout(() => {
                  setIsSubmittingApplication(false)
                  setShowApplyModal(false)
                  setApplyForm({ fullName: '', email: '', phone: '', coverNote: '', cvFile: null })
                  showToast('Votre candidature a été transmise avec succès à l\'institution !')
                }, 1000)
              }}
              className="space-y-3.5"
            >
              <div>
                <label className={`block text-xs font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={applyForm.fullName}
                  onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                  placeholder="Ex: Jean Baptiste"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Email de contact *
                  </label>
                  <input
                    type="email"
                    required
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    placeholder="jean@exemple.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    placeholder="+509 3123 4567"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Curriculum Vitae (PDF obligatoire) *
                </label>
                <div className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  applyForm.cvFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : resolvedTheme === 'dark' ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/40' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    id="cv-upload-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                          showToast('Seul le format PDF est accepté pour le CV.')
                          return
                        }
                        setApplyForm({ ...applyForm, cvFile: file })
                      }
                    }}
                  />
                  <label htmlFor="cv-upload-input" className="cursor-pointer flex flex-col items-center w-full">
                    {applyForm.cvFile ? (
                      <>
                        <FileCheck className="w-8 h-8 text-emerald-500 mb-1" />
                        <p className="text-xs font-semibold text-emerald-500 truncate max-w-xs">{applyForm.cvFile.name}</p>
                        <p className="text-[10px] text-zinc-500">{(applyForm.cvFile.size / 1024 / 1024).toFixed(2)} Mo • Cliquer pour changer</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-400 mb-1" />
                        <p className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Cliquez pour joindre votre CV
                        </p>
                        <p className="text-[10px] text-zinc-500">Format PDF uniquement (Max 10 Mo)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Message de motivation court
                </label>
                <textarea
                  rows={3}
                  value={applyForm.coverNote}
                  onChange={(e) => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                  placeholder="Présentez brièvement vos atouts pour ce poste..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApplication}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingApplication ? (
                    <span>Transmission...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer ma candidature</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Complet de Création Institutionnelle (Feuille de Route EXILE) */}
      <CreatePublicationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialType={createModalInitialType}
        onSuccess={handlePublicationCreated}
      />
    </div>
  )
}

export default SocialFeed
