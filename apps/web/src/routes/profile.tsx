import ProfileRoute from '@/features/profile/routes';

import type { Route } from './+types/profile';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Profile' }, { name: 'description', content: 'View your profile' }];
}

export default ProfileRoute;
