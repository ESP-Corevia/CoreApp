import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ChatInput } from './chat-input';

function getSubmitBtn(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

describe('ChatInput', () => {
  it('renders the textarea and submit button', () => {
    const { getByRole, container } = render(<ChatInput onSend={vi.fn()} status="ready" />);

    expect(getByRole('textbox')).toBeInTheDocument();
    expect(getSubmitBtn(container)).toBeInTheDocument();
  });

  it('calls onSend with the text and clears the input on submit', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { getByRole, container } = render(<ChatInput onSend={onSend} status="ready" />);

    const input = getByRole('textbox');
    await user.type(input, 'Hello assistant');
    await user.click(getSubmitBtn(container));

    expect(onSend).toHaveBeenCalledWith('Hello assistant');
  });

  it('does not call onSend when input is empty', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { container } = render(<ChatInput onSend={onSend} status="ready" />);

    await user.click(getSubmitBtn(container));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows submit button with status indicator', () => {
    const { container } = render(<ChatInput onSend={vi.fn()} status="submitted" />);

    const submitBtn = getSubmitBtn(container);
    expect(submitBtn).toBeInTheDocument();
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { getByRole } = render(<ChatInput onSend={onSend} status="ready" />);

    await user.type(getByRole('textbox'), 'Test{Enter}');
    expect(onSend).toHaveBeenCalledWith('Test');
  });
});
