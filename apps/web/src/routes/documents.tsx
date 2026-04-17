import DocumentsRoute from '@/features/documents/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Documents' }, { name: 'description', content: 'Corevia Documents Management' }];
}
export default DocumentsRoute;
