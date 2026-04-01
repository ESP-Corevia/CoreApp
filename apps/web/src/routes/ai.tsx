import AITestRoute from '@/features/ai/routes';
import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'AI Assistant (POC)' },
    { name: 'description', content: 'Test the AI chat assistant' },
  ];
}

export default AITestRoute;
