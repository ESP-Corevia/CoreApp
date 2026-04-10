import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { authClient } from '@/lib/auth-client';
import { LanguageSelector } from '../components/language-selector';
import { ThemeSelector } from '../components/theme-selector';

export default function Settings() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const navigate = useNavigate();

  if (authLoading) return <Loader />;

  const handleSignOut = async () => {
    await authClient.signOut();
    void navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl">{t('shared.settings.title')}</h1>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">{t('shared.settings.theme')}</h2>
        <Card>
          <CardContent className="p-4">
            <ThemeSelector />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">{t('shared.settings.language')}</h2>
        <Card>
          <CardContent className="p-4">
            <LanguageSelector />
          </CardContent>
        </Card>
      </section>

      <Button variant="destructive" className="w-full" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        {t('common.signOut')}
      </Button>
    </div>
  );
}
