import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'Français', native: 'Français' },
] as const;

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem('lang', code);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-1.5" role="radiogroup" aria-label="Language">
      {LANGUAGES.map(({ code, label, native }) => {
        const active = i18n.language.startsWith(code);
        return (
          // biome-ignore lint/a11y/useSemanticElements: pass
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handleChange(code)}
            className={cn(
              'group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-accent/30',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-lg font-semibold text-xs uppercase',
                  active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {code}
              </span>
              <div className="min-w-0">
                <p className={cn('font-medium text-sm', active && 'text-primary')}>{label}</p>
                {native !== label && <p className="text-muted-foreground text-xs">{native}</p>}
              </div>
            </div>
            {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
