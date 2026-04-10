import { Info, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';

export default function PendingVerification() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');

  if (authLoading || roleLoading) return <Loader />;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <ShieldCheck className="h-16 w-16 text-primary" />
        </div>
        <h1 className="font-bold text-2xl">{t('doctor.pendingVerification.title')}</h1>
        <p className="max-w-sm text-muted-foreground">
          {t('doctor.pendingVerification.description')}
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-left text-muted-foreground text-sm">
            {t('doctor.pendingVerification.tip')}
          </p>
        </CardContent>
      </Card>

      <Button asChild>
        <Link to="/doctor/profile">{t('doctor.pendingVerification.goToProfile')}</Link>
      </Button>
    </div>
  );
}
