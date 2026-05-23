// Auth Types
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
  type: 'professional' | 'institution' | 'admin';
  legacyPro?: boolean;
  funnyAccessDate?: string | null;
  institutionPlan?: InstitutionPlan;
}

export type InstitutionPlan = 'verified' | 'starter' | 'standard' | 'premium';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  registerPro: (userData: ProRegistrationData) => Promise<RegisterResult>;
  registerInstitution: (step1Data: InstitutionStep1, step2Data: InstitutionStep2) => Promise<RegisterResult>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasModuleAccess: (module: 'pro' | 'social' | 'funny') => boolean;
  canPublishAsInstitution: () => boolean;
  isVisitor: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Registration Types
export interface ProRegistrationData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  gender?: string;
  profession: string;
  specialty?: string;
  country: string;
  city: string;
}

export interface InstitutionStep1 {
  institutionName: string;
  institutionType: InstitutionType;
  email: string;
  phone: string;
  address: string;
  website?: string;
  responsibleName: string;
  responsibleTitle: string;
  responsibleIdType: string;
  responsibleIdNumber: string;
}

export type InstitutionType = 
  | 'school' 
  | 'hospital' 
  | 'bank' 
  | 'ngo' 
  | 'company' 
  | 'government' 
  | 'religious' 
  | 'other';

export interface InstitutionStep2 {
  countryCode: string;
  registrationNumber: string;
  legalDocument: File;
}

// Country Types
export interface SupportedCountry {
  code: string;
  name: string;
  registrationName: string;
  registrationFormat: RegExp;
  example: string;
  documentRequired: string;
  currency: string;
  language: string;
  phoneCode: string;
  flag: string;
}

// Profession Types
export interface ProfessionValidation {
  valid: boolean;
  type?: 'known' | 'suggestion' | 'new';
  profession?: string;
  suggestions?: string[];
  requiresReview?: boolean;
  error?: string | null;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  author: string;
  username: string;
  views: number;
  likes: number;
  comments?: number;
  duration: string;
  thumbnail?: string;
  videoUrl?: string;
  description?: string;
  date?: string;
  isLive: boolean;
  url?: string;
}

// Professional Types
export interface Professional {
  id: string;
  name: string;
  username: string;
  profession: string;
  specialty?: string;
  followers: number;
  videos: number;
  avatar?: string;
  verified: boolean;
}

// Request Types
export interface RequestData {
  id: string;
  type: 'consultation' | 'quote' | 'course' | 'collaboration' | 'other';
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  attachments?: File[];
  status: 'pending' | 'accepted' | 'rejected' | 'archived';
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toProfessional: string;
  createdAt: string;
}

// Social Module Types
export interface JobOffer {
  id: string;
  title: string;
  institution: {
    id: string;
    name: string;
    verified: boolean;
  };
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  postedAt: string;
  deadline?: string;
}

export interface JobApplication {
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  cv: File;
  coverLetter?: File;
  jobId: string;
}

export interface InstitutionProfile {
  id: string;
  name: string;
  type: InstitutionType;
  verified: boolean;
  plan: InstitutionPlan;
  followers: number;
  stats: {
    alerts: number;
    recruitments: number;
    events: number;
  };
}

// Component Props Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedModules?: string[];
}

export interface ActionGateProps {
  children: React.ReactNode;
  action?: 'like' | 'comment' | 'follow' | 'apply' | 'message' | 'request' | 'share' | 'view_history' | 'view_requests' | 'create_video' | 'view_notifications' | 'generic';
  fallback?: React.ReactNode;
  showModal?: boolean;
  onRequireAuth?: () => void;
}

export interface NavLinkType {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
  module: 'pro' | 'social' | 'funny';
  disabled?: boolean;
  tooltip?: string;
}
