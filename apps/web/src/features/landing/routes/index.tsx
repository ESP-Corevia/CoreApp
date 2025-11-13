import Loader from '@/components/loader';
import Landing from '../components/landing';
import { authClient } from '@/lib/auth-client';

export default function LandingRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader open />;
  }

  return <Landing session={session} />;
}
