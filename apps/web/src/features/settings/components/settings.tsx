import { Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation, Trans } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const handleChangeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };
  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Theme Settings */}
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Sun className="h-5 w-5" />
              <Trans i18nKey="settings.appearance">Appearance</Trans>
            </h2>
            <p className="text-muted-foreground text-sm">
              <Trans i18nKey="settings.appearanceSubtitle">Customize how Corevia looks</Trans>
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <div className="mb-4 space-y-1">
                <p className="font-medium">
                  <Trans i18nKey="settings.theme">Theme</Trans>
                </p>
                <p className="text-muted-foreground text-sm">
                  <Trans i18nKey="settings.themeSubtitle">Choose your color scheme</Trans>
                </p>
              </div>
              <div className="grid gap-2 sm:flex sm:gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                  className="gap-2"
                >
                  <Sun className="h-4 w-4" />
                  <Trans i18nKey="settings.light">Light</Trans>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  <Trans i18nKey="settings.dark">Dark</Trans>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={theme === 'system'}
                  onClick={() => setTheme('system')}
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  <Trans i18nKey="settings.system">System</Trans>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Language Settings */}
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Globe className="h-5 w-5" />
              <Trans i18nKey="settings.language">Language</Trans>
            </h2>
            <p className="text-muted-foreground text-sm">
              <Trans i18nKey="settings.languageSubtitle">Choose your preferred language</Trans>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">
                  <Trans i18nKey="settings.language">Language</Trans>
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('settings.currentLanguage', 'Current language: {{language}}', {
                    language: i18n.language,
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  aria-pressed={i18n.language === 'en'}
                  size="sm"
                  onClick={() => handleChangeLanguage('en')}
                >
                  English
                </Button>
                <Button
                  variant={i18n.language === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={i18n.language === 'fr'}
                  onClick={() => handleChangeLanguage('fr')}
                >
                  Français
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
