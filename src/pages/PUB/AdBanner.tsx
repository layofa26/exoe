// ============================================================
// EXILE Platform — PUB/AdBanner.tsx
// Composant publicité animé, non-intrusif
// S'intègre dans le feed vidéo (toutes les N vidéos)
// React 18 + TypeScript — aucune dépendance externe
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type AdFormat = "banner" | "card" | "inline";
export type AdStatus = "active" | "paused" | "ended";

export interface Ad {
  id: string;
  brandName: string;
  brandLogo?: string;           // URL logo (optionnel, sinon initiales)
  brandInitials: string;
  brandColor: string;           // couleur hex principale de la marque
  tagline: string;              // phrase choc (max 60 chars)
  description: string;          // détail (max 120 chars)
  ctaLabel: string;             // texte bouton ex: "Découvrir", "En savoir plus"
  ctaUrl: string;
  gradient: string;             // Tailwind gradient ex: "from-amber-500 to-orange-600"
  category: string;             // "Mode", "Tech", "Santé", etc.
  impressions: number;
  clicks: number;
  budget: number;               // budget total
  currency?: string;            // "USD" | "HTG" | "EUR" | "CAD"
  exchangeRate?: string;        // Taux de change ex: "1 USD = 132 HTG"
  spent: number;                // dépensé
  status: AdStatus;
  startDate: string;
  endDate: string;
  targetViews: number;
}

interface AdBannerProps {
  ad: Ad;
  format?: AdFormat;
  onImpression?: (adId: string) => void;
  onClose?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// STOCKAGE RÉEL DES ANNONCES PUBLICITAIRES
// ─────────────────────────────────────────────────────────────

export const getStoredAds = (): Ad[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('exile_ads')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    }
  } catch (e) {
    console.error('Erreur lors de la lecture des publicités:', e)
  }
  return []
}

export const saveStoredAds = (ads: Ad[]): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('exile_ads', JSON.stringify(ads))
      window.dispatchEvent(new CustomEvent('exile_ads_updated', { detail: ads }))
    }
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des publicités:', e)
  }
}

// ─────────────────────────────────────────────────────────────
// HOOK : rotation des pubs
// ─────────────────────────────────────────────────────────────

export function useAdRotation(ads: Ad[], intervalMs = 12000) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Apparition différée de 800ms pour ne pas bloquer le rendu feed
    const delay = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % ads.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [ads.length, intervalMs]);

  const active = ads.filter((a) => a.status === "active");
  return { ad: active[idx % Math.max(active.length, 1)], visible };
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT : BADGE "Sponsorisé"
// ─────────────────────────────────────────────────────────────

function SponsoredBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full select-none">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
        <circle cx="4" cy="4" r="4" opacity="0.4" />
        <circle cx="4" cy="4" r="2" />
      </svg>
      Publicité
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : AdBanner
// ─────────────────────────────────────────────────────────────

