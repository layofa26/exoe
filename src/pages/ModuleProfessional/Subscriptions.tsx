import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Play, Heart, Bell, Search, ArrowLeft,
  Share2, Bookmark, Trash2, X
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../services/apiClient'
import { AbonnementListSchema } from '../../schemas/apiSchemas'
import { useQuery } from '../../hooks/useQuery'

// Types
interface SubscribedProfessional {
  id: string
  name: string
  avatar: string | null
  profession: string
  specialty: string
  subscribedAt: string
  hasNewContent?: boolean
  notificationsEnabled?: boolean
}

interface FavoriteVideo {
  videoId: string
  title: string
  professionalId: string
  professionalName: string
  professionalAvatar?: string | null
  thumbnailUrl: string
  duration: string | number
  likes?: number
  addedAt: string
}

const defaultSubscriptions: SubscribedProfessional[] = [
  {
    id: '1',
    name: 'Dr. Jean Dupont',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
    profession: 'Médecin Spécialiste',
    specialty: 'Santé & Télémédecine',
    subscribedAt: '2024-01-15',
    hasNewContent: true,
    notificationsEnabled: true
  },
  {
    id: '2',
    name: 'Me. Sophie Martin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    profession: 'Avocate Conseil',
    specialty: 'Droit des Affaires',
    subscribedAt: '2024-02-01',
    hasNewContent: false,
    notificationsEnabled: true
  },
  {
    id: '3',
    name: 'Thomas Bernard',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    profession: 'Architecte Senior',
    specialty: 'Design Urbain & Éco-habitat',
    subscribedAt: '2024-02-20',
    hasNewContent: true,
    notificationsEnabled: false
  }
]

const demoFeedVideos: any[] = [
  {
    id: 'v_sub_1',
    title: '5 Stratégies Clés pour Optimiser la Fiscalité d’Entreprise en 2026',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600',
    duration: '06:45',
    author: {
      id: '2',
      name: 'Me. Sophie Martin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      profession: 'Avocate Conseil'
    },
    viewsCount: 2450,
    likesCount: 184,
    createdAt: 'Il y a 3 heures'
  },
  {
    id: 'v_sub_2',
    title: 'Diagnostic Précoce & Santé Connectée : Le Rôle de la Télémédecine',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
    duration: '12:20',
    author: {
      id: '1',
      name: 'Dr. Jean Dupont',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
      profession: 'Médecin Spécialiste'
    },
    viewsCount: 3890,
    likesCount: 312,
    createdAt: 'Hier'
  },
  {
    id: 'v_sub_3',
    title: 'Concevoir des Bâtiments Bas-Carbone : Études de Cas Pratiques',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
    duration: '08:15',
    author: {
      id: '3',
      name: 'Thomas Bernard',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      profession: 'Architecte Senior'
    },
    viewsCount: 1720,
    likesCount: 95,
    createdAt: 'Il y a 2 jours'
  }
]

