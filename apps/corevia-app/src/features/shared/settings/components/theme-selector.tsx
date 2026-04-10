import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme';

const THEMES = ['light', 'dark', 'system'] as const;

export function ThemeSelector() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const labelMap: Record<string, string> = {
    light: t('shared.settings.themeLight'),
    dark: t('shared.settings.themeDark'),
    system: t('shared.settings.themeSystem'),
  };

  return (
    <div className="flex gap-2">
      {THEMES.map(th => (
        <Button
          key={th}
          variant={theme === th ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(th)}
        >
          {labelMap[th]}
        </Button>
      ))}
    </div>
  );
}
