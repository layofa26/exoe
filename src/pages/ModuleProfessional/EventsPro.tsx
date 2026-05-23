import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, Users, DollarSign, Plus, Search,
  Clock, MapPin, Video, BarChart3, Trash2, CheckCircle,
  Radio, Ticket, X, ArrowLeft
} from 'lucide-react'
import TicketModal from '../../components/modals/TicketModal'
import EventStatsModal from '../../components/modals/EventStatsModal'
import { useTheme } from '../../contexts/ThemeContext'

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
  virtualLink?: string
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
}

// ============ DONE DEMO ============
const DEMO_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Masterclass: React 19 & Server Components',
    description: 'Yon sesyon imèsiv sou nouvo karakteristik React 19.',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    format: 'virtual',
    status: 'published',
    category: 'Tech',
    capacity: 500,
    stats: { views: 1240, registrations: 386, attendees: 0, revenue: 0 },
    organizerName: 'Exile Academy',
    organizerAvatar: undefined,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    price: 0,
    isLive: true,
    liveRoomName: 'exile-react-masterclass'
  },
  {
    id: 'evt-2',
    title: 'Workshop: Design System Premium',
    description: 'Aprann kreye yon design system modèn ak TailwindCSS.',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    format: 'hybrid',
    status: 'published',
    location: { city: 'Paris', venue: 'Station F' },
    category: 'Design',
    capacity: 50,
    stats: { views: 890, registrations: 42, attendees: 0, revenue: 2100 },
    organizerName: 'Design Studio Pro',
    organizerAvatar: undefined,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    price: 50,
    isLive: false
  }
]

