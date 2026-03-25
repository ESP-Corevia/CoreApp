import PillboxDetailRoute from '@/features/pillbox/routes/detail';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Détail traitement' }, { name: 'description', content: 'Détail du traitement' }];
}
export default PillboxDetailRoute;
