import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import { ProfileForm } from '../components/profile-form';

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

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl">{t('shared.profile.title')}</h1>
      <ProfileForm
        name={user.name ?? ''}
        email={user.email ?? ''}
        role={((user as Record<string, unknown>).role as string) ?? ''}
        doctorProfile={user.doctorProfile ?? undefined}
        patientProfile={user.patientProfile ?? undefined}
      />
    </div>
  );
}
