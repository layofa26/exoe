/**
 * Validation standard pour les emails
 * Format: user@domain.com
 * Contraintes:
 * - Format standard RFC 5322
 * - Domaine valide (TLD reconnu)
 * - Pas d'espaces ou caractères spéciaux invalides
 * - Longueur max 254 caractères
 */

// Liste des TLDs courants (non exhaustive mais couvre les principaux)
const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'fr', 'de', 'uk', 'es', 'it', 'nl', 'be', 'ch', 'at', 'pt', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'hu', 'gr', 'tr', 'ru', 'ua', 'ro', 'bg',
  'ca', 'us', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 've', 'ec', 'uy', 'py', 'bo', 'gy', 'sr',
  'au', 'nz', 'jp', 'kr', 'cn', 'in', 'pk', 'bd', 'id', 'my', 'sg', 'th', 'vn', 'ph', 'tw', 'hk',
  'za', 'ng', 'ke', 'tz', 'ug', 'rw', 'et', 'ma', 'dz', 'tn', 'eg', 'ng', 'za',
  'ht', 'jm', 'tt', 'bb', 'gd', 'lc', 'vc', 'ag', 'dm', 'gd', 'kn', 'bs', 'tc', 'ky', 'bm',
  'io', 'ai', 'gg', 'je', 'im', 'ms', 'vg', 'ky', 'bm', 'tc', 'sh', 'ac', 'tf', 'wf', 'yt', 'pm',
  'info', 'biz', 'name', 'pro', 'aero', 'coop', 'museum', 'travel', 'jobs', 'mobi', 'tel', 'xxx',
  'app', 'dev', 'page', 'cloud', 'tech', 'online', 'site', 'store', 'shop', 'blog', 'design', 'code',
  'xyz', 'top', 'club', 'online', 'fun', 'website', 'space', 'press', 'photo', 'tech', 'live'
]

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'L\'email est requis' }
  }

  const trimmedEmail = email.trim()

  // Longueur max 254 caractères
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'L\'email ne peut pas dépasser 254 caractères' }
  }

  // Regex standard pour validation email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Format d\'email invalide' }
  }

  // Vérification du domaine (doit avoir au moins un point et un TLD)
  const domainParts = trimmedEmail.split('@')
  if (domainParts.length !== 2) {
    return { valid: false, error: 'Format d\'email invalide' }
  }

  const domain = domainParts[1]
  if (!domain || !domain.includes('.') || domain.split('.').length < 2) {
    return { valid: false, error: 'Domaine invalide' }
  }

  // Vérification que le TLD a au moins 2 caractères et est dans la liste des TLDs valides
  const tld = domain.split('.').pop()
  if (!tld || tld.length < 2) {
    return { valid: false, error: 'Domaine invalide' }
  }

  // Vérification que le TLD est dans la liste des TLDs valides
  const tldLower = tld.toLowerCase()
  if (!VALID_TLDS.includes(tldLower)) {
    return { valid: false, error: 'Domaine invalide (TLD non reconnu)' }
  }

  return { valid: true }
}
