import PillboxDetailRoute from '@/features/pillbox/routes/detail';

import type { Route } from './+types/_index';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Détail traitement' }, { name: 'description', content: 'Détail du traitement' }];
}
export default PillboxDetailRoute;
