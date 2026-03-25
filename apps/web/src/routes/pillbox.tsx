import PillboxRoute from '@/features/pillbox/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Mon Pilulier' }, { name: 'description', content: 'Mon pilulier personnel' }];
}
export default PillboxRoute;
