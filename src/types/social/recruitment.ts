// Types pour le Recrutement du Module Social

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected'

export interface JobOffer {
  id: string
  title: string
  institution: {
    id: string
    name: string
    verified: boolean
    avatar?: string
  }
  location: string
  type: JobType
  description: string
  requirements: string[]
  salary?: {
    min?: number
    max?: number
    currency: string
  }
  postedAt: string
  deadline?: string
  applications: number
  isBoosted: boolean
  category?: string
}

export interface JobApplication {
  id: string
  jobId: string
  applicant: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  fullName: string
  email: string
  phone?: string
  message?: string
  cv: string // URL du fichier CV
  coverLetter?: string // URL du fichier lettre de motivation
  submittedAt: string
  status: ApplicationStatus
}

export interface CreateJobData {
  title: string
  location: string
  type: JobType
  description: string
  requirements: string[]
  salary?: {
    min?: number
    max?: number
  }
  deadline?: string
  category?: string
}
