// Types pour les Institutions du Module Social

import { InstitutionType, InstitutionPlan } from '../index'

export interface InstitutionProfile {
  id: string
  name: string
  type: InstitutionType
  verified: boolean
  plan: InstitutionPlan
  email: string
  phone: string
  address: string
  website?: string
  description?: string
  avatar?: string
  coverImage?: string
  followers: number
  following: number
  stats: {
    alerts: number
    recruitments: number
    events: number
    videos: number
    totalViews: number
  }
  createdAt: string
  registrationNumber: string
  countryCode: string
}

export interface InstitutionStep1 {
  institutionName: string
  institutionType: InstitutionType
  email: string
  phone: string
  address: string
  website?: string
  responsibleName: string
  responsibleTitle: string
  responsibleIdType: string
  responsibleIdNumber: string
}

export interface InstitutionStep2 {
  countryCode: string
  registrationNumber: string
  legalDocument: File | null
  selectedPlan: InstitutionPlan
}

export interface InstitutionSettings {
  notifications: {
    alerts: boolean
    recruitments: boolean
    events: boolean
    comments: boolean
  }
  moderation: {
    autoModerate: boolean
    requireApproval: boolean
  }
  privacy: {
    showEmail: boolean
    showPhone: boolean
    showAddress: boolean
  }
}
