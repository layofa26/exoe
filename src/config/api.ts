const PRODUCTION_API_BASE_URL = 'https://exile-backend-9q6o.onrender.com/api/v1'
const DEVELOPMENT_API_BASE_URL = 'http://localhost:8000/api/v1'

const isLocalHost = (url: string): boolean => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url)

const resolveApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (import.meta.env.PROD) {
    if (!configured || isLocalHost(configured)) return PRODUCTION_API_BASE_URL
    return configured.replace(/\/+$/, '')
  }
  return (configured || DEVELOPMENT_API_BASE_URL).replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()
