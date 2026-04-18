import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/loader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useTrpc } from '@/providers/trpc';
import { ProfileForm } from '../components/profile-form';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Profile() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { data: session } = authClient.useSession();
  const trpc = useTrpc();

  const { data, isLoading: userLoading } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: !!session?.isAuthenticated,
  });

  if (authLoading || userLoading) return <Loader />;

  const user = data?.user;
  if (!user) return <Loader />;

  const role = ((user as Record<string, unknown>).role as string) ?? '';
  const roleLabel = role
    ? t(role === 'patient' ? 'auth.signUp.rolePatient' : 'auth.signUp.roleDoctor')
    : '';
  const doctorProfile = user.doctorProfile ?? undefined;
  const isVerified = doctorProfile?.verified === true;

  return (
    <div className="space-y-4 md:space-y-5">
      <Card className="overflow-hidden">
        <div
          className={cn(
            'h-1 w-full',
            role === 'doctor' && !isVerified
              ? 'bg-amber-500'
              : 'bg-gradient-to-r from-primary to-primary/40',
          )}
          aria-hidden="true"
        />
        <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 md:p-6">
          <Avatar className="size-14 shrink-0 sm:size-16">
            <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary">
              {getInitials(user.name ?? '')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-semibold text-base sm:text-lg">{user.name}</p>
            {user.email && <p className="truncate text-muted-foreground text-sm">{user.email}</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              {roleLabel && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wide">
                  {roleLabel}
                </span>
              )}
              {role === 'doctor' && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                    isVerified
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {isVerified ? (
                    <ShieldCheck className="size-3" aria-hidden="true" />
                  ) : (
                    <ShieldOff className="size-3" aria-hidden="true" />
                  )}
                  {isVerified ? t('shared.profile.verified') : t('shared.profile.unverified')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileForm
        name={user.name ?? ''}
        email={user.email ?? ''}
        role={role}
        doctorProfile={doctorProfile}
        patientProfile={user.patientProfile ?? undefined}
      />
    </div>
  );
}
