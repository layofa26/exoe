import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar, Users, Plus, Search,
  Clock, MapPin, Video, BarChart3, Trash2, CheckCircle,
  Radio, Ticket, X, ArrowLeft, Share2, CalendarPlus, Check,
  Play, Download, Upload, RotateCcw, Laptop, Briefcase, Palette, HeartPulse,
  Scale, Megaphone, GraduationCap, Layers, PlayCircle, User, AlertCircle, Eye, Shield, DollarSign,
  ChevronLeft, ChevronRight, Info, Mic, MicOff, VideoOff, Settings2, Globe, Lock, MessageSquare, Bell,
  Image as ImageIcon, ChevronDown, ChevronUp, MoreVertical, Link2, Sliders,
  Bookmark, Flag, Edit3, RefreshCw
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '../../hooks/useQuery'
import ConfirmModal from '../../components/common/ConfirmModal'
import { resolveMediaUrl } from '../../utils/mediaUtils'
import type { EventItem } from '../../types/events'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function formatOrganizerName(name?: string): string {
  if (!name || !name.trim()) return 'Organisateur'
  const clean = name.replace(/^@+/, '').trim()
  return clean
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getOrganizerInitials(name?: string): string {
  const formatted = formatOrganizerName(name)
  const parts = formatted.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return formatted.slice(0, 2).toUpperCase() || 'EX'
}



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
      cacheKey: 'pro:events:real:v4',
      cacheTime: 10 * 1000,
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReplayEvent, setSelectedReplayEvent] = useState<EventItem | null>(null)
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dueEventReminder, setDueEventReminder] = useState<EventItem | null>(null)
  const notifiedEventsRef = useRef<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [showInstantLiveModal, setShowInstantLiveModal] = useState(false)
  const [activeMenuEventId, setActiveMenuEventId] = useState<string | null>(null)

  // Fermer le menu déroulant lors d'un clic en dehors
  useEffect(() => {
    if (!activeMenuEventId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && !target.closest('[data-event-menu]')) {
        setActiveMenuEventId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenuEventId])
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [reportingEvent, setReportingEvent] = useState<EventItem | null>(null)
  const [reportReason, setReportReason] = useState('spam')
  const [savedEventIds, setSavedEventIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('exile_saved_events') || '[]')
    } catch {
      return []
    }
  })
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

  // Écran Pré-Live (Green Room / Test Caméra & Micro avant d'entrer)
  const [preLiveEvent, setPreLiveEvent] = useState<{ id: string; title: string; category: string; roomName: string } | null>(null)
  const [preLiveCamActive, setPreLiveCamActive] = useState(true)
  const [preLiveMicActive, setPreLiveMicActive] = useState(true)
  const [preLiveFacingMode, setPreLiveFacingMode] = useState<'user' | 'environment'>('user')
  const [preLiveVideoDevices, setPreLiveVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [preLiveAudioDevices, setPreLiveAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [preLiveSelectedVideo, setPreLiveSelectedVideo] = useState<string>('')
  const [preLiveSelectedAudio, setPreLiveSelectedAudio] = useState<string>('')
  const [preLiveMicLevel, setPreLiveMicLevel] = useState<number>(0)
  const preLiveVideoRef = useRef<HTMLVideoElement | null>(null)
  const preLiveStreamRef = useRef<MediaStream | null>(null)
  const preLiveAudioCtxRef = useRef<AudioContext | null>(null)
  const preLiveAnimFrameRef = useRef<number | null>(null)

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleToggleSave = useCallback((event: EventItem) => {
    setSavedEventIds(prev => {
      const isSaved = prev.includes(event.id)
      const updated = isSaved ? prev.filter(id => id !== event.id) : [...prev, event.id]
      localStorage.setItem('exile_saved_events', JSON.stringify(updated))
      showToastMsg(isSaved ? 'Retiré de vos favoris' : 'Événement enregistré dans vos favoris !')
      return updated
    })
  }, [showToastMsg])

  const handleCopyLink = useCallback((event: EventItem) => {
    const shareUrl = `${window.location.origin}/pro?${event.isLive ? 'live' : 'event'}=${event.id}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl)
    }
    showToastMsg('Lien copié dans le presse-papiers !')
  }, [showToastMsg])

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
    setDeleteConfirm(null)
    setEvents(prev => prev.filter(e => e.id !== eventId))
    showToastMsg('Événement supprimé avec succès !')
    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (err) {
        console.warn('Erreur API suppression:', err)
      }
    }
  }, [setEvents, showToastMsg])

  const handleUpdateEvent = useCallback(async (eventId: string, data: any) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
    
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      format: data.format,
      category: data.category,
      price: data.price,
      location: data.location,
      coverImage: data.coverFile ? (data.coverImage || URL.createObjectURL(data.coverFile)) : e.coverImage
    } : e))
    
    setEditingEvent(null)
    setShowCreateModal(false)
    showToastMsg('Événement modifié avec succès !')

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        const formData = new FormData()
        formData.append('title', data.title)
        formData.append('description', data.description)
        if (data.startDate) formData.append('date_debut', new Date(data.startDate).toISOString())
        if (data.endDate) formData.append('date_fin', new Date(data.endDate).toISOString())
        formData.append('format', data.format)
        if (data.coverFile) formData.append('cover', data.coverFile)
        if (data.location?.city) formData.append('location', data.location.city)
        formData.append('price', String(data.price || 0))

        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
      } catch (err) {
        console.warn('Erreur mise à jour événement:', err)
      }
    }
  }, [setEvents, showToastMsg])

  // Open create modal if create=true query param is present
  // Open instant live modal if live=true query param is present
  useEffect(() => {
    if (searchParams.get('live') === 'true') {
      // "Lancer un Live" depuis le menu Publier du Header
      if (isAuthenticated) {
        setShowInstantLiveModal(true)
      }
      navigate('/pro/events', { replace: true })
      return
    }
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      navigate('/pro/events', { replace: true })
    }
  }, [searchParams, navigate, isAuthenticated])


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

  const eventsRef = useRef(events)
  eventsRef.current = events

  // Notification de rappel quand l'heure arrive + Polling léger pour détecter les lives en temps réel
  useEffect(() => {
    let isCancelled = false

    const checkScheduleAndLive = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const now = Date.now()
      eventsRef.current.forEach(e => {
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
        if (res.ok && !isCancelled) {
          const liveData = await res.json()
          const liveList = Array.isArray(liveData) ? liveData : (liveData.results || [])
          const liveIds = new Set(liveList.map((item: any) => String(item.id)))

          setEvents(prev => {
            let hasChanged = false
            const next = prev.map(evt => {
              const isLiveNow = liveIds.has(String(evt.id))
              if (evt.isLive !== isLiveNow) {
                hasChanged = true
                return { ...evt, isLive: isLiveNow, status: isLiveNow ? 'live' : evt.status }
              }
              return evt
            })
            return hasChanged ? next : prev
          })
        }
      } catch {}
    }

    const interval = setInterval(checkScheduleAndLive, 25000)
    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [isEventOwner, showToastMsg, setEvents])

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

  // Fermer et nettoyer le flux pré-live
  const closePreLive = useCallback(() => {
    if (preLiveAnimFrameRef.current) {
      cancelAnimationFrame(preLiveAnimFrameRef.current)
      preLiveAnimFrameRef.current = null
    }
    if (preLiveAudioCtxRef.current) {
      preLiveAudioCtxRef.current.close().catch(() => {})
      preLiveAudioCtxRef.current = null
    }
    if (preLiveStreamRef.current) {
      preLiveStreamRef.current.getTracks().forEach(track => track.stop())
      preLiveStreamRef.current = null
    }
    setPreLiveEvent(null)
    setPreLiveMicLevel(0)
  }, [])

  // Démarrer la caméra/micro pour le pré-live avec analyseur audio et énumération
  const startPreLiveMedia = useCallback(async (customVideoId?: string, customAudioId?: string, targetFacing?: 'user' | 'environment') => {
    if (preLiveAnimFrameRef.current) {
      cancelAnimationFrame(preLiveAnimFrameRef.current)
      preLiveAnimFrameRef.current = null
    }
    if (preLiveAudioCtxRef.current) {
      preLiveAudioCtxRef.current.close().catch(() => {})
      preLiveAudioCtxRef.current = null
    }
    if (preLiveStreamRef.current) {
      preLiveStreamRef.current.getTracks().forEach(track => track.stop())
      preLiveStreamRef.current = null
    }

    const facing = targetFacing || preLiveFacingMode
    const videoConstraint: MediaTrackConstraints | boolean = customVideoId
      ? { deviceId: { exact: customVideoId } }
      : { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }
    
    const audioConstraint: MediaTrackConstraints | boolean = customAudioId
      ? { deviceId: { exact: customAudioId }, echoCancellation: true, noiseSuppression: true }
      : { echoCancellation: true, noiseSuppression: true }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraint,
          audio: audioConstraint,
        })
        preLiveStreamRef.current = stream
        setPreLiveCamActive(true)
        setPreLiveMicActive(true)
        if (preLiveVideoRef.current) {
          preLiveVideoRef.current.srcObject = stream
        }

        // Énumération des périphériques disponibles
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          setPreLiveVideoDevices(devices.filter(d => d.kind === 'videoinput'))
          setPreLiveAudioDevices(devices.filter(d => d.kind === 'audioinput'))
        } catch {}

        // Détection de volume en temps réel pour tester le microphone
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
          if (AudioCtx) {
            const ctx = new AudioCtx()
            preLiveAudioCtxRef.current = ctx
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 64
            const source = ctx.createMediaStreamSource(stream)
            source.connect(analyser)
            const dataArr = new Uint8Array(analyser.frequencyBinCount)

            const checkVolume = () => {
              analyser.getByteFrequencyData(dataArr)
              let sum = 0
              for (let i = 0; i < dataArr.length; i++) {
                sum += dataArr[i]
              }
              const avg = sum / dataArr.length
              setPreLiveMicLevel(Math.min(100, Math.round((avg / 100) * 100)))
              preLiveAnimFrameRef.current = requestAnimationFrame(checkVolume)
            }
            checkVolume()
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Pre-live media access error:', err)
      showToastMsg("Accès caméra/micro non autorisé. Vérifiez les autorisations de votre navigateur.")
    }
  }, [preLiveFacingMode, showToastMsg])

  // Basculer la caméra avant/arrière
  const flipPreLiveCamera = useCallback(async () => {
    const nextFacing = preLiveFacingMode === 'user' ? 'environment' : 'user'
    setPreLiveFacingMode(nextFacing)
    await startPreLiveMedia(undefined, preLiveSelectedAudio || undefined, nextFacing)
  }, [preLiveFacingMode, preLiveSelectedAudio, startPreLiveMedia])

  // Changer de caméra spécifique
  const switchPreLiveVideo = useCallback(async (deviceId: string) => {
    setPreLiveSelectedVideo(deviceId)
    await startPreLiveMedia(deviceId, preLiveSelectedAudio || undefined)
  }, [preLiveSelectedAudio, startPreLiveMedia])

  // Changer de microphone spécifique
  const switchPreLiveAudio = useCallback(async (deviceId: string) => {
    setPreLiveSelectedAudio(deviceId)
    await startPreLiveMedia(preLiveSelectedVideo || undefined, deviceId)
  }, [preLiveSelectedVideo, startPreLiveMedia])

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

  // Entrer définitivement dans le salon Live après configuration
  const handleEnterLiveRoom = useCallback(() => {
    if (!preLiveEvent) return
    const { id, roomName } = preLiveEvent

    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    const cleanId = String(id).replace('exile-', '').replace('evt_', '')
    if (token && cleanId && !isNaN(Number(cleanId))) {
      fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/start_live/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.warn('start_live call in pre-live:', err))
    }

    setEvents(prev => prev.map(e => e.id === id ? { ...e, isLive: true, liveRoomName: roomName } : e))
    closePreLive()
    navigate(`/pro?live=${id}&from=${encodeURIComponent('/pro/events')}`)
  }, [preLiveEvent, closePreLive, navigate, setEvents])

  const startLive = useCallback(async (event: EventItem) => {
    // Si l'événement n'est pas encore en direct, SEUL l'organisateur peut le démarrer
    const isOwner = isEventOwner(event)
    if (!event.isLive && !isOwner) {
      showToastMsg("Ce direct n'a pas encore été démarré par l'organisateur.")
      return
    }

    const roomName = event.liveRoomName || `exile-${event.id}`

    if (isOwner) {
      // Ouvrir la Green Room (Pré-Live) pour configurer et vérifier caméra/micro avant de lancer
      setPreLiveEvent({
        id: event.id,
        title: event.title,
        category: event.category,
        roomName
      })
      setTimeout(() => {
        startPreLiveMedia()
      }, 150)
      return
    }

    // Pour les spectateurs, entrer directement dans le lecteur avec deuxième feed
    navigate(`/pro?live=${event.id}&from=${encodeURIComponent('/pro/events')}`)
  }, [isEventOwner, navigate, showToastMsg, startPreLiveMedia])

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

  const handleLaunchInstantLive = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const cleanUsername = (user?.username || 'mon_compte').replace(/^@+/, '')
    const title = instantLiveTitle.trim() || `Session Live de @${cleanUsername}`
    await ensureMediaPermissions()
    setIsLaunchingLive(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const now = new Date()
      const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      let createdId = `evt_${Date.now()}`
      const numCapacity = parseInt(instantLiveCapacity) || 500
      const parsedPrice = instantLiveAccessType === 'paid' ? Math.max(1, parseFloat(instantLivePrice) || 5) : 0
      const desc = instantLiveDescription.trim()

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
      <div className={`flex-shrink-0 sticky top-0 z-30 p-3.5 border-b backdrop-blur-xl ${resolvedTheme === 'dark' ? 'border-white/5 bg-[#0b0e14]/95' : 'border-slate-200 bg-white/95'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              className={`p-2 rounded-xl transition-colors flex-shrink-0 ${resolvedTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              title={t('common.back', 'Retour')}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base leading-tight truncate">
                {t('pro.events.title', 'Événements & Live')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Bouton 1 : Lancer un Live */}
            <button
              onClick={() => isAuthenticated ? setShowInstantLiveModal(true) : navigate('/login')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-sm text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              title="Démarrer un direct vidéo"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
              <span className="whitespace-nowrap">{t('pro.events.startLive', 'Lancer un Live')}</span>
            </button>

            {/* Bouton 2 : Créer un événement */}
            <button
              onClick={() => isAuthenticated ? setShowCreateModal(true) : navigate('/login')}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl shadow-sm text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              title="Créer un événement"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="whitespace-nowrap">{t('pro.events.createEvent', 'Créer un événement')}</span>
            </button>
          </div>
        </div>

        {/* Barre de Recherche (gauche) et Filtres (droite) sur la même ligne */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-1">
          {/* Search Bar */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border w-full sm:w-80 md:w-96 lg:w-[380px] xl:w-[460px] 2xl:w-[500px] flex-shrink-0 transition-all ${
            resolvedTheme === 'dark' 
              ? 'bg-zinc-900/80 border-zinc-800 text-white focus-within:border-[#FF6B00]/70 focus-within:ring-1 focus-within:ring-[#FF6B00]/30' 
              : 'bg-slate-100/90 border-slate-200 text-slate-900 focus-within:border-[#FF6B00]/70 focus-within:ring-1 focus-within:ring-[#FF6B00]/30 focus-within:bg-white'
          }`}>
            <Search size={15} className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('pro.events.searchPlaceholder', 'Rechercher un événement...')}
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0 placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 hover:opacity-75">
                <X size={14} className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'} />
              </button>
            )}
          </div>

          {/* 6 Boutons de filtre à droite */}
          <div className="flex items-center gap-1.5 overflow-x-auto justify-start lg:justify-end flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: t('common.all', 'Tout'), icon: Layers, count: events.length },
              { id: 'live', label: t('pro.events.live', 'EN DIRECT'), icon: Radio, count: activeLiveEvents.length },
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    active
                      ? 'bg-[#FF6B00] text-white shadow-sm shadow-[#FF6B00]/25'
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
      <div className="flex-1 overflow-y-auto w-full px-0 sm:px-4 lg:px-6 py-0 sm:py-4 pb-20 md:pb-8 no-scrollbar sm:scrollbar-thin">

        {/* LISTE EVENMAN */}
        {filtered.length === 0 ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-4 sm:p-6 md:p-12 text-center mx-3 sm:mx-0 my-4`}>
            <Calendar className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} mx-auto mb-2 sm:mb-3`} />
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-xs sm:text-sm md:text-base`}>{t('pro.events.noEvents', 'Aucun événement')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-y-3 sm:gap-3.5 gap-x-0 sm:gap-x-3.5 w-full">
            {filtered.map(event => {
              const isOwner = isEventOwner(event)
              const isFinished = isPast(event.endDate || event.startDate) || event.status === 'completed' || event.status === 'termine'
              const isDueNow = !event.isLive && new Date(event.startDate).getTime() <= Date.now() && new Date(event.endDate).getTime() >= Date.now() && !isFinished
              const hasReplay = Boolean(event.recordingUrl || event.replayUrl)
              const resolvedCover = event.coverImage ? resolveMediaUrl(event.coverImage) : null
              const organizerDisplay = formatOrganizerName(event.organizerName)
              const organizerInitials = getOrganizerInitials(event.organizerName)
              const resolvedAvatar = event.organizerAvatar ? resolveMediaUrl(event.organizerAvatar) : null

              return (
                <div key={event.id} className={`group w-full max-w-full ${resolvedTheme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700' : 'bg-white border-slate-200 hover:shadow-md'} rounded-none sm:rounded-2xl border-y sm:border border-x-0 sm:border-x overflow-hidden transition-all flex flex-col justify-between`}>
                  <div>
                    {/* KOUVRI AVÈK RAPÒ 16:9 */}
                    <div 
                      onClick={() => {
                        if (event.isLive) {
                          navigate(`/pro/events/${event.id}/live`)
                        } else {
                          navigate(`/pro/events/${event.id}/preview`)
                        }
                      }}
                      className={`relative w-full aspect-video ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'} overflow-hidden cursor-pointer`}
                    >
                      {resolvedCover ? (
                        <img 
                          src={resolvedCover} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col justify-end p-3.5 select-none ${
                          (event.category || '').toLowerCase().includes('tech') 
                            ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950'
                            : (event.category || '').toLowerCase().includes('bus')
                            ? 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950'
                            : (event.category || '').toLowerCase().includes('des')
                            ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950'
                            : (event.category || '').toLowerCase().includes('sant') || (event.category || '').toLowerCase().includes('heal')
                            ? 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950'
                            : 'bg-gradient-to-br from-zinc-900 via-slate-900 to-black'
                        }`}>
                          <p className="text-xs font-bold text-white line-clamp-2 leading-snug drop-shadow-sm mb-1">
                            {event.title}
                          </p>
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                            {event.category || 'EXILE'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      {/* BADGES SOU KOUVRI */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                        {event.isLive && (
                          <span className="bg-red-600/95 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-lg shadow-red-600/30">
                            <Radio className="w-2.5 h-2.5" />
                            {t('pro.events.live', 'En Direct')}
                          </span>
                        )}
                        {!event.isLive && isDueNow && (
                          <span className="bg-amber-600/95 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Clock className="w-2.5 h-2.5" />
                            {"L'heure est arrivée"}
                          </span>
                        )}
                        {!event.isLive && event.status === 'published' && isUpcoming(event.startDate) && !isDueNow && (
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            {t('pro.events.upcoming', 'À venir')}
                          </span>
                        )}
                        {hasReplay && (
                          <span className="bg-blue-600/95 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            Rediffusion
                          </span>
                        )}
                        {isFinished && !hasReplay && (
                          <span className="bg-zinc-800/90 backdrop-blur-md text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                            Terminé
                          </span>
                        )}
                        {event.status === 'draft' && (
                          <span className="bg-zinc-800/90 backdrop-blur-md text-zinc-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                            {t('pro.events.draft', 'Brouillon')}
                          </span>
                        )}
                        {event.isRegistered && (
                          <span className="bg-[#FF6B00] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            {t('pro.events.registered', 'Inscrit')}
                          </span>
                        )}
                      </div>

                      {/* BOUTON 3 PWEN AK DROPDOWN BIEN KADRE */}
                      <div className="absolute top-2 right-2 z-30" data-event-menu onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuEventId(activeMenuEventId === event.id ? null : event.id)}
                          className="w-7 h-7 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-95"
                          title={t('common.options', 'Options')}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu — Style YouTube Épuré */}
                        {activeMenuEventId === event.id && (
                          <div className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl shadow-2xl py-1 z-50 border ${
                            resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
                          } text-xs font-medium backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100`}>
                            {/* Partager intégré dans le menu */}
                            <button
                              onClick={() => { handleShareEvent(event); setActiveMenuEventId(null) }}
                              className="w-full px-3 py-1.5 text-left hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                              <span>Partager l'événement</span>
                            </button>

                            {/* Enregistrer / Favoris */}
                            <button
                              onClick={() => { handleToggleSave(event); setActiveMenuEventId(null) }}
                              className="w-full px-3 py-1.5 text-left hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors"
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${savedEventIds.includes(event.id) ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-zinc-400'}`} />
                              <span>{savedEventIds.includes(event.id) ? 'Retirer des favoris' : 'Enregistrer'}</span>
                            </button>

                            {/* Copier le lien */}
                            <button
                              onClick={() => { handleCopyLink(event); setActiveMenuEventId(null) }}
                              className="w-full px-3 py-1.5 text-left hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors"
                            >
                              <Link2 className="w-3.5 h-3.5 text-blue-400" />
                              <span>Copier le lien direct</span>
                            </button>

                            {isOwner ? (
                              <>
                                <div className="my-1 border-t border-zinc-800/40" />
                                <button
                                  onClick={() => { setEditingEvent(event); setShowCreateModal(true); setActiveMenuEventId(null) }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Modifier l'événement</span>
                                </button>

                                <button
                                  onClick={() => { setDeleteConfirm(event.id); setActiveMenuEventId(null) }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2.5 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  <span>Supprimer l'événement</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="my-1 border-t border-zinc-800/40" />
                                <button
                                  onClick={() => { setReportingEvent(event); setActiveMenuEventId(null) }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <Flag className="w-3.5 h-3.5 text-red-400" />
                                  <span>Signaler l'événement</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ACTION RAPIDE: LIVE */}
                      {event.isLive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/pro?live=${event.id}&from=${encodeURIComponent('/pro/events')}`)
                          }}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xl bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Video className="w-3 h-3" />
                          <span>{t('pro.events.join', 'Rejoindre')}</span>
                        </button>
                      )}
                    </div>

                    {/* TITRE & INFOS */}
                    <div 
                      onClick={() => {
                        if (event.isLive) {
                          navigate(`/pro?live=${event.id}&from=${encodeURIComponent('/pro/events')}`)
                        } else {
                          navigate(`/pro?event=${event.id}&from=${encodeURIComponent('/pro/events')}`)
                        }
                      }}
                      className="p-2.5 sm:p-3 space-y-1.5 cursor-pointer flex-1"
                    >
                      <h3 className={`text-xs sm:text-sm font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100 hover:text-[#FF6B00]' : 'text-slate-900 hover:text-[#FF6B00]'} truncate transition-colors`} title={event.title}>
                        {event.title}
                      </h3>
                      {event.description && event.description.trim() && event.description !== 'Diffusion en direct interactive sur EXILE.' && (
                        <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'} line-clamp-1 leading-snug`}>
                          {event.description}
                        </p>
                      )}

                      {/* META INFOS */}
                      <div className={`flex items-center gap-x-2.5 text-[10px] font-medium pt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 text-[#FF6B00] flex-shrink-0" />
                          <span className="truncate">{formatDate(event.startDate)}</span>
                        </span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          {event.format === 'virtual' ? (
                            <><Video className="w-3 h-3 text-blue-400" /> <span>En ligne</span></>
                          ) : event.format === 'hybrid' ? (
                            <><Layers className="w-3 h-3 text-indigo-400" /> <span>Hybride</span></>
                          ) : (
                            <><MapPin className="w-3 h-3 text-emerald-400" /> <span>{event.location?.city || 'Sur place'}</span></>
                          )}
                        </span>
                        <span className="flex items-center gap-1 flex-shrink-0 ml-auto">
                          <Users className="w-3 h-3 text-purple-400" />
                          <span>{event.stats.registrations}/{event.capacity}</span>
                        </span>
                      </div>

                      {/* ORGANISATEUR & PRIX */}
                      <div className={`flex items-center justify-between pt-2 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800/80' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 overflow-hidden">
                            {resolvedAvatar ? (
                              <img 
                                src={resolvedAvatar} 
                                alt={organizerDisplay} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <span>{organizerInitials}</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold truncate max-w-[120px] sm:max-w-[150px] ${resolvedTheme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>
                            {organizerDisplay}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          event.price === 0 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20'
                        }`}>
                          {event.price === 0 ? t('pro.events.free', 'Gratuit') : `${event.price}$`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION PRINCIPALE EN BAS DE CARTE (Partager est dans le menu 3 points) */}
                  {(() => {
                    let actionButton = null;

                    if (event.isLive) {
                      actionButton = (
                        <button
                          onClick={() => startLive(event)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>{isOwner ? "Gérer mon Direct" : "Rejoindre le Direct"}</span>
                        </button>
                      );
                    } else if (isFinished) {
                      if (isOwner) {
                        actionButton = (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => restartLive(event)}
                              className="py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                              title="Relancer ce même direct en tant qu'organisateur"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Relancer</span>
                            </button>
                            <button
                              onClick={() => { setSelectedReplayEvent(event); setShowReplayModal(true) }}
                              className="py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
                              title="Visionner ou gérer la rediffusion"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Rediffusion</span>
                            </button>
                          </div>
                        );
                      } else if (hasReplay) {
                        actionButton = (
                          <button
                            onClick={() => navigate(`/pro?event=${event.id}&from=${encodeURIComponent('/pro/events')}`)}
                            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Voir la Rediffusion</span>
                          </button>
                        );
                      }
                      // Note: For non-owner finished events without replay, we do NOT display a dead disabled button. The "Terminé" badge on the thumbnail is clean.
                    } else if (isOwner) {
                      actionButton = (
                        <button
                          onClick={() => startLive(event)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Démarrer le Direct</span>
                        </button>
                      );
                    } else {
                      actionButton = (
                        <button
                          onClick={() => handleToggleRegister(event)}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                            event.isRegistered
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              : 'bg-[#FF6B00] hover:bg-[#e05e00] text-white shadow-[#FF6B00]/25'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${event.isRegistered ? 'fill-current' : ''}`} />
                          <span>{event.isRegistered ? "Rappel activé ✓" : "Me prévenir"}</span>
                        </button>
                      );
                    }

                    if (!actionButton) return null;
                    return <div className="p-2.5 sm:p-3 pt-0">{actionButton}</div>;
                  })()}
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

      {/* MODAL: KREYE OUBYEN MODIFYE EVENMAN */}
      {showCreateModal && (
        <CreateEventModal
          initialEvent={editingEvent}
          onClose={() => { setShowCreateModal(false); setEditingEvent(null) }}
          onCreate={(data) => {
            if (editingEvent) {
              handleUpdateEvent(editingEvent.id, data)
            } else {
              createEvent(data)
            }
          }}
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
                onClick={() => handleDeleteEvent(deleteConfirm)}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t('common.confirm', 'Confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIGNALER UN ÉVÉNEMENT */}
      {reportingEvent && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-3xl p-5 max-w-sm w-full border shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Signaler cet événement</span>
              </div>
              <button onClick={() => setReportingEvent(null)} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Sélectionnez la raison du signalement pour « <strong className="text-zinc-200">{reportingEvent.title}</strong> » :
            </p>

            <div className="space-y-2 text-xs">
              {[
                { id: 'spam', label: 'Spam ou contenu trompeur' },
                { id: 'inappropriate', label: 'Contenu inapproprié ou explicite' },
                { id: 'violence', label: 'Violence ou incitation à la haine' },
                { id: 'scam', label: 'Arnaque ou escroquerie' },
                { id: 'other', label: 'Autre motif' }
              ].map(opt => (
                <label key={opt.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  reportReason === opt.id
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 font-semibold'
                    : resolvedTheme === 'dark' ? 'border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={opt.id}
                    checked={reportReason === opt.id}
                    onChange={() => setReportReason(opt.id)}
                    className="accent-red-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReportingEvent(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setReportingEvent(null)
                  showToastMsg('Signalement envoyé. Merci de nous aider à protéger la communauté !')
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 active:scale-95"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANCER UN LIVE (DESIGN ÉPURÉ & PROFESSIONNEL) */}
      {showInstantLiveModal && (
        <div className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 border shadow-xl space-y-4 my-auto ${resolvedTheme === 'dark' ? 'bg-[#11141c] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            {/* Header Modal */}
            <div className={`flex items-center justify-between border-b pb-3.5 ${resolvedTheme === 'dark' ? 'border-zinc-800/80' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    Démarrer un direct
                  </h3>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Configurez votre diffusion en direct
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstantLiveModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulaire Principal */}
            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              
              {/* Titre du Live */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Titre du direct <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={instantLiveTitle}
                  onChange={e => setInstantLiveTitle(e.target.value)}
                  placeholder="Ex. Session de questions-réponses, Masterclass..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-red-500 transition-all ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Catégorie
                </label>
                <select
                  value={instantLiveCategory}
                  onChange={e => setInstantLiveCategory(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-red-500 transition-all ${
                    resolvedTheme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="TECHNOLOGY">Technologie</option>
                  <option value="BUSINESS">Business & Finance</option>
                  <option value="DESIGN">Design & Création</option>
                  <option value="HEALTH">Santé & Bien-être</option>
                  <option value="LAW">Droit & Fiscalité</option>
                  <option value="MARKETING">Marketing & Vente</option>
                  <option value="EDUCATION">Formation & Éducation</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Audience
                </label>
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium ${
                  resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Public (Accessible à tous sur EXILE)</span>
                </div>
              </div>

              {/* Type d'accès (Gratuit / Payant) */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Accès
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstantLiveAccessType('free')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      instantLiveAccessType === 'free'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : resolvedTheme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Gratuit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstantLiveAccessType('paid')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      instantLiveAccessType === 'paid'
                        ? 'bg-[#FF6B00]/15 border-[#FF6B00]/40 text-[#FF6B00]'
                        : resolvedTheme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Payant</span>
                  </button>
                </div>

                {instantLiveAccessType === 'paid' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Prix :</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={instantLivePrice}
                        onChange={e => setInstantLivePrice(e.target.value)}
                        placeholder="5"
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00] ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <span className="absolute right-3 top-1.5 text-xs text-zinc-400 font-bold">$ USD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visibilité dans En direct */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={instantLiveShowInDirect}
                    onChange={e => setInstantLiveShowInDirect(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 accent-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Afficher immédiatement dans l'onglet « En direct »
                  </span>
                </label>
              </div>

              {/* ACCORDÉON: PARAMÈTRES AVANCÉS */}
              <div className={`pt-1 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800/80' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setInstantLiveShowAdvanced(prev => !prev)}
                  className={`w-full flex items-center justify-between py-2 text-xs font-semibold transition-colors ${
                    resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Paramètres avancés</span>
                  </div>
                  {instantLiveShowAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {instantLiveShowAdvanced && (
                  <div className="space-y-3 pt-2 pb-1 pl-1">
                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-400">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={instantLiveDescription}
                        onChange={e => setInstantLiveDescription(e.target.value)}
                        placeholder="Présentez les thèmes abordés..."
                        className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900'
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
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="100">100 participants</option>
                        <option value="250">250 participants</option>
                        <option value="500">500 participants</option>
                        <option value="1000">1 000 participants</option>
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
                        <span className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'} flex items-center gap-1`}>
                          <MessageSquare className="w-3 h-3 text-zinc-400" /> Autoriser le chat en direct
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={instantLiveSendNotifications}
                          onChange={e => setInstantLiveSendNotifications(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-red-600 accent-red-600"
                        />
                        <span className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'} flex items-center gap-1`}>
                          <Bell className="w-3 h-3 text-zinc-400" /> Notifier mes abonnés du début du direct
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className={`flex items-center justify-between gap-3 pt-3 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800/80' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setShowInstantLiveModal(false)}
                disabled={isLaunchingLive}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleLaunchInstantLive}
                disabled={isLaunchingLive}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isLaunchingLive ? 'Création en cours...' : 'Démarrer le direct'}</span>
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

              {/* Badge Facing Mode */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{preLiveFacingMode === 'user' ? 'Caméra avant' : 'Caméra arrière'}</span>
              </div>

              {/* Commandes Overlay Caméra / Micro / Flip */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
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

                <button
                  type="button"
                  onClick={flipPreLiveCamera}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors active:scale-95"
                  title="Changer de caméra (Avant / Arrière)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Test Microphone en direct (Barre de volume audio) */}
            <div className={`p-3 rounded-2xl border space-y-1.5 ${
              resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Mic className="w-3.5 h-3.5 text-red-500" />
                  Test du microphone
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {preLiveMicActive ? `${preLiveMicLevel}%` : 'Muet'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-100 ease-out"
                  style={{ width: preLiveMicActive ? `${preLiveMicLevel}%` : '0%' }}
                />
              </div>
            </div>

            {/* Sélecteurs de périphériques si plusieurs sont détectés */}
            {(preLiveVideoDevices.length > 1 || preLiveAudioDevices.length > 1) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {preLiveVideoDevices.length > 1 && (
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">Source vidéo</label>
                    <select
                      value={preLiveSelectedVideo}
                      onChange={(e) => switchPreLiveVideo(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                        resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    >
                      {preLiveVideoDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Caméra (${d.deviceId.slice(0, 6)}...)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {preLiveAudioDevices.length > 1 && (
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">Microphone</label>
                    <select
                      value={preLiveSelectedAudio}
                      onChange={(e) => switchPreLiveAudio(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                        resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    >
                      {preLiveAudioDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone (${d.deviceId.slice(0, 6)}...)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Boutons d'action finale */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={closePreLive}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleEnterLiveRoom}
                className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Passer au Direct</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CREATE EVENT MODAL (STYLE YOUTUBE STUDIO LIVE) ============
function CreateEventModal({ 
  onClose, 
  onCreate,
  initialEvent
}: { 
  onClose: () => void; 
  onCreate: (data: any) => void;
  initialEvent?: EventItem | null;
}) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Stepper YouTube Studio Live
  const [activeStep, setActiveStep] = useState<'details' | 'stream' | 'visibility'>('details')

  const [form, setForm] = useState({
    title: initialEvent?.title || '',
    description: initialEvent?.description || '',
    startDate: initialEvent?.startDate ? new Date(initialEvent.startDate).toISOString().slice(0, 16) : '',
    endDate: initialEvent?.endDate ? new Date(initialEvent.endDate).toISOString().slice(0, 16) : '',
    format: (initialEvent?.format || 'virtual') as 'virtual' | 'in-person' | 'hybrid',
    category: initialEvent?.category || 'Tech',
    capacity: initialEvent?.capacity || 100,
    price: initialEvent?.price || 0,
    location: initialEvent?.location || { city: '', venue: '' },
    coverImage: (initialEvent?.coverImage || '') as string,
    liveStatus: 'at_coming' as 'at_coming' | 'live' | 'ended',
    speakerName: '',
    speakerAvatar: '' as string,
    liveRoomName: initialEvent?.liveRoomName || '',
    maxParticipants: 100
  })

  // Paramètres de flux & Encadrement vidéo (YouTube Stream Settings)
  const [streamSource, setStreamSource] = useState<'webcam' | 'obs'>('webcam')
  const [streamLatency, setStreamLatency] = useState<'normal' | 'low'>('normal')
  const [enableLiveChat, setEnableLiveChat] = useState(true)
  const [enableAutoReplay, setEnableAutoReplay] = useState(true)

  // Visibilité & Droits (YouTube Privacy & Monetization)
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public')
  const [accessType, setAccessType] = useState<'free' | 'paid'>((initialEvent?.price && initialEvent.price > 0) ? 'paid' : 'free')

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [autoStartOnSchedule, setAutoStartOnSchedule] = useState(true)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialEvent?.coverImage ? resolveMediaUrl(initialEvent.coverImage) : null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [createModalAlert, setCreateModalAlert] = useState<{ title?: string; message: string; type?: 'info' | 'warning' | 'danger' | 'success' } | null>(null)

  const inappropriateWords = ['porn', 'sex', 'xxx', 'adult', 'nude', 'erotic', 'sexy', 'fuck', 'shit', 'ass']

  // Validation étape 1 (Détails)
  const validateDetails = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!form.title.trim()) {
      newErrors.title = t('pro.events.errTitleRequired', 'Le titre est obligatoire')
    } else if (form.title.length < 5) {
      newErrors.title = t('pro.events.errTitleMin', 'Le titre doit contenir au moins 5 caractères')
    } else if (form.title.length > 100) {
      newErrors.title = t('pro.events.errTitleMax', 'Le titre ne doit pas dépasser 100 caractères')
    }

    if (!form.description.trim()) {
      newErrors.description = t('pro.events.errDescRequired', 'La description est obligatoire')
    } else if (form.description.length < 20) {
      newErrors.description = t('pro.events.errDescMin', 'La description doit contenir au moins 20 caractères')
    } else if (form.description.length > 500) {
      newErrors.description = t('pro.events.errDescMax', 'La description ne doit pas dépasser 500 caractères')
    }

    if (!form.startDate) {
      newErrors.startDate = t('pro.events.errStartDateRequired', 'La date de début est obligatoire')
    }
    if (!form.endDate) {
      newErrors.endDate = t('pro.events.errEndDateRequired', 'La date de fin est obligatoire')
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      newErrors.endDate = t('pro.events.errEndDateAfter', 'La date de fin doit être après la date de début')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validation finale
  const validateFinalForm = (): boolean => {
    if (!validateDetails()) {
      setActiveStep('details')
      return false
    }

    const newErrors: { [key: string]: string } = {}

    if (form.capacity < 1) {
      newErrors.capacity = t('pro.events.errCapacityMin', 'La capacité doit être au moins 1')
    } else if (form.capacity > 10000) {
      newErrors.capacity = t('pro.events.errCapacityMax', 'La capacité ne doit pas dépasser 10000')
    }

    if (form.format !== 'virtual' && !form.location.city.trim()) {
      newErrors.location = t('pro.events.errLocationRequired', 'La ville est obligatoire pour un événement physique')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      setActiveStep('visibility')
      return false
    }

    return true
  }

  const containsInappropriateContent = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return inappropriateWords.some(word => lowerText.includes(word))
  }

  const handleImageUpload = (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setCreateModalAlert({ title: 'Fichier trop volumineux', message: "L'image ne doit pas dépasser 5MB", type: 'warning' })
      return
    }
    const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validFormats.includes(file.type)) {
      setCreateModalAlert({ title: 'Format non supporté', message: 'Format non supporté. Utilisez JPEG, PNG, WebP ou GIF', type: 'warning' })
      return
    }
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
      setForm(prev => ({ ...prev, coverImage: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleImageUpload(file)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validateFinalForm()) return

    if (containsInappropriateContent(form.title) || containsInappropriateContent(form.description)) {
      setCreateModalAlert({ title: 'Contenu inapproprié', message: 'Votre événement contient des mots inappropriés. Veuillez modifier le titre ou la description.', type: 'danger' })
      return
    }

    onCreate({
      ...form,
      price: accessType === 'paid' ? Math.max(1, form.price || 5) : 0,
      coverFile,
      autoStartOnSchedule,
      status: visibility === 'private' ? 'draft' : 'published',
      isLive: false,
      organizerName: 'Moi',
      organizerAvatar: null,
      isRegistered: false,
      streamSource,
      streamLatency,
      enableLiveChat,
      enableAutoReplay,
      visibility
    })
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 md:backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className={`${isDark ? 'bg-zinc-950 md:bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} h-full w-full md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-3xl flex flex-col overflow-hidden border-0 md:border shadow-2xl`}>
        
        {/* Header Style YouTube Studio */}
        <div className={`sticky top-0 ${isDark ? 'bg-zinc-950 md:bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'} border-b px-4 py-3.5 flex items-center justify-between z-10 backdrop-blur`}>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <ArrowLeft className="w-5 h-5 md:hidden" />
              <X className="w-5 h-5 hidden md:block" />
            </button>
            <div>
              <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                <span>{initialEvent ? "Modifier l'événement" : t('pro.events.createEvent', 'Créer un Événement')}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF6B00]/15 text-[#FF6B00] uppercase tracking-wider">
                  Live & Event
                </span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t('pro.events.createSubtitle', 'Webinaire, masterclass ou atelier professionnel')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              isDark ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('pro.events.preview', 'Aperçu')}</span>
          </button>
        </div>

        {/* Stepper Onglets Style YouTube Studio */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between text-xs font-bold ${
          isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50/80 border-slate-200 text-slate-500'
        }`}>
          <button
            type="button"
            onClick={() => setActiveStep('details')}
            className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${
              activeStep === 'details'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
              activeStep === 'details' ? 'bg-[#FF6B00] text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>1. Détails</span>
          </button>

          <div className="w-6 sm:w-10 h-0.5 bg-zinc-700/40" />

          <button
            type="button"
            onClick={() => {
              if (validateDetails()) setActiveStep('stream')
            }}
            className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${
              activeStep === 'stream'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
              activeStep === 'stream' ? 'bg-[#FF6B00] text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>2. Paramètres vidéo</span>
          </button>

          <div className="w-6 sm:w-10 h-0.5 bg-zinc-700/40" />

          <button
            type="button"
            onClick={() => {
              if (validateDetails()) setActiveStep('visibility')
            }}
            className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${
              activeStep === 'visibility'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
              activeStep === 'visibility' ? 'bg-[#FF6B00] text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span>3. Visibilité & Droits</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          
          {/* ============ ÉTAPE 1 : DÉTAILS ============ */}
          {activeStep === 'details' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Titre */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold block`}>
                    {t('pro.events.titleLabel', "Titre de l'événement")} *
                  </label>
                  <span className={`text-[10px] font-mono ${form.title.length > 100 ? 'text-red-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {form.title.length}/100
                  </span>
                </div>
                <input
                  required
                  value={form.title}
                  maxLength={110}
                  onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
                  placeholder="Ex: Masterclass : Optimiser son Architecture Cloud en 2026"
                  className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold block`}>
                    {t('pro.events.descriptionLabel', 'Description')} *
                  </label>
                  <span className={`text-[10px] font-mono ${form.description.length > 500 ? 'text-red-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {form.description.length}/500
                  </span>
                </div>
                <textarea
                  value={form.description}
                  maxLength={520}
                  onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }) }}
                  placeholder="Présentez les thématiques abordées, les compétences transmises et les points clés (ex: #Tech #Cloud #Architecture)..."
                  rows={3}
                  className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors resize-none ${errors.description ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                />
                {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Catégorie */}
              <div>
                <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                  {t('pro.events.category', 'Catégorie thématique')}
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className={`w-full ${isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
                >
                  <option value="Tech">💻 Technologie & Dev</option>
                  <option value="Business">💼 Business & Finance</option>
                  <option value="Design">🎨 Design & UI/UX</option>
                  <option value="Marketing">📢 Marketing & Vente</option>
                  <option value="Santé">❤️ Santé & Bien-être</option>
                  <option value="Droit">⚖️ Droit & Fiscalité</option>
                  <option value="Education">🎓 Masterclass & Académie</option>
                  <option value="Autre">✨ Autre</option>
                </select>
              </div>

              {/* Encadrement Miniature 16:9 Standard YouTube */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold block`}>
                    {t('pro.events.coverImage', 'Miniature & Encadrement vidéo')}
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">Format 16:9 HD (1280x720)</span>
                </div>
                
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all aspect-video max-h-56 flex flex-col items-center justify-center overflow-hidden ${
                    isDragging ? 'border-[#FF6B00] bg-[#FF6B00]/10' : isDark ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {coverImagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={coverImagePreview} alt="Aperçu 16:9" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => { setCoverImagePreview(null); setForm({ ...form, coverImage: '' }) }}
                        className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1.5 rounded-full shadow-lg transition-colors cursor-pointer"
                        title="Supprimer la miniature"
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
                        className="cursor-pointer flex flex-col items-center gap-2 p-2"
                      >
                        <div className={`w-11 h-11 rounded-2xl ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-white shadow-sm text-slate-600'} flex items-center justify-center`}>
                          <ImageIcon className="w-5 h-5 text-[#FF6B00]" />
                        </div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {t('pro.events.addCover', 'Importer une miniature')}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          Recommandé : 1280x720 (16:9). Max 5 Mo.
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates & Heures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                    {t('pro.events.startDateLabel', 'Date & Heure de début')} *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startDate}
                    onChange={e => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: '' }) }}
                    className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.startDate ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                  />
                  {errors.startDate && <p className="text-[10px] text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                    {t('pro.events.endDateLabel', 'Date & Heure de fin')} *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endDate}
                    onChange={e => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: '' }) }}
                    className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.endDate ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                  />
                  {errors.endDate && <p className="text-[10px] text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ============ ÉTAPE 2 : PARAMÈTRES VIDÉO & FLUX ============ */}
          {activeStep === 'stream' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Source de diffusion */}
              <div>
                <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-2 block`}>
                  Méthode de diffusion vidéo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setStreamSource('webcam')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      streamSource === 'webcam'
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00] ring-1 ring-[#FF6B00]'
                        : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-2 rounded-xl ${streamSource === 'webcam' ? 'bg-[#FF6B00] text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">Caméra Web (Webcam)</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Diffusez directement depuis votre navigateur avec votre webcam et micro. Aucun logiciel externe requis.
                    </p>
                  </div>

                  <div
                    onClick={() => setStreamSource('obs')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      streamSource === 'obs'
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00] ring-1 ring-[#FF6B00]'
                        : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-2 rounded-xl ${streamSource === 'obs' ? 'bg-[#FF6B00] text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Laptop className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">Logiciel OBS / RTMP</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Idéal pour OBS Studio, Streamlabs, régie multi-caméras et partage d'écran haute définition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Latence du flux */}
              <div>
                <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-2 block`}>
                  Latence du flux (Stream Latency)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    streamLatency === 'normal' ? 'border-[#FF6B00] bg-[#FF6B00]/5' : isDark ? 'border-zinc-800' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="streamLatency"
                      checked={streamLatency === 'normal'}
                      onChange={() => setStreamLatency('normal')}
                      className="mt-0.5 accent-[#FF6B00]"
                    />
                    <div>
                      <p className="text-xs font-bold">Latence normale</p>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Qualité maximale (1080p/4K), idéale pour cours et présentations.</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    streamLatency === 'low' ? 'border-[#FF6B00] bg-[#FF6B00]/5' : isDark ? 'border-zinc-800' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="streamLatency"
                      checked={streamLatency === 'low'}
                      onChange={() => setStreamLatency('low')}
                      className="mt-0.5 accent-[#FF6B00]"
                    />
                    <div>
                      <p className="text-xs font-bold">Faible latence</p>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Interaction ultra-rapide en direct pour questions et réponses.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Options du Direct (Chat, Replay DVR, Rappels) */}
              <div className={`p-4 rounded-2xl border space-y-3.5 ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Chat en direct
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Permettre aux participants d'envoyer des questions et des messages en direct.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLiveChat}
                    onChange={e => setEnableLiveChat(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B00] rounded cursor-pointer"
                  />
                </div>

                <div className="h-px bg-zinc-800/40" />

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
                      Enregistrement automatique & Replay (DVR)
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Conserver l'enregistrement et rendre le replay disponible dès la fin de la diffusion.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAutoReplay}
                    onChange={e => setEnableAutoReplay(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B00] rounded cursor-pointer"
                  />
                </div>

                <div className="h-px bg-zinc-800/40" />

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Rappel programmé à l'heure du direct
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Recevoir une alerte pour démarrer le live dès que l'heure planifiée arrive.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoStartOnSchedule}
                    onChange={e => setAutoStartOnSchedule(e.target.checked)}
                    className="w-4 h-4 accent-[#FF6B00] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============ ÉTAPE 3 : VISIBILITÉ & DROITS ============ */}
          {activeStep === 'visibility' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Gestion des droits de visibilité selon YouTube */}
              <div>
                <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-2 block`}>
                  Visibilité de l'événement (Droits d'accès)
                </label>
                <div className="space-y-2">
                  <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    visibility === 'public'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold">Public (Recommandé)</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Tout le monde peut rechercher, trouver et regarder cet événement sur EXILE.
                      </p>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    visibility === 'unlisted'
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                      : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'unlisted'}
                      onChange={() => setVisibility('unlisted')}
                      className="mt-1 accent-blue-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold">Non répertorié (Prive pa lyen)</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Seules les personnes qui possèdent le lien direct peuvent accéder à l'événement.
                      </p>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    visibility === 'private'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold">Privé (Organisateur & Invités)</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Visible uniquement par vous et les personnes que vous autorisez explicitement.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Accès Gratuit vs Payant */}
              <div>
                <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                  Tarification & Billetterie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAccessType('free'); setForm({ ...form, price: 0 }) }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accessType === 'free'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🆓 Gratuit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAccessType('paid'); if (form.price === 0) setForm({ ...form, price: 10 }) }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accessType === 'paid'
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00] shadow-sm'
                        : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Payant</span>
                  </button>
                </div>

                {accessType === 'paid' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Prix du billet :</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00] ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <span className="absolute right-3 top-1.5 text-xs text-zinc-400 font-bold">$ USD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Format & Capacité */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                    {t('pro.events.format', 'Format')}
                  </label>
                  <select
                    value={form.format}
                    onChange={e => setForm({ ...form, format: e.target.value as any })}
                    className={`w-full ${isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none transition-colors`}
                  >
                    <option value="virtual">💻 En ligne (Live / Webinaire)</option>
                    <option value="in-person">🏢 Présentiel</option>
                    <option value="hybrid">🌐 Hybride</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                    {t('pro.events.capacity', 'Capacité max (places)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={e => { setForm({ ...form, capacity: parseInt(e.target.value) || 1 }); setErrors({ ...errors, capacity: '' }) }}
                    className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100' : 'bg-slate-50 text-slate-900'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.capacity ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                  />
                </div>
              </div>

              {/* Lieu physique si présentiel ou hybride */}
              {form.format !== 'virtual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                      {t('pro.events.city', 'Ville *')}
                    </label>
                    <input
                      value={form.location.city}
                      onChange={e => { setForm({ ...form, location: { ...form.location, city: e.target.value } }); setErrors({ ...errors, city: '' }) }}
                      placeholder="Paris, Port-au-Prince, Dakar..."
                      className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-500' : isDark ? 'border-zinc-800 focus:border-[#FF6B00]' : 'border-slate-200 focus:border-[#FF6B00]'}`}
                    />
                    {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'} font-bold mb-1.5 block`}>
                      {t('pro.events.venue', 'Nom du lieu')}
                    </label>
                    <input
                      value={form.location.venue}
                      onChange={e => setForm({ ...form, location: { ...form.location, venue: e.target.value } })}
                      placeholder="Centre de conférences, Salle A..."
                      className={`w-full ${isDark ? 'bg-zinc-900/80 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none border-zinc-800 focus:border-[#FF6B00] transition-colors`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Stepper Actions */}
        <div className={`p-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-950 md:bg-zinc-900' : 'border-slate-200 bg-white'} flex items-center justify-between gap-3 flex-shrink-0`}>
          <div>
            {activeStep !== 'details' && (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'visibility') setActiveStep('stream')
                  else if (activeStep === 'stream') setActiveStep('details')
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t('common.cancel', 'Annuler')}
            </button>

            {activeStep !== 'visibility' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'details') {
                    if (validateDetails()) setActiveStep('stream')
                  } else if (activeStep === 'stream') {
                    setActiveStep('visibility')
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{initialEvent ? "Enregistrer les modifications" : t('pro.events.createEvent', "Créer l'Événement")}</span>
              </button>
            )}
          </div>
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

      {/* ALERT MODAL */}
      <ConfirmModal
        isOpen={Boolean(createModalAlert)}
        title={createModalAlert?.title || 'Information'}
        message={createModalAlert?.message || ''}
        confirmText="D'accord"
        isAlert={true}
        type={createModalAlert?.type || 'info'}
        onConfirm={() => setCreateModalAlert(null)}
      />
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
