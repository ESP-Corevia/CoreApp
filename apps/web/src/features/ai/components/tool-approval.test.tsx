import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { ToolApprovalBadge, ToolApprovalCard } from './tool-approval';

describe('ToolApprovalCard', () => {
  const defaultProps = {
    toolName: 'ban_user',
    input: { userId: 'user-1', banReason: 'abuse' },
    approvalId: 'approval-1',
    onApprove: vi.fn(),
    onDeny: vi.fn(),
  };

  it('renders tool name and input JSON', () => {
    const { getByText } = render(<ToolApprovalCard {...defaultProps} />);
    expect(getByText('ban_user')).toBeInTheDocument();
    expect(getByText(/"userId": "user-1"/)).toBeInTheDocument();
  });

  it('calls onApprove when the first button is clicked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { getAllByRole } = render(<ToolApprovalCard {...defaultProps} onApprove={onApprove} />);

    await user.click(getAllByRole('button')[0]);
    expect(onApprove).toHaveBeenCalledWith('approval-1');
  });

  it('calls onDeny when the second button is clicked', async () => {
    const user = userEvent.setup();
    const onDeny = vi.fn();
    const { getAllByRole } = render(<ToolApprovalCard {...defaultProps} onDeny={onDeny} />);

    await user.click(getAllByRole('button')[1]);
    expect(onDeny).toHaveBeenCalledWith('approval-1');
  });
});

describe('ToolApprovalBadge', () => {
  it('renders the tool name', () => {
    const { getByText } = render(<ToolApprovalBadge toolName="ban_user" approved={true} />);
    expect(getByText('ban_user')).toBeInTheDocument();
  });

  it('displays the reason when provided', () => {
    const { getByText } = render(
      <ToolApprovalBadge toolName="ban_user" approved={false} reason="Not authorized" />,
    );
    expect(getByText('— Not authorized')).toBeInTheDocument();
  });

  it('does not show reason when not provided', () => {
    const { queryByText } = render(<ToolApprovalBadge toolName="ban_user" approved={true} />);
    expect(queryByText(/—/)).not.toBeInTheDocument();
  });
});
