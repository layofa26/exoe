import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Users, Plus, Search,
  Clock, MapPin, Video, BarChart3, CheckCircle,
  Ticket, X, Radio, ArrowLeft, Upload, Image as ImageIcon
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../hooks/useToast'

// ============ SOCIAL EVENT TYPES ============
interface SocialEventItem {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  format: 'in-person' | 'virtual' | 'hybrid'
  status: 'published' | 'cancelled' | 'completed'
  location?: { city: string; venue: string }
  coverImage?: string
  category: string
  capacity: number
  stats: { views: number; registrations: number; attendees: number; shares: number }
  institution: {
    id: string
    name: string
    verified: boolean
    avatar?: string
  }
  createdAt: string
  publishedAt?: string
  price: number
  isFree: boolean
  isBoosted: boolean
  // Live & Jitsi fields
  liveStatus?: 'at_coming' | 'live' | 'ended'
  speaker?: { name: string; avatar?: string }
  jitsiRoom?: string
  participantsCount?: number
  maxParticipants?: number
  reactions?: { thumbs_up: number; clap: number; bulb: number; heart: number }
  isRegistered?: boolean
}

export const SocialEvents = (): JSX.Element => {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { msg: toastMsg, show: showToast } = useToast()

  const [events, setEvents] = useState<SocialEventItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'upcoming'>('all')
  const [selectedEvent, setSelectedEvent] = useState<SocialEventItem | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(true)

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setEvents(data.results || data)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    format: 'in-person' as 'in-person' | 'virtual' | 'hybrid',
    category: '',
    capacity: 100,
    location: { city: '', venue: '' },
    isFree: true,
    price: 0,
    coverImage: '' as string,
    // Live & Jitsi fields
    liveStatus: 'at_coming' as 'at_coming' | 'live' | 'ended',
    speakerName: '',
    speakerAvatar: '' as string,
    jitsiRoom: '',
    maxParticipants: 100
  })

  const handleRegister = useCallback(() => {
    navigate('/social/events/register')
    showToast('Redirection vers le formulaire d\'inscription...')
  }, [navigate, showToast])

  const confirmRegistration = useCallback(() => {
    if (selectedEvent) {
      setEvents(prev => prev.map(e => 
        e.id === selectedEvent.id 
          ? { ...e, stats: { ...e.stats, registrations: e.stats.registrations + 1 } }
          : e
      ))
      handleSetShowRegisterModal(false)
      setSelectedEvent(null)
      showToast('Inscription réussie!')
    }
  }, [selectedEvent, showToast])

  const filtered = events.filter(e => {
    if (activeTab === 'upcoming') return new Date(e.startDate) > new Date()
    if (activeTab !== 'all' && e.status !== activeTab) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return e.title.toLowerCase().includes(q) || 
             e.description.toLowerCase().includes(q) || 
             e.institution.name.toLowerCase().includes(q) ||
             e.category.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const formatDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const isUpcoming = (date: string) => new Date(date) > new Date()

  return (
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* HEADER - Compact pour desktop */}
      <div className={`fixed top-0 left-0 right-0 w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} backdrop-blur-lg border-b z-[100] px-4 py-3 md:py-2 md:mt-0 shadow-md transition-all duration-300 ${showCreateModal ? 'blur-md opacity-40 scale-95' : ''}`}>
        {/* Mobile: Vertical layout */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/social')}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1">
              <h1 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>Événements</h1>
            </div>
            <button
              onClick={() => handleSetShowCreateModal(true)}
              className="flex items-center gap-2 bg-social text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-social/90 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Créer
            </button>
          </div>

          {/* STATS - Mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { icon: Calendar, value: events.filter(e => e.status === 'published').length, label: 'Publiés', color: resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: resolvedTheme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100' },
              { icon: Users, value: events.reduce((s, e) => s + e.stats.registrations, 0), label: 'Inscrits', color: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: resolvedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100' },
              { icon: Radio, value: events.filter(e => isUpcoming(e.startDate)).length, label: 'À venir', color: resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-600', bg: resolvedTheme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100' },
            ].map((s, i) => (
              <div key={i} className={`flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border px-3 py-2 flex items-center gap-2.5 min-w-[80px]`}>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-tight`}>{s.value}</p>
                  <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABS + SEARCH - Mobile */}
          <div className="flex gap-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
              {(['all', 'published', 'upcoming'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-social text-white'
                      : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400 border-zinc-600 hover:text-zinc-200' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {tab === 'all' && 'Tous'}
                  {tab === 'published' && 'Publiés'}
                  {tab === 'upcoming' && 'À venir'}
                </button>
              ))}
            </div>
            <div className="relative w-40 flex-shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className={`w-full pl-10 pr-4 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg focus:ring-2 focus:ring-social focus:border-social`}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal compact layout */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/social')}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          
          <div className="flex-1">
            <h1 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>Événements</h1>
          </div>

          {/* STATS - Desktop */}
          <div className="flex gap-2 mp-34">
            {[
              { icon: Calendar, value: events.filter(e => e.status === 'published').length, label: 'Publiés', color: resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: resolvedTheme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100' },
              { icon: Users, value: events.reduce((s, e) => s + e.stats.registrations, 0), label: 'Inscrits', color: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: resolvedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100' },
              { icon: Radio, value: events.filter(e => isUpcoming(e.startDate)).length, label: 'À venir', color: resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-600', bg: resolvedTheme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100' },
            ].map((s, i) => (
              <div key={i} className={`flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border px-3 py-2 flex items-center gap-2.5 min-w-[80px]`}>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-tight`}>{s.value}</p>
                  <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABS - Desktop */}
          <div className="flex gap-1">
            {(['all', 'published', 'upcoming'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400 border-zinc-600 hover:text-zinc-200' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
                }`}
              >
                {tab === 'all' && 'Tous'}
                {tab === 'published' && 'Publiés'}
                {tab === 'upcoming' && 'À venir'}
              </button>
            ))}
          </div>

          {/* SEARCH - Desktop */}
          <div className="relative w-64">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, catégorie, institution..."
              className={`w-full pl-10 pr-4 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg focus:ring-2 focus:ring-social focus:border-social`}
            />
          </div>

          {/* CREATE BUTTON - Desktop */}
          <button
            onClick={() => handleSetShowCreateModal(true)}
            className="flex items-center gap-2 bg-social text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-social/90 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full px-4 py-6 pt-20 md:pt-24">

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
              onClick={() => navigate('/social/institution')}
              className={`px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all ${
                resolvedTheme === 'dark'
                  ? 'text-zinc-300 hover:bg-zinc-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mon Institution
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filtered.length === 0 ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
            <Calendar className={`w-12 h-12 mx-auto mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {filtered.map(event => (
              <div key={event.id} className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl border overflow-hidden transition-all hover:shadow-lg`}>
                {/* Cover Image */}
                <div className={`relative h-28 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'} overflow-hidden`}>
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Calendar className={`w-8 h-8 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${resolvedTheme === 'dark' ? 'from-black' : 'from-gray-900/80'} via-transparent to-transparent`} />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {event.liveStatus === 'live' && (
                      <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        EN DIRECT
                      </span>
                    )}
                    {event.isFree && (
                      <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Gratuit
                      </span>
                    )}
                    {event.liveStatus === 'at_coming' && (
                      <span className="bg-social/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        À venir
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  {/* Institution */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-social flex items-center justify-center text-white text-[9px] font-bold">
                      {event.institution?.avatar ? <img src={event.institution.avatar} className="w-full h-full rounded-full object-cover" /> : event.institution?.name?.charAt(0)}
                    </div>
                    <span className={`text-[9px] font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>{event.institution?.name}</span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-xs font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 line-clamp-2`}>
                    {event.title}
                  </h3>

                  {/* Info */}
                  <div className={`flex flex-wrap gap-x-2 gap-y-1 text-[9px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2 h-2" />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      {event.format === 'virtual' ? (
                        <><Video className="w-2 h-2" /> En ligne</>
                      ) : (
                        <><MapPin className="w-2 h-2" /> {event.location?.city}</>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-2 h-2" />
                      {event.stats.registrations}/{event.capacity}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleRegister()}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-social text-white rounded-lg text-[10px] font-medium hover:bg-social/90 transition-colors"
                    >
                      <Ticket className="w-2.5 h-2.5" />
                      S'inscrire
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <BarChart3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegisterModal && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-md w-full border`}>
            <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              S'inscrire à {selectedEvent.title}
            </h2>
            <p className={`text-sm mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              {selectedEvent.description}
            </p>
            <div className={`mb-6 p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} space-y-2`}>
                <p><strong>Date:</strong> {formatDate(selectedEvent.startDate)}</p>
                <p><strong>Lieu:</strong> {selectedEvent.format === 'virtual' ? 'En ligne' : selectedEvent.location?.city}</p>
                <p><strong>Capacité:</strong> {selectedEvent.stats.registrations}/{selectedEvent.capacity} inscrits</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { handleSetShowRegisterModal(false); setSelectedEvent(null) }}
                className={`flex-1 py-2.5 rounded-lg font-medium ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={confirmRegistration}
                className="flex-1 py-2.5 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-2xl w-full border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Créer un événement {createStep === 2 && '- Étape 2/2'}
              </h2>
              <button
                onClick={() => {
                  handleSetShowCreateModal(false)
                  setCreateStep(1)
                }}
                className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              <div className={`flex-1 h-1 rounded-full ${createStep >= 1 ? 'bg-social' : resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1 rounded-full ${createStep >= 2 ? 'bg-social' : resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`} />
            </div>

            {createStep === 1 ? (
              <form onSubmit={(e) => {
                e.preventDefault()
                setCreateStep(2)
              }} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                  Image de couverture
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${resolvedTheme === 'dark' ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-300 hover:border-gray-400'} transition-colors`}>
                  {newEvent.coverImage ? (
                    <div className="relative">
                      <img src={newEvent.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, coverImage: '' })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className={`w-12 h-12 mx-auto mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                      <p className={`text-sm mb-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                        Glissez une image ici ou cliquez pour sélectionner
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setNewEvent({ ...newEvent, coverImage: reader.result as string })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="coverImageInput"
                      />
                      <label
                        htmlFor="coverImageInput"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-social text-white rounded-lg text-sm font-medium hover:bg-social/90 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Choisir une image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                  placeholder="Ex: Conférence annuelle"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                  Description *
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-social focus:border-transparent transition-all resize-none`}
                  placeholder="Décrivez votre événement..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Date de début *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Date de fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                  Format *
                </label>
                <div className="flex gap-2">
                  {(['in-person', 'virtual', 'hybrid'] as const).map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, format })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        newEvent.format === format
                          ? 'bg-social text-white'
                          : resolvedTheme === 'dark'
                          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {format === 'in-person' && 'En présentiel'}
                      {format === 'virtual' && 'En ligne'}
                      {format === 'hybrid' && 'Hybride'}
                    </button>
                  ))}
                </div>
              </div>

              {newEvent.format !== 'virtual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={newEvent.location.city}
                      onChange={(e) => setNewEvent({ ...newEvent, location: { ...newEvent.location, city: e.target.value } })}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                      placeholder="Port-au-Prince"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={newEvent.location.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, location: { ...newEvent.location, venue: e.target.value } })}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${
                        resolvedTheme === 'dark'
                          ? 'bg-zinc-700 border-zinc-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                      placeholder="Hotel Karibe"
                    />
                  </div>
                </div>
              )}


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Catégorie *
                  </label>
                  <input
                    type="text"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    placeholder="Santé, Éducation, Culture..."
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Capacité *
                  </label>
                  <input
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={newEvent.isFree}
                  onChange={(e) => setNewEvent({ ...newEvent, isFree: e.target.checked, price: e.target.checked ? 0 : newEvent.price })}
                  className="w-4 h-4 rounded border-gray-300 text-social focus:ring-social"
                />
                <label htmlFor="isFree" className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Événement gratuit
                </label>
              </div>

              {!newEvent.isFree && (
                <div>
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5`}>
                    Prix (HTG) *
                  </label>
                  <input
                    type="number"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                    min="0"
                    required
                  />
                </div>
              )}

              {/* Live & Jitsi Configuration - Simplifié */}
              <div className={`p-4 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center gap-2`}>
                  <Video className="w-4 h-4" />
                  Options Live
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5`}>
                      Statut
                    </label>
                    <div className="flex gap-2">
                      {(['at_coming', 'live', 'ended'] as const).map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, liveStatus: status })}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            newEvent.liveStatus === status
                              ? status === 'live' ? 'bg-red-500 text-white' : 'bg-social text-white'
                              : resolvedTheme === 'dark'
                              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status === 'at_coming' && 'À venir'}
                          {status === 'live' && 'En direct'}
                          {status === 'ended' && 'Terminé'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5`}>
                        Salon Live (WebRTC)
                      </label>
                      <input
                        type="text"
                        value={newEvent.liveRoomName || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, liveRoomName: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-700 border-zinc-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                        placeholder="Nom du salon"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5`}>
                        Intervenant
                      </label>
                      <input
                        type="text"
                        value={newEvent.speakerName}
                        onChange={(e) => setNewEvent({ ...newEvent, speakerName: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-700 border-zinc-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } border focus:ring-2 focus:ring-social focus:border-transparent transition-all`}
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleSetShowCreateModal(false)
                    setCreateStep(1)
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-medium ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </form>
            ) : (
              <div className="space-y-4">
                {/* Preview Section */}
                <div className={`p-4 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>Aperçu de l'événement</h3>
                  {newEvent.coverImage && (
                    <img src={newEvent.coverImage} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{newEvent.title || 'Titre de l\'événement'}</h4>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-3`}>{newEvent.description || 'Description de l\'événement'}</p>
                  <div className={`flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {newEvent.startDate ? formatDate(newEvent.startDate) : 'Date de début'}
                    </span>
                    <span className="flex items-center gap-1">
                      {newEvent.format === 'virtual' ? (
                        <><Video className="w-3 h-3" /> En ligne</>
                      ) : (
                        <><MapPin className="w-3 h-3" /> {newEvent.location?.city || 'Ville'}</>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {newEvent.capacity} places
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className={`flex-1 py-2.5 rounded-lg font-medium ${
                      resolvedTheme === 'dark'
                        ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(true)
                      const event: SocialEventItem = {
                        id: `soc-evt-${Date.now()}`,
                        title: newEvent.title,
                        description: newEvent.description,
                        startDate: newEvent.startDate,
                        endDate: newEvent.endDate,
                        format: newEvent.format,
                        status: 'published',
                        category: newEvent.category,
                        capacity: newEvent.capacity,
                        stats: { views: 0, registrations: 0, attendees: 0, shares: 0 },
                        institution: { id: `inst-${Date.now()}`, name: 'Votre Institution', verified: false },
                        createdAt: new Date().toISOString(),
                        publishedAt: new Date().toISOString(),
                        price: newEvent.price,
                        isFree: newEvent.isFree,
                        isBoosted: false,
                        ...(newEvent.format !== 'virtual' && { location: newEvent.location }),
                        ...(newEvent.coverImage && { coverImage: newEvent.coverImage }),
                        // Live & Jitsi fields
                        liveStatus: newEvent.liveStatus,
                        ...(newEvent.speakerName && { speaker: { name: newEvent.speakerName, avatar: newEvent.speakerAvatar || undefined } }),
                        ...(newEvent.jitsiRoom && { jitsiRoom: newEvent.jitsiRoom }),
                        maxParticipants: newEvent.maxParticipants,
                        participantsCount: 0,
                        reactions: { thumbs_up: 0, clap: 0, bulb: 0, heart: 0 },
                        isRegistered: false
                      }
                      setEvents(prev => [...prev, event])
                      setIsCreating(false)
                      handleSetShowCreateModal(false)
                      setCreateStep(1)
                      setNewEvent({
                        title: '',
                        description: '',
                        startDate: '',
                        endDate: '',
                        format: 'in-person',
                        category: '',
                        capacity: 100,
                        location: { city: '', venue: '' },
                        isFree: true,
                        price: 0,
                        coverImage: '',
                        // Live & Jitsi fields
                        liveStatus: 'at_coming',
                        speakerName: '',
                        speakerAvatar: '',
                        jitsiRoom: '',
                        maxParticipants: 100
                      })
                      showToast('Événement créé avec succès!')
                    }}
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Création en cours...' : 'Publier l\'événement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialEvents
