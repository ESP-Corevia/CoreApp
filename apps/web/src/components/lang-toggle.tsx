import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export function LangToggle() {
  const { i18n } = useTranslation();

  const lang = i18n.language;
  const current = lang.startsWith('fr') ? 'fr' : 'en';
  const next = current === 'en' ? 'fr' : 'en';

  const toggleLang = async () => {
    try {
      localStorage.setItem('lang', next);
    } catch {
      throw new Error('Could not save language preference');
    }
    await i18n.changeLanguage(next);
  };

  return (
    <Button variant="outline" onClick={toggleLang}>
      {current === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
    </Button>
  );
}
