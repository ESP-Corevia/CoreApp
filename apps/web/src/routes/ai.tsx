import AiRoute from '@/features/ai/routes';
import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'AI Assistant' }, { name: 'description', content: 'Corevia AI assistant' }];
}

export default AiRoute;
