import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { Bug, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Spinner } from '@/components/ui/spinner';

import { ChatInput } from './chat-input';
import { ChatEmptyState, ChatMessage } from './chat-messages';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export default function AiChat() {
  const { t } = useTranslation();
  const [showDebug, setShowDebug] = useState(false);

  const { messages, sendMessage, addToolApprovalResponse, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/chat`,
      credentials: 'include',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const isStreaming = status === 'streaming';

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
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col md:-m-6 lg:-m-8">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-border/50 border-b bg-background px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10">
            <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">{t('ai.title')}</h1>
            <p className="text-muted-foreground text-xs">{t('ai.chatDescription')}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDebug(d => !d)}
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted/50"
          >
            <Bug className="size-3" />
            {showDebug ? t('ai.hideDebug') : t('ai.showDebug')}
          </button>
        )}
      </div>

      {/* Conversation — the only scrollable area */}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 px-4 py-6 md:px-6">
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLastMessage={index === messages.length - 1}
                  isStreaming={isStreaming}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                />
              ))}
              {status === 'submitted' && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner className="size-4" />
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Footer: fixed input area */}
      <div className="shrink-0 border-border/50 border-t bg-background px-4 py-3 md:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-destructive text-sm">
              {error.message}
            </div>
          )}

          {messages.length === 0 && (
            <Suggestions className="justify-center">
              {suggestions.map(item => (
                <Suggestion
                  key={item.title}
                  suggestion={item.prompt}
                  onClick={handleSend}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {item.title}
                </Suggestion>
              ))}
            </Suggestions>
          )}

          <ChatInput onSend={handleSend} status={status} onStop={stop} />

          {showDebug && messages.length > 0 && (
            <details className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
              <summary className="cursor-pointer font-medium text-muted-foreground text-xs">
                {t('ai.debugLastMessage')}
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-background p-2.5 font-mono text-xs">
                {JSON.stringify(messages[messages.length - 1], null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
