import { useState, useEffect, useCallback } from 'react'
import { X, Ticket, Users, DollarSign, Loader2, Plus } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

interface TicketType {
  id: string | number
  name: string
  description: string
  price: number
  quantity: number
  sold: number
}

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
}

export default function TicketModal({ isOpen, onClose, eventId, eventTitle }: TicketModalProps) {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTicket, setNewTicket] = useState({ name: '', description: '', price: 0, quantity: 100 })
  const [showCreate, setShowCreate] = useState(false)

  const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')

  const fetchTickets = useCallback(async () => {
    if (!cleanId || isNaN(Number(cleanId))) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/tickets/`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data)
          return
        }
      }
    } catch (err) {
      console.warn('Error fetching tickets from API:', err)
    } finally {
      setIsLoading(false)
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(`exile_tickets_${eventId}`)
    if (saved) {
      try {
        setTickets(JSON.parse(saved))
        return
      } catch {}
    }
    setTickets([
      { id: 't1', name: 'Standard', description: "Accès complet à l'événement", price: 0, quantity: 100, sold: 0 }
    ])
  }, [cleanId, eventId])

  useEffect(() => {
    if (isOpen) {
      fetchTickets()
    }
  }, [isOpen, fetchTickets])

  const addTicket = async () => {
    if (!newTicket.name.trim()) return
    setIsSubmitting(true)
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/tickets/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newTicket)
        })
        if (res.ok) {
          const created = await res.json()
          setTickets(prev => [...prev, created])
          setNewTicket({ name: '', description: '', price: 0, quantity: 100 })
          setShowCreate(false)
          setIsSubmitting(false)
          return
        }
      } catch (err) {
        console.warn('Error adding ticket via API:', err)
      }
    }

    // Local fallback
    const ticket: TicketType = {
      id: `ticket_${Date.now()}`,
      name: newTicket.name,
      description: newTicket.description,
      price: newTicket.price,
      quantity: newTicket.quantity,
      sold: 0
    }
    const updated = [...tickets, ticket]
    setTickets(updated)
    localStorage.setItem(`exile_tickets_${eventId}`, JSON.stringify(updated))
    setNewTicket({ name: '', description: '', price: 0, quantity: 100 })
    setShowCreate(false)
    setIsSubmitting(false)
  }

  const deleteTicket = async (id: string | number) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    if (token && cleanId && !isNaN(Number(cleanId)) && typeof id === 'number') {
      try {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/tickets/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (err) {
        console.warn('Error deleting ticket via API:', err)
      }
    }

    const updated = tickets.filter(t => String(t.id) !== String(id))
    setTickets(updated)
    localStorage.setItem(`exile_tickets_${eventId}`, JSON.stringify(updated))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-[#0f0f0f] md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">Billetterie — {eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Liste tickets */}
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{ticket.name}</h3>
                      <p className="text-xs text-zinc-500">{ticket.description || 'Accès à la session'}</p>
                    </div>
                    <button
                      onClick={() => deleteTicket(ticket.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Supprimer ce billet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      {Number(ticket.price) === 0 ? 'Gratuit' : `${ticket.price}$`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {ticket.sold}/{ticket.quantity} vendus
                    </span>
                    <span className="text-zinc-500">
                      {ticket.quantity > 0 ? (ticket.sold / ticket.quantity * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  {/* Barre de progression */}
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${ticket.quantity > 0 ? Math.min(100, (ticket.sold / ticket.quantity) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Ajouter ticket */}
              {showCreate ? (
                <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-4 space-y-3 animate-in fade-in">
                  <input
                    placeholder="Nom du ticket (ex: Standard, VIP, Accès Backstage)"
                    value={newTicket.name}
                    onChange={e => setNewTicket({ ...newTicket, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <input
                    placeholder="Description du ticket"
                    value={newTicket.description}
                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Prix ($)</label>
                      <input
                        type="number"
                        placeholder="Prix ($)"
                        min={0}
                        value={newTicket.price}
                        onChange={e => setNewTicket({ ...newTicket, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Places disponibles</label>
                      <input
                        type="number"
                        placeholder="Quantité"
                        min={1}
                        value={newTicket.quantity}
                        onChange={e => setNewTicket({ ...newTicket, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={addTicket}
                      disabled={isSubmitting || !newTicket.name.trim()}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="w-full py-2.5 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-400 text-xs font-semibold hover:border-blue-500/50 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un type de billet</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
