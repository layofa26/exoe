import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, Users, Plus, Search,
  Clock, MapPin, Video, BarChart3, Trash2, CheckCircle,
  Radio, Ticket, X, ArrowLeft, Share2, CalendarPlus, Check, Sparkles
} from 'lucide-react'
import TicketModal from '../../components/modals/TicketModal'
import EventStatsModal from '../../components/modals/EventStatsModal'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '../../hooks/useQuery'

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
  // Live & Streaming fields
  liveStatus?: 'at_coming' | 'live' | 'ended'
  speaker?: { name: string; avatar?: string }
  liveRoomName?: string
  participantsCount?: number
  maxParticipants?: number
  reactions?: { thumbs_up: number; clap: number; bulb: number; heart: number }
  isRegistered?: boolean
}

// ============ DEMO EVENTS ============
const DEMO_EVENTS: EventItem[] = [
  {
    id: 'evt_1',
    title: 'Conférence : Développement Web Moderne & Sécurité',
    description: 'Découvrez les dernières tendances en développement web avec React, TypeScript et Node.js',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    format: 'virtual',
    status: 'published',
    location: { city: 'En ligne', venue: 'Salon Live' },
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
    category: 'TECHNOLOGY',
    capacity: 100,
    stats: { views: 1250, registrations: 45, attendees: 0, revenue: 0 },
    organizerName: 'Jean Dupont',
    organizerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    price: 0,
    isLive: false,
    isRegistered: false
  },
  {
    id: 'evt_2',
    title: 'Workshop : Design d’Interface UI/UX & Design Systems',
    description: 'Apprenez à concevoir des parcours utilisateurs fluides et esthétiques',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    format: 'in-person',
    status: 'published',
    location: { city: 'Lyon', venue: 'Tech Hub' },
    coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600',
    category: 'DESIGN',
    capacity: 50,
    stats: { views: 890, registrations: 32, attendees: 0, revenue: 0 },
    organizerName: 'Marie Martin',
    organizerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    price: 50,
    isLive: false,
    isRegistered: false
  },
  {
    id: 'evt_3',
    title: 'Rencontre Networking : Dirigeants & Startups 2026',
    description: 'Échangez avec des experts, investisseurs et développeurs',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    format: 'hybrid',
    status: 'completed',
    location: { city: 'Marseille', venue: 'Business Center' },
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600',
    category: 'BUSINESS',
    capacity: 200,
    stats: { views: 2100, registrations: 150, attendees: 120, revenue: 7500 },
    organizerName: 'Pierre Durand',
    organizerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
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

  // SWR query avec chargement instantané (0ms) depuis le cache
  const {
    data: cachedEvents,
    isLoading: loading,
    refetch: loadEvents,
    setData: setEvents
  } = useQuery<EventItem[]>(
    async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        if (!token) {
          return DEMO_EVENTS
        }

        const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          return DEMO_EVENTS
        }

        const data = await response.json()
        const rawEvents = Array.isArray(data) ? data : (data.results || [])
        
        if (rawEvents.length === 0) return DEMO_EVENTS

        return rawEvents.map((item: any) => ({
          id: String(item.id),
          title: item.title || item.name,
          description: item.description,
          startDate: item.date_debut || item.start_date,
          endDate: item.date_fin || item.end_date,
          format: item.format || 'virtual',
          status: item.status || 'draft',
          location: item.location ? { city: item.location, venue: item.venue || '' } : undefined,
          coverImage: item.cover || item.cover_image,
          category: item.categorie || item.category || 'OTHER',
          capacity: item.capacite || item.capacity || 100,
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
          isLive: item.status === 'live' || item.is_live || false,
          liveRoomName: item.live_room_name,
          liveStatus: item.live_status,
          speaker: item.speaker,
          jitsiRoom: item.jitsi_room,
          participantsCount: item.participants_count,
          maxParticipants: item.max_participants,
          reactions: item.reactions,
          isRegistered: item.is_registered
        }))
      } catch (error) {
        console.error('Error loading events:', error)
        return DEMO_EVENTS
      }
    },
    {
      cacheKey: 'pro:events:list',
      cacheTime: 5 * 60 * 1000,
      initialData: DEMO_EVENTS
    }
  )

  const events = cachedEvents || DEMO_EVENTS

  // Fonction de navigation conditionnelle
  const handleBack = () => {
    navigate('/pro')
  }
  
  // Open create modal if create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      navigate('/pro/events', { replace: true })
    }
  }, [searchParams, navigate])

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'live' | 'past' | 'mine'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const CATEGORIES = [
    { id: 'all', label: 'Toutes' },
    { id: 'TECHNOLOGY', label: '💻 Technologie' },
    { id: 'BUSINESS', label: '📈 Business & Finance' },
    { id: 'DESIGN', label: '🎨 Design & UI/UX' },
    { id: 'HEALTH', label: '🏥 Santé & Bien-être' },
    { id: 'LAW', label: '⚖️ Droit & Fiscalité' },
    { id: 'MARKETING', label: '📣 Marketing' },
    { id: 'EDUCATION', label: '🎓 Masterclass' }
  ]

  // Set active tab or open create from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'upcoming' || tabParam === 'live' || tabParam === 'past' || tabParam === 'mine') {
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

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleShareEvent = useCallback(async (event: EventItem) => {
    const shareUrl = `${window.location.origin}/pro/events/${event.id}/preview`
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Rejoignez l'événement "${event.title}" sur EXILE`,
          url: shareUrl
        })
        showToastMsg('✓ Événement partagé !')
        return
      } catch (e) {}
    }
    navigator.clipboard?.writeText(shareUrl)
    showToastMsg('🔗 Lien de l\'événement copié dans le presse-papier !')
  }, [showToastMsg])

  const handleToggleRegister = useCallback((event: EventItem) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setEvents(prev => prev.map(e => {
      if (e.id === event.id) {
        const newRegistered = !e.isRegistered
        return {
          ...e,
          isRegistered: newRegistered,
          stats: {
            ...e.stats,
            registrations: newRegistered ? e.stats.registrations + 1 : Math.max(0, e.stats.registrations - 1)
          }
        }
      }
      return e
    }))
    showToastMsg(event.isRegistered ? 'Inscription annulée' : '🎉 Inscription confirmée avec succès !')
  }, [isAuthenticated, navigate, setEvents, showToastMsg])

  const addToGoogleCalendar = useCallback((event: EventItem) => {
    const start = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const end = new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location?.venue || 'En ligne')}`
    window.open(url, '_blank')
  }, [])

  const downloadICS = useCallback((event: EventItem) => {
    const start = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const end = new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EXILE Platform//NONSGML v1.0//FR\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location?.venue || 'En ligne'}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR`
    
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMsg('📅 Fichier calendrier (.ics) téléchargé !')
  }, [showToastMsg])

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

  const isUpcoming = (date: string) => new Date(date) > new Date()
  const isPast = (date: string) => new Date(date) < new Date()

  // Live priority events
  const activeLiveEvents = events.filter(e => e.isLive)

  const filtered = events.filter(e => {
    // Catégorie
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false

    // Onglet horizontal
    if (activeTab === 'live') {
      if (!e.isLive) return false
    } else if (activeTab === 'upcoming') {
      if (!isUpcoming(e.startDate) || e.isLive) return false
    } else if (activeTab === 'past') {
      if (!isPast(e.endDate || e.startDate) || e.isLive) return false
    } else if (activeTab === 'mine') {
      if (!e.isRegistered && e.status !== 'draft') return false
    }

    // Recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.organizerName.toLowerCase().includes(q) ||
        (e.location?.city && e.location.city.toLowerCase().includes(q))
      )
    }
    return true
  }).sort((a, b) => {
    if (a.isLive && !b.isLive) return -1
    if (!a.isLive && b.isLive) return 1
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  const formatDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  // ============ RENDU ============
  return (
    <div className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden ${resolvedTheme === 'dark' ? 'bg-[#0b0e14] text-zinc-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 text-white border border-zinc-700/80 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* ── EN-TÊTE FULL-WIDTH FLUSH AU TOP (Même design que Demandes) ── */}
      <div className={`flex-shrink-0 p-3.5 border-b backdrop-blur-xl ${resolvedTheme === 'dark' ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBack}
              className={`p-2 rounded-xl transition-colors ${resolvedTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              title="Retour"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">
                Événements & Live
              </h1>
            </div>
          </div>

          <button
            onClick={() => isAuthenticated ? setShowCreateModal(true) : navigate('/login')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl shadow-md text-xs font-bold transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Créer un événement</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
          <Search size={15} className={resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, intervenant ou ville..."
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
              <X size={13} />
            </button>
          )}
        </div>

        {/* 1. STATUS TABS FILTER (YouTube Style) */}
        <div className="flex gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'Tous', count: events.length },
            { id: 'upcoming', label: 'À venir', count: events.filter(e => isUpcoming(e.startDate) && !e.isLive).length },
            { id: 'live', label: 'En direct', count: activeLiveEvents.length },
            { id: 'past', label: 'Passés', count: events.filter(e => isPast(e.endDate || e.startDate) && !e.isLive).length },
            { id: 'mine', label: 'Mes événements', count: events.filter(e => e.isRegistered || e.status === 'draft').length }
          ].map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25'
                    : resolvedTheme === 'dark'
                    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80 bg-zinc-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-100/70'
                }`}
              >
                {tab.id === 'live' && activeLiveEvents.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. CATEGORIES HORIZONTAL SCROLL CHIPS */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-[#FF6B00] border border-[#FF6B00]/50 font-bold'
                    : resolvedTheme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 bg-zinc-800/20 border border-zinc-800'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100/80 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu principal défilant */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 pb-20 md:pb-8">

        {/* ─── 3. PRIORITY SECTION: LIVES EN DIRECT MAINTENANT ─── */}
        {activeLiveEvents.length > 0 && activeTab !== 'past' && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <span>En Direct Maintenant</span>
                <span className="px-1.5 py-0.2 bg-red-600/15 text-red-500 text-[10px] rounded-md font-bold">
                  {activeLiveEvents.length} LIVE
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLiveEvents.map(liveEvt => (
                <div
                  key={`live-featured-${liveEvt.id}`}
                  className={`relative rounded-3xl border overflow-hidden p-4 flex flex-col justify-between ${
                    resolvedTheme === 'dark'
                      ? 'bg-gradient-to-br from-red-950/30 via-zinc-900/90 to-zinc-900 border-red-500/30 shadow-lg shadow-red-950/20'
                      : 'bg-gradient-to-br from-red-50 to-white border-red-200 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
                        <Radio className="w-3 h-3" />
                        EN DIRECT
                      </span>
                      <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {liveEvt.participantsCount || liveEvt.stats.attendees || 42} participants
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h3
                      onClick={() => navigate(`/pro/events/${liveEvt.id}/preview`)}
                      className="text-sm sm:text-base font-bold cursor-pointer hover:text-red-400 transition-colors line-clamp-2"
                    >
                      {liveEvt.title}
                    </h3>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'} line-clamp-2`}>
                      {liveEvt.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-red-500/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={liveEvt.organizerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={liveEvt.organizerName}
                        className="w-7 h-7 rounded-full object-cover border border-red-500/40 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{liveEvt.organizerName}</span>
                    </div>

                    <button
                      onClick={() => startLive(liveEvt)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Rejoindre le Direct</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTE EVENMAN */}
        {filtered.length === 0 ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-4 sm:p-6 md:p-12 text-center`}>
            <Calendar className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-2 sm:mb-3`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-xs sm:text-sm md:text-base`}>Aucun événement</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(event => (
              <div key={event.id} className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700' : 'bg-white border-slate-200 hover:shadow-md'} rounded-3xl border overflow-hidden transition-all flex flex-col justify-between`}>
                <div>
                  {/* KOUVRI */}
                  <div className={`relative h-40 sm:h-44 ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'} overflow-hidden w-full`}>
                    {event.coverImage ? (
                      <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 to-zinc-950' : 'from-slate-100 to-slate-300'} flex items-center justify-center`}>
                        <Calendar className={`w-10 h-10 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* BADGES */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {event.isLive && (
                        <span className="bg-red-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5" />
                          En Direct
                        </span>
                      )}
                      {!event.isLive && event.status === 'published' && isUpcoming(event.startDate) && (
                        <span className="bg-emerald-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          À venir
                        </span>
                      )}
                      {event.status === 'draft' && (
                        <span className="bg-zinc-700/90 backdrop-blur text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Brouillon
                        </span>
                      )}
                      {event.isRegistered && (
                        <span className="bg-[#FF6B00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Inscrit
                        </span>
                      )}
                    </div>

                    {/* ACTION RAPIDE: LIVE */}
                    {event.isLive && (
                      <button
                        onClick={() => navigate(`/pro/events/${event.id}/preview`)}
                        className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Rejoindre</span>
                      </button>
                    )}
                  </div>

                  {/* TITRE & DESCRIPTION */}
                  <div className="p-3.5 space-y-2">
                    <h3 className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-slate-900'} leading-snug line-clamp-2`}>
                      {event.title}
                    </h3>
                    <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'} line-clamp-2`}>
                      {event.description}
                    </p>

                    {/* META INFOS */}
                    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium pt-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF6B00]" />
                        {formatDate(event.startDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        {event.format === 'virtual' ? (
                          <><Video className="w-3 h-3 text-blue-400" /> En ligne</>
                        ) : (
                          <><MapPin className="w-3 h-3 text-emerald-400" /> {event.location?.city || 'Sur place'}</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-400" />
                        {event.stats.registrations}/{event.capacity}
                      </span>
                    </div>

                    {/* ORGANISATEUR */}
                    <div className={`flex items-center gap-2 pt-2 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {event.organizerAvatar ? <img src={event.organizerAvatar} className="w-full h-full rounded-full object-cover" /> : event.organizerName.charAt(0)}
                      </div>
                      <span className={`text-[11px] font-medium truncate ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>
                        {event.organizerName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOUTONS D'ACTIONS EN BAS DE CARTE */}
                <div className={`p-3 pt-0 flex flex-col gap-2`}>
                  {/* Bouton d'inscription / participation principale */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleRegister(event)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                        event.isRegistered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#FF6B00] hover:bg-[#e05e00] text-white shadow-[#FF6B00]/25'
                      }`}
                    >
                      {event.isRegistered ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Inscrit ✓</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3.5 h-3.5" />
                          <span>S'inscrire ({event.price === 0 ? 'Gratuit' : `${event.price}$`})</span>
                        </>
                      )}
                    </button>

                    {/* Partager */}
                    <button
                      onClick={() => handleShareEvent(event)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Partager l'événement"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Google Calendar */}
                    <button
                      onClick={() => addToGoogleCalendar(event)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Ajouter au calendrier Google"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Boutons secondaires (Stats / Supprimer si organisateur) */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      onClick={() => { setSelectedEvent(event); setShowStatsModal(true) }}
                      className={`font-semibold transition-colors flex items-center gap-1 ${
                        resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Statistiques</span>
                    </button>

                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="text-red-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
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
    // Live & Direct fields
    liveStatus: 'at_coming' as 'at_coming' | 'live' | 'ended',
    speakerName: '',
    speakerAvatar: '' as string,
    liveRoomName: '',
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
      isRegistered: false
    })
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 md:backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-950 md:bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} h-full w-full md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-3xl flex flex-col overflow-hidden border-0 md:border shadow-2xl`}>
        
        {/* Header - Simple & Clean */}
        <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-zinc-950 md:bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'} border-b px-4 py-3.5 flex items-center justify-between z-10 backdrop-blur`}>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <ArrowLeft className="w-5 h-5 md:hidden" />
              <X className="w-5 h-5 hidden md:block" />
            </button>
            <div>
              <h2 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>
                Créer un Événement
              </h2>
              <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                Webinaire, masterclass ou atelier professionnel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Aperçu
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* UPLOAD IMAGE */}
          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
              Image de couverture
            </label>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all ${
                isDragging ? 'border-[#FF6B00] bg-[#FF6B00]/10' : resolvedTheme === 'dark' ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {coverImagePreview ? (
                <div className="relative">
                  <img src={coverImagePreview} alt="Preview" className="w-full h-40 sm:h-48 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setCoverImagePreview(null); setForm({ ...form, coverImage: '' }) }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
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
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-white shadow-sm text-slate-600'} flex items-center justify-center`}>
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Ajouter une affiche ou bannière
                    </p>
                    <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                      JPEG, PNG, WebP (max 5MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
              Titre de l'événement *
            </label>
            <input
              required
              value={form.title}
              onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
              placeholder="Ex: Masterclass : Optimiser son Architecture Cloud en 2026"
              className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
            />
            {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }) }}
              placeholder="Présentez les thématiques abordées, le public cible et les points clés..."
              rows={3}
              className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors resize-none ${errors.description ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
            />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Date & Heure de début *
              </label>
              <input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={e => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: '' }) }}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.startDate ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
              />
              {errors.startDate && <p className="text-[10px] text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Date & Heure de fin *
              </label>
              <input
                type="datetime-local"
                required
                value={form.endDate}
                onChange={e => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: '' }) }}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.endDate ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
              />
              {errors.endDate && <p className="text-[10px] text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Format
              </label>
              <select
                value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value as any })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
              >
                <option value="virtual">En ligne (Live / Webinaire)</option>
                <option value="in-person">Présentiel</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
              >
                <option value="Tech">Technologie</option>
                <option value="Business">Business & Finance</option>
                <option value="Design">Design & UI/UX</option>
                <option value="Marketing">Marketing & Vente</option>
                <option value="Santé">Santé & Bien-être</option>
                <option value="Droit">Droit & Fiscalité</option>
                <option value="Education">Masterclass Pro</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Capacité max (places)
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={e => { setForm({ ...form, capacity: parseInt(e.target.value) || 1 }); setErrors({ ...errors, capacity: '' }) }}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.capacity ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
              />
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                Tarif (0 = Gratuit)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none border-zinc-800 focus:border-[#FF6B00] transition-colors`}
              />
            </div>
          </div>

          {form.format !== 'virtual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                  Ville *
                </label>
                <input
                  value={form.location.city}
                  onChange={e => { setForm({ ...form, location: { ...form.location, city: e.target.value } }); setErrors({ ...errors, city: '' }) }}
                  placeholder="Paris, Montréal, Dakar..."
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                />
                {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                  Nom du lieu
                </label>
                <input
                  value={form.location.venue}
                  onChange={e => setForm({ ...form, location: { ...form.location, venue: e.target.value } })}
                  placeholder="Centre de conférences, Salle A..."
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none border-zinc-800 focus:border-[#FF6B00] transition-colors`}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions - Clean & Fixed */}
        <div className={`p-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-950 md:bg-zinc-900' : 'border-slate-200 bg-white'} flex items-center justify-end gap-3 flex-shrink-0`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              resolvedTheme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="create-event-form"
            className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Créer l'Événement</span>
          </button>
        </div>
      </div>

      {/* MODAL PREVISUALISATION */}
      {showPreview && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border shadow-2xl p-5 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold">Aperçu de l'événement</h2>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-full hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
              <div className="aspect-video relative bg-zinc-900">
                {coverImagePreview ? (
                  <img src={coverImagePreview} alt={form.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Calendar className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm">{form.title || 'Titre de l\'événement'}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{form.description || 'Description de l\'événement...'}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                  <span>{form.format === 'virtual' ? '🎥 En ligne' : '📍 ' + (form.location.city || 'Lieu')}</span>
                  <span>👥 {form.capacity} places</span>
                  <span>💰 {form.price === 0 ? 'Gratuit' : `${form.price}$`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
