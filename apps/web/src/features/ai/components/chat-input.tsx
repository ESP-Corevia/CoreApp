import type { ChatStatus } from 'ai';
import { useTranslation } from 'react-i18next';

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';

export function ChatInput({
  onSend,
  status,
  onStop,
}: {
  onSend: (text: string) => void;
  status: ChatStatus;
  onStop?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <PromptInput
      onSubmit={message => {
        if (message.text.trim()) {
          onSend(message.text);
        }
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea placeholder={t('ai.inputPlaceholder')} />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit status={status} onStop={onStop} />
      </PromptInputFooter>
    </PromptInput>
  );
}
