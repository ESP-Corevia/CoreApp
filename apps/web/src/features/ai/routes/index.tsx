import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Brain, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Streamdown } from 'streamdown';
import { authClient } from '@/lib/auth-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

// ---------------------------------------------------------------------------
// Thinking indicator — animated brain + pulsing dots
// ---------------------------------------------------------------------------

function ThinkingIndicator() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background px-4 py-2.5 shadow-sm">
        <Brain className="size-4 animate-pulse text-primary" />
        <span className="text-muted-foreground text-sm">{t('ai.thinking')}</span>
        <span className="flex gap-0.5" aria-hidden>
          <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thought process — collapsible block with smooth height transition
// ---------------------------------------------------------------------------

function ThinkingBlock({ content }: { content: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="my-2 overflow-hidden rounded-md border border-border/40 bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/40"
      >
        <Brain className="size-3 text-primary/60" />
        <span className="font-medium">{t('ai.thoughtProcess')}</span>
        <span
          className="ml-auto transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <ChevronRight className="size-3" />
        </span>
      </button>
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 500}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          className="whitespace-pre-wrap border-border/30 border-t px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed"
        >
          {content}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main chat route
// ---------------------------------------------------------------------------

export default function AITestRoute() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const { data: session } = authClient.useSession();
  const role = session?.role as string | undefined;

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/chat`,
      credentials: 'include',
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">{t('ai.title')}</h1>
          {session && (
            <p className="text-muted-foreground text-sm">
              Logged in as <strong>{session.userId}</strong> — role:{' '}
              <code className="rounded bg-muted px-1">{role ?? 'unknown'}</code>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowDebug(d => !d)}
          className="rounded border px-3 py-1 text-xs hover:bg-muted"
        >
          {showDebug ? t('ai.hideDebug') : t('ai.showDebug')} {t('ai.debug')}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">{t('ai.emptyChat')}</p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-background'
              }`}
            >
              {msg.parts.map((part, idx) => {
                if (part.type === 'text') {
                  return msg.role === 'assistant' ? (
                    <Streamdown
                      key={idx}
                      className="max-w-none text-sm"
                      isAnimating={status === 'streaming'}
                    >
                      {part.text}
                    </Streamdown>
                  ) : (
                    <p key={idx} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                if (part.type === 'reasoning' && part.text) {
                  return <ThinkingBlock key={idx} content={part.text} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && <ThinkingIndicator />}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('ai.inputPlaceholder')}
          disabled={isLoading}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {t('ai.send')}
        </button>
      </form>

      {/* Debug panel */}
      {showDebug && messages.length > 0 && (
        <details open className="rounded-lg border p-3">
          <summary className="cursor-pointer font-medium text-sm">
            {t('ai.debugLastMessage')}
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(messages[messages.length - 1], null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
