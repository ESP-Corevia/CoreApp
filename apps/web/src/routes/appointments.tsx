import AppointmentsRoute from '@/features/appointments/routes';

import type { Route } from './+types/_index';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Appointments' },
    { name: 'description', content: 'Corevia Appointments Management' },
  ];
}
export default AppointmentsRoute;
