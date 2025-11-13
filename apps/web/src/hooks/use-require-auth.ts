import { useEffect } from 'react';

import { useNavigate, useLocation } from 'react-router';

import { authClient } from '@/lib/auth-client';

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const redirect = async () => {
      if (!isPending && !session?.isAuthenticated) {
        await navigate(`/login?redirectTo=${encodeURIComponent(location.pathname != "/" ? location.pathname : "/home" )}`, {
          replace: true,
        });
      }
    };
    void redirect();
  }, [session, isPending, navigate, location.pathname]);

  return {
    session: session ?? null,
    isLoading: isPending,
  };
}

export function useGuestOnly() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    const redirect = async () => {
      if (!isPending && session?.isAuthenticated) {
        await navigate('/', { replace: true });
      }
    };
    void redirect();
  }, [session, isPending, navigate]);

  return {
    isLoading: isPending,
  };
}
