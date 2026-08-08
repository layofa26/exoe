import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User state
interface User {
  id: string | number
  username: string
  email?: string
  fullName?: string
  avatarUrl?: string
}

// Video state
interface Video {
  id: string | number
  title: string
  thumbnailUrl?: string
  author?: {
    id: string | number
    name?: string
    avatarUrl?: string
  }
  createdAt?: string
}

// Event state
interface Event {
  id: string | number
  title: string
  startDate?: string
  organizerId?: string | number
  organizerName?: string
  organizerAvatar?: string
}

// Request state
interface Request {
  id: string | number
  senderId?: string | number
  receiverId?: string | number
  status?: 'pending' | 'accepte' | 'refuse'
  createdAt?: string
}

// Subscription state
interface Subscription {
  id: string | number
  name: string
  avatar?: string | null
  profession: string
  subscribedAt: string
}

interface AppState {
  // User
  user: User | null
  setUser: (user: User | null) => void
  
  // Auth
  isAuthenticated: boolean
  setAuthenticated: (isAuthenticated: boolean) => void
  logout: () => void
  
  // Videos
  videos: Video[]
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  removeVideo: (videoId: string | number) => void
  
  // Events
  events: Event[]
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  removeEvent: (eventId: string | number) => void
  
  // Requests
  requests: Request[]
  setRequests: (requests: Request[]) => void
  addRequest: (request: Request) => void
  updateRequest: (requestId: string | number, status: string) => void
  removeRequest: (requestId: string | number) => void
  
  // Subscriptions
  subscriptions: Subscription[]
  setSubscriptions: (subscriptions: Subscription[]) => void
  addSubscription: (subscription: Subscription) => void
  removeSubscription: (subscriptionId: string | number) => void
  
  // Favorites
  favorites: Video[]
  setFavorites: (favorites: Video[]) => void
  addFavorite: (video: Video) => void
  removeFavorite: (videoId: string | number) => void
  
  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  // Notifications
  unreadCount: number
  setUnreadCount: (count: number) => void
  
  // Clear all data
  clearAll: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Auth
      isAuthenticated: false,
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        videos: [],
        events: [],
        requests: [],
        subscriptions: [],
        favorites: []
      }),
      
      // Videos
      videos: [],
      setVideos: (videos) => set({ videos }),
      addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
      removeVideo: (videoId) => set((state) => ({ 
        videos: state.videos.filter(v => v.id !== videoId) 
      })),
      
      // Events
      events: [],
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
      removeEvent: (eventId) => set((state) => ({ 
        events: state.events.filter(e => e.id !== eventId) 
      })),
      
      // Requests
      requests: [],
      setRequests: (requests) => set({ requests }),
      addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
      updateRequest: (requestId, status) => set((state) => ({
        requests: state.requests.map(r => 
          r.id === requestId ? { ...r, status: status as any } : r
        )
      })),
      removeRequest: (requestId) => set((state) => ({ 
        requests: state.requests.filter(r => r.id !== requestId) 
      })),
      
      // Subscriptions
      subscriptions: [],
      setSubscriptions: (subscriptions) => set({ subscriptions }),
      addSubscription: (subscription) => set((state) => ({ 
        subscriptions: [subscription, ...state.subscriptions] 
      })),
      removeSubscription: (subscriptionId) => set((state) => ({ 
        subscriptions: state.subscriptions.filter(s => s.id !== subscriptionId) 
      })),
      
      // Favorites
      favorites: [],
      setFavorites: (favorites) => set({ favorites }),
      addFavorite: (video) => set((state) => ({ favorites: [video, ...state.favorites] })),
      removeFavorite: (videoId) => set((state) => ({ 
        favorites: state.favorites.filter(v => v.id !== videoId) 
      })),
      
      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Notifications
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      // Clear all data
      clearAll: () => set({
        user: null,
        isAuthenticated: false,
        videos: [],
        events: [],
        requests: [],
        subscriptions: [],
        favorites: [],
        unreadCount: 0
      })
    }),
    {
      name: 'exile-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        videos: state.videos,
        events: state.events,
        requests: state.requests,
        subscriptions: state.subscriptions,
        favorites: state.favorites,
      })
    }
  )
)
