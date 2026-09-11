import { useState, useEffect, useCallback } from 'react'
import { X, TrendingUp, Users, DollarSign, Eye, Clock, Smartphone, Monitor, Tablet, Loader2, Star } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

interface EventStats {
  views: number
  registrations: number
  attendees: number
  revenue: number
  capacity: number
  peakViewers: number
  averageWatchTime: number
  averageRating?: number
  ratingsCount?: number
  deviceBreakdown: { desktop: number; mobile: number; tablet: number }
  dailyRegistrations: { date: string; count: number }[]
}

interface EventStatsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
}

export default function EventStatsModal({ isOpen, onClose, eventId, eventTitle }: EventStatsModalProps) {
  const [stats, setStats] = useState<EventStats>({
    views: 0,
    registrations: 0,
    attendees: 0,
    revenue: 0,
    capacity: 100,
    peakViewers: 0,
    averageWatchTime: 40,
    averageRating: 5.0,
    ratingsCount: 0,
    deviceBreakdown: { desktop: 52, mobile: 42, tablet: 6 },
    dailyRegistrations: [
      { date: 'Lun', count: 0 }, { date: 'Mar', count: 0 }, { date: 'Mer', count: 0 },
      { date: 'Jeu', count: 0 }, { date: 'Ven', count: 0 }, { date: 'Sam', count: 0 }, { date: 'Dim', count: 0 }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)

  const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')

  const fetchStats = useCallback(async () => {
    if (!cleanId || isNaN(Number(cleanId))) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/stats/`)
      if (res.ok) {
        const data = await res.json()
        setStats(prev => ({
          ...prev,
          ...data,
          capacity: data.capacity || 100,
          deviceBreakdown: data.deviceBreakdown || prev.deviceBreakdown,
          dailyRegistrations: data.dailyRegistrations || prev.dailyRegistrations
        }))
        return
      }
    } catch (err) {
      console.warn('Error fetching stats from API:', err)
    } finally {
      setIsLoading(false)
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(`exile_stats_${eventId}`)
    if (saved) {
      try {
        setStats(JSON.parse(saved))
      } catch {}
    }
  }, [cleanId, eventId])

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen, fetchStats])

  const fillRate = stats.capacity > 0 ? (stats.registrations / stats.capacity) * 100 : 0
  const attendanceRate = stats.registrations > 0 ? (stats.attendees / stats.registrations) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-[#0f0f0f] md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">Statistiques — {eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Eye, value: stats.views, label: 'Vues réelles', color: 'text-blue-400', bg: 'bg-blue-950/30' },
                  { icon: Users, value: stats.registrations, label: 'Inscriptions', color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
                  { icon: DollarSign, value: `${stats.revenue}$`, label: 'Revenus billets', color: 'text-amber-400', bg: 'bg-amber-950/30' },
                  { icon: Star, value: `${stats.averageRating || 5.0}/5`, label: `${stats.ratingsCount || 0} avis`, color: 'text-yellow-400', bg: 'bg-yellow-950/30' }
                ].map((kpi, i) => (
                  <div key={i} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-3.5">
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    <p className="text-lg font-bold text-white">{kpi.value}</p>
                    <p className="text-[11px] text-zinc-400">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Fill Rate */}
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-zinc-300">Taux de remplissage</span>
                  <span className="text-xs font-bold text-emerald-400">{fillRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, fillRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">{stats.registrations} / {stats.capacity} places réservées</p>
              </div>

              {/* Attendance Rate */}
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-zinc-300">Participation estimée</span>
                  <span className="text-xs font-bold text-blue-400">{attendanceRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, attendanceRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">{stats.attendees} participants estimés / {stats.registrations} inscrits</p>
              </div>

              {/* Device Breakdown */}
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
                <h3 className="text-xs font-semibold text-zinc-300 mb-3">Répartition par appareil</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: Smartphone, label: 'Mobile', value: stats.deviceBreakdown.mobile, color: 'bg-blue-500' },
                    { icon: Monitor, label: 'Desktop', value: stats.deviceBreakdown.desktop, color: 'bg-purple-500' },
                    { icon: Tablet, label: 'Tablette', value: stats.deviceBreakdown.tablet, color: 'bg-amber-500' }
                  ].map((device, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <device.icon className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs text-zinc-400 w-16">{device.label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${device.color} rounded-full`} style={{ width: `${device.value}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 w-10 text-right">{device.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Chart */}
              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
                <h3 className="text-xs font-semibold text-zinc-300 mb-3">Progression des inscriptions</h3>
                <div className="flex items-end gap-2 h-28">
                  {stats.dailyRegistrations.map((day, i) => {
                    const max = Math.max(1, ...stats.dailyRegistrations.map(d => d.count))
                    const height = (day.count / max) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className="w-full bg-blue-500/70 rounded-t-md transition-all hover:bg-blue-400 min-h-[4px]"
                          style={{ height: `${Math.max(4, height)}%` }}
                          title={`${day.count} inscrits`}
                        />
                        <span className="text-[10px] text-zinc-500">{day.date}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