// ============ P AJ EVENMAN ============
export default function EventsPro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resolvedTheme } = useTheme()
  
  // Open create modal if create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      // Remove the query param from URL
      navigate('/pro/events', { replace: true })
    }
  }, [searchParams, navigate])
  const [events, setEvents] = useState<EventItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'live'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showModeratorModal, setShowModeratorModal] = useState(false)

  // Sistèm Ròl ak Modérateur
  const [moderators, setModerators] = useState([
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'moderator' as const },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'moderator' as const }
  ])
  const [currentUserRole] = useState<'creator' | 'fan' | 'moderator'>('creator')

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
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('exile_events_v2')
    if (saved) {
      setEvents(JSON.parse(saved))
    } else {
      setEvents(DEMO_EVENTS)
      localStorage.setItem('exile_events_v2', JSON.stringify(DEMO_EVENTS))
    }
  }, [])

  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('exile_events_v2', JSON.stringify(events))
    }
  }, [events])

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const createEvent = useCallback((data: Omit<EventItem, 'id' | 'createdAt' | 'stats'>) => {
    const newEvent: EventItem = {
      ...data,
      id: `evt_${Date.now()}`,
      createdAt: new Date().toISOString(),
      stats: { views: 0, registrations: 0, attendees: 0, revenue: 0 }
    }
    setEvents(prev => [newEvent, ...prev])
    setShowCreateModal(false)
    showToastMsg('Événement créé avec succès')
  }, [showToastMsg])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
    showToastMsg('Événement supprimé')
  }, [showToastMsg])

  const publishEvent = useCallback((id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'published', publishedAt: new Date().toISOString() } : e))
    showToastMsg('Événement publié')
  }, [showToastMsg])

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
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* TOAST */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} backdrop-blur-md border-b z-30 px-4 py-3 md:py-4 md:mt-0`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pro')}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="h-1 flex-1 flex items-center justify-between gap-4">
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>Événements</h1>
            </div>
          {currentUserRole === 'creator' && (
            <button
              onClick={() => setShowModeratorModal(true)}
              className={`flex items-center gap-2 px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-xs md:text-sm font-medium transition-colors`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Modérateurs</span>
            </button>
          )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {!isMobile && 'Créer'}
          </button>
        </div>

        {/* STATS - mobil: horizontal scroll */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { icon: Calendar, value: events.filter(e => e.status === 'published').length, label: 'Publiés', color: resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: resolvedTheme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100' },
              { icon: Users, value: events.reduce((s, e) => s + e.stats.registrations, 0), label: 'Inscrits', color: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: resolvedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100' },
              { icon: DollarSign, value: `${events.reduce((s, e) => s + e.stats.revenue, 0)}€`, label: 'Revenus', color: resolvedTheme === 'dark' ? 'text-amber-400' : 'text-amber-600', bg: resolvedTheme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100' },
              { icon: Radio, value: events.filter(e => e.isLive).length, label: 'Live', color: resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600', bg: resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100' },
            ].map((s, i) => (
              <div key={i} className={`flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl border px-3 py-2 flex items-center gap-2.5 min-w-[130px]`}>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-tight`}>{s.value}</p>
                  <p className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS + SEARCH */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className={`w-full pl-9 pr-3 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors`}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {(['all', 'published', 'draft', 'live'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
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
        </div>
      </div>

      {/* LISTE EVENMAN */}
      <div className="w-full px-4 py-6 pt-16 md:pt-6 pb-24 md:pb-6">
        {filtered.length === 0 ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 md:p-12 text-center`}>
            <Calendar className={`w-8 h-8 md:w-12 md:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-3`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-xs md:text-sm md:text-base`}>Aucun événement</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {filtered.map(event => (
              <div key={event.id} className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl md:rounded-2xl border overflow-hidden transition-all active:scale-[0.99]`}>
                {/* KOUVRI */}
                <div className={`relative h-48 sm:h-56 md:h-64 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'} overflow-hidden w-full`}>
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Calendar className={`w-10 h-10 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${resolvedTheme === 'dark' ? 'from-black' : 'from-gray-900/80'} via-transparent to-transparent`} />

                  {/* BADGES */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {event.isLive && (
                      <span className="bg-red-600/90 backdrop-blur text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider animate-pulse">
                        <Radio className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5 md:mr-1" />
                        Live
                      </span>
                    )}
                    {!event.isLive && event.status === 'published' && isUpcoming(event.startDate) && (
                      <span className="bg-emerald-600/90 backdrop-blur text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider">
                        À venir
                      </span>
                    )}
                    {event.status === 'draft' && (
                      <span className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/90 text-zinc-300' : 'bg-gray-600/90 text-gray-200'} backdrop-blur text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider`}>
                        Brouillon
                      </span>
                    )}
                  </div>

                  {/* PRIX */}
                  {event.price > 0 ? (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-sm font-bold px-3 py-1 rounded-full">
                      {event.price}€
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-emerald-600/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Gratuit
                    </div>
                  )}

                  {/* ACTION RAPIDE: LIVE */}
                  {event.isLive && (
                    <button
                      onClick={() => navigate(`/pro/events/${event.id}/preview`)}
                      className="absolute bottom-3 right-3 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl animate-pulse"
                    >
                      <Video className="w-4 h-4" />
                      Rejoindre
                    </button>
                  )}
                </div>

                {/* TIT */}
                <div className="p-3 sm:p-4">
                  <h3 className={`text-sm sm:text-base md:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 leading-tight`}>{event.title}</h3>
                  <p className={`text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-3 line-clamp-2`}>{event.description}</p>

                  {/* INFO */}
                  <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4`}>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {event.format === 'virtual' ? (
                        <><Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" /> En ligne</>
                      ) : (
                        <><MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" /> {event.location?.city}</>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                      {event.stats.registrations}/{event.capacity}
                    </span>
                  </div>

                  {/* ORGANIZATEUR */}
                  <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {event.organizerAvatar ? <img src={event.organizerAvatar} className="w-full h-full rounded-full object-cover" /> : event.organizerName.charAt(0)}
                    </div>
                    <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{event.organizerName}</span>
                  </div>

                  {/* AKSIYON */}
                  <div className="flex flex-wrap gap-2">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => publishEvent(event.id)}
                        className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 ${resolvedTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'} border rounded-xl text-xs font-medium transition-colors`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Publier</span>
                      </button>
                    )}

                    {!event.isLive && event.status === 'published' && (
                      <button
                        onClick={() => {
                          setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLive: true, liveRoomName: `exile-${event.id}` } : e))
                          startLive({ ...event, isLive: true, liveRoomName: `exile-${event.id}` })
                        }}
                        className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 ${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400 border-red-800/40 hover:bg-red-900/50' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'} border rounded-xl text-xs font-medium transition-colors`}
                      >
                        <Radio className="w-4 h-4" />
                        <span>Live</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedEvent(event); setShowTicketModal(true) }}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-xs font-medium transition-colors`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Ticket</span>
                    </button>

                    <button
                      onClick={() => { setSelectedEvent(event); setShowStatsModal(true) }}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-xs font-medium transition-colors`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Stats</span>
                    </button>

                    <button
                      onClick={() => deleteEvent(event.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 ${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400 border-red-800/40 hover:bg-red-900/50' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'} border rounded-xl text-xs font-medium transition-colors`}
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-6 max-w-sm w-full border`}>
            <h3 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Supprimer ?</h3>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-6`}>Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-sm font-medium transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={() => deleteEvent(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
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

      {/* MODAL MODERATEUR */}
      {showModeratorModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border`}>
            <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} border-b px-4 py-4 flex items-center justify-between z-10`}>
              <h2 className={`text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gérer les modérateurs</h2>
              <button onClick={() => setShowModeratorModal(false)} className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
                <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/40' : 'bg-gray-50 border-gray-200'} rounded-xl border p-4`}>
                <h3 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>Modérateurs actuels</h3>
                {moderators.length === 0 ? (
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Aucun modérateur</p>
                ) : (
                  <div className="space-y-2">
                    {moderators.map(mod => (
                      <div key={mod.id} className={`flex items-center justify-between p-3 ${resolvedTheme === 'dark' ? 'bg-zinc-800/40' : 'bg-gray-100'} rounded-lg`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {mod.name.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mod.name}</p>
                            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>{mod.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setModerators(prev => prev.filter(m => m.id !== mod.id))}
                          className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/40' : 'bg-gray-50 border-gray-200'} rounded-xl border p-4`}>
                <h3 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>Ajouter un modérateur</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom"
                    className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                  <button
                    onClick={() => {
                      setModerators(prev => [...prev, { id: Date.now().toString(), name: 'Nouveau', email: 'nouveau@example.com', role: 'moderator' as const }])
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    coverImage: '' as string
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

    // Prix: entre 0 et 10000
    if (form.price < 0) {
      newErrors.price = 'Le prix ne peut pas être négatif'
    } else if (form.price > 10000) {
      newErrors.price = 'Le prix ne doit pas dépasser 10000€'
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
      virtualLink: form.format === 'virtual' ? 'https://meet.jit.si/' : undefined
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border`}>
        {/* Header */}
        <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} border-b px-4 py-4 flex items-center justify-between z-10`}>
          <h2 className={`text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Nouvel événement</h2>
          <button onClick={onClose} className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
            <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 pb-24 md:pb-6">
          {/* UPLOAD IMAGE */}
          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Image de couverture</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : resolvedTheme === 'dark' ? 'border-zinc-700 hover:border-zinc-600' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {coverImagePreview ? (
                <div className="relative">
                  <img src={coverImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setCoverImagePreview(null); setForm({ ...form, coverImage: '' }) }}
                    className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
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
                    <div className={`w-12 h-12 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Plus className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Cliquez ou glissez une image</p>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`}>JPEG, PNG, WebP, GIF (max 5MB)</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Titre</label>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                required
                value={form.title}
                onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
                placeholder="Nom de l'événement (min 5 caractères)"
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
            </div>
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Description</label>
            <textarea
              value={form.description}
              onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }) }}
              placeholder="Décrivez votre événement... (min 20 caractères)"
              rows={3}
              className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Début</label>
              <div className="relative">
                <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="datetime-local"
                  required
                  value={form.startDate}
                  onChange={e => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none transition-colors ${errors.startDate ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Fin</label>
              <div className="relative">
                <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="datetime-local"
                  required
                  value={form.endDate}
                  onChange={e => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none transition-colors ${errors.endDate ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Format</label>
              <select
                value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value as any })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-3 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors`}
              >
                <option value="virtual">En ligne</option>
                <option value="in-person">Présentiel</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Catégorie</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-3 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors`}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Capacité</label>
              <div className="relative">
                <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => { setForm({ ...form, capacity: parseInt(e.target.value) || 1 }); setErrors({ ...errors, capacity: '' }) }}
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${errors.capacity ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Prix (€)</label>
              <div className="relative">
                <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={e => { setForm({ ...form, price: parseInt(e.target.value) || 0 }); setErrors({ ...errors, price: '' }) }}
                  placeholder="0 = gratuit"
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${errors.price ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
          </div>

          {form.format !== 'virtual' && (
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} font-medium mb-1.5 block`}>Lieu</label>
              <div className="relative mb-2">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  value={form.location.city}
                  onChange={e => { setForm({ ...form, location: { ...form.location, city: e.target.value } }); setErrors({ ...errors, city: '' }) }}
                  placeholder="Ville"
                  className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white placeholder-zinc-600' : 'bg-white text-gray-900 placeholder-gray-400'} border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-500 focus:border-red-500' : resolvedTheme === 'dark' ? 'border-zinc-800 focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'}`}
                />
              </div>
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              <input
                value={form.location.venue}
                onChange={e => setForm({ ...form, location: { ...form.location, venue: e.target.value } })}
                placeholder="Nom du lieu"
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors`}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-3 rounded-xl font-semibold transition-colors`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} py-3 rounded-xl font-semibold transition-colors`}
            >
              Prévisualiser
            </button>
            <button
              type="submit"
              className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} py-3 rounded-xl font-semibold transition-colors`}
            >
              Créer
            </button>
          </div>
        </form>
      </div>

      {/* MODAL PREVISUALISATION */}
      {showPreview && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border`}>
            <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-200'} border-b px-4 py-4 flex items-center justify-between z-10`}>
              <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Prévisualisation</h2>
              <button onClick={() => setShowPreview(false)} className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
                <X className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="p-4">
              <div className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/50' : 'bg-gray-50 border-gray-200'} rounded-xl border overflow-hidden`}>
                <div className={`relative h-48 ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'} overflow-hidden`}>
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt={form.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Calendar className={`w-12 h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-emerald-600/80 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                    {form.price > 0 ? `${form.price}€` : 'Gratuit'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{form.title || 'Titre de l\'événement'}</h3>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-3 line-clamp-2`}>{form.description || 'Description de l\'événement...'}</p>
                  <div className={`flex flex-wrap gap-x-3 gap-y-1 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {form.startDate ? new Date(form.startDate).toLocaleDateString('fr-FR') : 'Date'}
                    </span>
                    <span className="flex items-center gap-1">
                      {form.format === 'virtual' ? (
                        <><Video className="w-4 h-4" /> En ligne</>
                      ) : (
                        <><MapPin className="w-4 h-4" /> {form.location.city || 'Lieu'}</>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {form.capacity} places
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">M</div>
                    <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Moi</span>
                  </div>
                  <div className="flex gap-2">
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'} rounded-xl text-xs font-medium`}>
                      <Ticket className="w-4 h-4" />
                      Ticket
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'} rounded-xl text-xs font-medium`}>
                      <BarChart3 className="w-4 h-4" />
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
