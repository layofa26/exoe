import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import ht from './locales/ht.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import it from './locales/it.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ht', name: 'Kreyòl Ayisyen', flag: '🇭🇹', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const resources = {
  fr: { translation: fr },
  ht: { translation: ht },
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  ar: { translation: ar },
  de: { translation: de },
  zh: { translation: zh },
  ru: { translation: ru },
  it: { translation: it },
};

// Récupère la langue sauvegardée dans localStorage ou prend 'fr' par défaut
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('exile_language') : null;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || 'fr',
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false, // React gère déjà le XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'exile_language',
      caches: ['localStorage'],
    },
  });

// Gestion automatique de la direction du document (RTL pour l'Arabe, LTR pour le reste)
const updateDocumentDirection = (langCode: string) => {
  if (typeof document === 'undefined') return;
  const isRtl = langCode === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = langCode;
  if (isRtl) {
    document.documentElement.classList.add('rtl-mode');
  } else {
    document.documentElement.classList.remove('rtl-mode');
  }
};

// Appliquer au démarrage
updateDocumentDirection(i18n.language || 'fr');

// Réagir à chaque changement de langue
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('exile_language', lng);
  }
  updateDocumentDirection(lng);
});

export default i18n;
