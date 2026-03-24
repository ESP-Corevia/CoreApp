import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import PillboxDashboard from '../components/pillbox-dashboard';

export default function PillboxRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <PillboxDashboard session={session} />;
}
