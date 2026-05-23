// Hook pou jere evenman - 100% Frontend (LocalStorage)
import { useState, useEffect, useCallback } from 'react'
import type { Event, Ticket, Registration, PromoCode, EventStatus } from '../types/events'
import { STORAGE_KEYS, MAX_EVENTS_PER_USER } from '../types/events'

export interface UseEventsReturn {
  // Evenman
  events: Event[]
  myEvents: Event[]
  loading: boolean
  error: string | null
  
  // Kreye & modifye
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => { success: boolean; error?: string; event?: Event }
  updateEvent: (eventId: string, updates: Partial<Event>) => { success: boolean; error?: string }
  deleteEvent: (eventId: string) => { success: boolean; error?: string }
  publishEvent: (eventId: string) => { success: boolean; error?: string }
  cancelEvent: (eventId: string) => { success: boolean; error?: string }
  
  // Tikè
  createTicket: (eventId: string, ticketData: Omit<Ticket, 'id' | 'createdAt'>) => { success: boolean; error?: string; ticket?: Ticket }
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => { success: boolean; error?: string }
  deleteTicket: (ticketId: string) => { success: boolean; error?: string }
  getEventTickets: (eventId: string) => Ticket[]
  
  // Registrations
  registrations: Registration[]
  createRegistration: (registrationData: Omit<Registration, 'id' | 'registeredAt' | 'updatedAt'>) => { success: boolean; error?: string; registration?: Registration }
  checkInAttendee: (registrationId: string) => { success: boolean; error?: string }
  getEventRegistrations: (eventId: string) => Registration[]
  getMyRegistrations: () => Registration[]
  
  // Estatistik
  getEventStats: (eventId: string) => {
    registrations: number
    attendees: number
    revenue: number
    capacity: number
    fillRate: number
  }
  
  // Filtre & rechèch
  searchEvents: (query: string, filters?: { category?: string; type?: string; format?: string; status?: EventStatus }) => Event[]
}

