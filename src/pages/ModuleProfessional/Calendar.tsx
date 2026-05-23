import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Video,
  Bell,
  MoreHorizontal,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  duration: string
  type: 'meeting' | 'video' | 'reminder' | 'event'
  with?: string
  description?: string
}

export const Calendar = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  // Données de démo
  const events: CalendarEvent[] = [
    { id: '1', title: 'Consultation M. Dupont', date: '2024-01-25', time: '14:00', duration: '1h', type: 'meeting', with: 'M. Dupont', description: 'Discussion projet salon' },
    { id: '2', title: 'Webinaire Design', date: '2024-01-26', time: '10:00', duration: '2h', type: 'event', description: 'Tendances 2024' },
    { id: '3', title: 'Tournage vidéo', date: '2024-01-28', time: '09:00', duration: '3h', type: 'video', description: 'Tutoriel cuisine' },
    { id: '4', title: 'Rendez-vous Marie L.', date: '2024-01-30', time: '16:00', duration: '1h', type: 'meeting', with: 'Marie L.' },
    { id: '5', title: 'Payer facture', date: '2024-01-28', time: '09:00', duration: '', type: 'reminder' }
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      case 'reminder': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'event': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      default: return resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-400 border-zinc-600' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-3 h-3" />
      case 'video': return <Video className="w-3 h-3" />
      case 'reminder': return <Bell className="w-3 h-3" />
      case 'event': return <CalendarIcon className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const days = getDaysInMonth(currentDate)
  const today = new Date()

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/pro/settings')}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeftIcon className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mon calendrier</h1>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Gérez votre emploi du temps</p>
            </div>
            <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              Nouveau
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex gap-1">
                    <button
                      onClick={prevMonth}
                      className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    >
                      <ChevronLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                    </button>
                    <button
                      onClick={nextMonth}
                      className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    >
                      <ChevronRight className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                    </button>
                  </div>
                </div>
                <div className={`flex gap-1 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-lg p-1`}>
                  {['month', 'week', 'day'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                        viewMode === mode
                          ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm'
                          : resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className={`text-center text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} py-2`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }

                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === currentDate.getMonth() &&
                    today.getFullYear() === currentDate.getFullYear()

                  const dayEvents = getEventsForDate(day)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`aspect-square p-2 rounded-lg border transition-colors text-left ${
                        isToday
                          ? 'border-primary bg-primary/5'
                          : resolvedTheme === 'dark' ? 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${selectedDate?.getDate() === day ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-zinc-800' : ''}`}
                    >
                      <span className={`text-sm font-medium ${isToday ? 'text-primary' : resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                event.type === 'meeting' ? 'bg-blue-500' :
                                event.type === 'video' ? 'bg-purple-500' :
                                event.type === 'reminder' ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-zinc-400">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Sélectionnez une date'
                }
              </h2>

              {selectedDate ? (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate.getDate()).length > 0 ? (
                    getEventsForDate(selectedDate.getDate()).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getEventIcon(event.type)}</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs opacity-80">{event.time} {event.duration && `(${event.duration})`}</p>
                            {event.with && <p className="text-xs opacity-80">avec {event.with}</p>}
                            {event.description && <p className="text-xs opacity-70 mt-1">{event.description}</p>}
                          </div>
                          <button className={`${resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-center py-4`}>Aucun événement ce jour</p>
                  )}
                </div>
              ) : (
                <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-center py-4`}>Cliquez sur une date pour voir les événements</p>
              )}

              <button className={`w-full mt-4 py-2 border ${resolvedTheme === 'dark' ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}>
                <Plus className="w-4 h-4" />
                Ajouter un événement
              </button>
            </div>

            {/* Upcoming Events */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Prochains événements</h2>
              <div className="space-y-3">
                {events.slice(0, 4).map((event) => (
                  <div key={event.id} className={`flex items-start gap-3 p-2 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'} rounded-lg transition-colors`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{event.title}</p>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>Légende</h2>
              <div className="space-y-2">
                {[
                  { type: 'meeting', label: 'Rendez-vous', color: 'bg-blue-500' },
                  { type: 'video', label: 'Tournage', color: 'bg-purple-500' },
                  { type: 'reminder', label: 'Rappel', color: 'bg-amber-500' },
                  { type: 'event', label: 'Événement', color: 'bg-green-500' }
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar
