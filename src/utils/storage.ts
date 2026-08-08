import { z } from 'zod'

// Safe localStorage operations with validation
export const safeStorage = {
  get: <T>(key: string, schema?: z.ZodSchema<T>): T | null => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      
      // Validate if schema provided
      if (schema) {
        const validated = schema.parse(parsed)
        return validated
      }
      
      return parsed
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      // Remove corrupted data
      localStorage.removeItem(key)
      return null
    }
  },

  set: <T>(key: string, value: T, schema?: z.ZodSchema<T>): boolean => {
    try {
      // Validate if schema provided
      if (schema) {
        schema.parse(value)
      }
      
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error)
      return false
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key)
  },

  clear: (): void => {
    localStorage.clear()
  },

  // Get with fallback
  getWithFallback: <T>(key: string, fallback: T, schema?: z.ZodSchema<T>): T => {
    const value = safeStorage.get<T>(key, schema)
    return value !== null ? value : fallback
  }
}

// Schema for common localStorage data structures
export const VideoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  author: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    avatarUrl: z.string().optional(),
  }).optional(),
  thumbnailUrl: z.string().optional(),
  viewsCount: z.number().optional(),
  createdAt: z.string().optional(),
})

export const EventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  organizerId: z.union([z.string(), z.number()]).optional(),
  organizerName: z.string().optional(),
  organizerAvatar: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const RequestSchema = z.object({
  id: z.union([z.string(), z.number()]),
  senderId: z.union([z.string(), z.number()]).optional(),
  receiverId: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['pending', 'accepte', 'refuse']).optional(),
  createdAt: z.string().optional(),
})

export const UserProfileSchema = z.object({
  username: z.string().optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
})
