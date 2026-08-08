import { useState, useRef, useEffect } from 'react'
import { X, QrCode, CheckCircle, User, Clock } from 'lucide-react'

interface Attendee {
  id: string
  name: string
  email: string
  ticketType: string
  checkedIn: boolean
  checkedInAt?: string
}

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
}

export default function QRScannerModal({ isOpen, onClose, eventId, eventTitle }: QRScannerModalProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [attendees, setAttendees] = useState<Attendee[]>(() => {
    const saved = localStorage.getItem(`exile_attendees_${eventId}`)
    if (saved) return JSON.parse(saved)
    return [
      { id: 'reg-1', name: 'Alice Martin', email: 'alice@email.com', ticketType: 'Standard', checkedIn: false },
      { id: 'reg-2', name: 'Bob Dupont', email: 'bob@email.com', ticketType: 'VIP', checkedIn: true, checkedInAt: '14:30' },
      { id: 'reg-3', name: 'Claire Lefebvre', email: 'claire@email.com', ticketType: 'Standard', checkedIn: false }
    ]
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  const saveAttendees = (updated: Attendee[]) => {
    setAttendees(updated)
    localStorage.setItem(`exile_attendees_${eventId}`, JSON.stringify(updated))
  }

  const checkIn = (attendeeId: string) => {
    const updated = attendees.map(a =>
      a.id === attendeeId
        ? { ...a, checkedIn: true, checkedInAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
        : a
    )
    saveAttendees(updated)
    setScanResult('Check-in réussi !')
    setTimeout(() => setScanResult(null), 2000)
  }

  const handleManualCheckIn = () => {
    const attendee = attendees.find(a =>
      a.email.toLowerCase() === manualInput.toLowerCase() ||
      a.id.toLowerCase() === manualInput.toLowerCase()
    )
    if (attendee) {
      checkIn(attendee.id)
      setManualInput('')
    } else {
      setScanResult('Participant non trouvé')
      setTimeout(() => setScanResult(null), 2000)
    }
  }

  // Simuler caméra
  useEffect(() => {
    if (mode === 'camera' && videoRef.current) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch(() => {
          setMode('manual')
        })
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
    }
  }, [mode])

  const checkedInCount = attendees.filter(a => a.checkedIn).length
  const totalCount = attendees.length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="bg-[#0f0f0f] md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Check-in — {eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Progression</span>
              <span className="text-sm font-bold text-emerald-400">{checkedInCount}/{totalCount}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'manual' ? 'bg-white text-gray-900' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Mode manuel
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'camera' ? 'bg-white text-gray-900' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Caméra
            </button>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div className={`text-center py-3 rounded-xl text-sm font-medium ${
              scanResult.includes('réussi') ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/30 text-red-400 border border-red-800/50'
            }`}>
              {scanResult}
            </div>
          )}

          {mode === 'camera' ? (
            <div className="aspect-square bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500/50 rounded-2xl" />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-zinc-500">
                Placez le QR code dans le cadre
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Manual input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Email ou ID du participant"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()}
                />
                <button
                  onClick={handleManualCheckIn}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Attendees list */}
              <div className="space-y-2">
                {attendees.map(attendee => (
                  <div
                    key={attendee.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      attendee.checkedIn
                        ? 'bg-emerald-950/20 border-emerald-800/30'
                        : 'bg-zinc-900/60 border-zinc-800/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{attendee.name}</p>
                      <p className="text-xs text-zinc-500">{attendee.ticketType}</p>
                    </div>
                    {attendee.checkedIn ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{attendee.checkedInAt}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => checkIn(attendee.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Check-in
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
