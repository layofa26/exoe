import { z } from 'zod'

/**
 * DRF peut renvoyer une liste simple ou une réponse paginée: on accepte les
 * deux formes et on normalise vers { results, count }.
 */
const listOf = <T extends z.ZodTypeAny>(item: T) =>
  z.union([
    z.object({ results: z.array(item), count: z.number().optional() }),
    z
      .array(item)
      .transform((results) => ({ results, count: results.length })),
  ])

// Profile schemas
export const ProfileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  username: z.string(),
  full_name: z.string().optional(),
  profession: z.string().optional(),
  speciality: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  photo: z.string().optional(),
  banner: z.string().optional(),
  website: z.string().optional(),
  followersCount: z.number().optional(),
  lastLoginAt: z.string().optional(),
})

export const ProfileListSchema = listOf(ProfileSchema)

// Video schemas
export const VideoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  file: z.string(),
  cover: z.string().optional(),
  owner: z.union([z.string(), z.number()]),
  created_at: z.string(),
  is_public: z.boolean(),
  views: z.number().optional(),
})

export const VideoListSchema = listOf(VideoSchema)

// Event schemas
export const EventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  format: z.enum(['in-person', 'virtual', 'hybrid']),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']),
  location: z.object({
    city: z.string(),
    venue: z.string(),
  }).optional(),
  cover_image: z.string().optional(),
  category: z.string(),
  capacity: z.number(),
  organizer_name: z.string(),
  organizer_avatar: z.string().optional(),
  created_at: z.string(),
  published_at: z.string().optional(),
  price: z.number(),
})

export const EventListSchema = listOf(EventSchema)

// Subscription/Abonnement schemas
export const AbonnementSchema = z.object({
  id: z.union([z.string(), z.number()]),
  user: z.union([z.string(), z.number()]),
  professionnel: z.union([z.string(), z.number()]),
  created_at: z.string(),
})

export const AbonnementListSchema = listOf(AbonnementSchema)

// Request/Demande schemas
export const RequestSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sender: z.union([z.string(), z.number()]),
  receiver: z.union([z.string(), z.number()]),
  status: z.enum(['pending', 'accepte', 'refuse']),
  created_at: z.string(),
})

export const RequestListSchema = listOf(RequestSchema)

// Skill schemas
export const SkillSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  category: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  profile: z.union([z.string(), z.number()]),
  created_at: z.string(),
})

export const SkillListSchema = listOf(SkillSchema)

// Activity schemas
export const ActivitySchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  description: z.string(),
  created_at: z.string(),
  username: z.string().optional(),
  user_full_name: z.string().optional(),
})

export const ActivityListSchema = listOf(ActivitySchema)

// Badge schemas
export const BadgeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  earned_at: z.string().optional(),
})

export const BadgeListSchema = listOf(BadgeSchema)

// Conversation schemas
export const ConversationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  participants: z.array(z.union([z.string(), z.number()])),
  last_message: z.string().optional(),
  last_message_at: z.string().optional(),
  unread_count: z.number().optional(),
})

export const ConversationListSchema = listOf(ConversationSchema)

// Message schemas
export const MessageSchema = z.object({
  id: z.union([z.string(), z.number()]),
  conversation: z.union([z.string(), z.number()]),
  sender: z.union([z.string(), z.number()]),
  content: z.string(),
  created_at: z.string(),
  read: z.boolean().optional(),
})

export const MessageListSchema = listOf(MessageSchema)
