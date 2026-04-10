import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';

export function useRoleGuard(expectedRole: 'patient' | 'doctor') {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const role = (session as Record<string, unknown>)?.role as string | undefined;

  useEffect(() => {
    if (isPending) return;
    if (!session?.isAuthenticated) return;
    if (role && role !== expectedRole) {
      void navigate('/403', { replace: true });
    }
  }, [session?.isAuthenticated, role, expectedRole, isPending, navigate]);

  return {
    isLoading: isPending,
    isAuthorized: role === expectedRole,
    role,
  };
}
