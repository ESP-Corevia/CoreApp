import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import DocumentsDashboard from '../components/documents-dashboard';

export default function DocumentsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <DocumentsDashboard session={session} />;
}
