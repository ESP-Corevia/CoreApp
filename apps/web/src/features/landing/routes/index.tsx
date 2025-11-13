import Loader from '@/components/loader';
import { useGuestOnly } from '@/hooks/use-require-auth';

import Landing from '../components/landing';

export default function LandingRoute() {
  const { isLoading } = useGuestOnly();

  if (isLoading) {
    return <Loader open />;
  }

  return <Landing />;
}
