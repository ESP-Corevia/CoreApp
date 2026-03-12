import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import DoctorsDashboard from '../components/doctors-dashboard';

export default function DoctorsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <DoctorsDashboard session={session} />;
}
