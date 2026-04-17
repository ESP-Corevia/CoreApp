import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme';

const THEMES: { value: 'light' | 'dark' | 'system'; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'light', labelKey: 'shared.settings.themeLight', Icon: Sun },
  { value: 'dark', labelKey: 'shared.settings.themeDark', Icon: Moon },
  { value: 'system', labelKey: 'shared.settings.themeSystem', Icon: Monitor },
];

export function ThemeSelector() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="radiogroup"
      aria-label={t('shared.settings.theme')}
    >
      {THEMES.map(({ value, labelKey, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              'group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg transition-colors',
                active ? 'bg-primary/15' : 'bg-muted',
              )}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </div>
            <span className="font-medium text-xs">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
