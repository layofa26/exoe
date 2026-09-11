import { Resend } from 'resend'

const apiKey = import.meta.env.VITE_RESEND_API_KEY || ''

export const resend = new Resend(apiKey)
