import ProfileRoute from '@/features/profile/routes';

import type { Route } from './+types/profile';

// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [{ title: 'Profile' }, { name: 'description', content: 'View your profile' }];
}

export default ProfileRoute;
