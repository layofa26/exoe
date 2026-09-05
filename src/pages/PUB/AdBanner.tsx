// ============================================================
// EXILE Platform — PUB/AdBanner.tsx
// Composant publicité animé, non-intrusif
// S'intègre dans le feed vidéo (toutes les N vidéos)
// React 18 + TypeScript — aucune dépendance externe
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { API_BASE_URL } from "../../config/api";

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
  ctaTextColor?: string;        // Couleur du texte du bouton ex: "#ffffff"
  ctaBgColor?: string;          // Couleur de fond du bouton ex: "#FF6B00"
  bgType?: 'color' | 'gradient' | 'media'; // Type de fond choisi
  bgColor?: string;             // Couleur de fond réelle hex ex: "#2563eb"
  bgMediaUrl?: string;          // Média de fond : image, GIF, ou vidéo
  bgVideoUrl?: string;          // Vidéo d'arrière-plan
  userUuid?: string;            // UUID du propriétaire
  gradient: string;             // Tailwind gradient ex: "from-amber-500 to-orange-600"
  category: string;             // "Mode", "Tech", "Santé", etc.
  targetAudience?: 'all' | 'interests'; // Diffusion ciblée
  targetInterests?: string[];   // Liste des centres d'intérêt ciblés
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

export const fetchRemoteAds = async (): Promise<Ad[]> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('exile_custom_ads')
    }
    const res = await fetch(`${API_BASE_URL}/pub/annonces/`)
    if (res.ok) {
      const remoteAds = await res.json()
      if (Array.isArray(remoteAds)) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('exile_ads', JSON.stringify(remoteAds))
          window.dispatchEvent(new CustomEvent('exile_ads_updated', { detail: remoteAds }))
        }
        checkAndNotifyExpiredAds(remoteAds)
        return remoteAds
      }
    }
  } catch {}
  const local = getStoredAds()
  checkAndNotifyExpiredAds(local)
  return local
}

export const saveStoredAds = async (ads: Ad[], options: { sync?: boolean } = {}): Promise<void> => {
  const { sync = true } = options
  try {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('exile_ads', JSON.stringify(ads))
      } catch {
        // En cas de quota dépassé (vidéo / GIF volumineux en Base64), sauvegarder version allégée en local
        try {
          const lightweight = ads.map(a => ({
            ...a,
            bgMediaUrl: a.bgMediaUrl && a.bgMediaUrl.length > 500000 ? '' : a.bgMediaUrl,
            bgVideoUrl: a.bgVideoUrl && a.bgVideoUrl.length > 500000 ? '' : a.bgVideoUrl
          }))
          localStorage.setItem('exile_ads', JSON.stringify(lightweight))
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('exile_ads_updated', { detail: ads }))
    }
    // Synchronisation serveur partagée intégrale dans la table PostgreSQL/SQLite
    if (!sync) return
    await fetch(`${API_BASE_URL}/pub/annonces/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaigns: ads })
    }).catch(() => {})
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des publicités:', e)
  }
}

// ─────────────────────────────────────────────────────────────
// IDENTIFICATION UUID & CLIC UNIQUE EN TEMPS RÉEL SANS DOUBLONS
// ─────────────────────────────────────────────────────────────

export const getUserUUID = (): string => {
  try {
    const profile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
    if (profile?.id) return String(profile.id)
    if (profile?.uuid) return String(profile.uuid)
  } catch {}
  let guestUuid = typeof localStorage !== 'undefined' ? localStorage.getItem('exile_client_uuid') : null
  if (!guestUuid && typeof localStorage !== 'undefined') {
    guestUuid = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
    localStorage.setItem('exile_client_uuid', guestUuid)
  }
  return guestUuid || 'guest_user'
}

export const trackAdClick = (adId: string, targetUrl?: string): void => {
  const userUuid = getUserUUID()
  const clickKey = `exile_ad_click_${adId}_${userUuid}`
  const alreadyClicked = typeof localStorage !== 'undefined' && localStorage.getItem(clickKey) === '1'

  if (!alreadyClicked) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(clickKey, '1')
    }

    // 1. Incrémenter en local et notifier
    const ads = getStoredAds()
    const updated = ads.map(a => {
      if (a.id === adId) {
        return { ...a, clicks: (a.clicks || 0) + 1 }
      }
      return a
    })
    saveStoredAds(updated)

    // 2. Transmettre au backend pour synchronisation en temps réel avec le dashboard
    fetch(`${API_BASE_URL}/pub/annonces/click/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: adId, user_uuid: userUuid })
    }).catch(() => {})
  }

  // 3. Ouvrir l'URL cible
  if (targetUrl && targetUrl !== '#' && targetUrl !== 'https://') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }
}

export const checkAndNotifyExpiredAds = (ads: Ad[]): void => {
  if (typeof localStorage === 'undefined') return
  const now = new Date()
  const myUuid = getUserUUID()

  ads.forEach(ad => {
    // Vérifier si la date de fin est dépassée ou statut terminé
    const isPastEnd = ad.endDate ? new Date(ad.endDate) < now : false
    if (ad.status === 'ended' || isPastEnd) {
      const notifiedKey = `exile_ad_expired_notified_${ad.id}_${myUuid}`
      if (localStorage.getItem(notifiedKey) !== '1') {
        localStorage.setItem(notifiedKey, '1')

        import('../../services/pubNotificationService').then(({ triggerPubNotification }) => {
          triggerPubNotification({
            type: 'campaign_ended',
            brandName: ad.brandName,
            adId: ad.id,
            endDate: ad.endDate,
            userUuid: ad.userUuid || myUuid
          })
        }).catch(() => {})
      }
    }
  })
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
