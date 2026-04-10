import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import AiChat from './ai-chat';

vi.mock('@ai-sdk/react', () => {
  const sendMessage = vi.fn();
  const addToolApprovalResponse = vi.fn();
  return {
    useChat: vi.fn().mockReturnValue({
      messages: [],
      sendMessage,
      addToolApprovalResponse,
      status: 'ready',
      error: undefined,
    }),
    __sendMessage: sendMessage,
    __addToolApprovalResponse: addToolApprovalResponse,
  };
});

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
  getToolName: vi.fn().mockReturnValue('test_tool'),
  isToolUIPart: vi.fn().mockReturnValue(false),
  lastAssistantMessageIsCompleteWithApprovalResponses: vi.fn(),
}));

vi.mock('use-stick-to-bottom', () => {
  const StickToBottom = ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  );
  StickToBottom.Content = ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  );
  return {
    StickToBottom,
    useStickToBottomContext: () => ({ isAtBottom: true, scrollToBottom: vi.fn() }),
  };
});

describe('AiChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state when there are no messages', () => {
    const { container } = render(<AiChat />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the text input', () => {
    const { getByRole } = render(<AiChat />);
    expect(getByRole('textbox')).toBeInTheDocument();
  });

  it('sends a message on submit', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<AiChat />);

    await user.type(getByRole('textbox'), 'List all users{Enter}');

    const mod = await import('@ai-sdk/react');
    const sendMessage = (mod as unknown as { __sendMessage: ReturnType<typeof vi.fn> })
      .__sendMessage;
    expect(sendMessage).toHaveBeenCalledWith({ text: 'List all users' });
  });

  it('renders messages from useChat', async () => {
    const { useChat } = await import('@ai-sdk/react');
    vi.mocked(useChat).mockReturnValue({
      messages: [
        { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
      ],
      sendMessage: vi.fn(),
      addToolApprovalResponse: vi.fn(),
      status: 'ready',
      error: undefined,
    } as never);

    const { getByText } = render(<AiChat />);
    expect(getByText('Hello')).toBeInTheDocument();
    expect(getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows error message', async () => {
    const { useChat } = await import('@ai-sdk/react');
    vi.mocked(useChat).mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      addToolApprovalResponse: vi.fn(),
      status: 'error',
      error: new Error('Connection lost'),
    } as never);

    const { getByText } = render(<AiChat />);
    expect(getByText('Connection lost')).toBeInTheDocument();
  });
});
