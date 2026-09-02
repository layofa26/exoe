import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useRecentSearches } from '../../hooks/useRecentSearches'
import { unwrapList } from '../../services/videoApi'
import type { NavLinkType } from '../../types'
import { notificationService, type AppNotification } from '../../services/notificationService'
import { syncRemotePubNotifications } from '../../services/pubNotificationService'
import {
  User,
  LogOut,
  Building2,
  Briefcase,
  Bell,
  Search,
  Filter,
  Clock,
  TrendingUp,
  History,
  X,
  MessageSquare,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  Video as VideoIcon,
  Calendar as CalendarIcon,
  Sparkles,
  Megaphone,
  Radio,
  ArrowRight
} from 'lucide-react'
import { UploadVideo } from '../video/UploadVideo'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

export const Header = (): JSX.Element => {
  const { isAuthenticated, user, logout, hasModuleAccess } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Cacher la barre de recherche sur la page d'accueil, login, register et forgot password
  const isLandingPage = location.pathname === '/'
  const isAuthPage = ['/login', '/register', '/forgot-password', '/forgot-email', '/reset-password'].includes(location.pathname)
  const hideSearchBar = isLandingPage || isAuthPage

  // Scroll behavior - header suit le feed et redescend immédiatement dès qu'on remonte
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = (e?: Event) => {
      const target = e?.target as HTMLElement | undefined
      const currentScrollY =
        target && typeof target.scrollTop === 'number' && target.scrollTop > 0
          ? target.scrollTop
          : window.scrollY || document.documentElement.scrollTop || 0

      const delta = currentScrollY - lastScrollY

      if (delta > 8 && currentScrollY > 40) {
        // Défilement vers le bas : masquer le header (mobile seulement)
        if (window.innerWidth < 1024) setIsHeaderVisible(false)
      } else if (delta < -4 || currentScrollY <= 15) {
        // Remontée : faire descendre le header immédiatement
        setIsHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      document.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [lastScrollY])

  // Toujours afficher le username (jamais le nom complet)
  const getDisplayName = () => {
    if (user?.username) return user.username.replace('@', '')
    if (user?.email) return user.email.split('@')[0]
    return 'Utilisateur'
  }

  const displayName = getDisplayName()

  // État avatar en temps réel avec synchronisation immédiate
  const [headerAvatar, setHeaderAvatar] = useState<string | undefined>(user?.avatarUrl)
  const [headerAvatarError, setHeaderAvatarError] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    setHeaderAvatar(user?.avatarUrl)
    setHeaderAvatarError(false)
  }, [user?.avatarUrl])

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e?.detail?.avatarUrl) {
        setHeaderAvatar(e.detail.avatarUrl)
        setHeaderAvatarError(false)
      }
    }
    window.addEventListener('exile_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('exile_profile_updated', handleProfileUpdate)
  }, [])

  // État pour les notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncNotifications = () => {
      const stored = JSON.parse(localStorage.getItem('exile_notifications') || '[]')
      if (stored.length > 0) {
        setNotifications(stored)
      }
    }
    syncNotifications()
    syncRemotePubNotifications()

    const handleNotifAdded = (e: any) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.filter(n => n.id !== e.detail.id)])
      } else {
        syncNotifications()
      }
    }

    window.addEventListener('exile_notification_added', handleNotifAdded)
    window.addEventListener('exile_notifications_updated', syncNotifications)
    window.addEventListener('storage', syncNotifications)

    // S'abonner aux nouvelles notifications
    const unsubscribe = notificationService.subscribe((notif) => {
      setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)])
    })

    return () => {
      window.removeEventListener('exile_notification_added', handleNotifAdded)
      window.removeEventListener('exile_notifications_updated', syncNotifications)
      window.removeEventListener('storage', syncNotifications)
      unsubscribe()
    }
  }, [])

  // Fermer le menu notification lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // État pour le bouton + Publier
  const [showPublishMenu, setShowPublishMenu] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const publishRef = useRef<HTMLDivElement>(null)

  // Fermer le menu publier lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (publishRef.current && !publishRef.current.contains(event.target as Node)) {
        setShowPublishMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // État pour le menu profil
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // État pour la recherche - logique complète de ProSubHeader
  const searchRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'professional'>('all')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<{professionals: any[], videos: any[]}>({ professionals: [], videos: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentAndPopular, setRecentAndPopular] = useState<{recentProfessionals: any[], popularProfessionals: any[], popularVideos: any[]} | null>(null)
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches()
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Synchroniser avec localStorage pour éviter les conflits avec App.tsx
  useEffect(() => {
    const checkMobileSearch = () => {
      try {
        const isActive = localStorage.getItem('exile_mobile_search_active')
        setIsMobileSearchOpen(isActive === 'true')
      } catch (e) {
        setIsMobileSearchOpen(false)
      }
    }
    
    checkMobileSearch()
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'exile_mobile_search_active') {
        setIsMobileSearchOpen(e.newValue === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Badge demandes reçues (pending)
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  
  useEffect(() => {
    const loadUnreadRequests = async () => {
      if (!user?.id) { setNewRequestsCount(0); return }
      const token = localStorage.getItem('accessToken')
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/demandes/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        const raw: any[] = Array.isArray(data) ? data : (data.results || [])
        const userId = (() => {
          try { return String(JSON.parse(atob(token.split('.')[1])).user_id) } catch { return '' }
        })()
        setNewRequestsCount(raw.filter(r => String(r.receiver?.id || r.receiver_id) === userId && r.status === 'envoye').length)
      } catch { setNewRequestsCount(0) }
    }
    loadUnreadRequests()
  }, [location.pathname, user?.id])

  
  const isActive = (path: string): boolean => location.pathname.startsWith(path)

  const handleLogout = (): void => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      logout()
    }
  }

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ne pas fermer si la recherche mobile est ouverte
      if (isMobileSearchOpen) return
      
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setShowFilterMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileSearchOpen])

  // Fonction de recherche avec filtre - copiée de ProSubHeader
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      loadRecentAndPopular()
      setShowDropdown(true)
      return
    }

    setSearchLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      // La recherche est publique: n'envoyer le token que s'il existe (sinon "Bearer null" -> 401)
      const headers: HeadersInit = token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' }

      const profilsResponse = await fetch(`${API_BASE_URL}/profil/profils/?search=${encodeURIComponent(query)}`, { headers })

      const videosResponse = await fetch(`${API_BASE_URL}/accueil/videos/?search=${encodeURIComponent(query)}`, { headers })
      
      const profilsData = profilsResponse.ok ? await profilsResponse.json() : []
      const videosData = videosResponse.ok ? await videosResponse.json() : []

      const professionals = unwrapList<any>(profilsData).map((p: any) => {
        const rawPhoto = p.photo_url || p.photo || p.avatar || ''
        let resolvedPhoto = ''
        if (rawPhoto && typeof rawPhoto === 'string' && rawPhoto !== 'null' && rawPhoto !== 'undefined') {
          if (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') || rawPhoto.startsWith('blob:')) {
            resolvedPhoto = rawPhoto
          } else if (rawPhoto.startsWith('/media/') || rawPhoto.startsWith('media/')) {
            resolvedPhoto = `http://localhost:8000${rawPhoto.startsWith('/') ? rawPhoto : `/${rawPhoto}`}`
          } else {
            resolvedPhoto = `https://rmbvwaemgiijitumhnys.supabase.co/storage/v1/object/public/Exile_images/${rawPhoto.replace(/^\/+/, '')}`
          }
        }

        return {
          id: p.user ?? p.id,
          username: p.username || '',
          fullName: p.full_name || p.username || 'Utilisateur',
          profession: p.profession || p.user_profession || '',
          avatar: resolvedPhoto,
          company: '',
          followersCount: 0,
          videosCount: 0
        }
      })

      const videos = unwrapList<any>(videosData).map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        thumbnail: v.cover_url || '',
        videoUrl: v.file_url || '',
        author: {
          id: v.owner,
          fullName: v.owner_full_name || v.owner_username || 'Utilisateur',
          profession: ''
        },
        views: v.views ?? 0,
        createdAt: v.created_at
      }))
      
      setSearchResults({ 
        professionals: filterType === 'video' ? [] : professionals, 
        videos: filterType === 'professional' ? [] : videos 
      })
      setShowDropdown(true)
      
      if (query.trim()) {
        addRecentSearch(query)
      }
    } catch (error) {
      console.error('Erreur de recherche:', error)
      setSearchResults({ professionals: [], videos: [] })
    } finally {
      setSearchLoading(false)
    }
  }

  // Charger les résultats récents et populaires
  const loadRecentAndPopular = async () => {
    try {
      setRecentAndPopular(null)
    } catch (error) {
      console.error('Erreur lors du chargement des résultats récents/populaires:', error)
    }
  }

  // Debounce pour éviter trop de requêtes API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, filterType])

  // Charger les résultats récents/populaires au montage
  useEffect(() => {
    loadRecentAndPopular()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowDropdown(true)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setShowDropdown(false)
    loadRecentAndPopular()
  }

  const handleMobileSearchOpen = () => {
    setIsMobileSearchOpen(true)
    setShowDropdown(true)
    localStorage.setItem('exile_mobile_search_active', 'true')
  }

  const handleMobileSearchClose = () => {
    setIsMobileSearchOpen(false)
    setShowDropdown(false)
    localStorage.setItem('exile_mobile_search_active', 'false')
    setSearchQuery('')
    setSearchResults({ professionals: [], videos: [] })
  }

  // Toggle mode sombre
  const toggleDarkMode = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const navLinks: NavLinkType[] = [
    { to: '/pro', label: 'Professionnel', icon: Briefcase, show: true, module: 'pro' },
    { to: '/social', label: 'Social', icon: Building2, show: true, module: 'social' },
  ]

  return (
    <header className={`bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-[100] w-full transition-transform duration-300 ease-in-out lg:!translate-y-0 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="relative flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Gauche */}
          <div className="flex-shrink-0 flex items-center z-10">
            <Link to="/" className="flex items-center">
              <img src="/logo_exile_SVG.svg" alt="EXILE" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
            </Link>
          </div>

          {/* Navigation - Centrée sur Desktop/Tablette et descendue plus bas sur Mobile pour ne pas coller à l'icône de recherche */}
          <nav className="absolute left-[46%] sm:left-1/2 -translate-x-1/2 flex items-center space-x-2.5 sm:space-x-6 md:space-x-8 z-10 pointer-events-auto top-[62%] sm:top-1/2 -translate-y-1/2 lg:mt-0">
            {navLinks.map((link) => (
              link.show && (
                <div key={link.to} className="relative group">
                  <Link
                    to={link.disabled ? '#' : link.to}
                    className={`relative text-xs sm:text-sm md:text-base font-bold transition-colors whitespace-nowrap ${
                      isActive(link.to)
                        ? 'text-[#FF6B00]'
                        : link.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 dark:text-zinc-300 hover:text-[#FF6B00]'
                    }`}
                    onClick={(e: React.MouseEvent) => link.disabled && e.preventDefault()}
                  >
                    <span>{link.label}</span>
                    {isActive(link.to) && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF6B00] rounded-full" />
                    )}
                    {link.disabled && (
                      <span className="ml-1 text-xs text-[#FF6B00] hidden sm:inline">(soon)</span>
                    )}
                  </Link>
                  {link.disabled && link.tooltip && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {link.tooltip}
                    </div>
                  )}
                </div>
              )
            ))}
          </nav>

          {/* Droite : Recherche & Boutons d'action (Compact sur mobile et tablette) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 md:gap-3 z-10">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* Search Icon - Non connecté avec logique complète - Caché sur page d'accueil et auth pages */}
                {!hideSearchBar && (
                  <div className="relative" ref={searchRef}>
                    <button
                      onClick={() => {
                        if (window.innerWidth < 640) {
                          handleMobileSearchOpen()
                        } else {
                          setShowDropdown(!showDropdown)
                        }
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                  {/* Search Dropdown - Complet (uniquement desktop) */}
                  {showDropdown && !isMobileSearchOpen && (
                    <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-lg shadow-lg p-3 z-50 ${
                      resolvedTheme === 'dark' ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                            resolvedTheme === 'dark' 
                              ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400' 
                              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        />
                        {searchQuery && (
                          <button
                            onClick={handleClearSearch}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <X className={`w-3 h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                          </button>
                        )}
                      </div>

                      {/* Bouton filtre */}
                      <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded ${showFilterMenu ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'} transition-colors`}
                      >
                        <Filter className={`w-3 h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                      </button>

                      {/* Menu filtre */}
                      {showFilterMenu && (
                        <div className={`absolute top-full right-0 mt-2 w-40 rounded-lg shadow-lg border z-50 ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => { setFilterType('all'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                            className={`w-full px-4 py-2 text-left text-sm ${filterType === 'all' ? 'bg-gray-50 dark:bg-zinc-800 text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                          >
                            Tout
                          </button>
                          <button
                            onClick={() => { setFilterType('video'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                            className={`w-full px-4 py-2 text-left text-sm ${filterType === 'video' ? 'bg-gray-50 dark:bg-zinc-800 text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                          >
                            Vidéos
                          </button>
                          <button
                            onClick={() => { setFilterType('professional'); setShowFilterMenu(false); searchQuery && handleSearch(searchQuery) }}
                            className={`w-full px-4 py-2 text-left text-sm ${filterType === 'professional' ? 'bg-gray-50 dark:bg-zinc-800 text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                          >
                            Professionnels
                          </button>
                        </div>
                      )}

                      {/* Résultats de recherche */}
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-zinc-400">
                          Recherche en cours...
                        </div>
                      ) : !searchQuery ? (
                        recentSearches.length > 0 && (
                          <div className="mt-2 border-t border-gray-100 dark:border-zinc-800">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                              <History className="w-3 h-3" />
                              Recherches récentes
                            </div>
                            {recentSearches.map((search, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchQuery(search)
                                  handleSearch(search)
                                }}
                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                              >
                                <History className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        searchResults.professionals.length > 0 || searchResults.videos.length > 0 ? (
                          <div className="mt-2 max-h-60 overflow-y-auto">
                            {searchResults.professionals.length > 0 && (
                              <div>
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                                  Professionnels
                                </div>
                                {searchResults.professionals.map((pro: any) => (
                                  <button
                                    key={pro.id}
                                    onClick={() => {
                                      navigate(`/pro/profile/${pro.id}`)
                                      setShowDropdown(false)
                                      setSearchQuery('')
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-emerald-400 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">{pro.fullName?.charAt(0) || pro.username?.charAt(0) || '?'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pro.fullName || pro.username}</p>
                                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{pro.profession || 'Professionnel'}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {searchResults.videos.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-zinc-800">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                                  Vidéos
                                </div>
                                {searchResults.videos.map((video: any) => (
                                  <button
                                    key={video.id}
                                    onClick={() => {
                                      navigate(`/pro/video/${video.id}`)
                                      setShowDropdown(false)
                                      setSearchQuery('')
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-10 h-7 bg-gray-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                                      {video.thumbnail ? (
                                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center">
                                          <Search className="w-3 h-3 text-gray-500 dark:text-zinc-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{video.title}</p>
                                      <p className="text-xs text-gray-500 dark:text-zinc-400">{video.views} vues</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-zinc-400 text-sm">
                            Aucun résultat trouvé
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
                )}
                {/* Avatar par défaut pour utilisateurs non connectés */}
                <Link to="/login" className="flex items-center space-x-2 p-1 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 dark:bg-zinc-600 rounded-full flex items-center justify-center text-gray-600 dark:text-zinc-300">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="hidden md:block text-xs md:text-sm font-medium text-gray-600 dark:text-zinc-300">
                    Connexion
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-end space-x-1.5 sm:space-x-2.5 md:space-x-3">
                {/* Visible Search Bar on Desktop & Tablet - Longueur compacte */}
                {!hideSearchBar && (
                  <div className="relative flex items-center justify-end" ref={searchRef}>
                    {/* Desktop Visible Search Bar */}
                    <div className="hidden lg:flex items-center relative w-44 xl:w-56">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(true)}
                        className={`w-full pl-9 pr-14 py-1.5 rounded-xl border text-xs sm:text-sm transition-all ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-800/90 border-zinc-700 text-white placeholder-zinc-400 focus:border-blue-500'
                            : 'bg-gray-100/90 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {searchQuery && (
                          <button
                            onClick={handleClearSearch}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                            title="Effacer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowFilterMenu(!showFilterMenu)}
                          className={`p-1 rounded-md transition-colors ${
                            showFilterMenu || filterType !== 'all'
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                          }`}
                          title="Filtres"
                        >
                          <Filter className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile & Tablet Search Trigger Icon */}
                    <button
                      onClick={handleMobileSearchOpen}
                      className="lg:hidden p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                      title="Rechercher"
                    >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Filter Type Floating Menu */}
                    {showFilterMenu && (
                      <div className={`absolute top-full right-0 mt-2 w-44 rounded-xl shadow-xl border z-50 p-1 ${
                        resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
                      }`}>
                        {[
                          { id: 'all', label: 'Tout' },
                          { id: 'video', label: 'Vidéos' },
                          { id: 'professional', label: 'Professionnels' }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setFilterType(f.id as any)
                              setShowFilterMenu(false)
                              if (searchQuery) handleSearch(searchQuery)
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs font-semibold rounded-lg transition-colors ${
                              filterType === f.id
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Autocomplete Results Dropdown */}
                    {showDropdown && !isMobileSearchOpen && (
                      <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 md:w-96 rounded-2xl shadow-2xl p-2 z-50 border ${
                        resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
                      } animate-in fade-in zoom-in-95 duration-100`}>
                        {searchLoading ? (
                          <div className="p-4 text-center text-xs text-gray-500 dark:text-zinc-400">
                            Recherche en cours...
                          </div>
                        ) : !searchQuery ? (
                          recentSearches.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-1.5">
                                <History className="w-3 h-3" />
                                <span>Recherches récentes</span>
                              </div>
                              {recentSearches.map((search, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSearchQuery(search)
                                    handleSearch(search)
                                  }}
                                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-left transition-colors"
                                >
                                  <History className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs text-gray-700 dark:text-zinc-300">{search}</span>
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          searchResults.professionals.length > 0 || searchResults.videos.length > 0 ? (
                            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/80">
                              {searchResults.professionals.length > 0 && (
                                <div className="py-1">
                                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase">
                                    Professionnels
                                  </div>
                                  {searchResults.professionals.map((pro: any) => {
                                    const proUsername = pro.username?.startsWith('@') ? pro.username : `@${pro.username || 'Utilisateur'}`
                                    return (
                                      <button
                                        key={pro.id}
                                        onClick={() => {
                                          navigate(`/pro/profile/${pro.id}`)
                                          setShowDropdown(false)
                                          setSearchQuery('')
                                        }}
                                        className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-left transition-colors"
                                      >
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                          {pro.avatar ? (
                                            <img src={pro.avatar} alt={proUsername} className="w-full h-full object-cover" />
                                          ) : (
                                            proUsername.replace('@', '').charAt(0).toUpperCase()
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{proUsername}</p>
                                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">{pro.profession || 'Professionnel'}</p>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                              {searchResults.videos.length > 0 && (
                                <div className="py-1">
                                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase">
                                    Vidéos
                                  </div>
                                  {searchResults.videos.map((video: any) => (
                                    <button
                                      key={video.id}
                                      onClick={() => {
                                        navigate(`/pro/video/${video.id}`)
                                        setShowDropdown(false)
                                        setSearchQuery('')
                                      }}
                                      className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-left transition-colors"
                                    >
                                      <div className="w-12 h-8 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                        {video.thumbnail ? (
                                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Search className="w-3.5 h-3.5 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{video.title}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">{video.views || 0} vues</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-xs text-gray-500 dark:text-zinc-400">
                              Aucun résultat trouvé
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton + Publier Professionnel (Desktop uniquement, sur mobile c'est dans ProSidebar) */}
                <div className="relative hidden md:block" ref={publishRef}>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login')
                        return
                      }
                      setShowPublishMenu(!showPublishMenu)
                    }}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-md font-semibold text-xs sm:text-sm transition-all duration-200 hover:shadow-orange-500/25 active:scale-95 flex-shrink-0"
                    title="Publier du contenu ou créer un événement"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline font-bold">Publier</span>
                  </button>

                  {/* Publish Menu Dropdown */}
                  {showPublishMenu && (
                    <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl py-2 z-50 border ${
                      resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
                    } animate-in fade-in zoom-in-95 duration-150 overflow-hidden`}>
                      <div className="px-3.5 py-2 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Création d'expertise</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsUploadModalOpen(true)
                          setShowPublishMenu(false)
                        }}
                        className="w-full text-left px-3.5 py-3 text-xs sm:text-sm text-gray-800 dark:text-zinc-200 hover:bg-orange-500/10 hover:text-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <VideoIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Vidéo d'expertise</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400">Tutoriel, conseil, projet</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/pro/events?create=true')
                          setShowPublishMenu(false)
                        }}
                        className="w-full text-left px-3.5 py-3 text-xs sm:text-sm text-gray-800 dark:text-zinc-200 hover:bg-purple-500/10 hover:text-purple-500 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Événement & Webinaire</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400">Conférence, atelier, masterclass</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/pro/events?create=true&live=true')
                          setShowPublishMenu(false)
                        }}
                        className="w-full text-left px-3.5 py-3 text-xs sm:text-sm text-gray-800 dark:text-zinc-200 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Radio className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold">Lancer un Live</p>
                            <span className="px-1.5 py-0.2 bg-red-600 text-white text-[8px] font-bold rounded">DIRECT</span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400">Diffusion en direct et chat live</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/pub/demande')
                          setShowPublishMenu(false)
                        }}
                        className="w-full text-left px-3.5 py-3 text-xs sm:text-sm text-gray-800 dark:text-zinc-200 hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Campagne Publicitaire</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400">Promouvoir votre entreprise (PUB)</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {(unreadCount > 0 || newRequestsCount > 0) && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                        {unreadCount + newRequestsCount > 9 ? '9+' : unreadCount + newRequestsCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl py-2 z-50 border ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
                    } animate-in fade-in zoom-in-95 duration-150`}>
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-zinc-700/60">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => {
                              notificationService.markAllAsRead()
                              setNotifications(notificationService.getNotifications())
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tout marquer comme lu
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-700/40">
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 text-center">
                            <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">Aucune notification</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Vous serez notifié dès qu'il y aura du nouveau.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                notificationService.markAsRead(notif.id)
                                setNotifications(notificationService.getNotifications())
                                setShowNotifications(false)
                                if (notif.type === 'message') {
                                  navigate('/pro/conversations')
                                } else if (notif.type === 'request_accepted' || notif.type === 'new_contact') {
                                  navigate('/pro/demandes')
                                }
                              }}
                              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                                !notif.read
                                  ? resolvedTheme === 'dark' ? 'bg-blue-950/30 hover:bg-blue-900/30' : 'bg-blue-50/70 hover:bg-blue-100/60'
                                  : resolvedTheme === 'dark' ? 'hover:bg-zinc-700/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* Logo ou icône de notification */}
                              {notif.iconUrl || (notif.data?.isPub && localStorage.getItem('exile_pub_platform_logo')) ? (
                                <img
                                  src={notif.iconUrl || localStorage.getItem('exile_pub_platform_logo') || ''}
                                  alt="PUB"
                                  className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-white/20 shadow-sm"
                                />
                              ) : (
                                <div className={`p-2 rounded-xl flex-shrink-0 ${
                                  notif.type === 'message'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : notif.type === 'request_accepted'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : notif.type === 'system'
                                    ? 'bg-purple-500/10 text-purple-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {notif.type === 'message' ? (
                                    <MessageSquare className="w-4 h-4" />
                                  ) : notif.type === 'request_accepted' ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4" />
                                  )}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <p className={`text-xs font-semibold truncate ${
                                    !notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-zinc-300'
                                  }`}>
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                                  {notif.message}
                                </p>

                                {/* Bouton d'action personnalisé (ex: Faire encore une demande) */}
                                {(notif.actionButton || notif.data?.actionButton) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      notificationService.markAsRead(notif.id)
                                      setShowNotifications(false)
                                      const url = notif.actionButton?.actionUrl || notif.data?.actionButton?.actionUrl || '/pub/demande'
                                      navigate(url)
                                    }}
                                    className="mt-2 px-3 py-1 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                  >
                                    <span>{notif.actionButton?.label || notif.data?.actionButton?.label || 'Faire encore une demande'}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}

                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 p-1 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-800 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden shadow-sm ring-1 ring-white/10 flex-shrink-0">
                      {headerAvatar && !headerAvatarError && isOnline ? (
                        <img
                          src={headerAvatar}
                          alt={displayName}
                          onError={() => setHeaderAvatarError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-zinc-200 font-bold">
                          {(displayName || 'U').replace(/^@/, '').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:block text-xs md:text-sm font-medium text-gray-700 dark:text-zinc-300 truncate max-w-[120px]">
                      @{displayName.replace(/^@/, '')}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 sm:w-56 rounded-lg shadow-lg py-2 z-50 ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Connecté en tant que</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">@{displayName.replace(/^@/, '')}</p>
                      </div>
                      <Link
                        to="/pro/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Mon profil
                      </Link>
                      <Link
                        to="/pro/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Paramètres
                      </Link>
                      <hr className="my-2 border-gray-200 dark:border-zinc-700" />
                      <button
                        onClick={() => {
                          handleLogout()
                          setShowProfileMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Full Screen Search - Simplified */}
      {isMobileSearchOpen && createPortal(
        <div className={`fixed inset-0 z-[999999] ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-white'} flex flex-col`}>
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-zinc-800">
            <button
              onClick={handleMobileSearchClose}
              className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <X className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
            </button>
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Rechercher..."
                autoFocus
                className={`w-full pl-12 pr-12 py-3 rounded-xl text-base ${
                  resolvedTheme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
                    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                } border focus:outline-none focus:ring-2 focus:ring-pro/20`}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} transition-colors`}
                >
                  <X className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {searchLoading ? (
              <div className="text-center text-sm text-gray-500 dark:text-zinc-400">
                Recherche en cours...
              </div>
            ) : !searchQuery ? (
              recentSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-3 h-3" />
                      Recherches récentes
                    </div>
                    <button
                      onClick={() => clearRecentSearches()}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                    >
                      Effacer
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search)
                        handleSearch(search)
                      }}
                      className="w-full px-3 py-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                    >
                      <History className="w-4 h-4 text-gray-400" />
                      <span className="text-base text-gray-700 dark:text-gray-300">{search}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              searchResults.professionals.length > 0 || searchResults.videos.length > 0 ? (
                <>
                  {searchResults.professionals.length > 0 && (
                    <div className="mt-4">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                        Professionnels
                      </div>
                      {searchResults.professionals.map((pro: any) => (
                        <button
                          key={pro.id}
                          onClick={() => {
                            navigate(`/pro/profile/${pro.id}`)
                            setShowDropdown(false)
                            setSearchQuery('')
                            setIsMobileSearchOpen(false)
                          }}
                          className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                            {pro.avatar ? (
                              <img src={pro.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (pro.username || 'U').replace('@', '').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {pro.username?.startsWith('@') ? pro.username : `@${pro.username || 'Utilisateur'}`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{pro.profession || 'Professionnel'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.videos.length > 0 && (
                    <div className="mt-4">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                        Vidéos
                      </div>
                      {searchResults.videos.map((video: any) => (
                        <button
                          key={video.id}
                          onClick={() => {
                            navigate(`/pro/video/${video.id}`)
                            setShowDropdown(false)
                            setSearchQuery('')
                            setIsMobileSearchOpen(false)
                          }}
                          className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                        >
                          <div className="w-14 h-10 bg-gray-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center">
                                <Search className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900 dark:text-white truncate">{video.title}</p>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">{video.views} vues</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-zinc-400 text-base">
                  Aucun résultat trouvé
                </div>
              )
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Video Upload Modal */}
      {isUploadModalOpen && (
        <UploadVideo
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </header>
  )
}

export default Header
