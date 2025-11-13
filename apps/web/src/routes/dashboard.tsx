import DashboardRoute from '@/features/dashboard/routes';

import type { Route } from './+types/_index';
// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Dashboard' }, { name: 'description', content: 'Corevia Dashboard' }];
}
export default DashboardRoute;
