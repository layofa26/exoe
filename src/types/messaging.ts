export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  isImportant: boolean;
  replyToId?: string;
  deletedFor?: string[];
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  replyTo?: Message;
  importantMessages?: ImportantMessage[];
}

export interface ImportantMessage {
  id: string;
  userId: string;
  messageId: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  message?: Message;
}

export interface Conversation {
  id: string;
  lastMessageAt?: Date;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  messages?: Message[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  mutedUntil?: Date;
  isArchived: boolean;
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface Report {
  id: string;
  reporterId: string;
  entityType: 'USER' | 'VIDEO' | 'COMMENT';
  entityId: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: Date;
  videoId?: string;
  commentId?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'REQUEST' | 'CONTACT' | 'ALERT';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  blocked: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    professionalProfile?: {
      profession: string;
    };
  };
  createdAt: string;
}
