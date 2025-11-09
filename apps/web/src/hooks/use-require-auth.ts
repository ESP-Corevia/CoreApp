import { useEffect, useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

function usePermission(resource: string, permission: string) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsChecking(true);
      setError(null);
      try {
        // If your client has a hook, use that instead.
        const { data } = await authClient.admin.hasPermission({
          permissions: { [resource]: [permission] },
        });
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) setAllowed(!!data?.success);
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setAllowed(false);
          setError(e);
        }
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) setIsChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource, permission]);

  return { allowed, isChecking, error };
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const {
    data: session,
    isPending: isSessionPending,
    error: sessionError,
  } = authClient.useSession();

  const {
    allowed,
    isChecking: isPermChecking,
    error: permError,
  } = usePermission('panel', 'access');

  const redirectTo = useMemo(() => {
    const full = location.pathname + (location.search || '');
    return encodeURIComponent(full || '/');
  }, [location.pathname, location.search]);

  useEffect(() => {
    void (async () => {
      if (isSessionPending || isPermChecking) return;

      if (!session?.isAuthenticated) {
        await navigate(`/login?redirectTo=${redirectTo}`, { replace: true });
        return;
      }

      if (allowed === false) {
        await navigate('/403', {
          replace: true,
          state: { from: location.pathname + (location.search || '') },
        });
        toast.error(
          t('errorScreen.permissionDenied', 'You do not have permission to access that resource.')
        );
        return;
      }
    })();
  }, [
    session,
    isSessionPending,
    isPermChecking,
    allowed,
    navigate,
    redirectTo,
    location.pathname,
    location.search,
    t,
  ]);

  return {
    session: allowed === true ? session : null,
    isLoading: isSessionPending || isPermChecking,
    error: sessionError ?? permError ?? null,
    isAuthorized: !!session?.isAuthenticated && allowed === true,
  };
}

export function useGuestOnly() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (session?.isAuthenticated) {
      const to =
        location.state?.redirectTo ??
        (typeof window !== 'undefined' ? window.sessionStorage.getItem('redirectTo') : null) ??
        '/';
      void navigate(to, { replace: true });
    }
  }, [session, isPending, navigate, location.state]);

  return { isLoading: isPending };
}
