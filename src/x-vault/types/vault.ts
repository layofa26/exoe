// Types definitions for x-vault Admin System

export type ActiveModule = 'pro' | 'social' | 'monetization';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';

export interface AdminUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  profession?: string;
  speciality?: string;
  city?: string;
  country?: string;
  gender?: string;
  birthDate?: string;
  module: 'pro' | 'social' | 'both';
  status: UserStatus;
  suspensionReason?: string;
  suspendedUntil?: string | null;
  isVerified: boolean;
  verifiedBadgeType?: 'gold' | 'blue' | 'pro';
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
  lastLoginIp?: string;
  device?: string;
  isOnline: boolean;
  profileCompletion: number; // 0-100%
  reportsCount: number;
  reputationScore: number; // 0-100
  videosCount?: number;
  subscribersCount?: number;
  followingCount?: number;
  isStaff?: boolean;
  isSuperuser?: boolean;
  subscription?: {
    plan: 'free' | 'pro_monthly' | 'pro_annual' | 'institution';
    status: 'active' | 'expired' | 'failed';
    amount: number;
    currency: string;
    startedAt: string;
    expiresAt: string;
    paymentMethod: 'moncash' | 'natcash' | 'card' | 'stripe';
  };
}

export interface PostContent {
  id: string;
  authorId: string;
  authorName: string;
  authorProfession?: string;
  module: 'pro' | 'social';
  title?: string;
  content: string;
  mediaType: 'text' | 'image' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  status: 'published' | 'hidden' | 'archived' | 'deleted' | 'pending_approval';
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  suspiciousLinksDetected?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isToxic?: boolean;
}

export interface ReportItem {
  id: string;
  targetType: 'user' | 'post' | 'comment' | 'video';
  targetId: string;
  targetTitle?: string;
  targetPreview?: string;
  reportedBy: string;
  reportedUser: string;
  reportedUserId: string;
  category: 'spam' | 'harassment' | 'hate_speech' | 'fake_profile' | 'inappropriate_content' | 'other';
  reason: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  assignedTo?: string;
  createdAt: string;
  internalNotes?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  planName: string;
  paymentGateway: 'moncash' | 'natcash' | 'card' | 'stripe';
  status: 'success' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  invoiceUrl?: string;
  isFraudAlert?: boolean;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  targetType: 'all' | 'profession' | 'region' | 'inactive' | 'custom';
  targetFilter?: string;
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  openRate?: number;
  clicksCount?: number;
  totalRecipients?: number;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  ipAddress: string;
  timestamp: string;
}

export interface ProfessionCategory {
  id: string;
  name: string;
  module: 'pro' | 'social';
  activeMembersCount: number;
  enabled: boolean;
}
