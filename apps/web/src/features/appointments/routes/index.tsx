import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import AppointmentsDashboard from '../components/appointments-dashboard';

export default function AppointmentsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <AppointmentsDashboard session={session} />;
}
