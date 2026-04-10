import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Loader from '@/components/loader';
import { authClient } from '@/lib/auth-client';

export default function Index() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const role = (session as Record<string, unknown>)?.role as string | undefined;

  useEffect(() => {
    if (isPending) return;
    if (!session?.isAuthenticated) {
      void navigate('/login', { replace: true });
      return;
    }
    if (role === 'patient') void navigate('/patient/home', { replace: true });
    else if (role === 'doctor') void navigate('/doctor/home', { replace: true });
  }, [isPending, session?.isAuthenticated, role, navigate]);

  return <Loader />;
}
