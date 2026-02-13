import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import HealthAssistantPage from '../components/HealthAssistantPage';

export default function HealthAssistantRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <HealthAssistantPage session={session} />;
}
