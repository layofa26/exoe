const resolveApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/+$/, '')

  // Lè nou nan navigatè (dev lokal, tinèl Cloudflare, oswa rezo mobil), sèvi ak proxy relatif /api/v1
  if (typeof window !== 'undefined') {
    if (!import.meta.env.PROD || window.location.hostname.includes('trycloudflare.com')) {
      return '/api/v1'
    }
  }

  return '/api/v1'
}

export const API_BASE_URL = resolveApiBaseUrl()
