import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export function usePatientOnboarded() {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const trpc = useTrpc();

  const role = (session as Record<string, unknown>)?.role as string | undefined;

  const { data: user, isLoading: isUserLoading } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: !!session?.isAuthenticated && role === 'patient',
  });

  // Patient is onboarded if they have a patient profile
  const isOnboarded = user?.user?.patientProfile != null;
  const isLoading = isSessionPending || isUserLoading;

  useEffect(() => {
    if (isLoading) return;
    if (role === 'patient' && !isOnboarded) {
      void navigate('/patient/onboarding', { replace: true });
    }
  }, [isLoading, role, isOnboarded, navigate]);

  return { isLoading, isOnboarded };
}
