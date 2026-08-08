import { z } from 'zod'

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

export const ProfileListSchema = z.object({
  results: z.array(ProfileSchema),
  count: z.number().optional(),
})

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

export const VideoListSchema = z.object({
  results: z.array(VideoSchema),
  count: z.number().optional(),
})

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

export const EventListSchema = z.object({
  results: z.array(EventSchema),
  count: z.number().optional(),
})

// Subscription/Abonnement schemas
export const AbonnementSchema = z.object({
  id: z.union([z.string(), z.number()]),
  user: z.union([z.string(), z.number()]),
  professionnel: z.union([z.string(), z.number()]),
  created_at: z.string(),
})

export const AbonnementListSchema = z.object({
  results: z.array(AbonnementSchema),
  count: z.number().optional(),
})

// Request/Demande schemas
export const RequestSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sender: z.union([z.string(), z.number()]),
  receiver: z.union([z.string(), z.number()]),
  status: z.enum(['pending', 'accepte', 'refuse']),
  created_at: z.string(),
})

export const RequestListSchema = z.object({
  results: z.array(RequestSchema),
  count: z.number().optional(),
})

// Skill schemas
export const SkillSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  category: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  profile: z.union([z.string(), z.number()]),
  created_at: z.string(),
})

export const SkillListSchema = z.object({
  results: z.array(SkillSchema),
  count: z.number().optional(),
})

// Activity schemas
export const ActivitySchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  description: z.string(),
  created_at: z.string(),
  username: z.string().optional(),
  user_full_name: z.string().optional(),
})

export const ActivityListSchema = z.object({
  results: z.array(ActivitySchema),
  count: z.number().optional(),
})

// Badge schemas
export const BadgeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  earned_at: z.string().optional(),
})

export const BadgeListSchema = z.object({
  results: z.array(BadgeSchema),
  count: z.number().optional(),
})

// Conversation schemas
export const ConversationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  participants: z.array(z.union([z.string(), z.number()])),
  last_message: z.string().optional(),
  last_message_at: z.string().optional(),
  unread_count: z.number().optional(),
})

export const ConversationListSchema = z.object({
  results: z.array(ConversationSchema),
  count: z.number().optional(),
})

// Message schemas
export const MessageSchema = z.object({
  id: z.union([z.string(), z.number()]),
  conversation: z.union([z.string(), z.number()]),
  sender: z.union([z.string(), z.number()]),
  content: z.string(),
  created_at: z.string(),
  read: z.boolean().optional(),
})

export const MessageListSchema = z.object({
  results: z.array(MessageSchema),
  count: z.number().optional(),
})
