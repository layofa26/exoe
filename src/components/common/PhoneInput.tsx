import { useState, useRef, useEffect } from 'react'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import 'flag-icons/css/flag-icons.min.css'
import { ChevronDown } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  placeholder?: string
  className?: string
  error?: string
  defaultCountryCode?: string // Code pays par défaut pour les numéros courts (ex: '509' pour Haïti)
  showHelpText?: boolean // Afficher le texte d'aide
}

// Liste des pays populaires avec leurs codes
const COUNTRIES = [
  { code: 'HT', dialCode: '509', name: 'Haïti' },
  { code: 'FR', dialCode: '33', name: 'France' },
  { code: 'US', dialCode: '1', name: 'États-Unis' },
  { code: 'CA', dialCode: '1', name: 'Canada' },
  { code: 'BE', dialCode: '32', name: 'Belgique' },
  { code: 'CH', dialCode: '41', name: 'Suisse' },
  { code: 'DE', dialCode: '49', name: 'Allemagne' },
  { code: 'ES', dialCode: '34', name: 'Espagne' },
  { code: 'IT', dialCode: '39', name: 'Italie' },
  { code: 'GB', dialCode: '44', name: 'Royaume-Uni' },
  { code: 'NL', dialCode: '31', name: 'Pays-Bas' },
  { code: 'PT', dialCode: '351', name: 'Portugal' },
  { code: 'BR', dialCode: '55', name: 'Brésil' },
  { code: 'AR', dialCode: '54', name: 'Argentine' },
  { code: 'MX', dialCode: '52', name: 'Mexique' },
  { code: 'CO', dialCode: '57', name: 'Colombie' },
  { code: 'PE', dialCode: '51', name: 'Pérou' },
  { code: 'CU', dialCode: '53', name: 'Cuba' },
  { code: 'DO', dialCode: '1', name: 'République Dominicaine' },
  { code: 'JM', dialCode: '1', name: 'Jamaïque' },
  { code: 'TT', dialCode: '1', name: 'Trinité-et-Tobago' },
  { code: 'BB', dialCode: '1', name: 'Barbade' },
  { code: 'GD', dialCode: '1', name: 'Grenade' },
  { code: 'LC', dialCode: '1', name: 'Sainte-Lucie' },
  { code: 'VC', dialCode: '1', name: 'Saint-Vincent' },
  { code: 'AG', dialCode: '1', name: 'Antigua-et-Barbuda' },
  { code: 'DM', dialCode: '1', name: 'Dominique' },
  { code: 'BS', dialCode: '1', name: 'Bahamas' },
  { code: 'DZ', dialCode: '213', name: 'Algérie' },
  { code: 'MA', dialCode: '212', name: 'Maroc' },
  { code: 'TN', dialCode: '216', name: 'Tunisie' },
  { code: 'EG', dialCode: '20', name: 'Égypte' },
  { code: 'NG', dialCode: '234', name: 'Nigeria' },
  { code: 'KE', dialCode: '254', name: 'Kenya' },
  { code: 'ZA', dialCode: '27', name: 'Afrique du Sud' },
  { code: 'ET', dialCode: '251', name: 'Éthiopie' },
  { code: 'GH', dialCode: '233', name: 'Ghana' },
  { code: 'CI', dialCode: '225', name: 'Côte d\'Ivoire' },
  { code: 'SN', dialCode: '221', name: 'Sénégal' },
  { code: 'CM', dialCode: '237', name: 'Cameroun' },
  { code: 'CD', dialCode: '243', name: 'République Démocratique du Congo' },
  { code: 'RW', dialCode: '250', name: 'Rwanda' },
  { code: 'UG', dialCode: '256', name: 'Ouganda' },
  { code: 'TZ', dialCode: '255', name: 'Tanzanie' },
  { code: 'ZW', dialCode: '263', name: 'Zimbabwe' },
  { code: 'ZM', dialCode: '260', name: 'Zambie' },
  { code: 'MW', dialCode: '265', name: 'Malawi' },
  { code: 'NA', dialCode: '264', name: 'Namibie' },
  { code: 'BW', dialCode: '267', name: 'Botswana' },
  { code: 'SZ', dialCode: '268', name: 'Eswatini' },
  { code: 'LS', dialCode: '266', name: 'Lesotho' },
  { code: 'AO', dialCode: '244', name: 'Angola' },
  { code: 'MZ', dialCode: '258', name: 'Mozambique' },
  { code: 'MG', dialCode: '261', name: 'Madagascar' },
  { code: 'MU', dialCode: '230', name: 'Maurice' },
  { code: 'SC', dialCode: '248', name: 'Seychelles' },
  { code: 'CV', dialCode: '238', name: 'Cap-Vert' },
  { code: 'ST', dialCode: '239', name: 'Sao Tomé-et-Principe' },
  { code: 'GN', dialCode: '224', name: 'Guinée' },
  { code: 'ML', dialCode: '223', name: 'Mali' },
  { code: 'BF', dialCode: '226', name: 'Burkina Faso' },
  { code: 'NE', dialCode: '227', name: 'Niger' },
  { code: 'TD', dialCode: '235', name: 'Tchad' },
  { code: 'CF', dialCode: '236', name: 'Centrafrique' },
  { code: 'CG', dialCode: '242', name: 'Congo' },
  { code: 'GA', dialCode: '241', name: 'Gabon' },
  { code: 'GQ', dialCode: '240', name: 'Guinée équatoriale' },
  { code: 'LR', dialCode: '231', name: 'Liberia' },
  { code: 'SL', dialCode: '232', name: 'Sierra Leone' },
  { code: 'BJ', dialCode: '229', name: 'Bénin' },
  { code: 'TG', dialCode: '228', name: 'Togo' },
  { code: 'GM', dialCode: '220', name: 'Gambie' },
  { code: 'GW', dialCode: '245', name: 'Guinée-Bissau' },
  { code: 'MR', dialCode: '222', name: 'Mauritanie' },
  { code: 'ER', dialCode: '291', name: 'Érythrée' },
  { code: 'DJ', dialCode: '253', name: 'Djibouti' },
  { code: 'SO', dialCode: '252', name: 'Somalie' },
  { code: 'SD', dialCode: '249', name: 'Soudan' },
  { code: 'SS', dialCode: '211', name: 'Soudan du Sud' },
  { code: 'LY', dialCode: '218', name: 'Libye' },
  { code: 'TN', dialCode: '216', name: 'Tunisie' },
  { code: 'DZ', dialCode: '213', name: 'Algérie' },
  { code: 'MA', dialCode: '212', name: 'Maroc' },
  { code: 'EH', dialCode: '212', name: 'Sahara occidental' },
  { code: 'JP', dialCode: '81', name: 'Japon' },
  { code: 'KR', dialCode: '82', name: 'Corée du Sud' },
  { code: 'CN', dialCode: '86', name: 'Chine' },
  { code: 'IN', dialCode: '91', name: 'Inde' },
  { code: 'PK', dialCode: '92', name: 'Pakistan' },
  { code: 'BD', dialCode: '880', name: 'Bangladesh' },
  { code: 'ID', dialCode: '62', name: 'Indonésie' },
  { code: 'MY', dialCode: '60', name: 'Malaisie' },
  { code: 'SG', dialCode: '65', name: 'Singapour' },
  { code: 'TH', dialCode: '66', name: 'Thaïlande' },
  { code: 'VN', dialCode: '84', name: 'Vietnam' },
  { code: 'PH', dialCode: '63', name: 'Philippines' },
  { code: 'TW', dialCode: '886', name: 'Taïwan' },
  { code: 'HK', dialCode: '852', name: 'Hong Kong' },
  { code: 'MO', dialCode: '853', name: 'Macau' },
  { code: 'KH', dialCode: '855', name: 'Cambodge' },
  { code: 'LA', dialCode: '856', name: 'Laos' },
  { code: 'MM', dialCode: '95', name: 'Myanmar' },
  { code: 'NP', dialCode: '977', name: 'Népal' },
  { code: 'LK', dialCode: '94', name: 'Sri Lanka' },
  { code: 'MV', dialCode: '960', name: 'Maldives' },
  { code: 'BT', dialCode: '975', name: 'Bhoutan' },
  { code: 'BN', dialCode: '673', name: 'Brunei' },
  { code: 'AU', dialCode: '61', name: 'Australie' },
  { code: 'NZ', dialCode: '64', name: 'Nouvelle-Zélande' },
  { code: 'FJ', dialCode: '679', name: 'Fidji' },
  { code: 'PG', dialCode: '675', name: 'Papouasie-Nouvelle-Guinée' },
  { code: 'SB', dialCode: '677', name: 'Îles Salomon' },
  { code: 'VU', dialCode: '678', name: 'Vanuatu' },
  { code: 'NC', dialCode: '687', name: 'Nouvelle-Calédonie' },
  { code: 'PF', dialCode: '689', name: 'Polynésie française' },
  { code: 'WS', dialCode: '685', name: 'Samoa' },
  { code: 'TO', dialCode: '676', name: 'Tonga' },
  { code: 'KI', dialCode: '686', name: 'Kiribati' },
  { code: 'TV', dialCode: '688', name: 'Tuvalu' },
  { code: 'NR', dialCode: '674', name: 'Nauru' },
  { code: 'PW', dialCode: '680', name: 'Palaos' },
  { code: 'FM', dialCode: '691', name: 'États fédérés de Micronésie' },
  { code: 'MH', dialCode: '692', name: 'Îles Marshall' },
  { code: 'RU', dialCode: '7', name: 'Russie' },
  { code: 'UA', dialCode: '380', name: 'Ukraine' },
  { code: 'BY', dialCode: '375', name: 'Biélorussie' },
  { code: 'KZ', dialCode: '7', name: 'Kazakhstan' },
  { code: 'UZ', dialCode: '998', name: 'Ouzbékistan' },
  { code: 'KG', dialCode: '996', name: 'Kirghizistan' },
  { code: 'TJ', dialCode: '992', name: 'Tadjikistan' },
  { code: 'TM', dialCode: '993', name: 'Turkménistan' },
  { code: 'GE', dialCode: '995', name: 'Géorgie' },
  { code: 'AM', dialCode: '374', name: 'Arménie' },
  { code: 'AZ', dialCode: '994', name: 'Azerbaïdjan' },
  { code: 'TR', dialCode: '90', name: 'Turquie' },
  { code: 'CY', dialCode: '357', name: 'Chypre' },
  { code: 'IL', dialCode: '972', name: 'Israël' },
  { code: 'JO', dialCode: '962', name: 'Jordanie' },
  { code: 'LB', dialCode: '961', name: 'Liban' },
  { code: 'SY', dialCode: '963', name: 'Syrie' },
  { code: 'IQ', dialCode: '964', name: 'Irak' },
  { code: 'KW', dialCode: '965', name: 'Koweït' },
  { code: 'SA', dialCode: '966', name: 'Arabie saoudite' },
  { code: 'AE', dialCode: '971', name: 'Émirats arabes unis' },
  { code: 'QA', dialCode: '974', name: 'Qatar' },
  { code: 'BH', dialCode: '973', name: 'Bahreïn' },
  { code: 'OM', dialCode: '968', name: 'Oman' },
  { code: 'YE', dialCode: '967', name: 'Yémen' },
  { code: 'IR', dialCode: '98', name: 'Iran' },
  { code: 'AF', dialCode: '93', name: 'Afghanistan' },
  { code: 'PK', dialCode: '92', name: 'Pakistan' },
  { code: 'IN', dialCode: '91', name: 'Inde' },
  { code: 'NP', dialCode: '977', name: 'Népal' },
  { code: 'BT', dialCode: '975', name: 'Bhoutan' },
  { code: 'LK', dialCode: '94', name: 'Sri Lanka' },
  { code: 'MV', dialCode: '960', name: 'Maldives' },
  { code: 'BD', dialCode: '880', name: 'Bangladesh' },
  { code: 'MM', dialCode: '95', name: 'Myanmar' },
  { code: 'TH', dialCode: '66', name: 'Thaïlande' },
  { code: 'LA', dialCode: '856', name: 'Laos' },
  { code: 'KH', dialCode: '855', name: 'Cambodge' },
  { code: 'VN', dialCode: '84', name: 'Vietnam' },
  { code: 'MY', dialCode: '60', name: 'Malaisie' },
  { code: 'SG', dialCode: '65', name: 'Singapour' },
  { code: 'ID', dialCode: '62', name: 'Indonésie' },
  { code: 'PH', dialCode: '63', name: 'Philippines' },
  { code: 'BN', dialCode: '673', name: 'Brunei' },
  { code: 'TW', dialCode: '886', name: 'Taïwan' },
  { code: 'HK', dialCode: '852', name: 'Hong Kong' },
  { code: 'MO', dialCode: '853', name: 'Macau' },
  { code: 'KR', dialCode: '82', name: 'Corée du Sud' },
  { code: 'KP', dialCode: '850', name: 'Corée du Nord' },
  { code: 'JP', dialCode: '81', name: 'Japon' },
  { code: 'CN', dialCode: '86', name: 'Chine' },
  { code: 'MN', dialCode: '976', name: 'Mongolie' },
  { code: 'KZ', dialCode: '7', name: 'Kazakhstan' },
  { code: 'UZ', dialCode: '998', name: 'Ouzbékistan' },
  { code: 'KG', dialCode: '996', name: 'Kirghizistan' },
  { code: 'TJ', dialCode: '992', name: 'Tadjikistan' },
  { code: 'TM', dialCode: '993', name: 'Turkménistan' },
  { code: 'AF', dialCode: '93', name: 'Afghanistan' },
  { code: 'PK', dialCode: '92', name: 'Pakistan' },
  { code: 'IN', dialCode: '91', name: 'Inde' },
  { code: 'NP', dialCode: '977', name: 'Népal' },
  { code: 'BT', dialCode: '975', name: 'Bhoutan' },
  { code: 'LK', dialCode: '94', name: 'Sri Lanka' },
  { code: 'MV', dialCode: '960', name: 'Maldives' },
  { code: 'BD', dialCode: '880', name: 'Bangladesh' },
  { code: 'MM', dialCode: '95', name: 'Myanmar' },
  { code: 'TH', dialCode: '66', name: 'Thaïlande' },
  { code: 'LA', dialCode: '856', name: 'Laos' },
  { code: 'KH', dialCode: '855', name: 'Cambodge' },
  { code: 'VN', dialCode: '84', name: 'Vietnam' },
  { code: 'MY', dialCode: '60', name: 'Malaisie' },
  { code: 'SG', dialCode: '65', name: 'Singapour' },
  { code: 'ID', dialCode: '62', name: 'Indonésie' },
  { code: 'PH', dialCode: '63', name: 'Philippines' },
  { code: 'BN', dialCode: '673', name: 'Brunei' },
  { code: 'TW', dialCode: '886', name: 'Taïwan' },
  { code: 'HK', dialCode: '852', name: 'Hong Kong' },
  { code: 'MO', dialCode: '853', name: 'Macau' },
]

