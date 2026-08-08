import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, Users, Plus, Search,
  Clock, MapPin, Video, BarChart3, Trash2, CheckCircle,
  Radio, Ticket, X, ArrowLeft
} from 'lucide-react'
import TicketModal from '../../components/modals/TicketModal'
import EventStatsModal from '../../components/modals/EventStatsModal'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ============ TIP YO ============
interface EventItem {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  format: 'in-person' | 'virtual' | 'hybrid'
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  location?: { city: string; venue: string }
  coverImage?: string
  category: string
  capacity: number
  stats: { views: number; registrations: number; attendees: number; revenue: number }
  organizerName: string
  organizerAvatar?: string
  createdAt: string
  publishedAt?: string
  price: number
  isLive: boolean
  liveRoomName?: string
  // Live & Jitsi fields
  liveStatus?: 'at_coming' | 'live' | 'ended'
  speaker?: { name: string; avatar?: string }
  jitsiRoom?: string
  participantsCount?: number
  maxParticipants?: number
  reactions?: { thumbs_up: number; clap: number; bulb: number; heart: number }
  isRegistered?: boolean
}

// ============ DEMO EVENTS ============
const DEMO_EVENTS: EventItem[] = [
  {
    id: 'evt_1',
    title: 'Conférence: Développement Web Moderne',
    description: 'Découvrez les dernières tendances en développement web avec React, TypeScript et Node.js',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    format: 'virtual',
    status: 'published',
    location: { city: 'Paris', venue: 'Online' },
    coverImage: '',
    category: 'TECHNOLOGY',
    capacity: 100,
    stats: { views: 1250, registrations: 45, attendees: 0, revenue: 0 },
    organizerName: 'Jean Dupont',
    organizerAvatar: '',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    price: 0,
    isLive: false,
    isRegistered: false
  },
  {
    id: 'evt_2',
    title: 'Workshop: Design UI/UX',
    description: 'Apprenez à créer des interfaces utilisateur modernes et intuitives',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    format: 'in-person',
    status: 'published',
    location: { city: 'Lyon', venue: 'Tech Hub' },
    coverImage: '',
    category: 'ARTS',
    capacity: 50,
    stats: { views: 890, registrations: 32, attendees: 0, revenue: 0 },
    organizerName: 'Marie Martin',
    organizerAvatar: '',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    price: 50,
    isLive: false,
    isRegistered: false
  },
  {
    id: 'evt_3',
    title: 'Networking: Entrepreneurs',
    description: 'Rencontrez d\'autres entrepreneurs et partagez vos expériences',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    format: 'hybrid',
    status: 'completed',
    location: { city: 'Marseille', venue: 'Business Center' },
    coverImage: '',
    category: 'BUSINESS',
    capacity: 200,
    stats: { views: 2100, registrations: 150, attendees: 120, revenue: 7500 },
    organizerName: 'Pierre Durand',
    organizerAvatar: '',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    price: 50,
    isLive: false,
    isRegistered: false
  }
]

