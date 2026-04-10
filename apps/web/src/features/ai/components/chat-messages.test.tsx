import userEvent from '@testing-library/user-event';
import type { UIMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ChatEmptyState, ChatMessage } from './chat-messages';

// Streamdown renders children as-is in tests (no markdown transform)
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: string }) => <span>{children}</span>,
}));

vi.mock('@/components/ai-elements/shimmer', () => ({
  Shimmer: ({ children }: { children: string }) => <span>{children}</span>,
}));

describe('ChatEmptyState', () => {
  it('renders the empty state with an icon', () => {
    const { container } = render(<ChatEmptyState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ChatMessage', () => {
  const handlers = { onApprove: vi.fn(), onDeny: vi.fn() };

  // -------------------------------------------------------------------------
  // Text parts
  // -------------------------------------------------------------------------

  it('renders user text', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello there' }],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('Hello there')).toBeInTheDocument();
  });

  it('renders assistant text via Streamdown', () => {
    const msg: UIMessage = {
      id: '2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hi! How can I help?' }],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('Hi! How can I help?')).toBeInTheDocument();
  });

  it('renders assistant avatar for assistant messages only', () => {
    const userMsg: UIMessage = {
      id: 'u',
      role: 'user',
      parts: [{ type: 'text', text: 'Hi' }],
    };
    const assistantMsg: UIMessage = {
      id: 'a',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hello' }],
    };

    const { container: uc } = render(
      <ChatMessage message={userMsg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    const { container: ac } = render(
      <ChatMessage
        message={assistantMsg}
        isLastMessage={false}
        isStreaming={false}
        {...handlers}
      />,
    );

    expect(ac.querySelector('.rounded-full')).toBeInTheDocument();
    expect(uc.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Reasoning parts
  // -------------------------------------------------------------------------

  it('renders a collapsible Reasoning for reasoning parts', () => {
    const msg: UIMessage = {
      id: 'r1',
      role: 'assistant',
      parts: [{ type: 'reasoning', text: 'Let me think about this...' }],
    };
    const { container } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );

    const trigger = container.querySelector('button');
    expect(trigger).toBeInTheDocument();
  });

  it('skips reasoning parts with empty text', () => {
    const msg: UIMessage = {
      id: 'r2',
      role: 'assistant',
      parts: [
        { type: 'reasoning', text: '' },
        { type: 'text', text: 'Final answer' },
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );

    expect(getByText('Final answer')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Tool approval parts
  // -------------------------------------------------------------------------

  it('renders ToolApprovalCard for approval-requested state', () => {
    const msg: UIMessage = {
      id: 't1',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ban_user' as 'dynamic-tool',
          toolCallId: 'tc1',
          toolName: 'ban_user',
          state: 'approval-requested',
          input: { userId: 'u1' },
          approval: { id: 'ap1' },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('ban_user')).toBeInTheDocument();
    expect(getByText('Approval required')).toBeInTheDocument();
  });

  it('renders ToolApprovalBadge for approval-responded state', () => {
    const msg: UIMessage = {
      id: 't2',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ban_user' as 'dynamic-tool',
          toolCallId: 'tc2',
          toolName: 'ban_user',
          state: 'approval-responded',
          input: { userId: 'u1' },
          approval: { id: 'ap2', approved: true },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('ban_user')).toBeInTheDocument();
    expect(getByText('approved')).toBeInTheDocument();
  });

  it('renders ToolApprovalBadge for output-denied state', () => {
    const msg: UIMessage = {
      id: 't3',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ban_user' as 'dynamic-tool',
          toolCallId: 'tc3',
          toolName: 'ban_user',
          state: 'output-denied',
          input: { userId: 'u1' },
          approval: { id: 'ap3', approved: false, reason: 'Nope' },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('denied')).toBeInTheDocument();
    expect(getByText('— Nope')).toBeInTheDocument();
  });

  it('renders ToolApprovalBadge for output-available with approval', () => {
    const msg: UIMessage = {
      id: 't4',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ban_user' as 'dynamic-tool',
          toolCallId: 'tc4',
          toolName: 'ban_user',
          state: 'output-available',
          input: { userId: 'u1' },
          output: { success: true },
          approval: { id: 'ap4', approved: true },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('ban_user')).toBeInTheDocument();
    expect(getByText('approved')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Auto-executed tool parts (Tool component)
  // -------------------------------------------------------------------------

  it('renders Tool for input-available state', () => {
    const msg: UIMessage = {
      id: 'a2',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc6',
          toolName: 'list_users',
          state: 'input-available',
          input: { query: 'test' },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={true} {...handlers} />,
    );
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('Running')).toBeInTheDocument();
  });

  it('renders Tool for output-available state (no approval)', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'a3',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc7',
          toolName: 'list_users',
          state: 'output-available',
          input: { query: 'all' },
          output: { users: [{ id: 'u1', name: 'Alice' }] },
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('Completed')).toBeInTheDocument();

    await user.click(getByText('list_users'));
    expect(getByText('Parameters')).toBeInTheDocument();
    expect(getByText('Result')).toBeInTheDocument();
  });

  it('renders Tool for output-error state', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'a4',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc8',
          toolName: 'list_users',
          state: 'output-error',
          input: { query: 'fail' },
          errorText: 'Database connection lost',
        } as never,
      ],
    };
    const { getByText } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('Error')).toBeInTheDocument();

    await user.click(getByText('list_users'));
    expect(getByText('Database connection lost')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Unknown / unhandled parts
  // -------------------------------------------------------------------------

  it('returns null for unknown part types', () => {
    const msg: UIMessage = {
      id: 'u1',
      role: 'assistant',
      parts: [{ type: 'source-url' as never, sourceId: 'x', url: 'http://x' } as never],
    };
    const { container } = render(
      <ChatMessage message={msg} isLastMessage={false} isStreaming={false} {...handlers} />,
    );
    const contentDiv = container.querySelector('.min-w-0');
    expect(contentDiv?.children).toHaveLength(0);
  });
});