export const PhoneInput = ({ value, onChange, placeholder, className = '', error, defaultCountryCode = '509', showHelpText = true }: PhoneInputProps) => {
  const [isValid, setIsValid] = useState<boolean>(false)
  const [countryCode, setCountryCode] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.dialCode === defaultCountryCode) || COUNTRIES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [validationError, setValidationError] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    
    // Mettre à jour le numéro avec le nouveau code pays
    const currentNumber = value.replace(/^\+\d+/, '')
    const newNumber = '+' + country.dialCode + currentNumber
    onChange(newNumber, false)
  }

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // N'accepter que les chiffres et le signe +
    let inputValue = e.target.value.replace(/[^0-9+]/g, '')

    // Empêcher la modification manuelle du code pays si le numéro commence par +
    if (value.startsWith('+') && inputValue.startsWith('+')) {
      // Extraire le code pays actuel
      const currentCountry = COUNTRIES.find(c => value.startsWith('+' + c.dialCode))
      if (currentCountry) {
        const dialCode = currentCountry.dialCode
        // Si l'utilisateur essaie de modifier le code pays, le remettre
        if (!inputValue.startsWith('+' + dialCode)) {
          // Garder le code pays et modifier seulement le numéro
          const currentNumber = value.replace(/^\+\d+/, '')
          inputValue = '+' + dialCode + inputValue.replace(/^\+\d+/, '')
        }
      }
    }

    // Détection du code pays et validation
    let valid = false
    let detectedCountry = ''
    let errorMsg = ''

    try {
      // Priorité: détecter d'abord les numéros courts (8 chiffres sans +)
      if (inputValue.length >= 8 && inputValue.length <= 10 && !inputValue.startsWith('+')) {
        // Numéro court détecté (8-10 chiffres sans +)
        // Ajouter le code pays par défaut
        const phoneNumberWithDefault = '+' + selectedCountry.dialCode + inputValue
        const phoneNumber = parsePhoneNumber(phoneNumberWithDefault)
        
        if (phoneNumber) {
          detectedCountry = phoneNumber.country || ''
          
          const isValidFormat = isValidPhoneNumber(phoneNumberWithDefault)
          const digitsOnly = phoneNumberWithDefault.replace(/\D/g, '')
          const hasMinDigits = digitsOnly.length >= 10
          
          valid = isValidFormat && hasMinDigits
          
          if (valid) {
            inputValue = phoneNumberWithDefault
            // Mettre à jour le pays sélectionné automatiquement
            const autoCountry = COUNTRIES.find(c => c.code === detectedCountry)
            if (autoCountry) {
              setSelectedCountry(autoCountry)
            }
          } else {
            if (!hasMinDigits) {
              errorMsg = 'Numéro trop court (min 10 chiffres)'
            } else {
              errorMsg = 'Format de numéro invalide'
            }
          }
        }
      } else if (inputValue.length > 5) {
        // Si le numéro ne commence pas par +, essayer de le détecter automatiquement
        let phoneNumberToParse = inputValue
        if (!inputValue.startsWith('+')) {
          // Essayer d'ajouter + pour la détection
          phoneNumberToParse = '+' + inputValue
        }

        const phoneNumber = parsePhoneNumber(phoneNumberToParse)
        if (phoneNumber) {
          detectedCountry = phoneNumber.country || ''
          
          // Validation avec contraintes supplémentaires
          const isValidFormat = isValidPhoneNumber(phoneNumberToParse)
          
          // Vérifier que le numéro a une longueur suffisante (min 10 chiffres après le code pays)
          const digitsOnly = phoneNumberToParse.replace(/\D/g, '')
          const hasMinDigits = digitsOnly.length >= 10
          
          valid = isValidFormat && hasMinDigits
          
          if (valid && !inputValue.startsWith('+')) {
            inputValue = phoneNumberToParse
            // Mettre à jour le pays sélectionné automatiquement
            const autoCountry = COUNTRIES.find(c => c.code === detectedCountry)
            if (autoCountry) {
              setSelectedCountry(autoCountry)
            }
          } else if (!valid) {
            if (!hasMinDigits) {
              errorMsg = 'Numéro trop court (min 10 chiffres)'
            } else {
              errorMsg = 'Format de numéro invalide pour ce pays'
            }
          }
        } else {
          errorMsg = 'Code pays non reconnu'
        }
      } else if (inputValue.length > 0) {
        errorMsg = 'Continuez à saisir votre numéro...'
      }
    } catch (err) {
      valid = false
      errorMsg = 'Format de numéro invalide'
    }

    setCountryCode(detectedCountry)
    setIsValid(valid)
    setValidationError(errorMsg)
    onChange(inputValue, valid)
  }

  const displayedCountry = (countryCode && COUNTRIES.find(c => c.code === countryCode)) || selectedCountry

  // Extraire le numéro local (sans le code pays sélectionné pour éviter le doublon visuel)
  const getDisplayValue = () => {
    if (!value) return ''
    const dialCodePrefix = '+' + displayedCountry.dialCode
    if (value.startsWith(dialCodePrefix)) {
      return value.substring(dialCodePrefix.length)
    }
    return value.replace(/^\+/, '')
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Nettoyer pour ne garder que les chiffres
    const rawLocal = e.target.value.replace(/[^0-9]/g, '')
    const fullNumber = rawLocal ? `+${displayedCountry.dialCode}${rawLocal}` : ''
    
    // Détection et validation
    let valid = false
    let errorMsg = ''
    
    try {
      if (rawLocal.length >= 8) {
        const parsed = parsePhoneNumber(fullNumber)
        if (parsed) {
          valid = isValidPhoneNumber(fullNumber)
        }
      }
    } catch {
      valid = false
    }

    if (!valid && rawLocal.length > 0 && rawLocal.length < 8) {
      errorMsg = 'Continuez à saisir votre numéro...'
    }

    setIsValid(valid)
    setValidationError(errorMsg)
    onChange(fullNumber, valid)
  }

  const getFlag = () => (
    <button
      type="button"
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      aria-label="Choisir le pays"
      className="flex items-center gap-1.5 pr-2.5 border-r border-gray-300 dark:border-zinc-700 hover:opacity-80 transition-opacity flex-shrink-0"
    >
      <span className={`fi fi-${displayedCountry.code.toLowerCase()} fis rounded text-base`}></span>
      <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-zinc-200">+{displayedCountry.dialCode}</span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
    </button>
  )

  const resolvedPlaceholder = placeholder ?? '6 12 34 56 78'

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
        {getFlag()}
      </div>
      <input
        type="tel"
        value={getDisplayValue()}
        onChange={handleLocalChange}
        placeholder={resolvedPlaceholder}
        className={`w-full pl-28 sm:pl-32 pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
          error ? 'border-red-500' : isValid ? 'border-green-500' : 'border-gray-300 dark:border-zinc-700'
        } ${className}`}
      />
      {isValid && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">
          ✓
        </div>
      )}
      {error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">
          ✕
        </div>
      )}

      {/* Dropdown de sélection de pays */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-gray-200 dark:border-zinc-700">
            <input
              type="text"
              placeholder="Rechercher un pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:border-zinc-600 dark:text-white text-sm"
            />
          </div>

          {/* Liste des pays */}
          <div className="overflow-y-auto max-h-72">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-zinc-400 text-sm">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left"
                >
                  <span className={`fi fi-${country.code.toLowerCase()} fis rounded`}></span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {country.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">
                      +{country.dialCode}
                    </div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <div className="text-green-500">
                      ✓
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Texte d'aide contextuel */}
      {showHelpText && (
        <div className="mt-1">
          {error ? (
            <p className="text-red-500 text-xs">{error}</p>
          ) : validationError ? (
            <p className="text-orange-500 text-xs">{validationError}</p>
          ) : isValid ? (
            <p className="text-green-500 text-xs">Numéro valide ✓</p>
          ) : value.length > 0 ? (
            <p className="text-gray-500 dark:text-zinc-400 text-xs">Continuez à saisir votre numéro...</p>
          ) : (
            <p className="text-gray-500 dark:text-zinc-400 text-xs">
              Entrez votre numéro sans le code pays, ou au format international (+{displayedCountry.dialCode}…)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
