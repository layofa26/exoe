// Constantes de validation pour la création d'institution

// Mots et patterns interdits dans les noms d'institutions
export const FORBIDDEN_INSTITUTION_NAME_PATTERNS = [
  // Contenu pornographique
  /porn/i,
  /sex/i,
  /xxx/i,
  /adult/i,
  /escort/i,
  /erotic/i,
  /nude/i,

  // Insultes et mots haineux
  /shit/i,
  /fuck/i,
  /bitch/i,
  /asshole/i,
  /damn/i,
  /bastard/i,

  // Caractères abusifs
  /(.){5,}/, // Répétition de 5+ caractères identiques
  /@+/, // Pas de @ dans le nom
  /#+/, // Pas de # dans le nom
  
  // Emojis et caractères spéciaux
  /[\u{1F600}-\u{1F64F}]/u, // Emojis émotions
  /[\u{1F300}-\u{1F5FF}]/u, // Emojis symboles
  /[\u{1F680}-\u{1F6FF}]/u, // Emojis transport
  /[\u{1F700}-\u{1F77F}]/u, // Emojis alchimie
  /[\u{1F780}-\u{1F7FF}]/u, // Emojis géométriques
  /[\u{1F800}-\u{1F8FF}]/u, // Emojis supplémentaires
  /[\u{2600}-\u{26FF}]/u, // Symboles divers
  /[\u{2700}-\u{27BF}]/u, // Dingbats
];

// Noms d'institutions réservés (système)
export const RESERVED_INSTITUTION_NAMES = [
  'exile',
  'exile admin',
  'exile support',
  'exile official',
  'exile platform',
  'exile social',
  'exile pro',
  'admin',
  'administrator',
  'support',
  'official',
  'staff',
  'moderator',
  'system',
  'test',
  'demo',
];

// Noms de compagnies/brands interdits
export const FORBIDDEN_COMPANY_NAMES = [
  'google',
  'microsoft',
  'apple',
  'tesla',
  'amazon',
  'facebook',
  'meta',
  'instagram',
  'tiktok',
  'twitter',
  'x',
  'linkedin',
  'youtube',
  'netflix',
  'spotify',
  'uber',
  'airbnb',
  'paypal',
  'stripe',
  'shopify',
  'salesforce',
  'oracle',
  'ibm',
  'intel',
  'amd',
  'nvidia',
  'samsung',
  'lg',
  'sony',
  'panasonic',
  'philips',
  'siemens',
  'bosch',
  'bmw',
  'mercedes',
  'audi',
  'volkswagen',
  'toyota',
  'honda',
  'ford',
  'gm',
  'natcom',
  'digicel',
  'moncash',
  'sogebank',
  'unibank',
  'capital bank',
  'boucard',
];

// Domaines email gratuits à refuser (sauf pour ONG/petites structures)
export const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'icloud.com',
  'me.com',
  'ymail.com',
  'rocketmail.com',
  'zoho.com',
  'gmx.com',
  'gmx.net',
  'web.de',
  'mail.ru',
  'yandex.com',
  'yandex.ru',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'sohu.com',
];

// Extensions de domaine professionnelles acceptées
export const PROFESSIONAL_DOMAIN_EXTENSIONS = [
  '.edu',
  '.ac',
  '.gov',
  '.mil',
  '.org',
  '.com',
  '.net',
  '.co',
  '.io',
  '.tech',
  '.ht',
  '.fr',
  '.us',
  '.ca',
  '.uk',
  '.de',
  '.es',
  '.it',
  '.br',
  '.mx',
  '.ar',
  '.cl',
  '.pe',
  '.co',
  '.ve',
  '.ec',
  '.py',
  '.uy',
  '.bo',
  '.do',
  '.cu',
  '.jm',
  '.tt',
  '.bb',
  '.gd',
  '.lc',
  '.vc',
  '.ag',
  '.dm',
  '.gd',
  '.kn',
  '.tc',
  '.vg',
];

// Types de documents légaux acceptés
export const ALLOWED_LEGAL_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Extensions de fichiers acceptées
export const ALLOWED_LEGAL_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
];

// Types de fichiers dangereux à refuser
export const DANGEROUS_FILE_TYPES = [
  'application/exe',
  'application/x-exe',
  'application/x-msdownload',
  'application/x-msi',
  'application/zip',
  'application/x-zip',
  'application/x-zip-compressed',
  'application/rar',
  'application/x-rar',
  'application/x-rar-compressed',
  'application/x-7z',
  'application/x-7z-compressed',
  'application/tar',
  'application/x-tar',
  'application/x-gzip',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/vnd.android.package-archive',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-sh',
  'application/x-shellscript',
  'text/x-perl',
  'text/x-python',
  'application/x-python-code',
  'application/x-php',
  'text/x-php',
  'application/x-ruby',
  'text/x-ruby',
  'application/x-bat',
  'application/x-csh',
  'text/x-csh',
  'application/x-msdownload',
];

