import { useChat } from '@ai-sdk/react';
import {
  type ChatStatus,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from 'ai';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

interface AiChatContextValue {
  messages: UIMessage[];
  sendMessage: ReturnType<typeof useChat>['sendMessage'];
  setMessages: ReturnType<typeof useChat>['setMessages'];
  addToolApprovalResponse: ReturnType<typeof useChat>['addToolApprovalResponse'];
  status: ChatStatus;
  stop: () => void;
  error: Error | undefined;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

export function AiChatProvider({ children }: { children: ReactNode }) {
  const { messages, sendMessage, setMessages, addToolApprovalResponse, status, stop, error } =
    useChat({
      transport: new DefaultChatTransport({
        api: `${SERVER_URL}/chat`,
        credentials: 'include',
      }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(o => !o), []);

  const value = useMemo<AiChatContextValue>(
    () => ({
      messages,
      sendMessage,
      setMessages,
      addToolApprovalResponse,
      status,
      stop,
      error,
      clear: () => setMessages([]),
      open,
      setOpen,
      toggle,
    }),
    [messages, sendMessage, setMessages, addToolApprovalResponse, status, stop, error, open, toggle],
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat(): AiChatContextValue {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error('useAiChat must be used inside AiChatProvider');
  return ctx;
}
