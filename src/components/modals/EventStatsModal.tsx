import { useMemo } from 'react'
import { X, TrendingUp, Users, DollarSign, Eye, Clock, Smartphone, Monitor, Tablet } from 'lucide-react'

interface EventStats {
  views: number
  registrations: number
  attendees: number
  revenue: number
  capacity: number
  peakViewers: number
  averageWatchTime: number
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
  const stats: EventStats = useMemo(() => {
    const saved = localStorage.getItem(`exile_stats_${eventId}`)
    if (saved) return JSON.parse(saved)
    return {
      views: 1240,
      registrations: 386,
      attendees: 342,
      revenue: 8400,
      capacity: 500,
      peakViewers: 256,
      averageWatchTime: 45,
      deviceBreakdown: { desktop: 45, mobile: 48, tablet: 7 },
      dailyRegistrations: [
        { date: 'Lun', count: 12 }, { date: 'Mar', count: 28 }, { date: 'Mer', count: 45 },
        { date: 'Jeu', count: 38 }, { date: 'Ven', count: 52 }, { date: 'Sam', count: 89 }, { date: 'Dim', count: 122 }
      ]
    }
  }, [eventId])

  const fillRate = (stats.registrations / stats.capacity) * 100
  const attendanceRate = stats.registrations > 0 ? (stats.attendees / stats.registrations) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="bg-[#0f0f0f] md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Statistiques — {eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Eye, value: stats.views, label: 'Vues', color: 'text-blue-400', bg: 'bg-blue-950/30' },
              { icon: Users, value: stats.registrations, label: 'Inscrits', color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
              { icon: DollarSign, value: `${stats.revenue}€`, label: 'Revenus', color: 'text-amber-400', bg: 'bg-amber-950/30' },
              { icon: Clock, value: `${stats.averageWatchTime}m`, label: 'Temps moyen', color: 'text-purple-400', bg: 'bg-purple-950/30' }
            ].map((kpi, i) => (
              <div key={i} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-3">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-lg font-bold text-white">{kpi.value}</p>
                <p className="text-[10px] text-zinc-500">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Fill Rate */}
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Taux de remplissage</span>
              <span className="text-sm font-bold text-emerald-400">{fillRate.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${fillRate}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">{stats.registrations} / {stats.capacity} places</p>
          </div>

          {/* Attendance Rate */}
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Taux de présence</span>
              <span className="text-sm font-bold text-blue-400">{attendanceRate.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">{stats.attendees} / {stats.registrations} présents</p>
          </div>

          {/* Device Breakdown */}
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Appareils</h3>
            <div className="space-y-2">
              {[
                { icon: Smartphone, label: 'Mobile', value: stats.deviceBreakdown.mobile, color: 'bg-blue-500' },
                { icon: Monitor, label: 'Desktop', value: stats.deviceBreakdown.desktop, color: 'bg-purple-500' },
                { icon: Tablet, label: 'Tablet', value: stats.deviceBreakdown.tablet, color: 'bg-amber-500' }
              ].map((device, i) => (
                <div key={i} className="flex items-center gap-3">
                  <device.icon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400 w-16">{device.label}</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${device.color} rounded-full`} style={{ width: `${device.value}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 text-right">{device.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Chart */}
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Inscriptions par jour</h3>
            <div className="flex items-end gap-2 h-32">
              {stats.dailyRegistrations.map((day, i) => {
                const max = Math.max(...stats.dailyRegistrations.map(d => d.count))
                const height = max > 0 ? (day.count / max) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500/60 rounded-t-md transition-all hover:bg-blue-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-zinc-500">{day.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
