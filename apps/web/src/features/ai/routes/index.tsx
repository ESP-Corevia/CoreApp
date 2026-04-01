import { fetchServerSentEvents, useChat } from '@tanstack/ai-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { authClient } from '@/lib/auth-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export default function AITestRoute() {
  const [input, setInput] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const { data: session } = authClient.useSession();
  const role = (session as Record<string, unknown>)?.role as string | undefined;

  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents(`${SERVER_URL}/chat`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">AI Assistant (POC)</h1>
          {session && (
            <p className="text-muted-foreground text-sm">
              Logged in as <strong>{session.userId}</strong>{' '}
              — role: <code className="rounded bg-muted px-1">{role ?? 'unknown'}</code>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowDebug((d) => !d)}
          className="rounded border px-3 py-1 text-xs hover:bg-muted"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">
            Send a message to start the conversation.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border'
              }`}
            >
              {msg.parts.map((part, idx) => {
                if (part.type === 'text') {
                  return msg.role === 'assistant' ? (
                    <div
                      key={idx}
                      className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border"
                    >
                      <Markdown>{part.content}</Markdown>
                    </div>
                  ) : (
                    <p key={idx} className="whitespace-pre-wrap">
                      {part.content}
                    </p>
                  );
                }
                if (part.type === 'thinking') {
                  return (
                    <p key={idx} className="text-xs italic text-muted-foreground">
                      Thinking: {part.content}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
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
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={isLoading}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Debug panel */}
      {showDebug && messages.length > 0 && (
        <details open className="rounded-lg border p-3">
          <summary className="cursor-pointer font-medium text-sm">
            Debug — last message
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(messages[messages.length - 1], null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