export const Subscriptions = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'favorites'>('feed')
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  // Charger les favoris depuis exile_favorites (synchronisé avec l'accueil)
  const getFavoritesKey = useCallback(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
      const uid = profile?.id || localStorage.getItem('exile_client_uuid')
      return uid ? `exile_favorites_${uid}` : 'exile_favorites'
    } catch {
      return 'exile_favorites'
    }
  }, [])

  const loadFavorites = useCallback((): FavoriteVideo[] => {
    try {
      const key = getFavoritesKey()
      const savedFavs = localStorage.getItem(key) || localStorage.getItem('exile_favorites')
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs)
        if (Array.isArray(parsed)) return parsed
      }
      return []
    } catch {
      return []
    }
  }, [getFavoritesKey])

  const [favorites, setFavorites] = useState<FavoriteVideo[]>(loadFavorites)

  // Écouter les événements de mise à jour des favoris en temps réel
  useEffect(() => {
    const handleSync = () => {
      setFavorites(loadFavorites())
    }
    window.addEventListener('exile_saved_videos_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('exile_saved_videos_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [loadFavorites])

  const {
    data: cachedSubs,
    setData: setSubscriptions
  } = useQuery<SubscribedProfessional[]>(
    async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return defaultSubscriptions

        const result = await api.get('/abonnement/abonnements/', AbonnementListSchema)
        if (result.success && result.data && result.data.results) {
          return result.data.results.map((sub: any) => ({
            id: String(sub.professionnel),
            name: sub.professionnel_name || 'Expert',
            avatar: sub.professionnel_avatar || null,
            profession: sub.professionnel_profession || 'Professionnel',
            specialty: sub.professionnel_speciality || '',
            subscribedAt: sub.created_at,
            hasNewContent: true,
            notificationsEnabled: true
          }))
        }
        return defaultSubscriptions
      } catch (err) {
        return defaultSubscriptions
      }
    },
    {
      cacheKey: (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
          return `pro:subscriptions:all:${profile?.id || localStorage.getItem('exile_client_uuid') || 'guest'}`
        } catch {
          return 'pro:subscriptions:all:guest'
        }
      })(),
      cacheTime: 5 * 60 * 1000,
      initialData: defaultSubscriptions
    }
  )

  const subscriptions = cachedSubs || defaultSubscriptions

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/pro/video/${video.id || video.videoId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Découvrez cette vidéo d'expertise sur EXILE`,
          url: shareUrl
        })
        showToast('✓ Vidéo partagée !')
        return
      } catch (e) {}
    }
    navigator.clipboard?.writeText(shareUrl)
    showToast('🔗 Lien copié !')
  }

  const handleToggleFavorite = (video: any) => {
    const vId = String(video.id || video.videoId)
    const exists = favorites.some(f => String(f.videoId || (f as any).id) === vId)
    let updated: FavoriteVideo[] = []

    if (exists) {
      updated = favorites.filter(f => String(f.videoId || (f as any).id) !== vId)
      setFavorites(updated)
      localStorage.setItem(getFavoritesKey(), JSON.stringify(updated))
      showToast('Retiré des favoris')
    } else {
      const newFav: FavoriteVideo = {
        videoId: vId,
        title: video.title,
        professionalId: video.author?.id || video.professionalId || '1',
        professionalName: video.author?.name || video.author?.username || video.professionalName || 'Expert',
        professionalAvatar: video.author?.avatar || video.author?.avatarUrl || video.professionalAvatar || null,
        thumbnailUrl: video.thumbnail || video.thumbnailUrl || '',
        duration: video.duration || '05:00',
        likes: video.likesCount || video.likes || 0,
        addedAt: new Date().toISOString()
      }
      updated = [newFav, ...favorites]
      setFavorites(updated)
      localStorage.setItem(getFavoritesKey(), JSON.stringify(updated))
      showToast('❤️ Ajouté aux favoris !')
    }

    // Sync saved videos IDs list
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem('exile_saved_videos') || '[]')
      const newSavedIds = exists ? savedIds.filter(id => id !== vId) : [...savedIds, vId]
      localStorage.setItem('exile_saved_videos', JSON.stringify(newSavedIds))
      window.dispatchEvent(new CustomEvent('exile_saved_videos_updated', { detail: { videoId: vId, isSaved: !exists } }))
    } catch {}
  }

  const toggleNotifications = (subId: string) => {
    const updated = subscriptions.map(s => s.id === subId ? { ...s, notificationsEnabled: !s.notificationsEnabled } : s)
    setSubscriptions(updated)
    const target = updated.find(s => s.id === subId)
    showToast(target?.notificationsEnabled ? `🔔 Notifications activées` : `🔕 Notifications désactivées`)
  }

  const unsubscribe = (profId: string) => {
    const prof = subscriptions.find(s => s.id === profId)
    const updated = subscriptions.filter(s => s.id !== profId)
    setSubscriptions(updated)
    setUnsubscribeConfirm(null)
    showToast(`Désabonné de ${prof?.name || 'ce professionnel'}`)
  }

  const displayedVideos = demoFeedVideos.filter(v => {
    const matchesCreator = selectedCreatorId === 'all' || v.author?.id === selectedCreatorId
    const matchesSearch = !searchQuery || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCreator && matchesSearch
  })

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchQuery) return true
    return sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sub.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sortedFavorites = [...favorites].filter(f => {
    if (!searchQuery) return true
    return f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.professionalName.toLowerCase().includes(searchQuery.toLowerCase())
  }).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

  const base = isDark ? 'bg-[#0b0e14] text-white' : 'bg-slate-50 text-slate-900'

  return (
    <div className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden ${base}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold bg-zinc-900 text-white border border-zinc-700/80 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Modal Confirmation Désabonnement */}
      {unsubscribeConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'} rounded-3xl max-w-sm w-full p-5 shadow-2xl border space-y-4`}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">Se désabonner ?</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Vous ne recevrez plus les publications de ce professionnel.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setUnsubscribeConfirm(null)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>Annuler</button>
              <button onClick={() => unsubscribe(unsubscribeConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EN-TÊTE FULL-WIDTH FLUSH AU TOP (Même design que Demandes) ── */}
      <div className={`flex-shrink-0 p-3.5 border-b backdrop-blur-xl ${isDark ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/pro')}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Heart size={18} className="fill-white" />
            </div>
            <h1 className="font-bold text-base">Abonnements</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
          <Search size={15} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une vidéo ou un créateur..."
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={13} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'feed', label: 'Fil des Vidéos', icon: Play, count: displayedVideos.length },
            { id: 'following', label: 'Mes Chaînes', icon: Users, count: filteredSubscriptions.length },
            { id: 'favorites', label: 'Favoris', icon: Bookmark, count: sortedFavorites.length }
          ].map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? 'bg-[#FF6B00] text-white shadow-md' : isDark ? 'bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300' : 'bg-slate-100/70 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/25 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENU DÉFILANT RESPONSIVE ── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-5xl mx-auto w-full pb-20 md:pb-8">
        
        {/* CONTENU ONGLET 1 : FIL DES VIDÉOS */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSelectedCreatorId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCreatorId === 'all'
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Tous
              </button>
              {subscriptions.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCreatorId(sub.id)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCreatorId === sub.id
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                      : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden">
                    {sub.avatar ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">{sub.name[0]}</div>}
                  </div>
                  <span>{sub.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedVideos.map(video => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/pro/video/${video.id}`)}
                  className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl overflow-hidden border shadow-sm cursor-pointer group hover:border-[#FF6B00]/50 transition-all`}
                >
                  <div className="relative aspect-video bg-zinc-800">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">{video.duration}</span>
                  </div>
                  <div className="p-3">
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                        {video.author?.avatar ? <img src={video.author.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{video.author?.name[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug">{video.title}</h3>
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{video.author?.name}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40">
                          <span className="text-[10px] text-zinc-500">{video.viewsCount} vues • {video.createdAt}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(video); }}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-[#FF6B00]"
                              title="Enregistrer"
                            >
                              <Bookmark size={13} className={favorites.some(f => String(f.videoId || (f as any).id) === String(video.id)) ? 'fill-[#FF6B00] text-[#FF6B00]' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleShare(video); }}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              title="Partager"
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : MES CHAÎNES */}
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSubscriptions.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
                Aucune chaîne trouvée
              </div>
            ) : (
              filteredSubscriptions.map(sub => (
                <div
                  key={sub.id}
                  className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl p-3 border shadow-sm flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/pro/profile/${sub.id}`)}>
                    <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                      {sub.avatar ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white">{sub.name[0]}</div>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{sub.name}</h3>
                      <p className="text-xs text-[#FF6B00] font-medium">{sub.profession}</p>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{sub.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleNotifications(sub.id)}
                      className={`p-2 rounded-xl transition-colors ${sub.notificationsEnabled ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}
                      title="Notifications"
                    >
                      <Bell size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnsubscribeConfirm(sub.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                    >
                      Abonné
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENU ONGLET 3 : FAVORIS (SYNCHRONISÉ) */}
        {activeTab === 'favorites' && (
          <div>
            {sortedFavorites.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto stroke-1" />
                <p className="text-sm font-semibold text-zinc-400">Aucune vidéo dans vos favoris</p>
                <p className="text-xs text-zinc-500">Ajoutez des vidéos aux favoris depuis l'accueil ou le lecteur vidéo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFavorites.map(fav => (
                  <div
                    key={fav.videoId || (fav as any).id}
                    onClick={() => navigate(`/pro/video/${fav.videoId || (fav as any).id}`)}
                    className={`${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200'} rounded-2xl overflow-hidden border shadow-sm cursor-pointer group hover:border-[#FF6B00]/50 transition-all`}
                  >
                    <div className="relative aspect-video bg-zinc-800">
                      <img src={fav.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">{fav.duration || '05:00'}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug">{fav.title}</h3>
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{fav.professionalName}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40">
                        <span className="text-[10px] text-zinc-500">Enregistré</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(fav); }}
                          className="p-1.5 rounded-lg text-[#FF6B00] hover:bg-zinc-800"
                          title="Retirer des favoris"
                        >
                          <Bookmark size={14} className="fill-[#FF6B00]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Subscriptions