// ============ P AJ EVENMAN ============
export default function EventsPro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resolvedTheme } = useTheme()
  const { isAuthenticated } = useAuth()

  const [events, setEvents] = useState<EventItem[]>([])

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Backend removed - events loading disabled
        setEvents([])
      } catch (error) {
        console.error('Failed to fetch events:', error)
        setEvents([])
      }
    }
    fetchEvents()
  }, [])

  // Fonction de navigation conditionnelle
  const handleBack = () => {
    navigate('/pro')
  }
  
  // Open create modal if create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      // Remove the query param from URL
      navigate('/pro/events', { replace: true })
    }
  }, [searchParams, navigate])

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'live'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'published' || tabParam === 'draft' || tabParam === 'live') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Cache ProSidebar lè modal kreye louvri
  useEffect(() => {
    if (showCreateModal) {
      localStorage.setItem('exile_creating_event', 'true')
    } else {
      localStorage.removeItem('exile_creating_event')
    }
  }, [showCreateModal])

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // Fallback to localStorage if not authenticated
          const saved = localStorage.getItem('exile_events_v2')
          if (saved) {
            setEvents(JSON.parse(saved) as EventItem[])
          } else {
            setEvents(DEMO_EVENTS)
            localStorage.setItem('exile_events_v2', JSON.stringify(DEMO_EVENTS))
          }
          return
        }

        // Fetch events from backend
        const response = await fetch('${API_BASE_URL}/v1/evenement/evenements/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        
        // Transform backend data to frontend format
        const transformedEvents: EventItem[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          startDate: item.start_date,
          endDate: item.end_date,
          format: item.format || 'virtual',
          status: item.status || 'draft',
          location: item.location ? { city: item.location, venue: item.venue || '' } : undefined,
          coverImage: item.cover_image,
          category: item.category || 'OTHER',
          capacity: item.capacity || 100,
          stats: { 
            views: item.views || 0, 
            registrations: item.registrations || 0, 
            attendees: item.attendees || 0, 
            revenue: item.revenue || 0 
          },
          organizerName: item.organizer_name || 'Organisateur',
          organizerAvatar: item.organizer_avatar,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          price: item.price || 0,
          isLive: item.is_live || false,
          liveRoomName: item.live_room_name,
          liveStatus: item.live_status,
          speaker: item.speaker,
          jitsiRoom: item.jitsi_room,
          participantsCount: item.participants_count,
          maxParticipants: item.max_participants,
          reactions: item.reactions,
          isRegistered: item.is_registered
        }))

        setEvents(transformedEvents)
        localStorage.setItem('exile_events_v2', JSON.stringify(transformedEvents))
      } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('exile_events_v2')
        if (saved) {
          setEvents(JSON.parse(saved) as EventItem[])
        } else {
          setEvents(DEMO_EVENTS)
          localStorage.setItem('exile_events_v2', JSON.stringify(DEMO_EVENTS))
        }
      }
    };
    loadEvents();
  }, [])

  useEffect(() => {
    const saveEvents = async () => {
      if (events.length > 0) {
        try {
          // Note: This would need to be updated to use API calls for individual event updates
          // For now, we keep localStorage as a cache
          localStorage.setItem('exile_events_v2', JSON.stringify(events))
        } catch (error) {
          console.error('Error saving events:', error);
        }
      }
    };
    saveEvents();
  }, [events])

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const createEvent = useCallback((data: Omit<EventItem, 'id' | 'createdAt' | 'stats'>) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const newEvent: EventItem = {
      ...data,
      id: `evt_${Date.now()}`,
      createdAt: new Date().toISOString(),
      stats: { views: 0, registrations: 0, attendees: 0, revenue: 0 }
    }
    setEvents(prev => [newEvent, ...prev])
    setShowCreateModal(false)
    showToastMsg('Événement créé avec succès')
  }, [showToastMsg, isAuthenticated, navigate])

  const deleteEvent = useCallback((id: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setEvents(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
    showToastMsg('Événement supprimé')
  }, [showToastMsg, isAuthenticated, navigate])

  const publishEvent = useCallback((id: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'published', publishedAt: new Date().toISOString() } : e))
    showToastMsg('Événement publié')
  }, [showToastMsg, isAuthenticated, navigate])

  const startLive = useCallback((event: EventItem) => {
    if (!event.liveRoomName) {
      const roomName = `exile-${event.id}`
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLive: true, liveRoomName: roomName } : e))
      navigate(`/pro/events/${event.id}/live?room=${roomName}`)
    } else {
      navigate(`/pro/events/${event.id}/live?room=${event.liveRoomName}`)
    }
  }, [navigate])

  const filtered = events.filter(e => {
    if (activeTab === 'live') return e.isLive
    if (activeTab !== 'all' && e.status !== activeTab) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const formatDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const isUpcoming = (date: string) => new Date(date) > new Date()

  // ============ RENDU ============
  return (
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-16 sm:pb-20`}>
      {/* TOAST */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* HEADER - Compact pour desktop */}
      <div className={`fixed top-0 left-0 right-0 w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} backdrop-blur-lg border-b z-[100] px-3 sm:px-4 py-2.5 sm:py-3 md:py-2 md:mt-0 shadow-md`}>
        {/* Mobile: Vertical layout */}
        <div className="md:hidden flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleBack}
              className={`p-1.5 sm:p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1">
              <h1 className={`text-base sm:text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>Événements</h1>
            </div>
            <button
              onClick={() => isAuthenticated ? setShowCreateModal(true) : navigate('/login')}
              className="flex items-center gap-1.5 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Créer</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>

          {/* STATS - Mobile */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
            {[
              { icon: Calendar, value: events.filter(e => e.status === 'published').length, label: 'Publiés', color: resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: resolvedTheme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100' },
              { icon: Users, value: events.reduce((s, e) => s + e.stats.registrations, 0), label: 'Inscrits', color: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: resolvedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100' },
              { icon: Radio, value: events.filter(e => e.isLive).length, label: 'Live', color: resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600', bg: resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100' },
            ].map((s, i) => (
              <div key={i} className={`flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5 min-w-[70px] sm:min-w-[80px]`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-tight`}>{s.value}</p>
                  <p className={`text-[9px] sm:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABS + SEARCH - Mobile */}
          <div className="flex gap-1.5 sm:gap-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
              {(['all', 'published', 'draft', 'live'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400 border-zinc-600 hover:text-zinc-200' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {tab === 'all' && 'Tous'}
                  {tab === 'published' && 'Publiés'}
                  {tab === 'draft' && 'Brouillons'}
                  {tab === 'live' && 'Live'}
                </button>
              ))}
            </div>
            <div className="relative w-28 sm:w-32 flex-shrink-0">
              <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal compact layout */}
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <h1 className={`text-base sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>Événements</h1>

          {/* STATS - Desktop horizontal */}
          <div className="flex gap-1.5 sm:gap-2">
            {[
              { icon: Calendar, value: events.filter(e => e.status === 'published').length, label: 'Publiés', color: resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: resolvedTheme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100' },
              { icon: Users, value: events.reduce((s, e) => s + e.stats.registrations, 0), label: 'Inscrits', color: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: resolvedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100' },
              { icon: Radio, value: events.filter(e => e.isLive).length, label: 'Live', color: resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600', bg: resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100' },
            ].map((s, i) => (
              <div key={i} className={`flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-lg border px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-1.5 sm:gap-2`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-[10px] sm:text-xs font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-tight`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABS - Desktop */}
          <div className="flex gap-1">
            {(['all', 'published', 'draft', 'live'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400 border-zinc-600 hover:text-zinc-200' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
                }`}
              >
                {tab === 'all' && 'Tous'}
                {tab === 'published' && 'Publiés'}
                {tab === 'draft' && 'Brouillons'}
                {tab === 'live' && 'Live'}
              </button>
            ))}
          </div>

          {/* SEARCH - Desktop */}
          <div className="relative w-36 sm:w-48 flex-shrink-0">
            <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-1.5 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Créer
          </button>
        </div>
      </div>

      {/* LISTE EVENMAN */}
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 pt-48 sm:pt-56 md:pt-20 pb-20 sm:pb-24 md:pb-6">
        {filtered.length === 0 ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-4 sm:p-6 md:p-12 text-center`}>
            <Calendar className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-2 sm:mb-3`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-xs sm:text-sm md:text-base`}>Aucun événement</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(event => (
              <div key={event.id} className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl md:rounded-2xl border overflow-hidden transition-all active:scale-[0.99]`}>
                {/* KOUVRI */}
                <div className={`relative h-36 sm:h-48 md:h-40 lg:h-36 xl:h-40 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'} overflow-hidden w-full`}>
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Calendar className={`w-8 h-8 sm:w-10 sm:h-10 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${resolvedTheme === 'dark' ? 'from-black' : 'from-gray-900/80'} via-transparent to-transparent`} />

                  {/* BADGES */}
                  <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex gap-1 sm:gap-1.5">
                    {event.isLive && (
                      <span className="bg-red-600/90 backdrop-blur text-white text-[8px] sm:text-[9px] md:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider animate-pulse">
                        <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 inline mr-0.5 sm:mr-1" />
                        Live
                      </span>
                    )}
                    {!event.isLive && event.status === 'published' && isUpcoming(event.startDate) && (
                      <span className="bg-emerald-600/90 backdrop-blur text-white text-[8px] sm:text-[9px] md:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider">
                        À venir
                      </span>
                    )}
                    {event.status === 'draft' && (
                      <span className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/90 text-zinc-300' : 'bg-gray-600/90 text-gray-200'} backdrop-blur text-[8px] sm:text-[9px] md:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider`}>
                        Brouillon
                      </span>
                    )}
                  </div>

                  {/* ACTION RAPIDE: LIVE */}
                  {event.isLive && (
                    <button
                      onClick={() => navigate(`/pro/events/${event.id}/preview`)}
                      className={`absolute bottom-2 sm:bottom-3 right-2 sm:right-3 px-2 sm:px-3 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs sm:text-sm font-bold transition-all flex items-center gap-1 sm:gap-2 shadow-xl animate-pulse ${
                        resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-white text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Rejoindre</span>
                      <span className="sm:hidden">Rejoindre</span>
                    </button>
                  )}
                </div>

                {/* TIT */}
                <div className="p-2.5 sm:p-3 md:p-2 lg:p-2">
                  <h3 className={`text-xs sm:text-sm md:text-sm lg:text-xs font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 md:mb-1 lg:mb-1 leading-tight line-clamp-2`}>{event.title}</h3>
                  <p className={`text-[10px] sm:text-xs md:text-xs lg:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5 sm:mb-2 md:mb-2 lg:mb-2 line-clamp-1`}>{event.description}</p>

                  {/* INFO */}
                  <div className={`flex flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-0.5 sm:gap-y-1 text-[10px] sm:text-xs md:text-xs lg:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1.5 sm:mb-2 md:mb-2 lg:mb-2`}>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-2 lg:h-2" />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {event.format === 'virtual' ? (
                        <><Video className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-2 lg:h-2" /> En ligne</>
                      ) : (
                        <><MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-2 lg:h-2" /> {event.location?.city}</>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-2 lg:h-2" />
                      {event.stats.registrations}/{event.capacity}
                    </span>
                  </div>

                  {/* ORGANIZATEUR */}
                  <div className={`flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 md:mb-2 lg:mb-2 pb-1.5 sm:pb-2 md:pb-2 lg:pb-2 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-4 lg:h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] md:text-[10px] lg:text-[9px] font-bold">
                      {event.organizerAvatar ? <img src={event.organizerAvatar} className="w-full h-full rounded-full object-cover" /> : event.organizerName.charAt(0)}
                    </div>
                    <span className={`text-[10px] sm:text-xs md:text-xs lg:text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>{event.organizerName}</span>
                  </div>

                  {/* AKSIYON */}
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 md:gap-1 lg:gap-1">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => publishEvent(event.id)}
                        className={`flex-1 min-w-[60px] sm:min-w-[80px] flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'} border rounded-xl text-[10px] sm:text-xs font-medium transition-colors`}
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Publier</span>
                        <span className="sm:hidden">Publier</span>
                      </button>
                    )}

                    {!event.isLive && event.status === 'published' && (
                      <button
                        onClick={() => {
                          setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLive: true, liveRoomName: `exile-${event.id}` } : e))
                          startLive({ ...event, isLive: true, liveRoomName: `exile-${event.id}` })
                        }}
                        className={`flex-1 min-w-[60px] sm:min-w-[80px] flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400 border-red-800/40 hover:bg-red-900/50' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'} border rounded-xl text-[10px] sm:text-xs font-medium transition-colors`}
                      >
                        <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Live</span>
                        <span className="sm:hidden">Live</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedEvent(event); setShowTicketModal(true) }}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-[10px] sm:text-xs font-medium transition-colors`}
                    >
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Ticket</span>
                      <span className="sm:hidden">Ticket</span>
                    </button>

                    <button
                      onClick={() => { setSelectedEvent(event); setShowStatsModal(true) }}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-[10px] sm:text-xs font-medium transition-colors`}
                    >
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Stats</span>
                      <span className="sm:hidden">Stats</span>
                    </button>

                    <button
                      onClick={() => deleteEvent(event.id)}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400 border-red-800/40 hover:bg-red-900/50' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'} border rounded-xl text-[10px] sm:text-xs font-medium transition-colors`}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                      <span className="sm:hidden">Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: KREYE EVENMAN */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createEvent}
        />
      )}

      {/* MODAL: DELETE */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-sm w-full border`}>
            <h3 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Supprimer ?</h3>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4 sm:mb-6`}>Cette action est irréversible.</p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-medium transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={() => deleteEvent(deleteConfirm)}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showTicketModal && selectedEvent && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => { setShowTicketModal(false); setSelectedEvent(null) }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}

      {showStatsModal && selectedEvent && (
        <EventStatsModal
          isOpen={showStatsModal}
          onClose={() => { setShowStatsModal(false); setSelectedEvent(null) }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}
    </div>
  )
}

// ============ CREATE EVENT MODAL ============
function CreateEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const { resolvedTheme } = useTheme()
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    format: 'virtual' as const,
    category: 'Tech',
    capacity: 100,
    price: 0,
    location: { city: '', venue: '' },
    coverImage: '' as string,
    // Live & Jitsi fields
    liveStatus: 'at_coming' as 'at_coming' | 'live' | 'ended',
    speakerName: '',
    speakerAvatar: '' as string,
    jitsiRoom: '',
    maxParticipants: 100
  })
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Filtrage mot cle inappropriate
  const inappropriateWords = ['porn', 'sex', 'xxx', 'adult', 'nude', 'erotic', 'sexy', 'fuck', 'shit', 'ass']

  // Validation pro
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Titre: entre 5 et 100 caractères
    if (!form.title.trim()) {
      newErrors.title = 'Le titre est obligatoire'
    } else if (form.title.length < 5) {
      newErrors.title = 'Le titre doit contenir au moins 5 caractères'
    } else if (form.title.length > 100) {
      newErrors.title = 'Le titre ne doit pas dépasser 100 caractères'
    }

    // Description: entre 20 et 500 caractères
    if (!form.description.trim()) {
      newErrors.description = 'La description est obligatoire'
    } else if (form.description.length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères'
    } else if (form.description.length > 500) {
      newErrors.description = 'La description ne doit pas dépasser 500 caractères'
    }

    // Dates: date de fin après date de début
    if (!form.startDate) {
      newErrors.startDate = 'La date de début est obligatoire'
    }
    if (!form.endDate) {
      newErrors.endDate = 'La date de fin est obligatoire'
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      newErrors.endDate = 'La date de fin doit être après la date de début'
    }

    // Capacité: entre 1 et 10000
    if (form.capacity < 1) {
      newErrors.capacity = 'La capacité doit être au moins 1'
    } else if (form.capacity > 10000) {
      newErrors.capacity = 'La capacité ne doit pas dépasser 10000'
    }

    // Lieu: requis si format présentiel ou hybride
    if (form.format !== 'virtual' && !form.location.city.trim()) {
      newErrors.city = 'La ville est obligatoire pour les événements présentiel/hybride'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const containsInappropriateContent = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return inappropriateWords.some(word => lowerText.includes(word))
  }

  const handleImageUpload = (file: File) => {
    if (!file) return
    
    // Validation taille
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }
    
    // Validation format
    const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validFormats.includes(file.type)) {
      alert('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF')
      return
    }
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
      setForm({ ...form, coverImage: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleImageUpload(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation pro
    if (!validateForm()) {
      return
    }
    
    // Validation mot cle inappropriate
    if (containsInappropriateContent(form.title) || containsInappropriateContent(form.description)) {
      alert('Votre événement contient des mots inappropriés. Veuillez modifier le titre ou la description.')
      return
    }
    
    onCreate({
      ...form,
      status: 'draft',
      isLive: false,
      organizerName: 'Moi',
      organizerAvatar: null,
      // Live & Jitsi fields
      liveStatus: form.liveStatus,
      ...(form.speakerName && { speaker: { name: form.speakerName, avatar: form.speakerAvatar || undefined } }),
      ...(form.jitsiRoom && { jitsiRoom: form.jitsiRoom }),
      maxParticipants: form.maxParticipants,
      participantsCount: 0,
      reactions: { thumbs_up: 0, clap: 0, bulb: 0, heart: 0 },
      isRegistered: false
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border`}>
        {/* Header */}
        <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} border-b px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between z-10`}>
          <h2 className={`text-base sm:text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Nouvel événement</h2>
          <button onClick={onClose} className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
            <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 pb-20 sm:pb-24 md:pb-6">
          {/* UPLOAD IMAGE */}
          <div>
            <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Image de couverture</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : resolvedTheme === 'dark' ? 'border-zinc-700 hover:border-zinc-600' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {coverImagePreview ? (
                <div className="relative">
                  <img src={coverImagePreview} alt="Preview" className="w-full h-36 sm:h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setCoverImagePreview(null); setForm({ ...form, coverImage: '' }) }}
                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-black/60 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    id="coverImageInput"
                  />
                  <label
                    htmlFor="coverImageInput"
                    className="cursor-pointer flex flex-col items-center gap-1.5 sm:gap-2"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Plus className={`w-5 h-5 sm:w-6 sm:h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Cliquez ou glissez une image</p>
                    <p className={`text-[9px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`}>JPEG, PNG, WebP, GIF (max 5MB)</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Titre</label>
            <div className="relative">
              <Calendar className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                required
                value={form.title}
                onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
                placeholder="Nom de l'événement (min 5 caractères)"
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
            </div>
            {errors.title && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Description</label>
            <textarea
              value={form.description}
              onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }) }}
              placeholder="Décrivez votre événement... (min 20 caractères)"
              rows={3}
              className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
            {errors.description && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Début</label>
              <div className="relative">
                <Clock className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="datetime-local"
                  required
                  value={form.startDate}
                  onChange={e => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-9 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors ${errors.startDate ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.startDate && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Fin</label>
              <div className="relative">
                <Clock className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="datetime-local"
                  required
                  value={form.endDate}
                  onChange={e => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-9 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors ${errors.endDate ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.endDate && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Format</label>
              <select
                value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value as any })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors`}
              >
                <option value="virtual">En ligne</option>
                <option value="in-person">Présentiel</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Catégorie</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors`}
              >
                <option>Tech</option>
                <option>Business</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>Education</option>
                <option>Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Capacité</label>
              <div className="relative">
                <Users className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => { setForm({ ...form, capacity: parseInt(e.target.value) || 1 }); setErrors({ ...errors, capacity: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors ${errors.capacity ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.capacity && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.capacity}</p>}
            </div>
          </div>

          {form.format !== 'virtual' && (
            <div>
              <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Lieu</label>
              <div className="relative mb-2">
                <MapPin className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  value={form.location.city}
                  onChange={e => { setForm({ ...form, location: { ...form.location, city: e.target.value } }); setErrors({ ...errors, city: '' }) }}
                  placeholder="Ville"
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.city && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.city}</p>}
              <input
                value={form.location.venue}
                onChange={e => setForm({ ...form, location: { ...form.location, venue: e.target.value } })}
                placeholder="Nom du lieu"
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors`}
              />
            </div>
          )}

          {/* Live & Jitsi Configuration - Simplifié */}
          <div className={`p-3 sm:p-4 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2`}>
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Options Live
            </h3>
            
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Statut</label>
                <div className="flex gap-1.5 sm:gap-2">
                  {(['at_coming', 'live', 'ended'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setForm({ ...form, liveStatus: status })}
                      className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                        form.liveStatus === status
                          ? status === 'live' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                          : resolvedTheme === 'dark'
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status === 'at_coming' && 'À venir'}
                      {status === 'live' && 'En direct'}
                      {status === 'ended' && 'Terminé'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Salle Jitsi</label>
                  <input
                    type="text"
                    value={form.jitsiRoom}
                    onChange={e => setForm({ ...form, jitsiRoom: e.target.value })}
                    placeholder="Nom de la salle"
                    className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1 sm:mb-1.5 block`}>Intervenant</label>
                  <input
                    type="text"
                    value={form.speakerName}
                    onChange={e => setForm({ ...form, speakerName: e.target.value })}
                    placeholder="Nom"
                    className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-300'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors`}
            >
              Prévisualiser
            </button>
            <button
              type="submit"
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors`}
            >
              Créer
            </button>
          </div>
        </form>
      </div>

      {/* MODAL PREVISUALISATION */}
      {showPreview && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border`}>
            <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} border-b px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between z-10`}>
              <h2 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Prévisualisation</h2>
              <button onClick={() => setShowPreview(false)} className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <div className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/50' : 'bg-gray-50 border-gray-200'} rounded-xl border overflow-hidden`}>
                <div className={`relative h-36 sm:h-48 ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'} overflow-hidden`}>
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt={form.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Calendar className={`w-10 h-10 sm:w-12 sm:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>{form.title || 'Titre de l\'événement'}</h3>
                  <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2 sm:mb-3 line-clamp-2`}>{form.description || 'Description de l\'événement...'}</p>
                  <div className={`flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 sm:gap-y-1 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-3 sm:mb-4`}>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      {form.startDate ? new Date(form.startDate).toLocaleDateString('fr-FR') : 'Date'}
                    </span>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      {form.format === 'virtual' ? (
                        <><Video className="w-3 h-3 sm:w-4 sm:h-4" /> En ligne</>
                      ) : (
                        <><MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {form.location.city || 'Lieu'}</>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {form.capacity} places
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] sm:text-sm font-bold">M</div>
                    <span className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Moi</span>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'} rounded-xl text-[10px] sm:text-xs font-medium`}>
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4" />
                      Ticket
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'} rounded-xl text-[10px] sm:text-xs font-medium`}>
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Stats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