export function AdBanner({
  ad,
  format = "card",
  onImpression,
  onClose,
  onClick,
}: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [entered, setEntered] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const impressionFired = useRef(false);

  // Animation d'entrée
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Shimmer accent toutes les 8s (subtil)
  useEffect(() => {
    const t = setInterval(() => {
      setShimmer(true);
      setTimeout(() => setShimmer(false), 800);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Impression tracking (IntersectionObserver)
  useEffect(() => {
    if (!ref.current || impressionFired.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionFired.current) {
          impressionFired.current = true;
          onImpression?.(ad.id);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ad.id, onImpression]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDismissed(true);
      setTimeout(() => onClose?.(ad.id), 300);
    },
    [ad.id, onClose]
  );

  const handleClick = useCallback(() => {
    onClick?.(ad.id);
    window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
  }, [ad.id, ad.ctaUrl, onClick]);

  if (dismissed) return null;

  // ── Format INLINE (entre vidéos dans le feed) ────────────
  if (format === "inline") {
    return (
      <div
        ref={ref}
        role="complementary"
        aria-label={`Publicité : ${ad.brandName}`}
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
        className="relative my-0"
      >
        {/* Ligne "Publicité" discrète */}
        <div className="flex items-center justify-between mb-2 px-1">
          <SponsoredBadge />
          <button
            onClick={handleClose}
            aria-label="Fermer la publicité"
            className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors text-lg leading-none px-1"
          >
            ×
          </button>
        </div>

        {/* Carte pub inline */}
        <button
          onClick={handleClick}
          className={`
            group relative w-full rounded-2xl overflow-hidden text-left
            bg-gradient-to-r ${ad.gradient}
            shadow-md hover:shadow-xl
            transition-all duration-300 hover:scale-[1.01]
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          `}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: shimmer
                ? "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)"
                : "transparent",
              transition: "background 0.6s ease",
            }}
          />

          <div className="flex items-center gap-4 px-5 py-4">
            {/* Logo marque */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-inner"
              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
            >
              {ad.brandLogo ? (
                <img src={ad.brandLogo} alt={ad.brandName} className="w-full h-full object-contain rounded-xl" />
              ) : (
                ad.brandInitials
              )}
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{ad.tagline}</p>
              <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{ad.description}</p>
              <p className="text-white/50 text-[11px] mt-1 font-medium">{ad.brandName} · {ad.category}</p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <span className="inline-block bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/30 transition-colors group-hover:bg-white/35 whitespace-nowrap">
                {ad.ctaLabel} →
              </span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ── Format CARD (sidebar ou section dédiée) ──────────────
  return (
    <div
      ref={ref}
      role="complementary"
      aria-label={`Publicité : ${ad.brandName}`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Bouton fermer - kache sou mobil pou ekonomize espas */}
      <div className="flex items-center justify-between mb-0 sm:mb-2">
        <SponsoredBadge />
        <button
          onClick={handleClose}
          aria-label="Fermer la publicité"
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors text-sm sm:text-base leading-none"
        >
          ×
        </button>
      </div>

      <button
        onClick={handleClick}
        className={`
          group relative w-full rounded-xl sm:rounded-2xl overflow-hidden text-left
          bg-gradient-to-br ${ad.gradient}
          shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl
          transition-all duration-300 hover:scale-[1.02] sm:hover:scale-[1.015]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        {/* Particules décoratives - pi piti sou mobil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-white/10 blur-lg sm:blur-xl" />
          <div className="absolute bottom-0 left-4 sm:left-8 w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-black/10 blur-md sm:blur-lg" />
        </div>

        {/* Shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: shimmer
              ? "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)"
              : "transparent",
            transition: "background 0.6s ease",
          }}
        />

        <div className="relative p-2 sm:p-3 md:p-5">
          {/* Header marque - pi kompak sou mobil */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-inner flex-shrink-0"
              style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
            >
              {ad.brandLogo ? (
                <img src={ad.brandLogo} alt={ad.brandName} className="w-full h-full object-contain rounded-lg sm:rounded-xl" />
              ) : (
                ad.brandInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-[11px] sm:text-xs md:text-sm leading-tight truncate">{ad.brandName}</p>
              <p className="text-white/60 text-[9px] sm:text-[10px] md:text-[11px] mt-0.5">{ad.category}</p>
            </div>
          </div>

          {/* Tagline - line-clamp pou mobil */}
          <p className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight mb-1 sm:mb-2 line-clamp-2">{ad.tagline}</p>
          <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-3 hidden sm:block">{ad.description}</p>

          {/* CTA - pi piti sou mobil */}
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-lg sm:rounded-xl transition-colors group-hover:bg-white/35">
            <span className="truncate max-w-[80px] sm:max-w-none">{ad.ctaLabel}</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT : Injecteur de pub dans le feed
// Insère une pub toutes les N vidéos (non-intrusif)
// ─────────────────────────────────────────────────────────────

export function AdInjector({
  children,
  ads,
  every = 3,
}: {
  children: React.ReactNode[];
  ads: Ad[];
  every?: number;
}) {
  const activeAds = ads.filter((a) => a.status === "active");
  const [adIdx, setAdIdx] = useState(0);

  const result: React.ReactNode[] = [];
  children.forEach((child, i) => {
    result.push(child);
    // Insérer une pub après chaque Nème élément
    if ((i + 1) % every === 0 && activeAds.length > 0) {
      const ad = activeAds[adIdx % activeAds.length];
      result.push(
        <div key={`ad-${i}`} className="col-span-full">
          <AdBanner
            ad={ad}
            format="inline"
            onClose={() => setAdIdx((x) => x + 1)}
            onImpression={(id) => console.log("[AD] impression:", id)}
            onClick={(id) => console.log("[AD] click:", id)}
          />
        </div>
      );
    }
  });

  return <>{result}</>;
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT : SectionPub (retrocompatible avec VideoFeed)
// ─────────────────────────────────────────────────────────────

interface SectionPubProps {
  className?: string;
}

export default function SectionPub({ className = '' }: SectionPubProps) {
  const { resolvedTheme } = useTheme();
  const [adIdx, setAdIdx] = useState(0);
  const [animatingAds, setAnimatingAds] = useState<number[]>([]);
  const activeAds = DEMO_ADS.filter((a) => a.status === "active");

  // Montrer jiska 12 piblikite (4x3)
  const getAdAt = (index: number) => activeAds[index % Math.max(activeAds.length, 1)];

  // Desktop: 12 piblikite (3x3)
  const desktopAds = [0, 1, 2, 3, 4, 5, 6, 7, 8,9,10,11].map(i => getAdAt(adIdx + i));
  
  // Mobile: 12 piblikite nan yon liy
  const mobileBaseAds = [0, 1, 2, 3, 4, 5, 6, 7, 8,9,10,11].map(i => getAdAt(adIdx + i));

  // Efè wotasyon chak 5 segond pou tout ekran
  useEffect(() => {
    const interval = setInterval(() => {
      // Chwazi yon piblikite aleyatwa pou ranplase
      const randomIndex = Math.floor(Math.random() * 6);
      setAnimatingAds([randomIndex]);
      
      // Apre 500ms animasyon, chanje li
      setTimeout(() => {
        setAdIdx(prev => prev + 1);
        setAnimatingAds([]);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Vèsyon mobil - Montre 6 piblikite nan yon liy horizontal (menm jan pou tout ekran piti)
  const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/pro';

  // Pa montre piblikite si se pa nan paj d'accueil (/pro)
  if (location.pathname !== '/pro' && location.pathname !== '/pro/') return null;

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  if (isSmallScreen) {
    return (
      <div className={`fixed top-[110px] sm:top-[128px] left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm ${className}`}>
        {/* Header ekstrèmman konpakt */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-2 py-0 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="pt-6 w-1 h-1  rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-white tracking-wide">Publicite</span>
          </div>
        </div>
        
        {/* Liy horizontal 6 piblikite - ekstrèmman konpakt */}
        <div className="flex overflow-x-auto gap-1 px-1 py-0 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
          {mobileBaseAds.slice(0, 6).map((ad, i) => (
            <div 
              key={`mobile-ad-${ad.id}-${i}`}
              className={`flex-shrink-0 transition-all duration-500 ${
                animatingAds.includes(i) 
                  ? 'scale-95 opacity-70' 
                  : 'scale-100 opacity-100'
              }`}
              style={{ 
                width: 'calc(25% - 4px)', 
                minWidth: '80px',
                scrollSnapAlign: 'start'
              }}
            >
              <button
                onClick={() => window.open(ad.ctaUrl, '_blank')}
                className="w-full text-left group bg-white rounded overflow-hidden shadow-sm hover:shadow transition-all duration-200 border border-gray-100 active:scale-95"
              >
                {/* Image container - pi piti 3:1 ratio */}
                <div className={`relative aspect-[4/2] overflow-hidden bg-gradient-to-br ${ad.gradient}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-[9px] tracking-wider drop-shadow">
                      {ad.brandInitials}
                    </span>
                  </div>
                  {/* Shine efè kan l ap wotete */}
                  {animatingAds.includes(i) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                  )}
                </div>
                
                {/* Text content - sèlman non, pi piti */}
                <div className="px-1 py-0.5">
                  <p className="text-[6px] font-bold text-gray-900 leading-none line-clamp-1">
                    {ad.brandName}
                  </p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vèsyon desktop - Grid 3x3 (jiska 9 piblikite) ak menm animasyon
  return (
    <div className={`space-y-3 mt-16 ${className}`}>
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} rounded-xl shadow-lg border ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-100'} overflow-hidden`}>
        {/* Header 
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white mb-0">Publicite</span>
          </div>
          <div className="flex gap-1 mt-10">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
        */}

        {/* Grid 3x3 ak menm animasyon an tankou mobil */}
        <div className="p-3 grid grid-cols-3 gap-3">
          {desktopAds.map((ad, i) => (
            <button
              key={`desktop-ad-${i}`}
              onClick={() => window.open(ad.ctaUrl, '_blank')}
              className={`text-left group transition-all duration-500 ${
                animatingAds.includes(i)
                  ? 'scale-95 opacity-70'
                  : 'scale-100 opacity-100'
              }`}
            >
              <div className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow bg-gradient-to-br ${ad.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-2xl">{ad.brandInitials}</span>
                </div>
                {/* Shine efè kan l ap wotete */}
                {animatingAds.includes(i) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <p className={`text-xs font-bold line-clamp-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{ad.brandName}</p>
                <p className={`text-[10px] line-clamp-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{ad.tagline}</p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
