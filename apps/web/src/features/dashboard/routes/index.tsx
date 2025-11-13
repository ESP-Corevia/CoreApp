import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import Dashboard from '../components/dashboard';

export default function DashboardRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <Dashboard session={session} />;
}
