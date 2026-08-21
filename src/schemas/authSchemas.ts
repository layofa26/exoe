import { z } from 'zod'

// Un compte peut être créé avec un téléphone seul: l'API renvoie alors email: ""
const optionalEmail = z
  .union([z.string().email('Invalid email format'), z.literal('')])
  .nullable()
  .optional()

// Login Response Schema
export const LoginResponseSchema = z.object({
  access: z.string().min(1, 'Access token is required'),
  refresh: z.string().min(1, 'Refresh token is required')
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

// Register Response Schema
export const RegisterResponseSchema = z.object({
  id: z.number().int().positive(),
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
  email: optionalEmail,
  phone_number: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  profession: z.string().min(1, 'Profession is required'),
  speciality: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional()
})

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.number().int().positive(),
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
  email: optionalEmail,
  phone_number: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  profession: z.string().min(1, 'Profession is required'),
  speciality: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  last_login_time: z.string().nullable().optional(),
  last_login_ip: z.string().nullable().optional()
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// API Error Schema
export const ApiErrorSchema = z.object({
  error: z.string().optional(),
  detail: z.string().optional(),
  password: z.union([z.string(), z.array(z.string())]).optional(),
  email: z.union([z.string(), z.array(z.string())]).optional(),
  birth_date: z.union([z.string(), z.array(z.string())]).optional()
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// Generic API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z.any().optional()
})

export type ApiResponse = z.infer<typeof ApiResponseSchema>
