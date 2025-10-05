import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

export function createTestI18n(lang: 'en' | 'fr' = 'en') {
  const instance = i18n.createInstance();
  void instance.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: { en: { translation: en }, fr: { translation: fr } },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });
  return instance;
}
