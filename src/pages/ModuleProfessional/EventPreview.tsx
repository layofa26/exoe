import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Video, Users, ArrowLeft,
  CheckCircle, Play, Share2, Heart, Bookmark
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useEventsAlgo } from '../../algoPro/signals/useEventsAlgo'

interface EventData {
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
  price: number
  isLive: boolean
  organizerName: string
  organizerAvatar?: string
}

export default function EventPreview() {
  const { resolvedTheme } = useTheme()
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventData | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)

  // Récupérer ou créer un userId pour les signaux algorithmiques
  const userId = localStorage.getItem('exile_user_id') || 'user_default'
  
  // Initialiser useEventsAlgo pour tracker les signaux d'événements
  const eventsAlgo = useEventsAlgo(userId)

  useEffect(() => {
    // Simuler chargement de l'événement depuis localStorage
    const savedEvents = localStorage.getItem('exile_events')
    if (savedEvents) {
      const events = JSON.parse(savedEvents)
      const foundEvent = events.find((e: EventData) => e.id === eventId)
      if (foundEvent) {
        setEvent(foundEvent)
        
        // Démarrer le tracking de l'événement
        eventsAlgo.startTracking(foundEvent as any)
      }
    }
    
    // Animation d'entrée
    setTimeout(() => setIsAnimating(false), 500)

    // Arrêter le tracking quand on quitte la page
    return () => {
      eventsAlgo.stopTracking()
    }
  }, [eventId, eventsAlgo])

  const handleGoLive = () => {
    if (event) {
      navigate(`/pro/events/${eventId}/live`)
    }
  }

  const handlePublish = () => {
    if (event && eventId) {
      // Mettre à jour le statut à published
      const savedEvents = localStorage.getItem('exile_events')
      if (savedEvents) {
        const events = JSON.parse(savedEvents)
        const updatedEvents = events.map((e: EventData) => 
          e.id === eventId ? { ...e, status: 'published' as const } : e
        )
        localStorage.setItem('exile_events', JSON.stringify(updatedEvents))
      }
      
      // Marquer l'événement comme enregistré avec useEventsAlgo
      eventsAlgo.markEventRegistered(eventId)
      
      navigate('/pro/events')
    }
  }

  if (!event) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      {/* HEADER AVEC FLECHE RETOUR */}
      <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white border-gray-200'} backdrop-blur-md border-b z-50 px-3 sm:px-4 py-3 sm:py-4`}>
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/pro/events')}
            className={`p-1.5 sm:p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} rounded-full transition-colors group`}
          >
            <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'} transition-colors`} />
          </button>
          <div className="flex-1">
            <h1 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Prévisualisation</h1>
            <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Vérifiez avant de publier</p>
          </div>
          <button
            onClick={handlePublish}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{event.status === 'draft' ? 'Publier' : 'Publié'}</span>
            <span className="sm:hidden">{event.status === 'draft' ? 'Publier' : 'Publié'}</span>
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* CARTE ÉVÉNEMENT */}
        <div className={`group ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-2xl border overflow-hidden transition-all duration-300`}>
          {/* IMAGE */}
          <div className={`relative h-48 sm:h-56 md:h-64 lg:h-80 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'} overflow-hidden`}>
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-zinc-800 via-zinc-900 to-black' : 'from-gray-200 via-gray-300 to-gray-400'} flex items-center justify-center`}>
                <Calendar className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
              </div>
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${resolvedTheme === 'dark' ? 'from-black' : 'from-gray-900/80'} via-transparent to-transparent`} />

            {/* BADGES */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex gap-1.5 sm:gap-2">
              {event.isLive && (
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase animate-pulse">
                  Live
                </span>
              )}
              <span className={`${resolvedTheme === 'dark' ? 'bg-zinc-700/90 text-zinc-300' : 'bg-gray-800/90 text-gray-200'} backdrop-blur text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase`}>
                {event.category}
              </span>
            </div>

            {/* PRIX */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              {event.price > 0 ? (
                <div className="bg-black/60 backdrop-blur text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full">
                  {event.price}€
                </div>
              ) : (
                <div className="bg-emerald-600/80 backdrop-blur text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-full uppercase">
                  Gratuit
                </div>
              )}
            </div>
          </div>

          {/* CONTENU */}
          <div className="p-4 sm:p-6">
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>{event.title}</h2>
            <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-4 sm:mb-6 line-clamp-3 text-xs sm:text-sm md:text-base`}>{event.description}</p>

            {/* INFO */}
            <div className={`flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-4 sm:mb-6`}>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
                {formatDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                {event.format === 'virtual' ? (
                  <><Video className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} /> En ligne</>
                ) : (
                  <><MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} /> {event.location?.city}</>
                )}
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
                {event.capacity} places
              </span>
            </div>

            {/* ORGANISATEUR */}
            <div className={`flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                {event.organizerAvatar ? (
                  <img src={event.organizerAvatar} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{event.organizerName.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className={`font-medium text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{event.organizerName}</p>
                <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Organisateur</p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {event.isLive && (
                <button
                  onClick={handleGoLive}
                  className="flex-1 min-w-[100px] sm:min-w-[120px] bg-red-600 text-white py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 animate-pulse"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  Rejoindre
                </button>
              )}
              <button className={`flex-1 min-w-[100px] sm:min-w-[120px] ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2`}>
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Partager</span>
                <span className="sm:hidden">Partager</span>
              </button>
              <button className={`flex-1 min-w-[100px] sm:min-w-[120px] ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2`}>
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">J'aime</span>
                <span className="sm:hidden">J'aime</span>
              </button>
              <button className={`flex-1 min-w-[100px] sm:min-w-[120px] ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2`}>
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sauvegarder</span>
                <span className="sm:hidden">Sauver</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-4 sm:p-6`}>
          <h3 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>Statistiques estimées</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`}>0</p>
              <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Vues</p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-400'}`}>0</p>
              <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Inscriptions</p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-purple-300' : 'text-purple-400'}`}>0</p>
              <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Partages</p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-orange-300' : 'text-orange-400'}`}>0€</p>
              <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Revenus</p>
            </div>
          </div>
        </div>

        {/* CONSEILS */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-950/30 border-blue-800/40'} rounded-2xl border p-4 sm:p-6`}>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
            <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
            Conseils avant publication
          </h3>
          <ul className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
            <li className="flex items-start gap-2">
              <span className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'} mt-0.5 sm:mt-1`}>•</span>
              Vérifiez que l'image de couverture est de bonne qualité
            </li>
            <li className="flex items-start gap-2">
              <span className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'} mt-0.5 sm:mt-1`}>•</span>
              Assurez-vous que la description est claire et attrayante
            </li>
            <li className="flex items-start gap-2">
              <span className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'} mt-0.5 sm:mt-1`}>•</span>
              Testez le lien virtuel si l'événement est en ligne
            </li>
            <li className="flex items-start gap-2">
              <span className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'} mt-0.5 sm:mt-1`}>•</span>
              Partagez l'événement sur vos réseaux sociaux
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
