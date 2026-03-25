import DashboardRoute from '@/features/dashboard/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Dashboard' }, { name: 'description', content: 'Corevia Dashboard' }];
}
export default DashboardRoute;
