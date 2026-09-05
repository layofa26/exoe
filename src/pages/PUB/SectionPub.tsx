import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users,
  Calendar,
  Sparkles,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Building2
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

import { getStoredAds, fetchRemoteAds, trackAdClick, type Ad } from './AdBanner'
import { API_BASE_URL } from '../../config/api'

export interface FeaturedCompany {
  id: string
  name: string
  initials: string
  category: string
  color: string
  url: string
  tagline?: string
  description?: string
  gradient?: string
  brandLogo?: string
  ctaLabel?: string
  ctaTextColor?: string
  ctaBgColor?: string
  bgType?: 'color' | 'gradient' | 'media'
  bgColor?: string
  bgMediaUrl?: string
  bgVideoUrl?: string
  targetAudience?: 'all' | 'interests'
  targetInterests?: string[]
}

interface RecommendedPro {
  id: string
  name: string
  username: string
  profession: string
  avatarUrl?: string
  subscribersCount: number
  isFollowing?: boolean
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  category: string
  isLive?: boolean
}

interface SectionPubProps {
  variant?: 'auto' | 'mobile' | 'desktop'
}

export default function SectionPub({ variant = 'auto' }: SectionPubProps) {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isDark = resolvedTheme === 'dark'

  const [searchParams] = useSearchParams()
  const highlightAdId = searchParams.get('highlightAd') || searchParams.get('adId')

  const [realAds, setRealAds] = useState<Ad[]>(() => getStoredAds())
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const mobileSliderRef = useRef<HTMLDivElement>(null)

  // Synchronisation distante + écoute des mises à jour en direct depuis le Dashboard PUB
  useEffect(() => {
    fetchRemoteAds().then(remote => {
      if (Array.isArray(remote)) setRealAds(remote)
    })

    const handleUpdate = () => {
      setRealAds(getStoredAds())
    }
    window.addEventListener('exile_ads_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('exile_ads_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const activeRealAds = realAds.filter(a => !a.status || a.status === 'active')

  const userProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
    } catch {
      return {}
    }
  }, [])

  const userInterests: string[] = useMemo(() => {
    const list: string[] = []
    if (Array.isArray(userProfile?.interests)) list.push(...userProfile.interests)
    if (userProfile?.profession) list.push(userProfile.profession)
    return list.map((s: string) => String(s).toLowerCase().trim())
  }, [userProfile])

  // Filtrage d'audience réel : Tous les visiteurs OU selon centres d'intérêt
  const targetedAds = useMemo(() => {
    return activeRealAds.filter(ad => {
      // 1. Si ciblage = "all", visible pour tout le monde (connecté ou non)
      if (!ad.targetAudience || ad.targetAudience === 'all') return true

      // 2. Si ciblage = "interests"
      if (ad.targetAudience === 'interests') {
        const adInterests = (ad.targetInterests || []).map(i => i.toLowerCase().trim())
        if (adInterests.length === 0) return true
        // Si l'utilisateur a au moins un centre d'intérêt correspondant
        const hasMatch = userInterests.some(ui => adInterests.some(ai => ai.includes(ui) || ui.includes(ai)))
        // Pour les visiteurs non connectés, afficher également pour découverte
        return hasMatch || userInterests.length === 0
      }
      return true
    })
  }, [activeRealAds, userInterests])

  // Seules les vraies publicités créées depuis le Dashboard PUB sont affichées (aucune fausse pub)
  const companies: FeaturedCompany[] = targetedAds.map(a => {
    const rawMedia = a.bgMediaUrl || a.bgVideoUrl || (a as any).bg_media_url || ''
    const hasMedia = Boolean(rawMedia && rawMedia.trim().length > 0)
    return {
      id: a.id,
      name: a.brandName,
      initials: a.brandInitials || a.brandName.slice(0, 2).toUpperCase(),
      category: a.category || 'Entreprise',
      color: a.bgColor || a.brandColor || '#2563eb',
      bgColor: a.bgColor || a.brandColor || '#2563eb',
      bgType: hasMedia ? 'media' : (a.bgType || (a.gradient ? 'gradient' : 'color')),
      gradient: hasMedia || a.bgType === 'color' ? '' : (a.gradient || ''),
      bgMediaUrl: rawMedia,
      bgVideoUrl: rawMedia,
      targetAudience: a.targetAudience || 'all',
      targetInterests: a.targetInterests || [],
      url: a.ctaUrl || '#',
      tagline: a.tagline,
      description: a.description,
      brandLogo: a.brandLogo,
      ctaLabel: a.ctaLabel || 'Visiter',
      ctaTextColor: a.ctaTextColor || '#ffffff',
      ctaBgColor: a.ctaBgColor || '#FF6B00',
    }
  })

  // Sélection et focalisation immédiate si une notification renvoie vers une publicité spécifique
  useEffect(() => {
    if (highlightAdId && companies.length > 0) {
      const targetIdx = companies.findIndex(c => String(c.id) === String(highlightAdId))
      if (targetIdx !== -1) {
        setCurrentAdIndex(targetIdx)
        if (mobileSliderRef.current) {
          const targetEl = mobileSliderRef.current.children[targetIdx] as HTMLElement
          if (targetEl && typeof targetEl.scrollIntoView === 'function') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
          }
        }
      }
    }
  }, [highlightAdId, companies])

  // Rotation automatique douce pour tous les modes (passe les publicités l'une après l'autre)
  useEffect(() => {
    if (companies.length <= 1) return
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % companies.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [companies.length])

  // Défilement automatique fluide vers la publicité active (les pubs passent l'une après l'autre sans jamais aller à la ligne)
  useEffect(() => {
    if (!mobileSliderRef.current || companies.length <= 1) return
    const container = mobileSliderRef.current
    if (!container || !container.children) return
    const activeItem = container.children[currentAdIndex % companies.length] as HTMLElement
    if (activeItem && typeof activeItem.offsetLeft === 'number') {
      const targetLeft = activeItem.offsetLeft - container.offsetLeft - (container.clientWidth / 2 - activeItem.clientWidth / 2)
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth'
        })
      } else {
        container.scrollLeft = Math.max(0, targetLeft)
      }
    }
  }, [currentAdIndex, companies.length])

  const [pros, setPros] = useState<RecommendedPro[]>([
    { id: '1', name: 'Dr. Marc Antoine', username: 'marcantoine', profession: 'Cardiologue & Chercheur', subscribersCount: 1420, isFollowing: false },
    { id: '2', name: 'Sophie Laurent', username: 'sophielaurent', profession: 'Experte FinTech & IA', subscribersCount: 3890, isFollowing: false }
  ])

  const [events, setEvents] = useState<UpcomingEvent[]>([
    { id: 'evt_1', title: 'Masterclass : Architecture Web & Sécurité', date: 'Demain à 18h00', category: 'Tech', isLive: true },
    { id: 'evt_2', title: 'Webinaire : Stratégies d’Investissement 2026', date: 'Samedi 14h00', category: 'Finance', isLive: false }
  ])

  // Charger les profils réels du backend
  useEffect(() => {
    const fetchPros = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/profil/profils/`, { headers })
        if (res.ok) {
          const data = await res.json()
          const raw: any[] = Array.isArray(data) ? data : (data.results || [])
          if (raw.length > 0) {
            setPros(raw.slice(0, 3).map((p: any) => ({
              id: String(p.user_id || p.id),
              name: p.full_name || p.username || 'Professionnel',
              username: p.username || 'pro',
              profession: p.profession || p.specialite || 'Expert',
              avatarUrl: p.photo_url || p.photo,
              subscribersCount: p.subscribers_count || 120,
              isFollowing: false
            })))
          }
        }
      } catch {}
    }
    fetchPros()
  }, [])

  const handleToggleFollow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setPros(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.isFollowing
        return {
          ...p,
          isFollowing: nextState,
          subscribersCount: nextState ? p.subscribersCount + 1 : Math.max(0, p.subscribersCount - 1)
        }
      }
      return p
    }))

    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        await fetch(`${API_BASE_URL}/abonnement/abonnements/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ professionnel: id })
        })
      }
    } catch {}
  }

  const activeAd = companies.length > 0 ? (companies[currentAdIndex % companies.length] || companies[0]) : null

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)

  const renderMobileFeaturedCompanies = () => (
    <div className="w-full py-1">
      {companies.length === 0 ? (
        <div className={`rounded-2xl border p-3.5 text-center space-y-2 mx-1 ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-sm font-bold">
            🏢
          </div>
          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Espace Entreprise(PUB)</p>
          <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Promouvez votre marque auprès des professionnels EXILE.</p>
          <button
            onClick={() => setIsInquiryModalOpen(true)}
            className="inline-block px-3.5 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs transition-colors shadow-sm active:scale-95"
          >
            📩 Faire une demande publicitaire
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between px-2 sm:px-1 mb-2">
            <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1.5`}>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Espace Entreprise(PUB)
              </span>
            </h3>
            {/* Indicateur d'animation synchronisé avec Desktop */}
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {companies.slice(0, 6).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentAdIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === (currentAdIndex % companies.length)
                      ? 'w-4 bg-orange-500'
                      : isDark ? 'w-1.5 bg-zinc-700' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Toujours sur UNE SEULE LIGNE horizontale (ne va JAMAIS à la ligne) — les publicités défilent et passent l'une après l'autre */}
          <div
            ref={mobileSliderRef}
            className="flex flex-nowrap items-center gap-1.5 sm:gap-2 px-1 pb-1 overflow-x-auto no-scrollbar scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {companies.map((company, idx) => {
              const isSelected = idx === (currentAdIndex % companies.length)
              const isTargetHighlighted = Boolean(highlightAdId && String(company.id) === String(highlightAdId))
              const mediaUrl = company.bgMediaUrl || company.bgVideoUrl || ''
              const hasMedia = Boolean(mediaUrl && mediaUrl.trim().length > 0)
              const isVideo = mediaUrl.startsWith('data:video') || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')
              const hasGradient = Boolean(company.gradient) && !hasMedia
              const hasColor = Boolean(company.bgColor || company.color) && !hasMedia && !hasGradient

              return (
                <div
                  key={company.id}
                  id={`exile-ad-${company.id}`}
                  onClick={() => {
                    setCurrentAdIndex(idx)
                    trackAdClick(company.id, company.url)
                  }}
                  style={!hasMedia && !hasGradient && hasColor ? { backgroundColor: company.bgColor || company.color } : undefined}
                  className={`relative rounded-xl border p-1.5 flex flex-col items-center justify-between text-center shadow-sm transition-all duration-500 cursor-pointer overflow-hidden h-[98px] sm:h-[110px] select-none flex-shrink-0 w-[calc(25%-5px)] sm:w-[calc(16.666%-7px)] ${
                    isTargetHighlighted
                      ? 'ring-4 ring-[#FF6B00] shadow-xl shadow-orange-500/50 scale-[1.06] z-20 border-[#FF6B00] animate-pulse'
                      : isSelected
                      ? 'ring-2 ring-[#FF6B00] shadow-md shadow-orange-500/20 scale-[1.03] z-10 border-[#FF6B00]'
                      : isDark
                      ? 'border-zinc-800 hover:border-zinc-700'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    hasGradient && !hasMedia ? `bg-gradient-to-br ${company.gradient} text-white` : ''
                  }`}
                >
                  {/* Arrière-plan Média Réel : GIF, Image ou Vidéo */}
                  {hasMedia && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]" />
                    </div>
                  )}

                  {/* Pastille de pulsation dynamique sur la publicité active */}
                  {isSelected && (
                    <span className="absolute top-1 right-1 flex h-2 w-2 z-20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                  )}

                  {/* Contenu compact de la boîte publicitaire */}
                  <div className="relative z-10 w-full flex flex-col items-center justify-between h-full">
                    {/* Logo ou Initiale */}
                    {company.brandLogo ? (
                      <img
                        src={company.brandLogo}
                        alt={company.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm border border-white/30 flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-sm ring-1 ring-white/20 flex-shrink-0"
                        style={{ backgroundColor: (hasMedia || hasGradient) ? 'rgba(255,255,255,0.25)' : (company.color || '#2563eb') }}
                      >
                        {company.initials}
                      </div>
                    )}

                    {/* Nom de la marque */}
                    <div className="w-full px-0.5 my-0.5">
                      <p className={`text-[10px] sm:text-[11px] font-black truncate leading-tight ${
                        hasMedia || hasGradient || hasColor ? 'text-white drop-shadow-sm' : (isDark ? 'text-white' : 'text-zinc-900')
                      }`}>
                        {company.name}
                      </p>
                    </div>

                    {/* Bouton CTA - Texte visible et couleurs dynamiques personnalisables */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        trackAdClick(company.id, company.url)
                      }}
                      style={{
                        backgroundColor: company.ctaBgColor || '#FF6B00',
                        color: company.ctaTextColor || '#ffffff'
                      }}
                      className="w-full py-0.5 px-1 rounded-md text-[9px] sm:text-[10px] font-extrabold truncate text-center shadow-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      <span className="truncate">{company.ctaLabel || 'Visiter'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  // Si on est en mode forcé mobile
  if (variant === 'mobile') {
    return (
      <>
        {renderMobileFeaturedCompanies()}
        <AdInquiryModal isOpen={isInquiryModalOpen} onClose={() => setIsInquiryModalOpen(false)} isDark={isDark} />
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sur mobile et tablette : Vue horizontale élégante */}
      <div className="block lg:hidden">
        {renderMobileFeaturedCompanies()}
      </div>

      {/* Sur Desktop : Vue Colonne Latérale Complète */}
      <div className="hidden lg:block space-y-4 p-2 sm:p-3">
        {/* 1. ESPACE PUBLICITAIRE : ENTREPRISE EN VEDETTE */}
        {!activeAd ? (
          <div className={`rounded-3xl border p-4 text-center space-y-2.5 ${
            isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Espace Entreprises (PUB)</h4>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Promouvez votre marque auprès des professionnels EXILE.</p>
            <button
              onClick={() => setIsInquiryModalOpen(true)}
              className="inline-block w-full py-2 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold text-center transition-colors shadow-sm active:scale-95"
            >
              📩 Faire une demande publicitaire
            </button>
          </div>
        ) : (
          <div
            onClick={() => trackAdClick(activeAd.id, activeAd.url)}
            className={`rounded-3xl border overflow-hidden shadow-sm transition-all h-[245px] flex flex-col justify-between cursor-pointer select-none group ${
              isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* En-tête Badge Espace Entreprise(PUB) */}
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Espace Entreprise(PUB)
                </span>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {companies.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentAdIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentAdIndex
                        ? 'w-5 bg-orange-500'
                        : isDark ? 'bg-zinc-700' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bannière Visuelle (hauteur constante et stable) */}
            <div
              style={!activeAd.bgMediaUrl && !activeAd.gradient ? { backgroundColor: activeAd.bgColor || activeAd.color || '#2563eb' } : undefined}
              className={`flex-1 p-3.5 ${activeAd.gradient && !activeAd.bgMediaUrl ? `bg-gradient-to-br ${activeAd.gradient}` : ''} text-white relative overflow-hidden flex flex-col justify-between`}
            >
              {/* Média de fond si configuré (GIF, Image ou Vidéo) */}
              {activeAd.bgMediaUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  {(activeAd.bgMediaUrl.startsWith('data:video') || activeAd.bgMediaUrl.endsWith('.mp4') || activeAd.bgMediaUrl.endsWith('.webm')) ? (
                    <video
                      src={activeAd.bgMediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={activeAd.bgMediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
                </div>
              )}

              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2">
                  {activeAd.brandLogo ? (
                    <img src={activeAd.brandLogo} alt={activeAd.name} className="w-8 h-8 rounded-xl object-cover border border-white/20 flex-shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: (activeAd.bgVideoUrl || activeAd.gradient) ? 'rgba(255,255,255,0.25)' : activeAd.color }}
                    >
                      {activeAd.initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm leading-tight text-white truncate">{activeAd.name}</h4>
                    <p className="text-[10px] text-white/80 truncate">{activeAd.category}</p>
                  </div>
                </div>
                {activeAd.tagline && (
                  <p className="text-xs font-semibold pt-0.5 text-white/95 line-clamp-1">{activeAd.tagline}</p>
                )}
                {activeAd.description && (
                  <p className="text-[11px] text-white/80 leading-relaxed line-clamp-2">{activeAd.description}</p>
                )}
              </div>
            </div>

            {/* CTA Pub - Texte exact et couleurs dynamiques définies dans le Dashboard PUB */}
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  trackAdClick(activeAd.id, activeAd.url)
                }}
                style={{
                  backgroundColor: activeAd.ctaBgColor || '#FF6B00',
                  color: activeAd.ctaTextColor || '#ffffff'
                }}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 group-hover:shadow-md"
              >
                <span className="truncate">{activeAd.ctaLabel || 'Visiter'}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

      {/* 2. SECTION : PROFESSIONNELS RECOMMANDÉS */}
      <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Experts Recommandés
            </h3>
          </div>
          <Link
            to="/pro/subscriptions"
            className="text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-0.5"
          >
            Voir tout
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {pros.map(pro => (
            <div
              key={pro.id}
              onClick={() => navigate(`/pro/profile/${pro.id}`)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden">
                  {pro.avatarUrl ? (
                    <img src={pro.avatarUrl} alt={pro.name} className="w-full h-full object-cover" />
                  ) : (
                    pro.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      @{pro.username.replace('@', '')}
                    </p>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                  <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {pro.profession}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleToggleFollow(pro.id, e)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                  pro.isFollowing
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95'
                }`}
              >
                {pro.isFollowing ? (
                  <>
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    Suivi
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    Suivre
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION : ÉVÉNEMENTS À VENIR */}
      <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Événements & Live
            </h3>
          </div>
          <Link
            to="/pro/events"
            className="text-[11px] font-semibold text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-0.5"
          >
            Tous
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {events.map(evt => (
            <div
              key={evt.id}
              onClick={() => navigate('/pro/events')}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  evt.isLive
                    ? 'bg-red-500/15 text-red-500 animate-pulse'
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {evt.isLive ? 'EN DIRECT' : evt.category}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {evt.date}
                </span>
              </div>
              <p className={`text-xs font-semibold line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {evt.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Modal de Demande Publicitaire Directe (Option 1) */}
    <AdInquiryModal isOpen={isInquiryModalOpen} onClose={() => setIsInquiryModalOpen(false)} isDark={isDark} />
  </div>
)
}

function AdInquiryModal({ isOpen, onClose, isDark }: { isOpen: boolean; onClose: () => void; isDark: boolean }) {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phoneWhatsApp: '',
    preferredContact: 'WhatsApp 💬',
    sector: 'Technologie',
    budget: '1000',
    currency: 'HTG',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  // Bloquer le scroll d'arrière-plan et masquer les contrôles vidéo quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('pub-inquiry-modal-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('pub-inquiry-modal-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('pub-inquiry-modal-open')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...form,
      createdAt: new Date().toISOString()
    }

    // 1. Sauvegarder dans la boîte de réception PUB locale
    const existingInquiries = JSON.parse(localStorage.getItem('exile_pub_inquiries') || '[]')
    const updatedInquiries = [newInquiry, ...existingInquiries]
    localStorage.setItem('exile_pub_inquiries', JSON.stringify(updatedInquiries))

    // Notifier le Dashboard PUB en direct
    window.dispatchEvent(new CustomEvent('exile_pub_inquiry_added', { detail: newInquiry }))
    window.dispatchEvent(new Event('storage'))

    // 2. Synchroniser avec le Backend Django
    const syncInquiry = async () => {
      try {
        await fetch(`${API_BASE_URL}/pub/demandes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInquiry)
        })
      } catch {}
    }
    syncInquiry()

    // 3. 🔔 AUTOMATION : Envoyer une notification automatique de confirmation avec date réelle et logo
    const existingNotifs = JSON.parse(localStorage.getItem('exile_notifications') || '[]')
    const customPlatformLogo = localStorage.getItem('exile_pub_platform_logo') || ''

    const realDateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' à ' + new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const autoNotif = {
      id: `notif_pub_${Date.now()}`,
      title: '📩 Demande publicitaire enregistrée !',
      message: `Votre demande pour "${form.companyName}" a bien été transmise à notre équipe. Vous serez recontacté(e) par ${form.preferredContact} (${form.phoneWhatsApp || form.email}).`,
      date: realDateStr,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'system',
      logo: customPlatformLogo
    }
    localStorage.setItem('exile_notifications', JSON.stringify([autoNotif, ...existingNotifs]))
    window.dispatchEvent(new CustomEvent('exile_notification_added', { detail: autoNotif }))
    window.dispatchEvent(new CustomEvent('exile_notifications_updated'))
    window.dispatchEvent(new Event('storage'))

    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 3500)
  }

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md sm:backdrop-blur-lg flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
    >
      <style>{`
        body.pub-inquiry-modal-open .sound-toggle-btn,
        body.pub-inquiry-modal-open .feed-progress-bar,
        body.pub-inquiry-modal-open .video-controls-overlay {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        body.pub-inquiry-modal-open .feed-video-card,
        body.pub-inquiry-modal-open .video-player-container,
        body.pub-inquiry-modal-open main,
        body.pub-inquiry-modal-open .pro-feed-container {
          filter: blur(8px) brightness(0.6) !important;
          transition: filter 0.2s ease-in-out !important;
        }
      `}</style>
      <div className={`w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-3xl border-0 sm:border ${isDark ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} p-4 sm:p-6 shadow-2xl space-y-4 overflow-y-auto relative z-10 shadow-black/90`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center font-bold text-base shadow-sm">
              📩
            </div>
            <div>
              <h3 className="font-bold text-base">Demande Publicitaire Entreprise</h3>
              <p className="text-xs text-zinc-400">Contactez directement l'équipe EXILE</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold border border-emerald-500/30">
              ✓
            </div>
            <h4 className="text-lg font-bold text-emerald-400">Demande transmise avec succès !</h4>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
              Une <strong>notification automatique de confirmation</strong> a été envoyée à votre compte. Notre équipe vous recontactera très rapidement par <strong>{form.preferredContact}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1">Nom de l'Entreprise / Marque *</label>
              <input
                required
                type="text"
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                placeholder="ex: Solèy Market / DigiFinance"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Nom du Contact</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={e => setForm({ ...form, contactName: e.target.value })}
                  placeholder="votre nom & prénom"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Email Professionnel *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@entreprise.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                />
              </div>
            </div>

            {/* Champ Téléphone / WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <span>Numéro Téléphone / WhatsApp *</span>
                </label>
                <input
                  required
                  type="tel"
                  value={form.phoneWhatsApp}
                  onChange={e => setForm({ ...form, phoneWhatsApp: e.target.value })}
                  placeholder="+509 3700 0000 / +1..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Canal de contact préféré *</label>
                <select
                  value={form.preferredContact}
                  onChange={e => setForm({ ...form, preferredContact: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                >
                  <option value="WhatsApp 💬">💬 WhatsApp (Message Direct)</option>
                  <option value="Appel Téléphonique 📞">📞 Appel Téléphonique</option>
                  <option value="Email 📧">📧 Email Professionnel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Devise & Budget Souhaité</label>
                <div className="flex gap-1.5">
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className={`px-2.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                  >
                    <option value="HTG">HTG</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    placeholder="1000"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Secteur d'activité</label>
                <select
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                >
                  <option value="Technologie">Technologie</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Finance">Finance</option>
                  <option value="Santé">Santé</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Services">Services</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Message & Objectif de la campagne *</label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez votre produit, vos objectifs de visibilité..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none`}
              />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span>Envoyer ma demande</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


