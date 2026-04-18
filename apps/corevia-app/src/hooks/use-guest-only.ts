import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';

export function useGuestOnly() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  const role = (session as Record<string, unknown>)?.role as string | undefined;

  useEffect(() => {
    if (isPending) return;
    if (session?.isAuthenticated && role) {
      const params = new URLSearchParams(location.search);
      const raw = params.get('redirectTo') ?? '';
      let redirectPath: string;
      try {
        const decoded = decodeURIComponent(raw);
        redirectPath = decoded.startsWith('/') ? decoded : `/${role}/home`;
      } catch {
        redirectPath = `/${role}/home`;
      }
      void navigate(redirectPath, { replace: true });
    }
  }, [session?.isAuthenticated, role, isPending, navigate, location.search]);

  return { isLoading: isPending };
}
