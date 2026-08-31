import { z } from 'zod'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
// Ensure API_BASE_URL always ends with /api/v1 for production URLs
const FINAL_API_BASE_URL = API_BASE_URL.includes('/api/v1')
  ? API_BASE_URL
  : API_BASE_URL + '/v1'
const API_TIMEOUT = 15000 // 15 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Rate limiting: store last request timestamps per endpoint
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20

// Get current user ID from token
const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.user_id || payload.sub || null
  } catch {
    return null
  }
}

// Check rate limit
const checkRateLimit = (endpoint: string): boolean => {
  const now = Date.now()
  const requests = rateLimitStore.get(endpoint) || []
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for ${endpoint}`)
    return false
  }
  
  recentRequests.push(now)
  rateLimitStore.set(endpoint, recentRequests)
  return true
}

// Sleep function for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Generic API client with retry, timeout, and validation
export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
  retries: number = MAX_RETRIES
): Promise<{ success: boolean; data?: T; error?: string }> => {
  // Check rate limit
  if (!checkRateLimit(endpoint)) {
    return {
      success: false,
      error: 'Trop de requêtes. Veuillez réessayer plus tard.'
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  const url = endpoint.startsWith('http') ? endpoint : `${FINAL_API_BASE_URL}${endpoint}`
  
  // Add auth header if token exists (fallback from localStorage)
  const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
  const headers: Record<string, string> = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  // Merge with provided headers
  Object.assign(headers, options.headers as Record<string, string> || {})

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include' // Important for httpOnly cookies
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Retry on 5xx errors
      if (response.status >= 500 && retries > 0) {
        await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1))
        return apiClient<T>(endpoint, options, schema, retries - 1)
      }

      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.detail || errorData.error || `Erreur HTTP: ${response.status}`
      }
    }

    const data = await response.json()

    // Validate response if schema provided
    if (schema) {
      try {
        const validatedData = schema.parse(data)
        return { success: true, data: validatedData }
      } catch (error) {
        console.error('Validation error:', error)
        return {
          success: false,
          error: 'Erreur de validation des données'
        }
      }
    }

    return { success: true, data }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Délai de connexion dépassé. Veuillez réessayer.'
      }
    }

    // Retry on network errors
    if (retries > 0) {
      await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1))
      return apiClient<T>(endpoint, options, schema, retries - 1)
    }

    console.error('API error:', error)
    return {
      success: false,
      error: 'Erreur de connexion au serveur'
    }
  }
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, { method: 'GET' }, schema),
  
  post: <T>(endpoint: string, body: any, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, schema),
  
  put: <T>(endpoint: string, body: any, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, schema),
  
  patch: <T>(endpoint: string, body: any, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, schema),
  
  delete: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, { method: 'DELETE' }, schema),
  
  // For file uploads (FormData)
  upload: <T>(endpoint: string, formData: FormData, schema?: z.ZodSchema<T>) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Empty headers to avoid Content-Type override
    }, schema),
}

// Export helper to get current user ID
export { getCurrentUserId }
