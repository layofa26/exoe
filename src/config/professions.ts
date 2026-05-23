import type { ProfessionValidation } from '../types'

interface ProfessionsDatabase {
  [key: string]: string[]
}

export const PROFESSIONS_DATABASE: ProfessionsDatabase = {
  tech: [
    "Développeur Web", "Développeur Mobile", "Développeur Logiciel",
    "Data Scientist", "Data Analyst", "Ingénieur DevOps",
    "Architecte Cloud", "Ingénieur Cybersécurité", "Administrateur Système",
    "Designer UI/UX", "Product Manager", "Scrum Master",
    "Spécialiste SEO/SEA", "Community Manager", "Growth Hacker",
    "Analyste Marketing Digital", "Développeur Blockchain", "Expert IA/Machine Learning"
  ],
  
  finance: [
    "Comptable", "Expert-Comptable", "Analyste Financier",
    "Contrôleur de Gestion", "Auditeur", "Banquier",
    "Conseiller en Gestion de Patrimoine", "Trader", "Courtier",
    "Analyste Crédit", "Risk Manager", "Trésorier"
  ],
  
  sante: [
    "Médecin Généraliste", "Médecin Spécialiste", "Infirmier",
    "Pharmacien", "Kinésithérapeute", "Psychologue",
    "Psychothérapeute", "Dentiste", "Nutritionniste", "Diététicien",
    "Vétérinaire", "Sage-Femme", "Optométriste", "Podologue",
    "Ergothérapeute", "Orthophoniste", "Ostéopathe", "Chiropracteur"
  ],
  
  droit: [
    "Avocat", "Notaire", "Huissier de Justice", "Juriste d'Entreprise",
    "Conseiller Juridique", "Magistrat", "Clerc de Notaire",
    "Médiateur", "Arbitre"
  ],
  
  creation: [
    "Graphiste", "Designer Graphique", "Directeur Artistique",
    "Photographe", "Vidéaste", "Monteur Vidéo", "Cadreur",
    "Rédacteur", "Copywriter", "Journaliste", "Correcteur",
    "Illustrateur", "Motion Designer", "Sound Designer",
    "Musicien Professionnel", "Compositeur", "Arrangeur",
    "Réalisateur", "Scénariste", "Acteur", "Metteur en Scène",
    "Danseur Professionnel", "Chorégraphe"
  ],
  
  education: [
    "Professeur", "Instituteur", "Formateur Professionnel",
    "Coach Certifié", "Conseiller d'Orientation", "Documentaliste",
    "Chercheur", "Doctorant"
  ],
  
  artisanat: [
    "Menuisier", "Ébéniste", "Plombier", "Électricien",
    "Maçon", "Peintre en Bâtiment", "Carreleur", "Couvreur",
    "Charpentier", "Serrurier", "Mécanicien", "Carrossier",
    "Couturier", "Styliste", "Bijoutier", "Horloger",
    "Céramiste", "Verrier", "Ferronnier", "Tapissier"
  ],
  
  commerce: [
    "Commerçant", "Chef d'Entreprise", "Gérant de Boutique",
    "Responsable Commercial", "Attaché Commercial", "Téléconseiller",
    "Vendeur", "Responsable Magasin", "Acheteur", "Merchandiser"
  ],
  
  ingenieur: [
    "Ingénieur Civil", "Ingénieur Mécanique", "Ingénieur Électrique",
    "Ingénieur Environnement", "Ingénieur Génie Chimique",
    "Ingénieur Réseau", "Ingénieur Télécom", "Géomètre",
    "Topographe", "Architecte", "Urbaniste"
  ],
  
  agriculture: [
    "Agriculteur", "Éleveur", "Viticulteur", "Maraîcher",
    "Arboriculteur", "Apiculteur", "Pisciculteur", "Technicien Agricole",
    "Conseiller Agricole", "Paysagiste", "Jardinier"
  ],
  
  tourisme: [
    "Chef de Cuisine", "Chef Pâtissier", "Barman", "Sommelier",
    "Maître d'Hôtel", "Directeur de Restaurant", "Gouvernante",
    "Guide Touristique", "Agent de Voyage", "Hôtelier",
    "Réceptionniste", "Animateur", "Moniteur de Ski", "Moniteur de Plongée"
  ],
  
  autre: [
    "Consultant", "Coach de Vie", "Coach Sportif", "Conseiller RH",
    "Recruteur", "Traducteur", "Interprète", "Bibliothécaire",
    "Archiviste", "Conservateur", "Historien", "Philosophe",
    "Théologien", "Assistant Social", "Éducateur Spécialisé"
  ]
}

export const ALL_PROFESSIONS: string[] = Object.values(PROFESSIONS_DATABASE).flat()

const PROHIBITED_PATTERNS: RegExp[] = [
  /p[o0]rn/i, /sex/i, /xxx/i, /adult/i, /escort/i,
  /prostitut/i, /stripper/i, /cam.*girl/i, /sugardaddy/i,
  /sugarmommy/i, /onlyfans/i, /fansly/i, /patreon.*adult/i,
  /drug/i, /dealer/i, /hacker.*illegal/i, /crack/i,
  /hitman/i, /assassin/i, /terrorist/i, /scam/i,
  /^test$/i, /^profession$/i, /^métier$/i, /^job$/i,
  /^student$/i, /^unemployed$/i, /^none$/i
]

export const isValidProfession = (profession: string): ProfessionValidation => {
  if (!profession || profession.length < 2) {
    return { valid: false, error: 'Profession trop courte' }
  }
  
  // Check blacklist
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(profession)) {
      return { valid: false, error: 'Terme non autorisé' }
    }
  }
  
  // Check if in database (exact match)
  const exactMatch = ALL_PROFESSIONS.includes(profession)
  
  if (exactMatch) {
    return { valid: true, type: 'known', profession }
  }
  
  // Partial match for autocomplete
  const partialMatches = ALL_PROFESSIONS.filter(p => 
    p.toLowerCase().includes(profession.toLowerCase())
  )
  
  if (partialMatches.length > 0) {
    return { valid: true, type: 'suggestion', suggestions: partialMatches.slice(0, 5) }
  }
  
  // New profession - needs manual review
  return { valid: true, type: 'new', requiresReview: true }
}

export const searchProfessions = (query: string): string[] => {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  return ALL_PROFESSIONS.filter(p => 
    p.toLowerCase().includes(lowerQuery)
  ).slice(0, 10)
}
