import LandingRoute from '@/features/landing/routes/index';
import type { Route } from './+types/_index';

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'home' }, { name: 'description', content: 'home is a web application' }];
}

export default function Home() {
  return <LandingRoute />;
}
