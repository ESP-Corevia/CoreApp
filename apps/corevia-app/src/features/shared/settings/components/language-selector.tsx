import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    void i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
  };

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(({ code, label }) => (
        <Button
          key={code}
          variant={i18n.language === code ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleChange(code)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
