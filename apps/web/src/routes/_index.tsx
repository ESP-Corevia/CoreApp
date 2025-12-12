import HomeRoute from '@/features/home/routes/index';

import type { Route } from './+types/_index';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Corevia' }, { name: 'description', content: 'Corevia is a web application' }];
}
export default HomeRoute;
