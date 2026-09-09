/**
 * Exile Platform - Centralized Media URL Resolver
 * 
 * S'assure que toutes les ressources multimédias (/media/...) sont résolues correctement :
 * 1. En navigateur (localhost, réseau local, ou tunnel Cloudflare) : retourne un chemin relatif /media/...
 *    qui passe directement par le proxy Vite (vite.config.ts) sans déclencher de blocage Mixed Content (HTTPS -> HTTP)
 *    ni pointer sur localhost sur un appareil distant.
 * 2. En production sans tunnel ou en environnement distant SSR : utilise l'origine backend configurée.
 * 3. Supporte les URLs absolues (Supabase, S3, CDN, data:, blob:).
 */

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return ''

  // URLs déjà complètes ou protocoles spéciaux
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  // Normalisation du chemin avec slash initial
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  // Si l'URL pointe vers les médias Django (/media/...)
  if (cleanPath.startsWith('/media/')) {
    // Si nous sommes dans un navigateur, un chemin relatif /media/... est TOUJOURS préférable
    // car le proxy Vite forwarde directement vers Django (127.0.0.1:8000), évitant :
    // - Les blocages Mixed Content sous HTTPS (ex: Cloudflare Tunnel trycloudflare.com)
    // - Les blocages CORS
    // - Les erreurs 'localhost' sur les téléphones ou appareils du réseau local
    if (typeof window !== 'undefined') {
      const customMediaBase = import.meta.env.VITE_MEDIA_BASE_URL
      if (customMediaBase) {
        return `${customMediaBase.replace(/\/+$/, '')}${cleanPath}`
      }
      return cleanPath
    }

    // SSR ou fallback
    const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')
    const origin = apiBase.replace(/\/api.*$/, '').replace(/\/+$/, '')
    return `${origin}${cleanPath}`
  }

  // Si c'est un nom de fichier brut destiné au bucket Supabase Exile_images
  if (!cleanPath.startsWith('/api') && !cleanPath.startsWith('/static')) {
    const supabaseBase = import.meta.env.VITE_SUPABASE_URL || 'https://phjpbbcymhtppfkyoegk.supabase.co'
    return `${supabaseBase.replace(/\/+$/, '')}/storage/v1/object/public/Exile_images/${trimmed.replace(/^\/+/, '')}`
  }

  return cleanPath
}

export default resolveMediaUrl
