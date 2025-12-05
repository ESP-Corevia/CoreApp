import HealthAssistantRoute from '@/features/health-assistant/routes';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Assistant santé' },
    { name: 'description', content: 'Chatbot santé multi-experts Corevia' },
  ];
}

export default HealthAssistantRoute;
