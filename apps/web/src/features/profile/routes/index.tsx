import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import Profile from '../components/profile';

export default function ProfileRoute() {
  const { isLoading, session } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <Profile session={session} />;
}
