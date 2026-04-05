import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChatInput } from './chat-input';
import { ChatEmptyState, ChatMessage, ThinkingIndicator } from './chat-messages';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export default function AiChat() {
  const { t } = useTranslation();
  const [showDebug, setShowDebug] = useState(false);

  const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/chat`,
      credentials: 'include',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const suggestions = [
    {
      title: t('ai.suggestions.listUsers.title'),
      prompt: t('ai.suggestions.listUsers.prompt'),
    },
    {
      title: t('ai.suggestions.updateUser.title'),
      prompt: t('ai.suggestions.updateUser.prompt'),
    },
    {
      title: t('ai.suggestions.deleteUser.title'),
      prompt: t('ai.suggestions.deleteUser.prompt'),
    },
    {
      title: t('ai.suggestions.createDoctor.title'),
      prompt: t('ai.suggestions.createDoctor.prompt'),
    },
  ];

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
    <section className="overflow-hidden rounded-3xl border border-border bg-background">
      <div className="border-border border-b px-5 py-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-lg">{t('ai.title')}</h1>
            <p className="mt-1 text-muted-foreground text-sm">{t('ai.chatDescription')}</p>
          </div>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowDebug(d => !d)}
              className="rounded-full border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
            >
              {showDebug ? t('ai.hideDebug') : t('ai.showDebug')} {t('ai.debug')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-[28rem] px-4 py-5 md:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <ChatEmptyState />

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map(item => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleSend(item.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-muted/30 px-4 py-2.5 text-sm transition-colors hover:bg-muted/60 disabled:opacity-50"
                >
                  <span className="font-medium">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto space-y-6">
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

      <div className="border-border border-t bg-background px-4 py-4 md:px-6">
        <div className="mx-auto space-y-3">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
              {error.message}
            </div>
          ) : null}

          <ChatInput onSend={handleSend} disabled={isLoading} />

          {showDebug && messages.length > 0 ? (
            <details open className="rounded-2xl border border-border bg-muted/20 p-3">
              <summary className="cursor-pointer font-medium text-muted-foreground text-xs">
                {t('ai.debugLastMessage')}
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-background p-3 text-xs">
                {JSON.stringify(messages[messages.length - 1], null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