// Fonction de validation du nom d'institution
export const validateInstitutionName = (name: string): { valid: boolean; error?: string } => {
  // Nettoyer le nom
  const cleanedName = name.trim();

  // Vérifier la longueur
  if (cleanedName.length < 3) {
    return { valid: false, error: 'Le nom doit contenir au moins 3 caractères' };
  }

  if (cleanedName.length > 120) {
    return { valid: false, error: 'Le nom ne peut pas dépasser 120 caractères' };
  }

  // Vérifier les espaces multiples
  if (/\s{2,}/.test(cleanedName)) {
    return { valid: false, error: 'Le nom ne peut pas contenir d\'espaces multiples' };
  }

  // Vérifier les patterns interdits (contenu inapproprié uniquement)
  const forbiddenPatterns = [
    /porn/i,
    /sex/i,
    /xxx/i,
    /adult/i,
    /escort/i,
    /erotic/i,
    /nude/i,
    /shit/i,
    /fuck/i,
    /bitch/i,
    /asshole/i,
    /damn/i,
    /bastard/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(cleanedName)) {
      return { valid: false, error: 'Ce nom contient des mots non autorisés' };
    }
  }

  // Vérifier les noms réservés (case insensitive)
  const lowerName = cleanedName.toLowerCase();
  if (RESERVED_INSTITUTION_NAMES.some(reserved => lowerName === reserved)) {
    return { valid: false, error: 'Ce nom est réservé par le système' };
  }

  // Vérifier les noms de compagnies interdits
  if (FORBIDDEN_COMPANY_NAMES.some(company => lowerName.includes(company))) {
    return { valid: false, error: 'Ce nom contient une marque ou entreprise protégée' };
  }

  // Vérifier que le nom n'est pas uniquement des chiffres
  if (/^\d+$/.test(cleanedName)) {
    return { valid: false, error: 'Le nom ne peut pas être uniquement composé de chiffres' };
  }

  // Vérifier que le nom contient au moins une lettre
  if (!/[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(cleanedName)) {
    return { valid: false, error: 'Le nom doit contenir au moins une lettre' };
  }

  return { valid: true };
};

// Fonction de validation de l'email institutionnel
export const validateInstitutionEmail = (email: string, isNGOOrSmall: boolean = false): { valid: boolean; error?: string; requiresEnhancedVerification?: boolean } => {
  const emailLower = email.toLowerCase().trim();
  
  // Validation basique du format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }
  
  // Extraire le domaine
  const domain = emailLower.split('@')[1];
  
  // Vérifier si c'est un domaine gratuit
  const isFreeDomain = FREE_EMAIL_DOMAINS.includes(domain);
  
  if (isFreeDomain && !isNGOOrSmall) {
    return { 
      valid: false, 
      error: 'Les emails gratuits (gmail, yahoo, etc.) ne sont pas acceptés pour les institutions. Utilisez un email professionnel.' 
    };
  }
  
  // Si c'est un domaine gratuit mais c'est une ONG/petite structure
  if (isFreeDomain && isNGOOrSmall) {
    return { 
      valid: true, 
      requiresEnhancedVerification: true 
    };
  }
  
  // Vérifier que le domaine a une extension professionnelle
  const hasProfessionalExtension = PROFESSIONAL_DOMAIN_EXTENSIONS.some(ext => domain.endsWith(ext));
  
  if (!hasProfessionalExtension) {
    return { 
      valid: true, 
      requiresEnhancedVerification: true,
      error: 'Domaine non reconnu. Vérification renforcée requise.' 
    };
  }
  
  return { valid: true };
};

// Fonction de validation du type MIME de fichier
export const validateLegalDocumentMimeType = (mimeType: string): { valid: boolean; error?: string } => {
  if (!ALLOWED_LEGAL_DOCUMENT_TYPES.includes(mimeType)) {
    if (DANGEROUS_FILE_TYPES.includes(mimeType)) {
      return { valid: false, error: 'Ce type de fichier est dangereux et non autorisé' };
    }
    return { valid: false, error: 'Format de fichier non supporté. Utilisez PDF, JPG ou PNG.' };
  }
  
  return { valid: true };
};

// Fonction de validation de l'extension de fichier
export const validateLegalDocumentExtension = (filename: string): { valid: boolean; error?: string } => {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  
  if (!ALLOWED_LEGAL_DOCUMENT_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Extension de fichier non supportée. Utilisez PDF, JPG ou PNG.' };
  }
  
  return { valid: true };
};

// Fonction de validation de la taille de fichier (max 5MB)
export const validateLegalDocumentSize = (fileSize: number): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (fileSize > maxSize) {
    return { valid: false, error: 'La taille du fichier ne peut pas dépasser 5MB' };
  }
  
  return { valid: true };
};

// Fonction complète de validation de document légal
export const validateLegalDocument = (file: File): { valid: boolean; error?: string } => {
  // Valider l'extension
  const extensionValidation = validateLegalDocumentExtension(file.name);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }
  
  // Valider le type MIME
  const mimeTypeValidation = validateLegalDocumentMimeType(file.type);
  if (!mimeTypeValidation.valid) {
    return mimeTypeValidation;
  }
  
  // Valider la taille
  const sizeValidation = validateLegalDocumentSize(file.size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  return { valid: true };
};
