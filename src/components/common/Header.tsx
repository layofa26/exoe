import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useRecentSearches } from '../../hooks/useRecentSearches'
import type { NavLinkType } from '../../types'
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
  X
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const Header = (): JSX.Element => {
  const { isAuthenticated, user, logout, hasModuleAccess } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Cacher la barre de recherche sur la page d'accueil, login, register et forgot password
  const isLandingPage = location.pathname === '/'
  const isAuthPage = ['/login', '/register', '/forgot-password', '/forgot-email', '/reset-password'].includes(location.pathname)
  const hideSearchBar = isLandingPage || isAuthPage

  // Scroll behavior - header suit le feed et redescente immédiatement
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Si on scroll vers le bas, cacher le header
      // Si on scroll vers le haut, afficher le header immédiatement
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll vers le bas
        setIsHeaderVisible(false)
      } else {
        // Scroll vers le haut
        setIsHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Afficher le username tel quel (déjà au format @prenom_nom du backend)
  const getDisplayName = () => {
    // Priorité: username (format @prenom_nom du backend) > full_name > email
    if (user?.username) return user.username
    if (user?.fullName) return user.fullName
    if (user?.email) return user.email
    return 'Utilisateur'
  }

  const displayName = getDisplayName()

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

  // État pour les demandes (badge)
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  
  // Charger demandes non lues depuis l'API
  useEffect(() => {
    const loadUnreadRequests = async () => {
      if (!user?.id) {
        setNewRequestsCount(0)
        return
      }

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
        const FINAL_API_BASE_URL = API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('/api/v1') 
          ? API_BASE_URL.replace('/api', '/api/v1') 
          : API_BASE_URL
        const response = await fetch(`${FINAL_API_BASE_URL}/demande/demandes/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const pendingCount = data.filter((r: any) =>
            r.receiver === user.id && r.status === 'pending'
          ).length
          setNewRequestsCount(pendingCount)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error)
        setNewRequestsCount(0)
      }
    }

    loadUnreadRequests()
  }, [location.pathname, user?.id])
  
  // État pour le statut en ligne
  const [isOnline, setIsOnline] = useState(true)

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
      
      const profilsResponse = await fetch(`${API_BASE_URL}/profil/profils/?search=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const videosResponse = await fetch(`${API_BASE_URL}/accueil/videos/?search=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const profilsData = profilsResponse.ok ? await profilsResponse.json() : { results: [] }
      const videosData = videosResponse.ok ? await videosResponse.json() : { results: [] }
      
      const professionals = profilsData.results ? profilsData.results.map((p: any) => ({
        id: p.id,
        username: p.username,
        fullName: p.username,
        profession: '',
        company: '',
        followersCount: 0,
        videosCount: 0
      })) : []
      
      const videos = videosData.results ? videosData.results.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        thumbnail: v.cover,
        videoUrl: v.file,
        author: {
          id: v.owner,
          fullName: 'Utilisateur',
          profession: ''
        },
        views: 0,
        createdAt: v.created_at
      })) : []
      
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
    <header className={`bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-[100] w-full transition-transform duration-200 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Gauche avec flex-1 pour équilibrer */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="flex items-center">
              <img src="/logo_exile_SVG.svg" alt="EXILE" className="w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14" />
            </Link>
          </div>

          {/* Navigation - Desktop & Mobile - Centrés */}
          <nav className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 mt-8 sm:mt-0">
            {navLinks.map((link) => (
              link.show && (
                <div key={link.to} className="relative group">
                  <Link
                    to={link.disabled ? '#' : link.to}
                    className={`relative py-2 text-sm sm:text-sm md:text-base font-bold transition-colors ${
                      isActive(link.to)
                        ? 'text-orange-500'
                        : link.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-orange-500'
                    }`}
                    onClick={(e: React.MouseEvent) => link.disabled && e.preventDefault()}
                  >
                    <span className="hidden sm:inline">{link.label}</span>
                    <span className="sm:hidden text-sm font-bold">{link.label}</span>
                    {isActive(link.to) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                    )}
                    {link.disabled && (
                      <span className="ml-1 text-xs text-orange-500 hidden sm:inline">(soon)</span>
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

          {/* Right Side - Login/Register buttons or User Profile */}
          <div className="flex-1 flex items-center justify-end space-x-1 md:space-x-2">
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
                                      navigate(`/pro/profile/${pro.username}`)
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
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Search Icon - Connecté avec logique complète - Caché sur page d'accueil et auth pages */}
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

                  {/* Search Dropdown - Complet (même code que non connecté, uniquement desktop) */}
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
                                      navigate(`/pro/profile/${pro.username}`)
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

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {newRequestsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 p-1 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0) || user?.username?.charAt(0) || ''
                      )}
                    </div>
                    <span className="hidden md:block text-xs md:text-sm font-medium text-gray-700 dark:text-zinc-300">
                      {displayName}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 sm:w-56 rounded-lg shadow-lg py-2 z-50 ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Connecté en tant que</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || user?.username}</p>
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

      {/* Mobile Full Screen Search */}
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
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-pro'
                    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-pro'
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
                <div className="border-t border-gray-200 dark:border-zinc-800 mt-4">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center justify-between">
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
                    <div className="border-t border-gray-200 dark:border-zinc-800 mt-4">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                        Professionnels
                      </div>
                      {searchResults.professionals.map((pro: any) => (
                        <button
                          key={pro.id}
                          onClick={() => {
                            navigate(`/pro/profile/${pro.username}`)
                            setShowDropdown(false)
                            setSearchQuery('')
                            setIsMobileSearchOpen(false)
                          }}
                          className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-emerald-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{pro.fullName?.charAt(0) || pro.username?.charAt(0) || '?'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900 dark:text-white truncate">{pro.fullName || pro.username}</p>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{pro.profession || 'Professionnel'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.videos.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-zinc-800 mt-4">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
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
    </header>
  )
}

export default Header
