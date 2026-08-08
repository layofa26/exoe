import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Building2, Bell, Search, Plus, Clock, X, TrendingUp, History } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useRecentSearches } from '../../hooks/useRecentSearches'

interface SocialHeaderProps {
  title?: string
  showSearch?: boolean
  showCreateButton?: boolean
  showLogo?: boolean
  onCreateClick?: () => void
  onSearch?: (query: string) => void
}

export function SocialHeader({
  title = 'EXILE Social',
  showSearch = true,
  showCreateButton = true,
  showLogo = true,
  onCreateClick,
  onSearch
}: SocialHeaderProps) {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType] = useState<'all' | 'video' | 'professional'>('all')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchResults, setSearchResults] = useState<{professionals: any[], videos: any[]}>({ professionals: [], videos: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentAndPopular, setRecentAndPopular] = useState<{recentProfessionals: any[], popularProfessionals: any[], popularVideos: any[]} | null>(null)
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches()

  // Synchroniser avec localStorage pour éviter les conflits avec Header.tsx
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

  // Fonction de recherche avec filtre - utilise l'API réelle
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    // Si la requête est vide, afficher les résultats récents/populaires
    if (!query.trim()) {
      loadRecentAndPopular()
      setShowDropdown(true)
      return
    }

    // Déclencher la recherche dès 1 caractère
    setSearchLoading(true)
    try {
      // Backend removed - search disabled
      setSearchResults({ professionals: [], videos: [] })
      setShowDropdown(true)
      
      // Ajouter aux recherches récentes si la recherche a réussi
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
      // Backend removed - recent/popular loading disabled
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

  // Fermer dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowDropdown(true)
    onSearch?.(query)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setShowDropdown(false)
    loadRecentAndPopular()
    onSearch?.('')
  }

  const handleMobileSearchOpen = () => {
    console.log('Opening mobile search')
    setIsMobileSearchOpen(true)
    setShowDropdown(true)
    localStorage.setItem('exile_mobile_search_active', 'true')
  }

  const handleMobileSearchClose = () => {
    setIsMobileSearchOpen(false)
    setShowDropdown(false)
    localStorage.setItem('exile_mobile_search_active', 'false')
    setSearchQuery('')
  }

  return (
    <header className={`sticky top-0 z-50 ${resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Title */}
          {showLogo && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-social to-blue-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </h1>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            {showSearch && (
              <div className="relative" ref={searchRef}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    setShowDropdown(true)
                    if (window.innerWidth < 640) {
                      handleMobileSearchOpen()
                    }
                  }}
                  placeholder="Rechercher..."
                  className={`pl-10 pr-10 py-2 rounded-lg text-sm ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-social'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-social'
                  } border focus:outline-none focus:ring-2 focus:ring-social/20 w-48`}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
                  >
                    <X className={`w-3 h-3 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-400'}`} />
                  </button>
                )}

                {/* Search Dropdown */}
                {showDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border max-h-80 overflow-y-auto z-50 ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-950 border-zinc-800'
                      : 'bg-white border-gray-200'
                  }`}>
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-zinc-400">
                        Recherche en cours...
                      </div>
                    ) : !searchQuery ? (
                      // Afficher les résultats récents/populaires
                      <>
                        {recentAndPopular && (
                          <>
                            {/* Professionnels récents */}
                            {recentAndPopular.recentProfessionals && recentAndPopular.recentProfessionals.length > 0 && (
                              <div>
                                <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  Professionnels récents
                                </div>
                                {recentAndPopular.recentProfessionals.slice(0, 5).map((pro: any) => (
                                  <button
                                    key={pro.id}
                                    onClick={() => {
                                      navigate(`/pro/profile/${pro.username}`)
                                      setShowDropdown(false)
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-7 h-7 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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

                            {/* Professionnels populaires */}
                            {recentAndPopular.popularProfessionals && recentAndPopular.popularProfessionals.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-zinc-800">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3" />
                                  Professionnels populaires
                                </div>
                                {recentAndPopular.popularProfessionals.slice(0, 5).map((pro: any) => (
                                  <button
                                    key={pro.id}
                                    onClick={() => {
                                      navigate(`/pro/profile/${pro.username}`)
                                      setShowDropdown(false)
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-7 h-7 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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

                            {/* Vidéos populaires */}
                            {recentAndPopular.popularVideos && recentAndPopular.popularVideos.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-zinc-800">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3" />
                                  Vidéos populaires
                                </div>
                                {recentAndPopular.popularVideos.slice(0, 5).map((video: any) => (
                                  <button
                                    key={video.id}
                                    onClick={() => {
                                      navigate(`/pro/video/${video.id}`)
                                      setShowDropdown(false)
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-10 h-7 bg-gray-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                                      {video.thumbnailUrl ? (
                                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
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

                            {/* Recherches récentes */}
                            {recentSearches.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-zinc-800">
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
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <History className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      // Résultats de recherche actifs
                      <>
                        {searchResults.professionals.length > 0 || searchResults.videos.length > 0 ? (
                          <>
                            {searchResults.professionals.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-zinc-800">
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
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-7 h-7 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <div className="w-10 h-7 bg-gray-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                                      {video.thumbnailUrl ? (
                                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
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
                          </>
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-zinc-400 text-sm">
                            Aucun résultat trouvé
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

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
                          ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-social'
                          : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-social'
                      } border focus:outline-none focus:ring-2 focus:ring-social/20`}
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
                    // Afficher les résultats récents/populaires sur mobile
                    <>
                      {recentAndPopular && (
                        <>
                          {/* Professionnels récents */}
                          {recentAndPopular.recentProfessionals && recentAndPopular.recentProfessionals.length > 0 && (
                            <div>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Professionnels récents
                              </div>
                              {recentAndPopular.recentProfessionals.slice(0, 5).map((pro: any) => (
                                <button
                                  key={pro.id}
                                  onClick={() => {
                                    navigate(`/pro/profile/${pro.username}`)
                                    setShowDropdown(false)
                                    setIsMobileSearchOpen(false)
                                  }}
                                  className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                >
                                  <div className="w-10 h-10 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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

                          {/* Professionnels populaires */}
                          {recentAndPopular.popularProfessionals && recentAndPopular.popularProfessionals.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-zinc-800 mt-4">
                              <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" />
                                Professionnels populaires
                              </div>
                              {recentAndPopular.popularProfessionals.slice(0, 5).map((pro: any) => (
                                <button
                                  key={pro.id}
                                  onClick={() => {
                                    navigate(`/pro/profile/${pro.username}`)
                                    setShowDropdown(false)
                                    setIsMobileSearchOpen(false)
                                  }}
                                  className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                >
                                  <div className="w-10 h-10 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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

                          {/* Vidéos populaires */}
                          {recentAndPopular.popularVideos && recentAndPopular.popularVideos.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-zinc-800 mt-4">
                              <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" />
                                Vidéos populaires
                              </div>
                              {recentAndPopular.popularVideos.slice(0, 5).map((video: any) => (
                                <button
                                  key={video.id}
                                  onClick={() => {
                                    navigate(`/pro/video/${video.id}`)
                                    setShowDropdown(false)
                                    setIsMobileSearchOpen(false)
                                  }}
                                  className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left"
                                >
                                  <div className="w-14 h-10 bg-gray-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                                    {video.thumbnailUrl ? (
                                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
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

                          {/* Recherches récentes */}
                          {recentSearches.length > 0 && (
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
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    // Résultats de recherche actifs sur mobile
                    <>
                      {searchResults.professionals.length > 0 || searchResults.videos.length > 0 ? (
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
                                  <div className="w-10 h-10 bg-gradient-to-br from-social to-blue-600 rounded-full flex items-center justify-center">
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
                                    {video.thumbnailUrl ? (
                                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
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
                      )}
                    </>
                  )}
                </div>
              </div>, document.body)}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
              >
                <Bell className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border z-50 ${
                  resolvedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                  <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                    <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {[
                      { type: 'alert', title: 'Nouvelle urgence', time: 'Il y a 5 min', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', id: '1' },
                      { type: 'live', title: 'Live en cours', time: 'Il y a 15 min', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', id: '2' },
                      { type: 'video', title: 'Nouvelle vidéo', time: 'Il y a 1h', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', id: '3' },
                    ].map((notif, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/social')
                        }}
                        className={`p-4 border-b border-gray-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                              {notif.title}
                            </p>
                            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-zinc-800">
                    <button className={`w-full text-center text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'}`}>
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create Button */}
            {showCreateButton && (
              <button
                onClick={onCreateClick}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Créer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SocialHeader
