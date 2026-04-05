import Loader from '@/components/loader';
import { useRequireAuth } from '@/hooks/use-require-auth';

import AiChat from '../components/ai-chat';

export default function AiRoute() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loader open />;
  }

  return <AiChat />;
}
