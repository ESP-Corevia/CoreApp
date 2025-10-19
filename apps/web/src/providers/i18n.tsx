import { useEffect, useState } from 'react';

import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const resources = { en, fr } as const;

let initPromise: ReturnType<typeof i18n.init> | undefined;
function ensureI18nInit() {
  initPromise ??= i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources,
    interpolation: { escapeValue: false },
  });
  return initPromise;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    let mounted = true;
    void ensureI18nInit().then(async () => {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
      if (saved === 'en' || saved === 'fr') {
        await i18n.changeLanguage(saved);
      }
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export { i18n };
