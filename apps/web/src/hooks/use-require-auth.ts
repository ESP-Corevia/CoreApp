import { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

function usePermission(resource: string, permission: string) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    // Only check once — permission doesn't change during the session
    if (checkedRef.current) return;

    let cancelled = false;
    void (async () => {
      setIsChecking(true);
      try {
        const { data } = await authClient.admin.hasPermission({
          permissions: { [resource]: [permission] },
        });
        if (!cancelled) {
          setAllowed(!!data?.success);
          checkedRef.current = true;
        }
      } catch {
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource, permission]);

  return { allowed, isChecking };
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const {
    data: session,
    isPending: isSessionPending,
    isRefetching,
    error: sessionError,
  } = authClient.useSession();
  const { allowed, isChecking: isPermChecking } = usePermission('panel', 'access');

  // True while the session state is not yet settled (initial load or refetch).
  const isSessionLoading = isSessionPending || isRefetching;

  const redirectTo = useMemo(() => {
    const full = location.pathname + (location.search || '');
    return encodeURIComponent(full || '/');
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Wait for session AND permission checks to fully settle before redirecting.
    // This prevents the login-flicker caused by a brief null session during
    // Better Auth's background refetches (e.g. window focus, cross-tab sync).
    if (isSessionLoading || isPermChecking) return;

    if (!session?.isAuthenticated) {
      void navigate(`/login?redirectTo=${redirectTo}`, { replace: true });
      return;
    }

    if (allowed === false) {
      void navigate('/403', {
        replace: true,
        state: { from: location.pathname + (location.search || '') },
      });
      toast.error(
        t('errorScreen.permissionDenied', 'You do not have permission to access that resource.'),
      );
    }
  }, [
    session?.isAuthenticated,
    isSessionLoading,
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
    isLoading: isSessionLoading || isPermChecking,
    error: sessionError ?? null,
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
  }, [session?.isAuthenticated, isPending, navigate, location.state]);

  return { isLoading: isPending };
}
