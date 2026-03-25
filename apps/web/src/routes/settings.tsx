import SettingsRoute from '@/features/settings/routes';

import type { Route } from './+types/settings';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Settings' }, { name: 'description', content: 'Manage your settings' }];
}

export default SettingsRoute;
