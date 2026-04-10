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

  const isVerified = (user?.user as Record<string, unknown>)?.doctorVerified === true;
  const isLoading = isSessionPending || isUserLoading;

  useEffect(() => {
    if (isLoading) return;
    if (role === 'doctor' && !isVerified) {
      void navigate('/doctor/pending-verification', { replace: true });
    }
  }, [isLoading, role, isVerified, navigate]);

  return { isLoading, isVerified };
}
