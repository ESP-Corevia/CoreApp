import PillboxRoute from '@/features/pillbox/routes';

import type { Route } from './+types/_index';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Mon Pilulier' }, { name: 'description', content: 'Mon pilulier personnel' }];
}
export default PillboxRoute;
