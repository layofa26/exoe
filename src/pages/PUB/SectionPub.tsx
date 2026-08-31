import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

import { getStoredAds, type Ad } from './AdBanner'

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

export const FEATURED_COMPANIES: FeaturedCompany[] = [
  {
    id: 'comp-1',
    name: 'DigiFinance HT',
    initials: 'DF',
    category: 'Finance',
    color: '#059669',
    gradient: 'from-emerald-600 to-teal-700',
    url: '#',
    tagline: 'Comptabilité & Solutions FinTech',
    description: 'Automatisez vos déclarations fiscales et optimisez la trésorerie de votre entreprise.'
  },
  {
    id: 'comp-2',
    name: 'TechHaïti',
    initials: 'TH',
    category: 'Technologie',
    color: '#2563eb',
    gradient: 'from-blue-600 to-indigo-700',
    url: '#',
    tagline: 'Transformation Digitale & Cloud',
    description: 'Développement de logiciels sur mesure, audits cybersécurité et infrastructure cloud pour entreprises.'
  },
  {
    id: 'comp-3',
    name: 'Solèy Market',
    initials: 'SM',
    category: 'Supermarché',
    color: '#ea580c',
    gradient: 'from-amber-500 to-orange-600',
    url: '#',
    tagline: 'Logistique & Approvisionnement',
    description: 'Livraison express et sourcing de produits de qualité pour les professionnels.'
  },
  {
    id: 'comp-4',
    name: 'Kay Reparasyon',
    initials: 'KP',
    category: 'Services',
    color: '#7c3aed',
    gradient: 'from-purple-600 to-indigo-800',
    url: '#',
    tagline: 'Maintenance & Réparations Pro',
    description: 'Services techniques et maintenance rapide pour vos équipements et locaux professionnels.'
  }
]

interface SectionPubProps {
  variant?: 'auto' | 'mobile' | 'desktop'
}

export default function SectionPub({ variant = 'auto' }: SectionPubProps) {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isDark = resolvedTheme === 'dark'

  const [realAds, setRealAds] = useState<Ad[]>(() => getStoredAds())
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  // Écouter les mises à jour en direct depuis le Dashboard PUB
  useEffect(() => {
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

  const activeRealAds = realAds.filter(a => a.status === 'active')

  const companies: FeaturedCompany[] = activeRealAds.map(a => ({
    id: a.id,
    name: a.brandName,
    initials: a.brandInitials || a.brandName.slice(0, 2).toUpperCase(),
    category: a.category || 'Entreprise',
    color: a.brandColor || '#2563eb',
    gradient: a.gradient || 'from-blue-600 to-indigo-700',
    url: a.ctaUrl || '#',
    tagline: a.tagline,
    description: a.description
  }))

  // Rotation automatique douce pour le mode desktop
  useEffect(() => {
    if (companies.length === 0) return
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % companies.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [companies.length])

  const [pros, setPros] = useState<RecommendedPro[]>([
    { id: '1', name: 'Dr. Marc Antoine', username: 'marcantoine', profession: 'Cardiologue & Chercheur', subscribersCount: 1420, isFollowing: false },
    { id: '2', name: 'Sophie Laurent', username: 'sophielaurent', profession: 'Experte FinTech & IA', subscribersCount: 3890, isFollowing: false }
  ])

  const [events] = useState<UpcomingEvent[]>([
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
      } catch {
        // Fallback silently
      }
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

  // ── 📱 VUE MOBILE & TABLETTE : "Entreprises en vedette" ──
  const renderMobileFeaturedCompanies = () => (
    <div className="w-full py-2">
      <div className="flex items-center justify-between px-2 sm:px-1 mb-2.5">
        <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Entreprises en vedette
        </h3>
      </div>

      {companies.length === 0 ? (
        <div className={`rounded-2xl border p-4 text-center space-y-2 mx-1 ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center mx-auto font-bold text-sm">
            📢
          </div>
          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Espace Entreprises (PUB)</p>
          <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Promouvez votre marque auprès des professionnels EXILE.</p>
          <button
            onClick={() => setIsInquiryModalOpen(true)}
            className="inline-block mt-1 px-4 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs transition-colors shadow-sm active:scale-95"
          >
            📩 Faire une demande publicitaire
          </button>
        </div>
      ) : (
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide px-1 pb-1 justify-start">
          {companies.map(company => (
            <div
              key={company.id}
              className={`${
                companies.length <= 2 ? 'w-44 sm:w-52 flex-shrink-0' : 'flex-1 min-w-[145px] sm:min-w-[165px]'
              } rounded-2xl border p-3 flex flex-col items-center text-center shadow-sm transition-transform active:scale-98 ${
                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
              }`}
            >
              {/* Logo / Initiale Avatar Cercle */}
              {company.brandLogo ? (
                <img
                  src={company.brandLogo}
                  alt={company.name}
                  className="w-12 h-12 rounded-full object-cover mb-2 shadow-sm border border-white/20"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm mb-2 shadow-sm"
                  style={{ backgroundColor: company.color || '#2563eb' }}
                >
                  {company.initials}
                </div>
              )}

              {/* Nom + Badge vérifié bleu */}
              <div className="flex items-center justify-center gap-1 w-full min-w-0">
                <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {company.name}
                </span>
                <CheckCircle2 size={13} className="text-blue-500 fill-blue-500 text-white flex-shrink-0" />
              </div>

              {/* Catégorie */}
              <span className={`text-[10px] sm:text-[11px] truncate mb-3 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                {company.category}
              </span>

              {/* Bouton Visiter Pill */}
              <a
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (company.url === '#') e.preventDefault()
                }}
                className="w-full py-1 px-3 rounded-full border border-[#FF6B00]/40 hover:border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10 text-xs font-bold transition-all text-center"
              >
                Visiter
              </a>
            </div>
          ))}
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
          <div className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
            isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'
          }`}>
            <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Sponsorisé
                </span>
                <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Espace Entreprise
                </span>
              </div>
              <div className="flex gap-1">
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

            {/* Bannière Dégradé Visuelle */}
            <div className={`p-4 bg-gradient-to-br ${activeAd.gradient || 'from-blue-600 to-indigo-700'} text-white relative overflow-hidden`}>
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center gap-2">
                  {activeAd.brandLogo ? (
                    <img src={activeAd.brandLogo} alt={activeAd.name} className="w-8 h-8 rounded-xl object-cover border border-white/20" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm"
                      style={{ backgroundColor: activeAd.color }}
                    >
                      {activeAd.initials}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-white">{activeAd.name}</h4>
                    <p className="text-[11px] text-white/80">{activeAd.category}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold pt-1 text-white/95">{activeAd.tagline}</p>
                <p className="text-[11px] text-white/80 leading-relaxed line-clamp-2">{activeAd.description}</p>
              </div>
            </div>

            {/* CTA Pub */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between gap-2">
              <a
                href={activeAd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold text-center transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Visiter le catalogue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
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
        body.pub-inquiry-modal-open .video-player-container {
          filter: blur(10px) brightness(0.5) !important;
          transition: filter 0.2s ease-in-out !important;
        }
      `}</style>
      <div className={`w-full max-w-lg rounded-3xl border ${isDark ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative z-10 shadow-black/90`}>
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


