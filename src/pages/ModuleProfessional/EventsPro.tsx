import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar, Users, Plus, Search,
  Clock, MapPin, Video, BarChart3, Trash2, CheckCircle,
  Radio, Ticket, X, ArrowLeft, Share2, CalendarPlus, Check, Sparkles,
  Play, Download, Upload, RotateCcw, Laptop, Briefcase, Palette, HeartPulse,
  Scale, Megaphone, GraduationCap, Layers, PlayCircle, User, AlertCircle, Eye, Shield, DollarSign,
  ChevronLeft, ChevronRight, Info, Mic, MicOff, VideoOff, Settings2, Globe, Lock, MessageSquare, Bell,
  Image as ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react'
import TicketModal from '../../components/modals/TicketModal'
import EventStatsModal from '../../components/modals/EventStatsModal'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '../../hooks/useQuery'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

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
  participantsCount?: number
  maxParticipants?: number
  reactions?: { thumbs_up: number; clap: number; bulb: number; heart: number }
  isRegistered?: boolean
  ownerId?: number
  recordingUrl?: string
  replayUrl?: string
  autoStartOnSchedule?: boolean
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resolvedTheme } = useTheme()
  const { isAuthenticated, user } = useAuth()

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

        const response = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          return []
        }

        const data = await response.json()
        const rawEvents = Array.isArray(data) ? data : (data.results || [])
        
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
          organizerName: item.owner_name || item.organizer_name || 'Organisateur',
          organizerAvatar: item.owner_avatar || item.organizer_avatar,
          ownerId: item.owner_id,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          price: item.price || 0,
          isLive: item.status === 'live' || item.is_live || false,
          liveRoomName: item.live_room_name,
          recordingUrl: item.recording_url || item.replay_url,
          replayUrl: item.replay_url,
          autoStartOnSchedule: item.auto_start_on_schedule ?? true,
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
        return []
      }
    },
    {
      cacheKey: 'pro:events:list',
      cacheTime: 5 * 60 * 1000,
      initialData: []
    }
  )

  const events = cachedEvents || []

  // Fonction de navigation conditionnelle
  const handleBack = () => {
    navigate('/pro')
  }
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'live' | 'past' | 'replays' | 'mine'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedReplayEvent, setSelectedReplayEvent] = useState<EventItem | null>(null)
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dueEventReminder, setDueEventReminder] = useState<EventItem | null>(null)
  const notifiedEventsRef = useRef<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [showInstantLiveModal, setShowInstantLiveModal] = useState(false)
  const [instantLiveTitle, setInstantLiveTitle] = useState('')
  const [instantLiveCategory, setInstantLiveCategory] = useState('TECHNOLOGY')
  const [instantLiveAccessType, setInstantLiveAccessType] = useState<'free' | 'paid'>('free')
  const [instantLivePrice, setInstantLivePrice] = useState('5')
  const [instantLiveShowInDirect, setInstantLiveShowInDirect] = useState(true)
  const [instantLiveShowAdvanced, setInstantLiveShowAdvanced] = useState(false)
  const [instantLiveDescription, setInstantLiveDescription] = useState('')
  const [instantLiveCapacity, setInstantLiveCapacity] = useState('500')
  const [instantLiveAllowComments, setInstantLiveAllowComments] = useState(true)
  const [instantLiveSendNotifications, setInstantLiveSendNotifications] = useState(true)
  const [instantLiveCoverFile, setInstantLiveCoverFile] = useState<File | null>(null)
  const [instantLiveCoverPreview, setInstantLiveCoverPreview] = useState<string | null>(null)
  const [isLaunchingLive, setIsLaunchingLive] = useState(false)

  // Écran Pré-Live (Test Caméra & Micro avant d'entrer)
  const [preLiveEvent, setPreLiveEvent] = useState<{ id: string; title: string; category: string; roomName: string } | null>(null)
  const [preLiveCamActive, setPreLiveCamActive] = useState(true)
  const [preLiveMicActive, setPreLiveMicActive] = useState(true)
  const preLiveVideoRef = useRef<HTMLVideoElement | null>(null)
  const preLiveStreamRef = useRef<MediaStream | null>(null)

  // Open create modal if create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      navigate('/pro/events', { replace: true })
    }
  }, [searchParams, navigate])

  const CATEGORIES = [
    { id: 'all', label: t('common.all', 'Toutes les catégories'), icon: Layers },
    { id: 'TECHNOLOGY', label: t('pro.events.catTech', 'Technologie'), icon: Laptop },
    { id: 'BUSINESS', label: t('pro.events.catBusiness', 'Business & Finance'), icon: Briefcase },
    { id: 'DESIGN', label: t('pro.events.catDesign', 'Design & UI/UX'), icon: Palette },
    { id: 'HEALTH', label: t('pro.events.catHealth', 'Santé & Bien-être'), icon: HeartPulse },
    { id: 'LAW', label: t('pro.events.catLaw', 'Droit & Fiscalité'), icon: Scale },
    { id: 'MARKETING', label: t('pro.events.catMarketing', 'Marketing'), icon: Megaphone },
    { id: 'EDUCATION', label: t('pro.events.catEducation', 'Masterclass Pro'), icon: GraduationCap }
  ]

  // Set active tab or open create from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'upcoming' || tabParam === 'live' || tabParam === 'past' || tabParam === 'replays' || tabParam === 'mine') {
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
        showToastMsg('Événement partagé !')
        return
      } catch (e) {}
    }
    navigator.clipboard?.writeText(shareUrl)
    showToastMsg('Lien copié dans le presse-papier !')
  }, [showToastMsg])

  const handleToggleRegister = useCallback(async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(event.id).replace('exile-', '').replace('evt_', '')

    const newRegistered = !event.isRegistered
    setEvents(prev => prev.map(e => {
      if (e.id === event.id) {
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
    showToastMsg(newRegistered ? 'Inscription confirmée avec succès !' : 'Inscription annulée')

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/register/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (res.ok) {
          const data = await res.json()
          setEvents(prev => prev.map(e => e.id === event.id ? {
            ...e,
            isRegistered: data.is_registered,
            stats: {
              ...e.stats,
              registrations: data.registrations_count
            }
          } : e))
        }
      } catch (err) {
        console.warn('Erreur API inscription:', err)
      }
    }
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
    showToastMsg('Fichier calendrier (.ics) téléchargé !')
  }, [showToastMsg])

  // Helper pour vérifier et demander les permissions Caméra & Micro une seule fois
  const ensureMediaPermissions = useCallback(async (): Promise<boolean> => {
    const granted = localStorage.getItem('exile_media_permissions_granted')
    if (granted === 'true') {
      return true
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return true
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach(t => t.stop())
      localStorage.setItem('exile_media_permissions_granted', 'true')
      return true
    } catch (err: any) {
      console.warn('Media permissions warning:', err)
      // Si l'utilisateur n'a pas de caméra ou refuse, on le laisse continuer avec avertissement
      showToastMsg("Accès caméra/micro non accordé ou indisponible. Vous pourrez toujours écouter le live.")
      return true
    }
  }, [showToastMsg])

  // Défilement horizontal des catégories
  const scrollCategories = useCallback((direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }, [])

  // Helper pour vérifier si l'utilisateur actuel est le créateur / propriétaire de l'événement
  const isEventOwner = useCallback((event: EventItem) => {
    if (!isAuthenticated || !user) return false
    if (event.ownerId !== undefined && event.ownerId !== null && String(event.ownerId) === String(user.id)) {
      return true
    }
    if (event.organizerName && (event.organizerName === user.username || event.organizerName === user.fullName || event.organizerName === 'Moi')) {
      return true
    }
    return false
  }, [isAuthenticated, user])

  // Notification de rappel quand l'heure arrive + Polling léger pour détecter les lives en temps réel
  useEffect(() => {
    const checkScheduleAndLive = async () => {
      const now = Date.now()
      events.forEach(e => {
        const start = new Date(e.startDate).getTime()
        const end = new Date(e.endDate).getTime()
        const isTimeDue = now >= start && now <= end
        if (isTimeDue && !e.isLive && e.status !== 'completed' && e.status !== 'termine' && e.status !== 'cancelled') {
          if (isEventOwner(e) && !notifiedEventsRef.current.has(e.id)) {
            notifiedEventsRef.current.add(e.id)
            setDueEventReminder(e)
            showToastMsg(`L'heure de votre événement "${e.title}" est arrivée. Vous pouvez lancer le direct dès que vous êtes prêt.`)
          }
        }
      })

      // Polling léger en tâche de fond pour mettre à jour les statuts en direct sans recharger toute la page
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/?status=live`, { headers })
        if (res.ok) {
          const liveData = await res.json()
          const liveList = Array.isArray(liveData) ? liveData : (liveData.results || [])
          const liveIds = new Set(liveList.map((item: any) => String(item.id)))

          setEvents(prev => prev.map(evt => {
            const isLiveNow = liveIds.has(String(evt.id))
            if (evt.isLive !== isLiveNow) {
              return { ...evt, isLive: isLiveNow, status: isLiveNow ? 'live' : evt.status }
            }
            return evt
          }))
        }
      } catch {}
    }

    checkScheduleAndLive()
    const interval = setInterval(checkScheduleAndLive, 12000)
    return () => clearInterval(interval)
  }, [events, isEventOwner, showToastMsg, setEvents])

  const createEvent = useCallback(async (data: any) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)

    try {
      if (token) {
        const formData = new FormData()
        formData.append('title', data.title)
        formData.append('name', data.title)
        formData.append('description', data.description || '')
        formData.append('date_debut', start.toISOString())
        formData.append('date_fin', end.toISOString())

        let fmt = 'online'
        if (data.format === 'in-person') fmt = 'presentiel'
        else if (data.format === 'hybrid') fmt = 'hybrid'
        formData.append('format', fmt)

        const categoryMap: { [key: string]: string } = {
          'Tech': 'tech',
          'TECHNOLOGY': 'tech',
          'Business': 'business',
          'BUSINESS': 'business',
          'Design': 'design',
          'DESIGN': 'design',
          'Marketing': 'marketing',
          'MARKETING': 'marketing',
          'Santé': 'health',
          'HEALTH': 'health',
          'Droit': 'law',
          'LAW': 'law',
          'Education': 'education',
          'EDUCATION': 'education',
          'Autre': 'autre'
        }
        formData.append('categorie', categoryMap[data.category] || 'autre')
        formData.append('capacite', String(data.capacity || 100))
        formData.append('status', 'published')
        formData.append('is_live', 'false')
        formData.append('auto_start_on_schedule', data.autoStartOnSchedule !== false ? 'true' : 'false')

        if (data.coverFile) {
          formData.append('cover', data.coverFile)
        }
        if (data.location?.city) {
          formData.append('location', data.location.city)
        }

        const res = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (res.ok) {
          const item = await res.json()
          const newEventItem: EventItem = {
            id: String(item.id),
            title: item.title || item.name,
            description: item.description,
            startDate: item.date_debut || item.start_date,
            endDate: item.date_fin || item.end_date,
            format: item.format || 'virtual',
            status: item.status || 'published',
            location: item.location ? { city: item.location, venue: item.venue || '' } : undefined,
            coverImage: item.cover || item.cover_image,
            category: item.categorie || item.category || 'OTHER',
            capacity: item.capacite || item.capacity || 100,
            stats: { views: 0, registrations: 0, attendees: 0, revenue: 0 },
            organizerName: item.owner_name || user?.fullName || user?.username || 'Moi',
            organizerAvatar: item.owner_avatar || user?.avatar,
            ownerId: item.owner_id || (user?.id ? Number(user.id) : undefined),
            createdAt: item.created_at || new Date().toISOString(),
            price: item.price || 0,
            isLive: false,
            liveRoomName: item.live_room_name,
            recordingUrl: item.recording_url || item.replay_url,
            replayUrl: item.replay_url,
            autoStartOnSchedule: item.auto_start_on_schedule ?? true,
            isRegistered: false
          }
          setEvents(prev => [newEventItem, ...prev])
          setShowCreateModal(false)
          showToastMsg('Événement créé et enregistré avec succès !')
          return
        }
      }

      // Fallback local
      const localEvent: EventItem = {
        ...data,
        id: `evt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        stats: { views: 0, registrations: 0, attendees: 0, revenue: 0 },
        organizerName: user?.fullName || user?.username || 'Moi',
        organizerAvatar: user?.avatar,
        ownerId: user?.id ? Number(user.id) : undefined,
        isLive: false,
        autoStartOnSchedule: data.autoStartOnSchedule !== false
      }
      setEvents(prev => [localEvent, ...prev])
      setShowCreateModal(false)
      showToastMsg('Événement créé avec succès')
    } catch (err) {
      console.error('Erreur création événement:', err)
      setShowCreateModal(false)
      showToastMsg('Événement créé')
    }
  }, [isAuthenticated, navigate, user, setEvents, showToastMsg])

  const restartLive = useCallback(async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!isEventOwner(event)) {
      showToastMsg("Seul l'organisateur peut relancer ce direct.")
      return
    }

    await ensureMediaPermissions()

    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(event.id).replace('exile-', '').replace('evt_', '')
    const roomName = event.liveRoomName || `exile-${event.id}`

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/restart_live/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        showToastMsg('Direct relancé avec succès')
      } catch (err) {
        console.warn('Error restarting live:', err)
      }
    }

    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLive: true, status: 'published', liveRoomName: roomName } : e))
    navigate(`/pro/events/${event.id}/live?room=${roomName}`)
  }, [isAuthenticated, isEventOwner, ensureMediaPermissions, navigate, showToastMsg, setEvents])

  const handleUploadRecording = useCallback(async (eventId: string, file?: File, replayUrl?: string) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
    try {
      if (token && cleanId && !isNaN(Number(cleanId))) {
        const formData = new FormData()
        if (file) formData.append('recording', file)
        if (replayUrl) formData.append('replay_url', replayUrl)
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/recording/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })
      }
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, replayUrl: replayUrl || (file ? URL.createObjectURL(file) : undefined), hasRecording: true } : e))
      showToastMsg('Enregistrement sauvegardé avec succès')
    } catch (err) {
      console.warn('Error uploading recording:', err)
      showToastMsg("Erreur lors de la sauvegarde de l'enregistrement")
    }
  }, [showToastMsg, setEvents])

  const startLive = useCallback(async (event: EventItem) => {
    // Si l'événement n'est pas encore en direct, SEUL l'organisateur peut le démarrer
    const isOwner = isEventOwner(event)
    if (!event.isLive && !isOwner) {
      showToastMsg("Ce direct n'a pas encore été démarré par l'organisateur.")
      return
    }

    // Demander/vérifier les permissions média si organisateur
    if (isOwner) {
      await ensureMediaPermissions()
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(event.id).replace('exile-', '').replace('evt_', '')
    const roomName = event.liveRoomName || `exile-${event.id}`

    if (token && cleanId && !isNaN(Number(cleanId)) && isOwner) {
      try {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/start_live/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      } catch {}
    }

    if (isOwner) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLive: true, liveRoomName: roomName } : e))
    }
    navigate(`/pro/events/${event.id}/live?room=${roomName}`)
  }, [isEventOwner, ensureMediaPermissions, navigate, showToastMsg, setEvents])

  const deleteEvent = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const evt = events.find(e => e.id === id)
    if (evt && !isEventOwner(evt)) {
      showToastMsg("Seul l'organisateur peut supprimer cet événement.")
      return
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(id).replace('exile-', '').replace('evt_', '')

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!res.ok && res.status !== 204) {
          showToastMsg("Erreur lors de la suppression sur le serveur.")
          return
        }
      } catch (err) {
        console.warn('Erreur suppression événement:', err)
      }
    }

    setEvents(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
    showToastMsg('Événement supprimé avec succès')
  }, [events, isEventOwner, showToastMsg, isAuthenticated, navigate, setEvents])

  const publishEvent = useCallback((id: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'published', publishedAt: new Date().toISOString() } : e))
    showToastMsg('Événement publié')
  }, [showToastMsg, isAuthenticated, navigate])

  // Fermer et nettoyer le flux pré-live
  const closePreLive = useCallback(() => {
    if (preLiveStreamRef.current) {
      preLiveStreamRef.current.getTracks().forEach(track => track.stop())
      preLiveStreamRef.current = null
    }
    setPreLiveEvent(null)
  }, [])

  // Démarrer la caméra/micro pour le pré-live
  const startPreLiveMedia = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        preLiveStreamRef.current = stream
        if (preLiveVideoRef.current) {
          preLiveVideoRef.current.srcObject = stream
        }
      }
    } catch (err) {
      console.warn('Pre-live media access error:', err)
    }
  }, [])

  // Toggle Camera in Pre-Live
  const togglePreLiveCam = useCallback(() => {
    if (preLiveStreamRef.current) {
      const videoTrack = preLiveStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setPreLiveCamActive(videoTrack.enabled)
      }
    } else {
      setPreLiveCamActive(prev => !prev)
    }
  }, [])

  // Toggle Mic in Pre-Live
  const togglePreLiveMic = useCallback(() => {
    if (preLiveStreamRef.current) {
      const audioTrack = preLiveStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setPreLiveMicActive(audioTrack.enabled)
      }
    } else {
      setPreLiveMicActive(prev => !prev)
    }
  }, [])

  // Entrer définitivement dans le salon Live
  const handleEnterLiveRoom = useCallback(() => {
    if (!preLiveEvent) return
    const { id, roomName } = preLiveEvent
    // Arrêter le preview local pour libérer la caméra pour Jitsi
    if (preLiveStreamRef.current) {
      preLiveStreamRef.current.getTracks().forEach(track => track.stop())
      preLiveStreamRef.current = null
    }
    setPreLiveEvent(null)
    navigate(`/pro/events/${id}/live?room=${roomName}`)
  }, [preLiveEvent, navigate])

  const handleLaunchInstantLive = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const title = instantLiveTitle.trim() || `Session Live de @${user?.username || 'mon_compte'}`
    await ensureMediaPermissions()
    setIsLaunchingLive(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const now = new Date()
      const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      let createdId = `evt_${Date.now()}`
      const numCapacity = parseInt(instantLiveCapacity) || 500
      const parsedPrice = instantLiveAccessType === 'paid' ? Math.max(1, parseFloat(instantLivePrice) || 5) : 0
      const desc = instantLiveDescription.trim() || 'Diffusion en direct interactive sur EXILE.'

      if (token) {
        const formData = new FormData()
        formData.append('title', title)
        formData.append('name', title)
        formData.append('description', desc)
        formData.append('format', 'online')
        formData.append('categorie', instantLiveCategory.toLowerCase())
        formData.append('capacite', String(numCapacity))
        formData.append('status', 'live')
        formData.append('is_live', 'true')
        formData.append('price', String(parsedPrice))
        formData.append('date_debut', now.toISOString())
        formData.append('date_fin', endDate.toISOString())
        if (instantLiveCoverFile) {
          formData.append('cover', instantLiveCoverFile)
        }

        const res = await fetch(`${API_BASE_URL}/evenement/evenements/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        if (res.ok) {
          const newEvt = await res.json()
          if (newEvt.id) createdId = String(newEvt.id)
        }
      }

      const roomName = `exile-${createdId}`
      
      // Ajouter immédiatement à la liste d'événements pour feedback instantané
      const newLiveItem: EventItem = {
        id: createdId,
        title,
        description: desc,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        format: 'virtual',
        status: 'published',
        category: instantLiveCategory,
        capacity: numCapacity,
        stats: { views: 1, registrations: 1, attendees: 1, revenue: 0 },
        organizerName: user?.fullName || user?.username || 'Moi',
        organizerAvatar: user?.avatar,
        ownerId: user?.id ? Number(user.id) : undefined,
        createdAt: now.toISOString(),
        publishedAt: now.toISOString(),
        price: parsedPrice,
        isLive: true,
        liveRoomName: roomName,
        isRegistered: true
      }
      setEvents(prev => [newLiveItem, ...prev.filter(e => e.id !== createdId)])

      setShowInstantLiveModal(false)
      // Ouvrir l'écran Pré-Live pour tester caméra et micro
      setPreLiveEvent({
        id: createdId,
        title,
        category: instantLiveCategory,
        roomName
      })
      setTimeout(() => {
        startPreLiveMedia()
      }, 200)
    } catch {
      const fallbackId = `evt_${Date.now()}`
      setShowInstantLiveModal(false)
      setPreLiveEvent({
        id: fallbackId,
        title,
        category: instantLiveCategory,
        roomName: `exile-${fallbackId}`
      })
      setTimeout(() => {
        startPreLiveMedia()
      }, 200)
    } finally {
      setIsLaunchingLive(false)
    }
  }, [
    isAuthenticated,
    instantLiveTitle,
    instantLiveCategory,
    instantLiveAccessType,
    instantLivePrice,
    instantLiveDescription,
    instantLiveCapacity,
    instantLiveCoverFile,
    user,
    navigate,
    ensureMediaPermissions,
    setEvents,
    startPreLiveMedia
  ])

  const isUpcoming = (date: string) => new Date(date) > new Date()
  const isPast = (date: string) => new Date(date) < new Date()

  // Live priority events
  const activeLiveEvents = events.filter(e => e.isLive)

  const filtered = events.filter(e => {
        // Catégorie
    if (selectedCategory !== 'all') {
      const cat = (e.category || '').toLowerCase()
      const sel = selectedCategory.toLowerCase()
      if (sel === 'technology' && !cat.includes('tech')) return false
      else if (sel === 'business' && !cat.includes('bus') && !cat.includes('fin')) return false
      else if (sel === 'design' && !cat.includes('des')) return false
      else if (sel === 'health' && !cat.includes('sant') && !cat.includes('heal')) return false
      else if (sel === 'law' && !cat.includes('droit') && !cat.includes('law')) return false
      else if (sel === 'marketing' && !cat.includes('market')) return false
      else if (sel === 'education' && !cat.includes('educ') && !cat.includes('master')) return false
      else if (sel !== 'technology' && sel !== 'business' && sel !== 'design' && sel !== 'health' && sel !== 'law' && sel !== 'marketing' && sel !== 'education') {
        if (!cat.includes(sel)) return false
      }
    }

    // Onglet horizontal
    if (activeTab === 'live') {
      if (!e.isLive) return false
    } else if (activeTab === 'upcoming') {
      if (!isUpcoming(e.startDate) || e.isLive) return false
    } else if (activeTab === 'past') {
      if ((!isPast(e.endDate || e.startDate) && e.status !== 'completed' && e.status !== 'termine') || e.isLive) return false
    } else if (activeTab === 'replays') {
      if (!e.recordingUrl && !e.replayUrl) return false
    } else if (activeTab === 'mine') {
      if (!isEventOwner(e) && !e.isRegistered && e.status !== 'draft') return false
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

  const formatDate = (s: string) => new Date(s).toLocaleDateString(i18n.language || 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

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
              title={t('common.back', 'Retour')}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">
                {t('pro.events.title', 'Événements & Live')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Bouton 1 : Lancer un Live (Direct 1-clic) */}
            <button
              onClick={() => isAuthenticated ? setShowInstantLiveModal(true) : navigate('/login')}
              className="group relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl shadow-md shadow-red-600/30 text-xs font-bold transition-all active:scale-95 flex-shrink-0 border border-red-400/30"
              title="Démarrer un direct vidéo immédiatement en 1 clic"
            >
              <div className="relative flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
              <div className="text-left leading-none">
                <span className="block font-bold">{t('pro.events.startLive', 'Lancer un Live')}</span>
                <span className="text-[9px] font-medium opacity-80 hidden sm:block">1-Clic direct</span>
              </div>
            </button>

            {/* Bouton 2 : Créer un événement (Programmer) */}
            <button
              onClick={() => isAuthenticated ? setShowCreateModal(true) : navigate('/login')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-2xl shadow-md shadow-orange-500/20 text-xs font-bold transition-all active:scale-95 flex-shrink-0 border border-orange-400/30"
              title="Programmer un événement ou un Live futur"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <div className="text-left leading-none">
                <span className="block font-bold">{t('pro.events.createEvent', 'Créer un événement')}</span>
                <span className="text-[9px] font-medium opacity-80 hidden sm:block">Programmer</span>
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${resolvedTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
          <Search size={15} className={resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('pro.events.searchPlaceholder', 'Rechercher par titre, intervenant ou ville...')}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
              <X size={13} />
            </button>
          )}
        </div>

                {/* 1. STATUS TABS FILTER */}
        <div className="flex gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: t('common.all', 'Tous'), icon: Layers, count: events.length },
            { id: 'live', label: t('pro.events.live', 'En direct'), icon: Radio, count: activeLiveEvents.length },
            { id: 'upcoming', label: t('pro.events.upcoming', 'À venir'), icon: Calendar, count: events.filter(e => isUpcoming(e.startDate) && !e.isLive).length },
            { id: 'past', label: t('pro.events.past', 'Passés'), icon: CheckCircle, count: events.filter(e => (isPast(e.endDate || e.startDate) || e.status === 'completed' || e.status === 'termine') && !e.isLive).length },
            { id: 'replays', label: t('pro.events.replays', 'Rediffusions'), icon: PlayCircle, count: events.filter(e => Boolean(e.recordingUrl || e.replayUrl)).length },
            { id: 'mine', label: t('pro.events.myEvents', 'Mes événements'), icon: User, count: events.filter(e => isEventOwner(e) || e.isRegistered).length }
          ].map(tab => {
            const active = activeTab === tab.id
            const TabIcon = tab.icon
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
                <TabIcon className={`w-3.5 h-3.5 ${tab.id === 'live' && activeLiveEvents.length > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. CATEGORIES HORIZONTAL SCROLL CHIPS AVEC BOUTONS FLECHES */}
        <div className="relative flex items-center pt-2 pb-0.5 group">
          <button
            onClick={() => scrollCategories('left')}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-full border shadow-sm flex-shrink-0 mr-1.5 transition-all z-10 ${
              resolvedTheme === 'dark' ? 'bg-zinc-850 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex-1 flex gap-1.5 overflow-x-auto scroll-smooth py-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id
              const CatIcon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-zinc-800 text-[#FF6B00] border border-[#FF6B00]/50 font-bold shadow-sm'
                      : resolvedTheme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 bg-zinc-800/20 border border-zinc-800'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100/80 border border-slate-200'
                  }`}
                >
                  <CatIcon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-full border shadow-sm flex-shrink-0 ml-1.5 transition-all z-10 ${
              resolvedTheme === 'dark' ? 'bg-zinc-850 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ALERTE NOTIFICATION : L'HEURE DU DIRECT EST ARRIVÉE ── */}
      {dueEventReminder && (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-3">
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg transition-all ${
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/40 text-white'
              : 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-300 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                  "L'heure de votre événement est arrivée !"
                </span>
                <p className="text-xs font-medium line-clamp-1">
                  {"L'événement « "}<strong className="font-bold">{dueEventReminder.title}</strong>{" » est prêt. Vous pouvez lancer le direct dès que vous êtes prêt."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                onClick={() => {
                  const evt = dueEventReminder
                  setDueEventReminder(null)
                  startLive(evt)
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Démarrer le Direct</span>
              </button>

              <button
                onClick={() => setDueEventReminder(null)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                  resolvedTheme === 'dark' ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
                title="Fermer ce rappel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal défilant */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 pb-20 md:pb-8">

        {/* ─── 3. PRIORITY SECTION: LIVES EN DIRECT MAINTENANT ─── */}
        {activeLiveEvents.length > 0 && activeTab !== 'past' && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <span>{t('pro.events.liveNow', 'En Direct Maintenant')}</span>
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
                        {t('pro.events.live', 'EN DIRECT')}
                      </span>
                      <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {liveEvt.participantsCount || liveEvt.stats.attendees || 1} {t('pro.events.participants', 'participants')}
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
                      <span>{t('pro.events.joinLive', 'Rejoindre le Direct')}</span>
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
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-xs sm:text-sm md:text-base`}>{t('pro.events.noEvents', 'Aucun événement')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(event => {
              const isOwner = isEventOwner(event)
              const isFinished = isPast(event.endDate || event.startDate) || event.status === 'completed' || event.status === 'termine'
              const isDueNow = !event.isLive && new Date(event.startDate).getTime() <= Date.now() && new Date(event.endDate).getTime() >= Date.now() && !isFinished

              return (
              <div key={event.id} className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700' : 'bg-white border-slate-200 hover:shadow-md'} rounded-3xl border overflow-hidden transition-all flex flex-col justify-between`}>
                <div>
                    {/* KOUVRI */}
                    <div 
                      onClick={() => { setSelectedDetailEvent(event); setShowDetailModal(true) }}
                      className={`relative h-40 sm:h-44 ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'} overflow-hidden w-full cursor-pointer`}
                    >
                      {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center select-none ${
                          (event.category || '').toLowerCase().includes('tech') 
                            ? 'bg-gradient-to-br from-indigo-900/60 via-blue-900/40 to-zinc-950 text-indigo-200'
                            : (event.category || '').toLowerCase().includes('bus')
                            ? 'bg-gradient-to-br from-amber-900/60 via-orange-900/40 to-zinc-950 text-amber-200'
                            : (event.category || '').toLowerCase().includes('des')
                            ? 'bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-zinc-950 text-purple-200'
                            : (event.category || '').toLowerCase().includes('sant') || (event.category || '').toLowerCase().includes('heal')
                            ? 'bg-gradient-to-br from-emerald-900/60 via-teal-900/40 to-zinc-950 text-emerald-200'
                            : 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-zinc-300'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6 opacity-80" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {event.category || 'EXILE LIVE'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* BADGES */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {event.isLive && (
                        <span className="bg-red-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5" />
                          {t('pro.events.live', 'En Direct')}
                        </span>
                      )}
                      {!event.isLive && new Date(event.startDate).getTime() <= Date.now() && new Date(event.endDate).getTime() >= Date.now() && event.status !== 'completed' && event.status !== 'termine' && (
                        <span className="bg-amber-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Clock className="w-2.5 h-2.5" />
                          {"L'heure est arrivée"}
                        </span>
                      )}
                      {!event.isLive && event.status === 'published' && isUpcoming(event.startDate) && (
                        <span className="bg-emerald-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t('pro.events.upcoming', 'À venir')}
                        </span>
                      )}
                      {event.status === 'draft' && (
                        <span className="bg-zinc-700/90 backdrop-blur text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t('pro.events.draft', 'Brouillon')}
                        </span>
                      )}
                      {event.isRegistered && (
                        <span className="bg-[#FF6B00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          {t('pro.events.registered', 'Inscrit')}
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
                        <span>{t('pro.events.join', 'Rejoindre')}</span>
                      </button>
                    )}
                  </div>

                  {/* TITRE & DESCRIPTION */}
                  <div 
                    onClick={() => { setSelectedDetailEvent(event); setShowDetailModal(true) }}
                    className="p-3.5 space-y-2 cursor-pointer"
                  >
                    <h3 className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100 hover:text-[#FF6B00]' : 'text-slate-900 hover:text-[#FF6B00]'} leading-snug line-clamp-2 transition-colors`}>
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
                          <><Video className="w-3 h-3 text-blue-400" /> {t('pro.events.onlineEvent', 'En ligne')}</>
                        ) : (
                          <><MapPin className="w-3 h-3 text-emerald-400" /> {event.location?.city || t('pro.events.onSite', 'Sur place')}</>
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
                <div className="p-3 pt-0 flex flex-col gap-2">
                  {(() => {
                    const isOwner = isEventOwner(event)
                    const isFinished = isPast(event.endDate || event.startDate) || event.status === 'completed' || event.status === 'termine'
                    const isDueNow = !event.isLive && new Date(event.startDate).getTime() <= Date.now() && new Date(event.endDate).getTime() >= Date.now() && !isFinished

                    if (event.isLive) {
                      return (
                        <button
                          onClick={() => startLive(event)}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/30 active:scale-95 bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>{isOwner ? "Gérer mon Direct en cours" : "Rejoindre le Direct"}</span>
                        </button>
                      )
                    }

                    if (isFinished) {
                      if (isOwner) {
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => restartLive(event)}
                              className="py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                              title="Relancer ce même direct en tant qu'organisateur"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Relancer</span>
                            </button>
                            <button
                              onClick={() => { setSelectedReplayEvent(event); setShowReplayModal(true) }}
                              className="py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
                              title="Visionner ou gérer la rediffusion"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Rediffusion</span>
                            </button>
                          </div>
                        )
                      } else {
                        return (event.recordingUrl || event.replayUrl) ? (
                          <button
                            onClick={() => { setSelectedReplayEvent(event); setShowReplayModal(true) }}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Visionner la Rediffusion</span>
                          </button>
                        ) : (
                          <div className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border ${
                            resolvedTheme === 'dark' ? 'bg-zinc-800/40 text-zinc-400 border-zinc-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Session Terminée</span>
                          </div>
                        )
                      }
                    }

                    // Événement à venir
                    if (isOwner) {
                      return (
                        <button
                          onClick={() => startLive(event)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-500/30"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Démarrer le Direct</span>
                        </button>
                      )
                    } else {
                      return (
                        <div className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isDueNow ? "En attente du lancement par l'organisateur" : "Direct programmé"}</span>
                        </div>
                      )
                    }
                  })()}

                  {/* Boutons d'actions principaux et inscription */}
                  {!isFinished ? (
                    <div className="flex items-center gap-1.5">
                      {!isOwner ? (
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
                              <span>{t('pro.events.registered', 'Inscrit')} ✓</span>
                            </>
                          ) : (
                            <>
                              <Ticket className="w-3.5 h-3.5" />
                              <span>{t('pro.events.register', "S'inscrire")} ({event.price === 0 ? t('pro.events.free', 'Gratuit') : `${event.price}$`})</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                          resolvedTheme === 'dark' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t('pro.events.organizer', 'Organisateur')}</span>
                        </div>
                      )}

                      {/* Partager */}
                      <button
                        onClick={() => handleShareEvent(event)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                        }`}
                        title={t('common.share', "Partager l'événement")}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Google Calendar */}
                      <button
                        onClick={() => addToGoogleCalendar(event)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                        }`}
                        title={t('pro.events.addToGoogleCalendar', 'Ajouter au calendrier Google')}
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareEvent(event)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t('common.share', 'Partager')}</span>
                      </button>
                      <button
                        onClick={() => { setSelectedDetailEvent(event); setShowDetailModal(true) }}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Détails</span>
                      </button>
                    </div>
                  )}

                  {/* Boutons secondaires (Billetterie / Stats / Supprimer si organisateur) */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedEvent(event); setShowStatsModal(true) }}
                        className={`font-semibold transition-colors flex items-center gap-1 ${
                          resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span>{t('pro.events.stats', 'Statistiques')}</span>
                      </button>

                      {isEventOwner(event) && (
                        <button
                          onClick={() => { setSelectedEvent(event); setShowTicketModal(true) }}
                          className={`font-semibold transition-colors flex items-center gap-1 ${
                            resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
                          }`}
                        >
                          <Ticket className="w-3 h-3" />
                          <span>Billetterie</span>
                        </button>
                      )}
                    </div>

                    {isEventOwner(event) && (
                      <button
                        onClick={() => setDeleteConfirm(event.id)}
                        className="text-red-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('common.delete', 'Supprimer')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* COMPTEUR EN BAS DE PAGE (Design propre) */}
        {filtered.length > 0 && (
          <div className="pt-8 pb-4 text-center">
            <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
              Affichage de <span className="font-bold text-[#FF6B00]">{filtered.length}</span> événement{filtered.length > 1 ? 's' : ''}
            </p>
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

      {/* MODAL: REDIFFUSION / ENREGISTREMENT */}
      {showReplayModal && selectedReplayEvent && (
        <ReplayModal
          isOpen={showReplayModal}
          onClose={() => { setShowReplayModal(false); setSelectedReplayEvent(null) }}
          event={selectedReplayEvent}
          onRestartLive={restartLive}
          onUploadRecording={handleUploadRecording}
        />
      )}

      {/* MODAL: DELETE */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 max-w-sm w-full border`}>
            <h3 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{t('pro.events.deleteModalTitle', 'Supprimer ?')}</h3>
            <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4 sm:mb-6`}>{t('pro.events.deleteModalMsg', 'Cette action est irréversible.')}</p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-medium transition-colors`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                onClick={() => deleteEvent(deleteConfirm)}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t('common.confirm', 'Confirmer')}
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

      {/* MODAL: DÉTAILS RAPIDES DE L'ÉVÉNEMENT */}
      {showDetailModal && selectedDetailEvent && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl flex flex-col max-h-[90vh] ${
            resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header / Cover */}
            <div className="relative h-44 sm:h-52 bg-zinc-950 overflow-hidden flex-shrink-0">
              {selectedDetailEvent.coverImage ? (
                <img src={selectedDetailEvent.coverImage} alt={selectedDetailEvent.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 via-zinc-900 to-black flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                onClick={() => { setShowDetailModal(false); setSelectedDetailEvent(null) }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedDetailEvent.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug line-clamp-2">
                  {selectedDetailEvent.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className={resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}>
                {selectedDetailEvent.description || "Aucune description fournie pour cet événement."}
              </p>

              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B00]" />
                  <span><strong>Date :</strong> {formatDate(selectedDetailEvent.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span><strong>Format :</strong> {selectedDetailEvent.format === 'virtual' ? 'En ligne (Salon Live)' : (selectedDetailEvent.location?.city || 'Sur place')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span><strong>Participants inscrits :</strong> {selectedDetailEvent.stats.registrations} / {selectedDetailEvent.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span><strong>Tarif :</strong> {selectedDetailEvent.price === 0 ? 'Gratuit' : `${selectedDetailEvent.price}$`}</span>
                </div>
              </div>

              {/* Organisateur */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-bold">
                  {selectedDetailEvent.organizerAvatar ? <img src={selectedDetailEvent.organizerAvatar} className="w-full h-full rounded-full object-cover" /> : selectedDetailEvent.organizerName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-xs">{selectedDetailEvent.organizerName}</p>
                  <p className="text-[10px] text-zinc-400">Organisateur certifié</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-3.5 border-t flex items-center justify-between gap-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                onClick={() => {
                  const evt = selectedDetailEvent
                  setShowDetailModal(false)
                  navigate(`/pro/events/${evt.id}/preview`)
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Page Complète</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedDetailEvent.isLive ? (
                  <button
                    onClick={() => {
                      const evt = selectedDetailEvent
                      setShowDetailModal(false)
                      startLive(evt)
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white animate-pulse flex items-center gap-1.5 shadow-md"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Rejoindre le Live</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowDetailModal(false); setSelectedDetailEvent(null) }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANCER UN LIVE EN 1-CLIC (PROFESSIONNEL) */}
      {showInstantLiveModal && (
        <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 my-auto ${resolvedTheme === 'dark' ? 'bg-[#12161f] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    <span>LANCER UN LIVE</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-500 uppercase tracking-wider border border-red-500/30">
                      1-Clic Direct
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Diffusion haute définition & interaction en direct</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstantLiveModal(false)}
                className={`p-2 rounded-xl transition-colors ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulaire Principal */}
            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              
              {/* Titre du Live */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-zinc-300">
                  Titre du Live <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={instantLiveTitle}
                  onChange={e => setInstantLiveTitle(e.target.value)}
                  placeholder="Ex. Q&A Tech avec la communauté, Masterclass..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-zinc-300">
                  Catégorie
                </label>
                <select
                  value={instantLiveCategory}
                  onChange={e => setInstantLiveCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                    resolvedTheme === 'dark' ? 'bg-zinc-950/80 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="TECHNOLOGY">💻 Technologie</option>
                  <option value="BUSINESS">💼 Business & Finance</option>
                  <option value="DESIGN">🎨 Design & UI/UX</option>
                  <option value="HEALTH">❤️ Santé & Bien-être</option>
                  <option value="LAW">⚖️ Droit & Fiscalité</option>
                  <option value="MARKETING">📢 Marketing & Vente</option>
                  <option value="EDUCATION">🎓 Masterclass & Éducation</option>
                  <option value="OTHER">✨ Autre</option>
                </select>
              </div>

              {/* Qui peut regarder ? */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-zinc-300">
                  Qui peut regarder ?
                </label>
                <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium ${
                  resolvedTheme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <Globe className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold text-white">🌍 Tout le monde (Public sur EXILE)</span>
                </div>
              </div>

              {/* Type d'accès (Gratuit / Payant) */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-zinc-300">
                  Type d'accès
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstantLiveAccessType('free')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      instantLiveAccessType === 'free'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🆓 Gratuit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstantLiveAccessType('paid')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      instantLiveAccessType === 'paid'
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00] shadow-sm'
                        : resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Payant</span>
                  </button>
                </div>

                {instantLiveAccessType === 'paid' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Prix d'accès :</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={instantLivePrice}
                        onChange={e => setInstantLivePrice(e.target.value)}
                        placeholder="5"
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00] ${
                          resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <span className="absolute right-3 top-1.5 text-xs text-zinc-400 font-bold">$ USD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visibilité dans En direct */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={instantLiveShowInDirect}
                    onChange={e => setInstantLiveShowInDirect(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 accent-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-300">
                    ☑ Afficher immédiatement dans l'onglet « En direct »
                  </span>
                </label>
              </div>

              {/* ACCORDÉON: PARAMÈTRES AVANCÉS */}
              <div className="pt-1 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setInstantLiveShowAdvanced(prev => !prev)}
                  className={`w-full flex items-center justify-between py-2 text-xs font-bold transition-colors ${
                    resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Paramètres avancés</span>
                  </div>
                  {instantLiveShowAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {instantLiveShowAdvanced && (
                  <div className="space-y-3 pt-2 pb-1 pl-1">
                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-400">
                        Description brève
                      </label>
                      <textarea
                        rows={2}
                        value={instantLiveDescription}
                        onChange={e => setInstantLiveDescription(e.target.value)}
                        placeholder="Présentez les thèmes abordés lors de ce live..."
                        className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    {/* Image de couverture optionnelle */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Image de couverture (optionnel)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <Upload className="w-3 h-3" />
                          <span>Choisir un fichier</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setInstantLiveCoverFile(file)
                                setInstantLiveCoverPreview(URL.createObjectURL(file))
                              }
                            }}
                          />
                        </label>
                        {instantLiveCoverFile && (
                          <span className="text-[11px] text-emerald-400 truncate max-w-[200px]">
                            {instantLiveCoverFile.name}
                          </span>
                        )}
                      </div>
                      {instantLiveCoverPreview && (
                        <div className="mt-2 w-full h-20 rounded-xl overflow-hidden border border-zinc-800">
                          <img src={instantLiveCoverPreview} alt="Aperçu" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Limite de participants */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-400">
                        Limite de participants
                      </label>
                      <select
                        value={instantLiveCapacity}
                        onChange={e => setInstantLiveCapacity(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="100">100 participants</option>
                        <option value="250">250 participants</option>
                        <option value="500">500 participants (Recommandé)</option>
                        <option value="1000">1 000 participants (Grande Masterclass)</option>
                      </select>
                    </div>

                    {/* Options secondaires */}
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={instantLiveAllowComments}
                          onChange={e => setInstantLiveAllowComments(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-red-600 accent-red-600"
                        />
                        <span className="text-[11px] text-zinc-300 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-blue-400" /> Autoriser le chat et les commentaires en direct
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={instantLiveSendNotifications}
                          onChange={e => setInstantLiveSendNotifications(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-red-600 accent-red-600"
                        />
                        <span className="text-[11px] text-zinc-300 flex items-center gap-1">
                          <Bell className="w-3 h-3 text-amber-400" /> Notifier mes abonnés du début de ce live
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowInstantLiveModal(false)}
                disabled={isLaunchingLive}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleLaunchInstantLive}
                disabled={isLaunchingLive}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-xl shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{isLaunchingLive ? 'Création en cours...' : '🔴 Démarrer maintenant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ÉCRAN PRÉ-LIVE : TEST CAMÉRA & MICROPHONE ─── */}
      {preLiveEvent && (
        <div className="fixed inset-0 z-[100001] bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 ${
            resolvedTheme === 'dark' ? 'bg-[#0f131a] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header Pré-Live */}
            <div className="flex items-center justify-between border-b pb-3 border-zinc-800">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Écran Pré-Live · Configuration
                </span>
                <h3 className="font-extrabold text-base mt-1 line-clamp-1">{preLiveEvent.title}</h3>
              </div>
              <button
                onClick={closePreLive}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Annuler"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zone Preview Vidéo */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
              <video
                ref={preLiveVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!preLiveCamActive ? 'hidden' : ''}`}
              />
              {!preLiveCamActive && (
                <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <VideoOff className="w-7 h-7 text-zinc-600" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400">Caméra désactivée</span>
                </div>
              )}

              {/* Commandes Overlay Caméra / Micro */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={togglePreLiveMic}
                  className={`p-2.5 rounded-xl text-white transition-colors ${
                    preLiveMicActive ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={preLiveMicActive ? 'Couper le microphone' : 'Activer le microphone'}
                >
                  {preLiveMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={togglePreLiveCam}
                  className={`p-2.5 rounded-xl text-white transition-colors ${
                    preLiveCamActive ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={preLiveCamActive ? 'Couper la caméra' : 'Activer la caméra'}
                >
                  {preLiveCamActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Statuts des périphériques */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                preLiveCamActive ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${preLiveCamActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span>Caméra : <strong>{preLiveCamActive ? 'Activée' : 'Désactivée'}</strong></span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                preLiveMicActive ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${preLiveMicActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span>Microphone : <strong>{preLiveMicActive ? 'Activé' : 'Désactivé'}</strong></span>
              </div>
            </div>

            {/* Boutons d'action finale */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={closePreLive}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleEnterLiveRoom}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Entrer dans le Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CREATE EVENT MODAL ============
function CreateEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const { t } = useTranslation()
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
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [autoStartOnSchedule, setAutoStartOnSchedule] = useState(true)
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
      newErrors.title = t('pro.events.errTitleRequired', 'Le titre est obligatoire')
    } else if (form.title.length < 5) {
      newErrors.title = t('pro.events.errTitleMin', 'Le titre doit contenir au moins 5 caractères')
    } else if (form.title.length > 100) {
      newErrors.title = t('pro.events.errTitleMax', 'Le titre ne doit pas dépasser 100 caractères')
    }

    // Description: entre 20 et 500 caractères
    if (!form.description.trim()) {
      newErrors.description = t('pro.events.errDescRequired', 'La description est obligatoire')
    } else if (form.description.length < 20) {
      newErrors.description = t('pro.events.errDescMin', 'La description doit contenir au moins 20 caractères')
    } else if (form.description.length > 500) {
      newErrors.description = t('pro.events.errDescMax', 'La description ne doit pas dépasser 500 caractères')
    }

    // Dates: date de fin après date de début
    if (!form.startDate) {
      newErrors.startDate = t('pro.events.errStartDateRequired', 'La date de début est obligatoire')
    }
    if (!form.endDate) {
      newErrors.endDate = t('pro.events.errEndDateRequired', 'La date de fin est obligatoire')
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      newErrors.endDate = t('pro.events.errEndDateAfter', 'La date de fin doit être après la date de début')
    }

    // Capacité: entre 1 et 10000
    if (form.capacity < 1) {
      newErrors.capacity = t('pro.events.errCapacityMin', 'La capacité doit être au moins 1')
    } else if (form.capacity > 10000) {
      newErrors.capacity = t('pro.events.errCapacityMax', 'La capacité ne doit pas dépasser 10000')
    }

    // Lieu: requis si format présentiel ou hybride
    if (form.format !== 'virtual' && !form.location.city.trim()) {
      newErrors.city = t('pro.events.errCityRequired', 'La ville est obligatoire pour les événements présentiel/hybride')
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
    
    setCoverFile(file)
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
      coverFile,
      autoStartOnSchedule,
      status: 'published',
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
                {t('pro.events.createEvent', 'Créer un Événement')}
              </h2>
              <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t('pro.events.createSubtitle', 'Webinaire, masterclass ou atelier professionnel')}
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
            {t('pro.events.preview', 'Aperçu')}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* UPLOAD IMAGE */}
          <div>
            <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
              {t('pro.events.coverImage', 'Image de couverture')}
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
                      {t('pro.events.addCover', 'Ajouter une affiche ou bannière')}
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
              {t('pro.events.titleLabel', "Titre de l'événement *")}
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
              {t('pro.events.descriptionLabel', 'Description *')}
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
                {t('pro.events.startDateLabel', 'Date & Heure de début *')}
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
                {t('pro.events.endDateLabel', 'Date & Heure de fin *')}
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

          {/* Option: Notification de rappel à l'heure */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${resolvedTheme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="space-y-0.5">
              <label htmlFor="autoStart" className="text-xs font-bold block cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                M'avertir et envoyer une notification quand l'heure arrive
              </label>
              <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                Recevoir une alerte et une notification dès que l'heure de début arrive pour vous proposer de démarrer le direct sans forcer l'ouverture.
              </p>
            </div>
            <input
              id="autoStart"
              type="checkbox"
              checked={autoStartOnSchedule}
              onChange={e => setAutoStartOnSchedule(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B00] rounded cursor-pointer flex-shrink-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                {t('pro.events.format', 'Format')}
              </label>
              <select
                value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value as any })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
              >
                <option value="virtual">{t('pro.events.formatVirtual', 'En ligne (Live / Webinaire)')}</option>
                <option value="in-person">{t('pro.events.formatInPerson', 'Présentiel')}</option>
                <option value="hybrid">{t('pro.events.formatHybrid', 'Hybride')}</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                {t('pro.events.category', 'Catégorie')}
              </label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
              >
                <option value="Tech">{t('pro.events.catTech', 'Technologie')}</option>
                <option value="Business">{t('pro.events.catBusiness', 'Business & Finance')}</option>
                <option value="Design">{t('pro.events.catDesign', 'Design & UI/UX')}</option>
                <option value="Marketing">{t('pro.events.catMarketing', 'Marketing & Vente')}</option>
                <option value="Santé">{t('pro.events.catHealth', 'Santé & Bien-être')}</option>
                <option value="Droit">{t('pro.events.catLaw', 'Droit & Fiscalité')}</option>
                <option value="Education">{t('pro.events.catEducation', 'Masterclass Pro')}</option>
                <option value="Autre">{t('common.other', 'Autre')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                {t('pro.events.capacity', 'Capacité max (places)')}
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
                {t('pro.events.price', 'Tarif (0 = Gratuit)')}
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
                  {t('pro.events.city', 'Ville *')}
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
                  {t('pro.events.venue', 'Nom du lieu')}
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
            {t('common.cancel', 'Annuler')}
          </button>
          <button
            type="submit"
            form="create-event-form"
            className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('pro.events.createEvent', "Créer l'Événement")}</span>
          </button>
        </div>
      </div>

      {/* MODAL PREVISUALISATION */}
      {showPreview && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border shadow-2xl p-5 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold">{t('pro.events.previewTitle', "Aperçu de l'événement")}</h2>
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
                <h3 className="font-bold text-sm">{form.title || t('pro.events.defaultTitle', "Titre de l'événement")}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{form.description || t('pro.events.defaultDesc', "Description de l'événement...")}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    {form.format === 'virtual' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {form.format === 'virtual' ? t('pro.events.onlineEvent', 'En ligne') : (form.location.city || t('pro.events.location', 'Lieu'))}
                  </span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {form.capacity} {t('pro.events.capacityUnit', 'places')}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {form.price === 0 ? t('pro.events.free', 'Gratuit') : `${form.price}$`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ REPLAY & RECORDING MODAL ============
interface ReplayModalProps {
  isOpen: boolean
  onClose: () => void
  event: EventItem
  onRestartLive: (event: EventItem) => void
  onUploadRecording: (eventId: string, file?: File, replayUrl?: string) => Promise<void>
}

function ReplayModal({ isOpen, onClose, event, onRestartLive, onUploadRecording }: ReplayModalProps) {
  const { resolvedTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const [customReplayUrl, setCustomReplayUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const isOwner = Boolean(user?.id && event.ownerId && String(user.id) === String(event.ownerId))
  const videoSource = event.recordingUrl || event.replayUrl

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !customReplayUrl.trim()) return
    setIsUploading(true)
    try {
      await onUploadRecording(event.id, selectedFile || undefined, customReplayUrl.trim() || undefined)
      setSelectedFile(null)
      setCustomReplayUrl('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Rediffusion & Enregistrement</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-md">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Lecteur Vidéo */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800 shadow-inner">
            {videoSource ? (
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                src={videoSource.startsWith('http') ? videoSource : `${API_BASE_URL.replace('/api/v1', '')}${videoSource}`}
              />
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 fill-current opacity-60" />
                </div>
                <div>
                  <p className="font-bold text-sm text-zinc-200">Rediffusion non disponible pour le moment</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    {isOwner
                      ? "L'enregistrement vidéo n'a pas encore été importé. Vous pouvez téléverser un fichier MP4/WebM ou fournir un lien YouTube/Vimeo ci-dessous."
                      : "L'organisateur n'a pas encore mis en ligne l'enregistrement de cette session. Revenez plus tard pour visionner la rediffusion."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations sur l'événement */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm sm:text-base">{event.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{event.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                {event.stats.registrations} participants
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span>Organisé par <strong className="text-zinc-200">{event.organizerName}</strong></span>
            </div>
          </div>

          {/* Section Upload pour Organisateur si pas encore de vidéo */}
          {isOwner && (
            <form onSubmit={handleUploadSubmit} className={`p-4 rounded-2xl border space-y-3 ${resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  {videoSource ? "Remplacer l'enregistrement vidéo" : "Ajouter la vidéo d'enregistrement"}
                </p>
                {selectedFile && (
                  <span className="text-[10px] text-emerald-400 font-semibold truncate max-w-[150px]">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${resolvedTheme === 'dark' ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50' : 'border-slate-300 hover:border-slate-400 bg-white'}`}>
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <span className="text-[11px] font-semibold">Choisir un fichier (MP4, WebM)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  placeholder="Ou lien de replay (ex: YouTube, Vimeo...)"
                  value={customReplayUrl}
                  onChange={e => setCustomReplayUrl(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                />
              </div>

              {(selectedFile || customReplayUrl.trim()) && (
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enregistrement en cours...' : 'Enregistrer la vidéo'}</span>
                </button>
              )}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${resolvedTheme === 'dark' ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => {
                  onClose()
                  onRestartLive(event)
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Relancer ce Direct</span>
              </button>
            )}

            {videoSource && (
              <a
                href={videoSource.startsWith('http') ? videoSource : `${API_BASE_URL.replace('/api/v1', '')}${videoSource}`}
                download={`replay-${event.id}.webm`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger</span>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
