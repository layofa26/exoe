import { useState } from 'react'
import { X, Ticket, Users, DollarSign, QrCode } from 'lucide-react'

interface TicketType {
  id: string
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
  const [tickets, setTickets] = useState<TicketType[]>(() => {
    const saved = localStorage.getItem(`exile_tickets_${eventId}`)
    if (saved) return JSON.parse(saved)
    return [
      { id: 't1', name: 'Standard', description: 'Accès complet à l\'événement', price: 0, quantity: 100, sold: 42 }
    ]
  })
  const [newTicket, setNewTicket] = useState({ name: '', description: '', price: 0, quantity: 1 })
  const [showCreate, setShowCreate] = useState(false)

  const saveTickets = (updated: TicketType[]) => {
    setTickets(updated)
    localStorage.setItem(`exile_tickets_${eventId}`, JSON.stringify(updated))
  }

  const addTicket = () => {
    if (!newTicket.name.trim()) return
    const ticket: TicketType = {
      id: `ticket_${Date.now()}`,
      name: newTicket.name,
      description: newTicket.description,
      price: newTicket.price,
      quantity: newTicket.quantity,
      sold: 0
    }
    saveTickets([...tickets, ticket])
    setNewTicket({ name: '', description: '', price: 0, quantity: 1 })
    setShowCreate(false)
  }

  const deleteTicket = (id: string) => {
    saveTickets(tickets.filter(t => t.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="bg-[#0f0f0f] md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t md:border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Tickets — {eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Liste tickets */}
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-zinc-900/80 rounded-xl border border-zinc-800/60 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{ticket.name}</h3>
                  <p className="text-xs text-zinc-500">{ticket.description}</p>
                </div>
                <button
                  onClick={() => deleteTicket(ticket.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {ticket.price === 0 ? 'Gratuit' : `${ticket.price}€`}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {ticket.sold}/{ticket.quantity} vendus
                </span>
                <span className="text-zinc-500">
                  {(ticket.sold / ticket.quantity * 100).toFixed(0)}%
                </span>
              </div>
              {/* Barre de progression */}
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(ticket.sold / ticket.quantity) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Ajouter ticket */}
          {showCreate ? (
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-4 space-y-3">
              <input
                placeholder="Nom du ticket"
                value={newTicket.name}
                onChange={e => setNewTicket({ ...newTicket, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Description"
                value={newTicket.description}
                onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Prix (€)"
                  min={0}
                  value={newTicket.price}
                  onChange={e => setNewTicket({ ...newTicket, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Quantité"
                  min={1}
                  value={newTicket.quantity}
                  onChange={e => setNewTicket({ ...newTicket, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={addTicket}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm font-medium hover:border-zinc-700 hover:text-zinc-300 transition-colors"
            >
              + Ajouter un type de ticket
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
