import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ChatInput } from './chat-input';

function getSubmitBtn(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

describe('ChatInput', () => {
  it('renders the text input and submit button', () => {
    const { getByRole, container } = render(<ChatInput onSend={vi.fn()} disabled={false} />);

    expect(getByRole('textbox')).toBeInTheDocument();
    expect(getSubmitBtn(container)).toBeInTheDocument();
  });

  it('calls onSend with the text and clears the input on submit', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { getByRole, container } = render(<ChatInput onSend={onSend} disabled={false} />);

    const input = getByRole('textbox');
    await user.type(input, 'Hello assistant');
    await user.click(getSubmitBtn(container));

    expect(onSend).toHaveBeenCalledWith('Hello assistant');
    expect(input).toHaveValue('');
  });

  it('does not call onSend when input is empty', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { container } = render(<ChatInput onSend={onSend} disabled={false} />);

    await user.click(getSubmitBtn(container));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled is true', () => {
    const { getByRole, container } = render(<ChatInput onSend={vi.fn()} disabled={true} />);

    expect(getByRole('textbox')).toBeDisabled();
    expect(getSubmitBtn(container)).toBeDisabled();
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { getByRole } = render(<ChatInput onSend={onSend} disabled={false} />);

    await user.type(getByRole('textbox'), 'Test{Enter}');
    expect(onSend).toHaveBeenCalledWith('Test');
  });
});
