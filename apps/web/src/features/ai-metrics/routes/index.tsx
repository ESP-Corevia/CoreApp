import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import AiMetrics from '../components/aiMetrics';

export default function AiMetricsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <AiMetrics session={session} />;
}
