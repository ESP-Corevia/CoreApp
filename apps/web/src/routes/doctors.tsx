import DoctorsRoute from '@/features/doctors/routes';

import type { Route } from './+types/_index';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Doctors' }, { name: 'description', content: 'Corevia Doctors Management' }];
}
export default DoctorsRoute;
