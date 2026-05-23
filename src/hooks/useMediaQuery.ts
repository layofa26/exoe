import { useState, useEffect } from 'react';

/**
 * Hook generik pou detekte media queries.
 * Pi fleksib pase useIsMobile - pèmèt deteksyon plizyè breakpoints.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    setMatches(media.matches); // Mete ajou initialement
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// --- Hooks prekonfigire pou diferan taille ekran ---

/** Mobil: ekran < 640px */
export function useIsSmallMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/** Mobil ak Tablet pòtre: ekran < 768px */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** Tablet: ekran 768px - 1023px (iPad pòtre, etc) */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/** Tablet landscape ak piti laptop: ekran < 1024px */
export function useIsTabletOrBelow(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/** Desktop: ekran >= 1024px */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/** Gwo ekran: >= 1280px */
export function useIsLargeScreen(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/** Touch device (detekte si aparèy a gen touch) */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}
