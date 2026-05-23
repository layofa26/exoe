import type { SupportedCountry } from '../types'

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: 'HT',
    name: 'Haïti',
    registrationName: 'Identification Fiscal (IF) / RCCM',
    registrationFormat: /^[0-9]{10}$/,
    example: '0012345678',
    documentRequired: 'Extrait RCCM ou ID Fiscal',
    currency: 'HTG',
    language: 'fr',
    phoneCode: '+509',
    flag: '🇭🇹'
  },
  {
    code: 'DO',
    name: 'République Dominicaine',
    registrationName: 'RNC (Registro Nacional de Contribuyentes)',
    registrationFormat: /^[0-9]{9}$/,
    example: '123456789',
    documentRequired: 'Certificado de Registro Mercantil',
    currency: 'DOP',
    language: 'es',
    phoneCode: '+1-809',
    flag: '🇩🇴'
  },
  {
    code: 'CU',
    name: 'Cuba',
    registrationName: 'ID Fiscal / Registro Mercantil',
    registrationFormat: /^[0-9]{11}$/,
    example: '12345678901',
    documentRequired: 'Licencia de Comercialización o Registro Mercantil',
    currency: 'CUP',
    language: 'es',
    phoneCode: '+53',
    flag: '🇨🇺'
  },
  {
    code: 'CL',
    name: 'Chili',
    registrationName: 'RUT (Rol Único Tributario)',
    registrationFormat: /^[0-9]{8,9}-[0-9kK]$/,
    example: '12345678-9',
    documentRequired: 'Extracto RUT oficial',
    currency: 'CLP',
    language: 'es',
    phoneCode: '+56',
    flag: '🇨🇱'
  },
  {
    code: 'BR',
    name: 'Brésil',
    registrationName: 'CNPJ (Cadastro Nacional de Pessoa Jurídica)',
    registrationFormat: /^[0-9]{14}$/,
    example: '12345678000195',
    documentRequired: 'CNPJ Certificate ou Contrato Social',
    currency: 'BRL',
    language: 'pt',
    phoneCode: '+55',
    flag: '🇧🇷'
  },
  {
    code: 'US',
    name: 'États-Unis',
    registrationName: 'EIN (Employer Identification Number)',
    registrationFormat: /^[0-9]{9}$/,
    example: '123456789',
    documentRequired: 'SS-4 Form / Certificate of Incorporation',
    currency: 'USD',
    language: 'en',
    phoneCode: '+1',
    flag: '🇺🇸'
  },
  {
    code: 'MX',
    name: 'Mexique',
    registrationName: 'RFC (Registro Federal de Contribuyentes)',
    registrationFormat: /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
    example: 'ABCD010101ABC',
    documentRequired: 'Constancia de Situación Fiscal',
    currency: 'MXN',
    language: 'es',
    phoneCode: '+52',
    flag: '🇲🇽'
  },
  {
    code: 'FR',
    name: 'France',
    registrationName: 'SIRET / SIREN',
    registrationFormat: /^[0-9]{14}$/,
    example: '12345678900012',
    documentRequired: 'Extrait Kbis (< 3 mois)',
    currency: 'EUR',
    language: 'fr',
    phoneCode: '+33',
    flag: '🇫🇷'
  },
  {
    code: 'NG',
    name: 'Nigeria',
    registrationName: 'CAC Number (Corporate Affairs Commission)',
    registrationFormat: /^[A-Z]{2}[0-9]{6}$/,
    example: 'RC123456',
    documentRequired: 'Certificate of Incorporation',
    currency: 'NGN',
    language: 'en',
    phoneCode: '+234',
    flag: '🇳🇬'
  },
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    registrationName: 'CIPC Registration Number',
    registrationFormat: /^[0-9]{14}$/,
    example: '202312345607',
    documentRequired: 'COR14.3 or Certificate of Incorporation',
    currency: 'ZAR',
    language: 'en',
    phoneCode: '+27',
    flag: '🇿🇦'
  }
]

interface ValidationResult {
  valid: boolean
  format?: string
  example?: string
  error?: string | null
  country?: string
}

export const validateRegistrationNumber = (countryCode: string, number: string): ValidationResult => {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode)
  if (!country) {
    return { valid: false, error: 'Pays non supporté' }
  }
  
  const isValid = country.registrationFormat.test(number)
  
  return {
    valid: isValid,
    format: country.registrationName,
    example: country.example,
    error: isValid ? null : `Format attendu: ${country.example}`,
    country: country.name
  }
}

export const getCountryByCode = (code: string): SupportedCountry | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code)
}
