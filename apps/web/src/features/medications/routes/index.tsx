import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import MedicationsSearch from '../components/medications-search';

export default function MedicationsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <MedicationsSearch session={session} />;
}
