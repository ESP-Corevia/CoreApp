import MedicationsRoute from '@/features/medications/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Médicaments' }, { name: 'description', content: 'Recherche de médicaments' }];
}
export default MedicationsRoute;
