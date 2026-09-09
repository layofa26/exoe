const PRODUCTION_API_BASE_URL = 'https://exile-backend-9q6o.onrender.com/api/v1'
const DEVELOPMENT_API_BASE_URL = '/api/v1'

const resolveApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/+$/, '')

  // Lè nou nan navigatè (dev lokal, tinèl Cloudflare, oswa rezo mobil), sèvi ak proxy relatif /api/v1
  if (typeof window !== 'undefined') {
    if (!import.meta.env.PROD || window.location.hostname.includes('trycloudflare.com')) {
      return '/api/v1'
    }
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_API_BASE_URL
  }
  return DEVELOPMENT_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
