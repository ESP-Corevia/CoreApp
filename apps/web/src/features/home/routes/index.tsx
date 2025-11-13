import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import Home from '../components/home';

export default function HomeRoute() {
  const { isLoading, session } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <Home session={session} />;
}
