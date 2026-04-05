import type { UIMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ChatEmptyState, ChatMessage } from './chat-messages';

describe('ChatEmptyState', () => {
  it('renders the empty state with an icon', () => {
    const { container } = render(<ChatEmptyState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ChatMessage', () => {
  const handlers = { onApprove: vi.fn(), onDeny: vi.fn() };

  it('renders user text', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello there' }],
    };
    const { getByText } = render(<ChatMessage message={msg} status="ready" {...handlers} />);
    expect(getByText('Hello there')).toBeInTheDocument();
  });

  it('renders assistant text', () => {
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

    // Assistant has the sparkles avatar (a rounded-full div)
    expect(ac.querySelector('.rounded-full')).toBeInTheDocument();
    // User does not
    expect(uc.querySelector('.rounded-full')).not.toBeInTheDocument();
  });
});
