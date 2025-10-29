import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import Settings from '../components/settings';

export default function SettingsRoute() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <Settings />;
}
