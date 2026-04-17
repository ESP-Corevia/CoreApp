import { Globe, LogOut, Palette, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Loader from '@/components/loader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '../components/language-selector';
import { ThemeSelector } from '../components/theme-selector';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SectionProps {
  title: string;
  description: string;
  icon: typeof Palette;
  children: React.ReactNode;
}

function Section({ title, description, icon: Icon, children }: SectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-medium text-foreground text-sm">{title}</h2>
      </div>
      <Card>
        <CardContent className="space-y-3 p-4 md:p-5">
          <p className="text-muted-foreground text-xs">{description}</p>
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (authLoading) return <Loader />;

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const userName = (user?.name as string | undefined) ?? '';
  const userEmail = (user?.email as string | undefined) ?? '';
  const role = sessionAny?.role as 'patient' | 'doctor' | undefined;
  const roleLabel = role
    ? t(role === 'patient' ? 'auth.signUp.rolePatient' : 'auth.signUp.roleDoctor')
    : '';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      void navigate('/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {userName && (
        <Card className="overflow-hidden">
          <div
            className="h-1 w-full bg-gradient-to-r from-primary to-primary/40"
            aria-hidden="true"
          />
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 md:p-6">
            <Avatar className="size-12 shrink-0 sm:size-14">
              <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold text-base">{userName}</p>
              {userEmail && <p className="truncate text-muted-foreground text-sm">{userEmail}</p>}
              {roleLabel && (
                <span
                  className={cn(
                    'mt-0.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wide',
                  )}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Section
        title={t('shared.settings.appearance')}
        description={t('shared.settings.appearanceDescription')}
        icon={Palette}
      >
        <ThemeSelector />
      </Section>

      <Section
        title={t('shared.settings.language')}
        description={t('shared.settings.languageDescription')}
        icon={Globe}
      >
        <LanguageSelector />
      </Section>

      <Section
        title={t('shared.settings.account')}
        description={t('shared.settings.accountDescription')}
        icon={ShieldCheck}
      >
        <Button
          variant="outline"
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
          onClick={() => setSignOutOpen(true)}
        >
          <LogOut className="size-4" aria-hidden="true" />
          {t('common.signOut')}
        </Button>
      </Section>

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('shared.settings.signOutConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('shared.settings.signOutConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSignOutOpen(false)} disabled={isSigningOut}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut className="size-4" aria-hidden="true" />
              {isSigningOut ? t('common.loading') : t('common.signOut')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
