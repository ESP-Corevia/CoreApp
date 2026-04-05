import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatInput } from './chat-input';
import { ChatEmptyState, ChatMessage, ThinkingIndicator } from './chat-messages';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export default function AiChat() {
  const { t } = useTranslation();
  const [showDebug, setShowDebug] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/chat`,
      credentials: 'include',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  const handleApprove = (id: string) => {
    addToolApprovalResponse({ id, approved: true });
  };

  const handleDeny = (id: string) => {
    addToolApprovalResponse({ id, approved: false, reason: 'User denied the action' });
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col md:-m-6 lg:-m-8">
      {/* Scrollable messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                status={status}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            ))}
            {isLoading && <ThinkingIndicator />}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto w-full max-w-2xl px-4 pb-2">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-destructive text-sm">
            {error.message}
          </div>
        </div>
      )}

      {/* Input — pinned at the bottom of the flex column */}
      <div className="shrink-0 border-border/40 border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <ChatInput onSend={handleSend} disabled={isLoading} />

          {/* Debug toggle */}
          {messages.length > 0 && (
            <div className="mt-1.5 flex justify-center">
              <button
                type="button"
                onClick={() => setShowDebug(d => !d)}
                className="text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              >
                {showDebug ? t('ai.hideDebug') : t('ai.showDebug')} {t('ai.debug')}
              </button>
            </div>
          )}
          {showDebug && messages.length > 0 && (
            <details open className="mt-2 rounded-lg border border-border/30 p-3">
              <summary className="cursor-pointer font-medium text-muted-foreground text-xs">
                {t('ai.debugLastMessage')}
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/30 p-2 text-xs">
                {JSON.stringify(messages[messages.length - 1], null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
