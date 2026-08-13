import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, AlertTriangle, Briefcase, Calendar, Video, Megaphone, Filter, TrendingUp, CheckCircle, Share2, Upload, Radio, X, Users, FileText, Heart, Star, Zap } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { SocialHeader } from '../../components/social/SocialHeader'
import { InstitutionVideoCard } from '../../components/social/InstitutionVideoCard'
import { AlertType, AlertPriority } from '../../types/social/alert'
import { useToast } from '../../hooks/useToast'

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
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])

  // Fetch alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/activities/activities/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setFeedItems(data.results || data)
        }
      } catch (error) {
        console.error('[SocialFeed] Failed to fetch alerts:', error)
        setFeedItems([]) // Set empty array on error to prevent crash
      }
    }
    fetchAlerts()
  }, [])

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
        alert('Token non trouvé. Veuillez vous reconnecter.')
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

  const handleApply = useCallback((_item: FeedItem) => {
    navigate('/social/institution/request')
    showToast('Redirection vers le formulaire de candidature...')
  }, [navigate, showToast])

  const handleRegister = useCallback((_item: FeedItem) => {
    navigate('/social/events')
    showToast('Redirection vers l\'événement...')
  }, [navigate, showToast])

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
      <div className="pt-16">
        <SocialHeader
          title=""
          showSearch={true}
          showCreateButton={true}
          showLogo={false}
          onCreateClick={() => setShowCreateModal(true)}
          onSearch={(query) => setSearchQuery(query)}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-4 sm:pb-6">

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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[30000] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Créer du contenu</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowVideoImportModal(true)
                  }}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-center group ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-social group-hover:scale-110 transition-transform" />
                  <span className={`text-sm sm:text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Importer une vidéo</span>
                  <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Pour les institutions</p>
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowLiveVideoModal(true)
                  }}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-center group ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <Radio className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className={`text-sm sm:text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Live vidéo</span>
                  <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Diffusion en direct</p>
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowAlertModal(true)
                  }}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-center group ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className={`text-sm sm:text-base font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Créer une alerte</span>
                  <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Urgence, santé, etc.</p>
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-lg font-medium border transition-colors ${resolvedTheme === 'dark' ? 'border-zinc-700 text-gray-300 hover:bg-zinc-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Import Modal */}
      {showVideoImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-4xl w-full border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Importer une vidéo institutionnelle
                </h2>
                <p className={`text-sm sm:text-base mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Réservé aux institutions (Universités, Écoles, Entreprises)
                </p>
              </div>
              <button
                onClick={() => setShowVideoImportModal(false)}
                className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Video Upload Section */}
              {videoPreviewUrl ? (
                <div className={`border-2 rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-200'}`}>
                  <div className="relative">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full h-48 sm:h-64 object-cover"
                    />
                    <button
                      onClick={handleRemoveVideo}
                      className={`absolute top-2 right-2 p-2 rounded-full ${
                        resolvedTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/80'
                      } hover:bg-red-500 hover:text-white transition-colors`}
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className={`p-3 sm:p-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    <p className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedVideoFile?.name}
                    </p>
                    <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {(selectedVideoFile?.size ? (selectedVideoFile.size / (1024 * 1024)).toFixed(2) : '0')} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'} transition-colors`}>
                  <Upload className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  <p className={`text-sm sm:text-base mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Glissez une vidéo ici ou cliquez pour sélectionner
                  </p>
                  <p className={`text-[10px] sm:text-xs mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
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
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-social text-white rounded-lg text-sm sm:text-base font-medium hover:bg-social/90 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Choisir une vidéo
                  </label>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Graduation Promotion 2021-2025"
                    maxLength={100}
                    value={videoForm.title}
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                  <p className={`text-[10px] sm:text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Max 100 caractères</p>
                </div>

                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Communiqué ou note officielle..."
                    rows={3}
                    value={videoForm.description}
                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                </div>

                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Hashtags
                  </label>
                  <div className="flex gap-2 mb-2 sm:mb-3">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={handleHashtagKeyPress}
                      placeholder="#annonce"
                      className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:ring-2 focus:ring-social focus:border-social`}
                    />
                    <button
                      type="button"
                      onClick={handleAddHashtag}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {videoForm.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {videoForm.hashtags.map((hashtag, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                            resolvedTheme === 'dark'
                              ? 'bg-zinc-700 text-zinc-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-medium">#{hashtag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHashtag(hashtag)}
                            className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Département (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sciences Informatiques, Gestion"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
              <h3 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Options supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Visibilité
                  </label>
                  <div className="flex gap-3 sm:gap-4">
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
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Commentaires
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <input type="checkbox" defaultChecked className="text-social focus:ring-social rounded" />
                    Autoriser les commentaires
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4 sm:pt-6">
              <button
                onClick={() => setShowVideoImportModal(false)}
                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={handlePublishVideo}
                disabled={!selectedVideoFile || !videoForm.title.trim() || !videoForm.description.trim()}
                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Video Modal */}
      {showLiveVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-2xl w-full border`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Créer un live vidéo
              </h2>
              <button
                onClick={() => setShowLiveVideoModal(false)}
                className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-300'}`}>
              <Radio className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <p className={`text-sm sm:text-base mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                Utiliser votre caméra pour créer un live
              </p>
              <p className={`text-[10px] sm:text-xs mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                Accès caméra et microphone requis
              </p>
              <button className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-social text-white rounded-lg text-sm sm:text-base font-medium hover:bg-social/90 transition-colors">
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Démarrer le live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-2xl w-full border`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Créer une alerte
              </h2>
              <button
                onClick={() => setShowAlertModal(false)}
                className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setAlertType('urgency')
                  setShowAlertModal(false)
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-red-600 hover:border-red-500 bg-red-900/20'
                    : 'border-red-300 hover:border-red-400 bg-red-50'
                }`}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 text-red-500" />
                <span className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Urgence</span>
              </button>
              <button
                onClick={() => {
                  setAlertType('health')
                  setShowAlertModal(false)
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-emerald-600 hover:border-emerald-500 bg-emerald-900/20'
                    : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50'
                }`}
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 text-emerald-500" />
                <span className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Santé</span>
              </button>
              <button
                onClick={() => {
                  setAlertType('recruitment')
                  setShowAlertModal(false)
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-blue-600 hover:border-blue-500 bg-blue-900/20'
                    : 'border-blue-300 hover:border-blue-400 bg-blue-50'
                }`}
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 text-blue-500" />
                <span className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Recrutement</span>
              </button>
              <button
                onClick={() => {
                  setAlertType('announcement')
                  setShowAlertModal(false)
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-purple-600 hover:border-purple-500 bg-purple-900/20'
                    : 'border-purple-300 hover:border-purple-400 bg-purple-50'
                }`}
              >
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 text-purple-500" />
                <span className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Annonce</span>
              </button>
              <button
                onClick={() => {
                  setAlertType('promotion')
                  setShowAlertModal(false)
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-amber-600 hover:border-amber-500 bg-amber-900/20'
                    : 'border-amber-300 hover:border-amber-400 bg-amber-50'
                }`}
              >
                <Star className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 text-amber-500" />
                <span className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Promotion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Creation Modal */}
      {alertType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-2xl w-full border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Créer une alerte {alertType === 'urgency' && 'd\'urgence'}
                {alertType === 'health' && 'de santé'}
                {alertType === 'recruitment' && 'de recrutement'}
                {alertType === 'announcement' && 'd\'annonce'}
                {alertType === 'promotion' && 'de promotion'}
              </h2>
              <button
                onClick={() => setAlertType(null)}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Alert Type Header */}
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border ${
              alertType === 'urgency' && (resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
              || alertType === 'health' && (resolvedTheme === 'dark' ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200')
              || alertType === 'recruitment' && (resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
              || alertType === 'announcement' && (resolvedTheme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200')
              || alertType === 'promotion' && (resolvedTheme === 'dark' ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200')
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                {alertType === 'urgency' && <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />}
                {alertType === 'health' && <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />}
                {alertType === 'recruitment' && <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />}
                {alertType === 'announcement' && <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />}
                {alertType === 'promotion' && <Star className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />}
                <div>
                  <p className={`font-semibold text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {alertType === 'urgency' && 'Alerte d\'urgence'}
                    {alertType === 'health' && 'Alerte de santé'}
                    {alertType === 'recruitment' && 'Alerte de recrutement'}
                    {alertType === 'announcement' && 'Annonce officielle'}
                    {alertType === 'promotion' && 'Promotion'}
                  </p>
                  <p className={`text-xs sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                    {alertType === 'urgency' && 'Informations urgentes et importantes'}
                    {alertType === 'health' && 'Informations de santé publique'}
                    {alertType === 'recruitment' && 'Opportunités d\'emploi'}
                    {alertType === 'announcement' && 'Annonces institutionnelles'}
                    {alertType === 'promotion' && 'Promotions et offres spéciales'}
                  </p>
                </div>
              </div>
            </div>

            {/* Alert Form */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Titre
                </label>
                <input
                  type="text"
                  placeholder="Titre de l'alerte..."
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:ring-2 focus:ring-social focus:border-social`}
                />
              </div>

              <div>
                <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  placeholder="Description détaillée de l'alerte..."
                  rows={4}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:ring-2 focus:ring-social focus:border-social`}
                />
              </div>

              {alertType === 'recruitment' && (
                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Poste
                  </label>
                  <input
                    type="text"
                    placeholder="Intitulé du poste..."
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-social focus:border-social`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm sm:text-base font-medium mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Pièce jointe
                </label>
                <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center ${
                  resolvedTheme === 'dark'
                    ? 'border-zinc-600 hover:border-zinc-500'
                    : 'border-gray-300 hover:border-gray-400'
                } transition-colors`}>
                  <FileText className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  <p className={`text-sm sm:text-base mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Glissez un fichier ici ou cliquez pour sélectionner
                  </p>
                  <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                    PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                  </p>
                  <input type="file" className="hidden" id="alertFileInput" />
                  <label
                    htmlFor="alertFileInput"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-social text-white rounded-lg text-sm sm:text-base font-medium hover:bg-social/90 transition-colors cursor-pointer mt-2 sm:mt-3"
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Choisir un fichier
                  </label>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  onClick={() => setAlertType(null)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setAlertType(null)
                    showToast('Alerte créée avec succès!')
                  }}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium bg-social text-white hover:bg-social/90 transition-colors`}
                >
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  onClick={() => selectedItem && handleSocialShare('facebook', selectedItem)}
                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-600 hover:border-zinc-500'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors text-center`}
                >
                  <span className="text-xl sm:text-2xl">📘</span>
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('twitter', selectedItem)}
                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-600 hover:border-zinc-500'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors text-center`}
                >
                  <span className="text-xl sm:text-2xl">🐦</span>
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('whatsapp', selectedItem)}
                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-600 hover:border-zinc-500'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors text-center`}
                >
                  <span className="text-xl sm:text-2xl">💬</span>
                </button>
                <button
                  onClick={() => selectedItem && handleSocialShare('linkedin', selectedItem)}
                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                    resolvedTheme === 'dark'
                      ? 'border-zinc-600 hover:border-zinc-500'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors text-center`}
                >
                  <span className="text-xl sm:text-2xl">💼</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className={`w-full py-2 sm:py-3 rounded-lg font-medium ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialFeed
