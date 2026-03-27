import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import PatientsDashboard from '../components/patients-dashboard';

export default function PatientsRoute() {
  const { session, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <PatientsDashboard session={session} />;
}
