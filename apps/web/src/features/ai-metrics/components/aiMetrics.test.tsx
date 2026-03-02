import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import AiMetrics from './aiMetrics';

function buildMockMetrics() {
  return {
    isMock: true,
    generatedAt: new Date('2026-03-02T00:00:00.000Z'),
    period: {
      preset: '30d' as const,
      from: new Date('2026-02-01T00:00:00.000Z'),
      to: new Date('2026-03-02T00:00:00.000Z'),
      groupBy: 'day' as const,
    },
    summary: {
      totalCostUsd: 120.45,
      totalTokens: 304_500,
      totalRequests: 4_850,
      totalConversations: 1_210,
      activeUsers: 520,
      errorRate: 1.23,
    },
    trend: [
      {
        date: new Date('2026-02-28T00:00:00.000Z'),
        costUsd: 9.3,
        tokens: 20_100,
        requests: 340,
        conversations: 110,
        errorRate: 1.1,
      },
      {
        date: new Date('2026-03-01T00:00:00.000Z'),
        costUsd: 10.2,
        tokens: 21_220,
        requests: 360,
        conversations: 118,
        errorRate: 1.2,
      },
    ],
    byUser: [
      {
        userId: 'mobile-u-001',
        userName: 'Alex Martin',
        userEmail: 'alex.martin@corevia.app',
        costUsd: 20.2,
        tokens: 58_000,
        requests: 910,
        conversations: 290,
        errorRate: 1.05,
      },
    ],
    byFeature: [
      {
        feature: 'chat',
        costUsd: 52.2,
        tokens: 152_000,
        requests: 2_210,
        conversations: 820,
        errorRate: 0.95,
        activeUsers: 360,
      },
    ],
  };
}

describe('AiMetrics', () => {
  it('renders metrics cards and data sections', async () => {
    const handler = vi.fn().mockResolvedValue(buildMockMetrics());

    const { findByText } = render(<AiMetrics session={{ isAuthenticated: true, userId: '123' }} />, {
      trpcHandlers: {
        'admin.getAiMetrics': handler,
      },
    });

    expect(await findByText('AI Metrics')).toBeInTheDocument();
    expect(await findByText('By Mobile Feature')).toBeInTheDocument();
    expect(await findByText('By User')).toBeInTheDocument();
    expect(await findByText('Alex Martin')).toBeInTheDocument();
    expect(await findByText('chat')).toBeInTheDocument();

    expect(handler).toHaveBeenCalledWith({
      preset: '30d',
      groupBy: 'day',
      limit: 10,
      from: undefined,
      to: undefined,
    });
  });

  it('renders period filter controls', async () => {
    const user = userEvent.setup();
    const handler = vi.fn().mockResolvedValue(buildMockMetrics());
    const { getByRole, findByText } = render(
      <AiMetrics session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(await findByText('Group by')).toBeInTheDocument();
    expect(await findByText('Top users')).toBeInTheDocument();
    await user.click(getByRole('button', { name: 'Custom' }));
    expect(handler).toHaveBeenCalled();
  });

  it('returns null when session is not authenticated', () => {
    const handler = vi.fn();
    const { queryByText } = render(<AiMetrics session={null} />, {
      trpcHandlers: {
        'admin.getAiMetrics': handler,
      },
    });

    expect(queryByText('AI Metrics')).not.toBeInTheDocument();
    expect(handler).not.toHaveBeenCalled();
  });
});
