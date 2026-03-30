import PatientsRoute from '@/features/patients/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Patients' }, { name: 'description', content: 'Corevia Patients Management' }];
}
export default PatientsRoute;
