import DoctorsRoute from '@/features/doctors/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Doctors' }, { name: 'description', content: 'Corevia Doctors Management' }];
}
export default DoctorsRoute;
