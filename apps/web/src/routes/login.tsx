import Login from '@/features/auth/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Login' }, { name: 'description', content: 'Corevia Login' }];
}
export default Login;
