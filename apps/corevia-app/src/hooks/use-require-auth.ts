import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending, isRefetching, error } = authClient.useSession();

  const isLoading = isPending || isRefetching;

  const redirectTo = useMemo(() => {
    const full = location.pathname + (location.search || '');
    return encodeURIComponent(full || '/');
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isLoading) return;
    if (!session?.isAuthenticated) {
      void navigate(`/login?redirectTo=${redirectTo}`, { replace: true });
    }
  }, [session?.isAuthenticated, isLoading, navigate, redirectTo]);

  return {
    session,
    isLoading,
    error: error ?? null,
    isAuthenticated: !!session?.isAuthenticated,
  };
}
