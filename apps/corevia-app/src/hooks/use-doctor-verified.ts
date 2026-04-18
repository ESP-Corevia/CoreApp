import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export function useDoctorVerified() {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const trpc = useTrpc();

  const role = (session as Record<string, unknown>)?.role as string | undefined;

  const { data: user, isLoading: isUserLoading } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: !!session?.isAuthenticated && role === 'doctor',
  });

  const doctorProfile = (user?.user as Record<string, unknown> | undefined)?.doctorProfile as
    | { verified?: boolean }
    | null
    | undefined;
  const isVerified = doctorProfile?.verified === true;
  const hasProfile = doctorProfile != null;
  const isLoading = isSessionPending || isUserLoading;

  useEffect(() => {
    if (isLoading) return;
    if (role !== 'doctor') return;
    if (hasProfile && !isVerified) {
      void navigate('/doctor/pending-verification', { replace: true });
    }
  }, [isLoading, role, isVerified, hasProfile, navigate]);

  return { isLoading, isVerified };
}