export const useEvents = (userId: string): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Chaje done depi LocalStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Chaje tout evenman
        const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents))
        }

        // Chaje tout tikè
        const savedTickets = localStorage.getItem(STORAGE_KEYS.TICKETS)
        if (savedTickets) {
          setTickets(JSON.parse(savedTickets))
        }

        // Chaje tout registrations
        const savedRegistrations = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)
        if (savedRegistrations) {
          setRegistrations(JSON.parse(savedRegistrations))
        }

        setLoading(false)
      } catch (err) {
        setError('Erreur lors du chargement des événements')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Sove evenman yo
  const saveEvents = useCallback((newEvents: Event[]) => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(newEvents))
    setEvents(newEvents)
  }, [])

  // Sove tikè yo
  const saveTickets = useCallback((newTickets: Ticket[]) => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(newTickets))
    setTickets(newTickets)
  }, [])

  // Sove registrations yo
  const saveRegistrations = useCallback((newRegistrations: Registration[]) => {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(newRegistrations))
    setRegistrations(newRegistrations)
  }, [])

  // Kreye yon evenman
  const createEvent = useCallback((eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => {
    // Verifye limit
    const userEvents = events.filter(e => e.organizerId === userId)
    if (userEvents.length >= MAX_EVENTS_PER_USER) {
      return { success: false, error: `Limite de ${MAX_EVENTS_PER_USER} événements atteinte` }
    }

    const newEvent: Event = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        views: 0,
        registrations: 0,
        attendees: 0,
        revenue: 0
      }
    }

    const updatedEvents = [...events, newEvent]
    saveEvents(updatedEvents)

    return { success: true, event: newEvent }
  }, [events, userId, saveEvents])

  // Modifye yon evenman
  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    const eventIndex = events.findIndex(e => e.id === eventId)
    if (eventIndex === -1) {
      return { success: false, error: 'Événement non trouvé' }
    }

    const updatedEvents = [...events]
    updatedEvents[eventIndex] = {
      ...updatedEvents[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    saveEvents(updatedEvents)
    return { success: true }
  }, [events, saveEvents])

  // Siprime yon evenman
  const deleteEvent = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    if (event.organizerId !== userId) {
      return { success: false, error: 'Non autorisé' }
    }

    const updatedEvents = events.filter(e => e.id !== eventId)
    saveEvents(updatedEvents)

    // Siprime tikè ak registrations asosye yo
    const updatedTickets = tickets.filter(t => t.eventId !== eventId)
    saveTickets(updatedTickets)

    const updatedRegistrations = registrations.filter(r => r.eventId !== eventId)
    saveRegistrations(updatedRegistrations)

    return { success: true }
  }, [events, tickets, registrations, userId, saveEvents, saveTickets, saveRegistrations])

  // Pibliye yon evenman
  const publishEvent = useCallback((eventId: string) => {
    return updateEvent(eventId, { 
      status: 'published',
      publishedAt: new Date().toISOString()
    })
  }, [updateEvent])

  // Anile yon evenman
  const cancelEvent = useCallback((eventId: string) => {
    return updateEvent(eventId, { status: 'cancelled' })
  }, [updateEvent])

  // Kreye yon tikè
  const createTicket = useCallback((eventId: string, ticketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const event = events.find(e => e.id === eventId)
    if (!event || event.organizerId !== userId) {
      return { success: false, error: 'Non autorisé' }
    }

    const newTicket: Ticket = {
      ...ticketData,
      id: `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }

    const updatedTickets = [...tickets, newTicket]
    saveTickets(updatedTickets)

    return { success: true, ticket: newTicket }
  }, [events, tickets, userId, saveTickets])

  // Modifye yon tikè
  const updateTicket = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId)
    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    const updatedTickets = [...tickets]
    updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], ...updates }
    saveTickets(updatedTickets)

    return { success: true }
  }, [tickets, saveTickets])

  // Siprime yon tikè
  const deleteTicket = useCallback((ticketId: string) => {
    const updatedTickets = tickets.filter(t => t.id !== ticketId)
    saveTickets(updatedTickets)
    return { success: true }
  }, [tickets, saveTickets])

  // Jwenn tout tikè pou yon evenman
  const getEventTickets = useCallback((eventId: string) => {
    return tickets.filter(t => t.eventId === eventId)
  }, [tickets])

  // Kreye yon registration
  const createRegistration = useCallback((registrationData: Omit<Registration, 'id' | 'registeredAt' | 'updatedAt'>) => {
    // Verifye si tikè a disponib
    const ticket = tickets.find(t => t.id === registrationData.ticketId)
    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    if (ticket.sold + registrationData.quantity > ticket.quantity) {
      return { success: false, error: 'Plus assez de tickets disponibles' }
    }

    const newRegistration: Registration = {
      ...registrationData,
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedRegistrations = [...registrations, newRegistration]
    saveRegistrations(updatedRegistrations)

    // Mete ajou kantite tikè vann
    const updatedTickets = tickets.map(t => 
      t.id === ticket.id ? { ...t, sold: t.sold + registrationData.quantity } : t
    )
    saveTickets(updatedTickets)

    // Mete ajou estatistik evenman an
    const event = events.find(e => e.id === registrationData.eventId)
    if (event) {
      const updatedEvents = events.map(e => 
        e.id === event.id ? { 
          ...e, 
          stats: { 
            ...e.stats, 
            registrations: e.stats.registrations + registrationData.quantity,
            revenue: e.stats.revenue + registrationData.totalAmount
          }
        } : e
      )
      saveEvents(updatedEvents)
    }

    return { success: true, registration: newRegistration }
  }, [tickets, registrations, events, saveTickets, saveRegistrations, saveEvents])

  // Tchek-in yon patisipan
  const checkInAttendee = useCallback((registrationId: string) => {
    const regIndex = registrations.findIndex(r => r.id === registrationId)
    if (regIndex === -1) {
      return { success: false, error: 'Inscription non trouvée' }
    }

    const updatedRegistrations = [...registrations]
    updatedRegistrations[regIndex] = {
      ...updatedRegistrations[regIndex],
      status: 'attended',
      checkedInAt: new Date().toISOString(),
      checkedInBy: userId
    }

    saveRegistrations(updatedRegistrations)

    // Mete ajou estatistik evenman an
    const eventId = updatedRegistrations[regIndex].eventId
    const event = events.find(e => e.id === eventId)
    if (event) {
      const updatedEvents = events.map(e => 
        e.id === eventId ? { 
          ...e, 
          stats: { 
            ...e.stats, 
            attendees: e.stats.attendees + updatedRegistrations[regIndex].quantity
          }
        } : e
      )
      saveEvents(updatedEvents)
    }

    return { success: true }
  }, [registrations, events, userId, saveRegistrations, saveEvents])

  // Jwenn tout registrations pou yon evenman
  const getEventRegistrations = useCallback((eventId: string) => {
    return registrations.filter(r => r.eventId === eventId)
  }, [registrations])

  // Jwenn tout registrations itilizatè kouran an
  const getMyRegistrations = useCallback(() => {
    return registrations.filter(r => r.attendeeId === userId)
  }, [registrations, userId])

  // Jwenn estatistik yon evenman
  const getEventStats = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) {
      return { registrations: 0, attendees: 0, revenue: 0, capacity: 0, fillRate: 0 }
    }

    const eventTickets = tickets.filter(t => t.eventId === eventId)
    const totalCapacity = eventTickets.reduce((sum, t) => sum + t.quantity, 0)
    const totalSold = eventTickets.reduce((sum, t) => sum + t.sold, 0)

    return {
      registrations: event.stats.registrations,
      attendees: event.stats.attendees,
      revenue: event.stats.revenue,
      capacity: totalCapacity,
      fillRate: totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0
    }
  }, [events, tickets])

  // Rechèch evenman
  const searchEvents = useCallback((query: string, filters?: { category?: string; type?: string; format?: string; status?: EventStatus }) => {
    let results = events.filter(e => e.status === 'published')

    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(e => 
        e.title.toLowerCase().includes(lowerQuery) ||
        e.description.toLowerCase().includes(lowerQuery) ||
        e.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    }

    if (filters?.category) {
      results = results.filter(e => e.category === filters.category)
    }

    if (filters?.type) {
      results = results.filter(e => e.type === filters.type)
    }

    if (filters?.format) {
      results = results.filter(e => e.format === filters.format)
    }

    if (filters?.status) {
      results = results.filter(e => e.status === filters.status)
    }

    // Tcheke pa dat (pi resan anvan)
    return results.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [events])

  // Lis evenman pwopriyetè a
  const myEvents = events.filter(e => e.organizerId === userId)

  return {
    events,
    myEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    cancelEvent,
    createTicket,
    updateTicket,
    deleteTicket,
    getEventTickets,
    registrations,
    createRegistration,
    checkInAttendee,
    getEventRegistrations,
    getMyRegistrations,
    getEventStats,
    searchEvents
  }
}
