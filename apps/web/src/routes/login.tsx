import Login from '@/features/auth/routes/login';

import type { Route } from './+types/_index';
// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Login' }, { name: 'description', content: 'Corevia Login' }];
}
export default Login;
