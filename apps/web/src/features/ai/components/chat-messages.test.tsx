import userEvent from '@testing-library/user-event';
import type { UIMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ChatEmptyState, ChatMessage, ThinkingIndicator } from './chat-messages';

// Streamdown renders children as-is in tests (no markdown transform)
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: string }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/shining-text', () => ({
  ShiningText: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('ChatEmptyState', () => {
  it('renders the empty state with an icon', () => {
    const { container } = render(<ChatEmptyState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ThinkingIndicator', () => {
  it('renders the thinking text with avatar', () => {
    const { getByText, container } = render(<ThinkingIndicator />);
    expect(getByText('ai.thinking')).toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
    expect(getByText('Hello there')).toBeInTheDocument();
  });

  it('renders assistant text via Streamdown', () => {
    const msg: UIMessage = {
      id: '2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hi! How can I help?' }],
    };
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
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
      <ChatMessage message={userMsg} status="ready" {...handlers} />,
    );
    const { container: ac } = render(
      <ChatMessage message={assistantMsg} status="ready" {...handlers} />,
    );

    expect(ac.querySelector('.rounded-full')).toBeInTheDocument();
    expect(uc.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Reasoning parts
  // -------------------------------------------------------------------------

  it('renders a collapsible ThinkingBlock for reasoning parts', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'r1',
      role: 'assistant',
      parts: [{ type: 'reasoning', text: 'Let me think about this...' }],
    };
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);

    // The thought-process button is visible
    const btn = getByText('ai.thoughtProcess');
    expect(btn).toBeInTheDocument();

    // Content is in the DOM
    const content = getByText('Let me think about this...');
    // Find the collapsible wrapper (transition container)
    const collapseDiv = content.closest('.transition-\\[max-height\\,opacity\\]');
    expect(collapseDiv).toHaveStyle({ maxHeight: '0px', opacity: '0' });

    // Click to expand
    await user.click(btn);
    expect(collapseDiv).toHaveStyle({ opacity: '1' });
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
    const { queryByText, getByText } = render(
      <ChatMessage message={msg} status="ready" {...handlers} />,
    );

    expect(queryByText('ai.thoughtProcess')).not.toBeInTheDocument();
    expect(getByText('Final answer')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Tool approval parts (via isToolUIPart)
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
    expect(getByText('ban_user')).toBeInTheDocument();
    expect(getByText('approved')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Auto-executed tool parts (ToolInvocationCard)
  // -------------------------------------------------------------------------

  it('renders ToolInvocationCard for input-streaming state', () => {
    const msg: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc5',
          toolName: 'list_users',
          state: 'input-streaming',
          input: { query: 'test' },
        } as never,
      ],
    };
    const { getByText } = render(<ChatMessage message={msg} status="streaming" {...handlers} />);
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('running…')).toBeInTheDocument();
  });

  it('renders ToolInvocationCard for input-available state', () => {
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
    const { getByText } = render(<ChatMessage message={msg} status="streaming" {...handlers} />);
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('running…')).toBeInTheDocument();
  });

  it('renders ToolInvocationCard for output-available state (no approval)', async () => {
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
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('done')).toBeInTheDocument();

    // Expand to see input/output
    await user.click(getByText('list_users'));
    expect(getByText('Input')).toBeInTheDocument();
    expect(getByText('Output')).toBeInTheDocument();
    expect(getByText(/"name": "Alice"/)).toBeInTheDocument();
  });

  it('renders ToolInvocationCard for output-error state', async () => {
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
    const { getByText, container } = render(
      <ChatMessage message={msg} status="ready" {...handlers} />,
    );
    expect(getByText('list_users')).toBeInTheDocument();
    expect(getByText('error')).toBeInTheDocument();

    // Error styling applied
    expect(container.querySelector('.border-red-500\\/30')).toBeInTheDocument();

    // Expand to see error text
    await user.click(getByText('list_users'));
    expect(getByText('Database connection lost')).toBeInTheDocument();
  });

  it('hides output section when output is null', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'a5',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc9',
          toolName: 'list_users',
          state: 'output-available',
          input: { query: 'test' },
          output: null,
        } as never,
      ],
    };
    const { getByText, queryByText } = render(
      <ChatMessage message={msg} status="ready" {...handlers} />,
    );

    await user.click(getByText('list_users'));
    expect(queryByText('Output')).not.toBeInTheDocument();
  });

  it('hides input section when input is null', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'a6',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc10',
          toolName: 'list_users',
          state: 'output-available',
          input: null,
          output: { ok: true },
        } as never,
      ],
    };
    const { getByText, queryByText } = render(
      <ChatMessage message={msg} status="ready" {...handlers} />,
    );

    await user.click(getByText('list_users'));
    expect(queryByText('Input')).not.toBeInTheDocument();
    expect(getByText('Output')).toBeInTheDocument();
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
    const { container } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
    const contentDiv = container.querySelector('.min-w-0');
    expect(contentDiv?.children).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // ThinkingBlock toggle
  // -------------------------------------------------------------------------

  it('toggles ThinkingBlock open and closed', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'toggle1',
      role: 'assistant',
      parts: [{ type: 'reasoning', text: 'Deep thought' }],
    };
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);

    const btn = getByText('ai.thoughtProcess');
    const content = getByText('Deep thought');
    const collapseDiv = content.closest('.transition-\\[max-height\\,opacity\\]');

    // Initially closed
    expect(collapseDiv).toHaveStyle({ opacity: '0' });

    // Open
    await user.click(btn);
    expect(collapseDiv).toHaveStyle({ opacity: '1' });

    // Close again
    await user.click(btn);
    expect(collapseDiv).toHaveStyle({ opacity: '0' });
  });

  // -------------------------------------------------------------------------
  // ToolInvocationCard toggle
  // -------------------------------------------------------------------------

  it('toggles ToolInvocationCard open and closed', async () => {
    const user = userEvent.setup();
    const msg: UIMessage = {
      id: 'toggle2',
      role: 'assistant',
      parts: [
        {
          type: 'tool-list_users' as 'dynamic-tool',
          toolCallId: 'tc11',
          toolName: 'list_users',
          state: 'output-available',
          input: { q: 'x' },
          output: { r: 1 },
        } as never,
      ],
    };
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);

    // Open
    await user.click(getByText('list_users'));
    const inputLabel = getByText('Input');
    expect(inputLabel).toBeInTheDocument();

    // Close
    await user.click(getByText('list_users'));
    const collapseDiv = inputLabel.closest('.transition-\\[max-height\\,opacity\\]');
    expect(collapseDiv).toHaveStyle({ maxHeight: '0px' });
  });
});
