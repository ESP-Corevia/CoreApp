import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import AiMetrics, { parseDateInput } from './aiMetrics';

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
        userId: 'mobile-u-002',
        userName: 'Lea Dubois',
        userEmail: 'lea.dubois@corevia.app',
        costUsd: 12.8,
        tokens: 42_000,
        requests: 610,
        conversations: 220,
        errorRate: 0.82,
      },
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
        feature: 'summary',
        costUsd: 18.4,
        tokens: 56_000,
        requests: 950,
        conversations: 350,
        errorRate: 1.12,
        activeUsers: 210,
      },
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
  it('parses ISO-like date input for custom filters', () => {
    expect(parseDateInput('')).toBeUndefined();
    expect(parseDateInput('not-a-date')).toBeUndefined();
    expect(parseDateInput('2026-02-20')).toEqual(new Date('2026-02-20T00:00:00.000Z'));
  });

  it('renders metrics cards and data sections', async () => {
    const handler = vi.fn().mockResolvedValue(buildMockMetrics());

    const { findByText } = render(
      <AiMetrics session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(await findByText('AI Metrics')).toBeInTheDocument();
    expect(await findByText('By Mobile Feature')).toBeInTheDocument();
    expect(await findByText('By User')).toBeInTheDocument();
    expect(await findByText('Alex Martin')).toBeInTheDocument();
    expect(await findByText('Lea Dubois')).toBeInTheDocument();
    expect(await findByText('chat')).toBeInTheDocument();
    expect(await findByText('summary')).toBeInTheDocument();

    expect(handler).toHaveBeenCalledWith({
      preset: '30d',
      groupBy: 'day',
      limit: 10,
      userSort: 'costDesc',
      from: undefined,
      to: undefined,
    });

    const alexName = await findByText('Alex Martin');
    const leaName = await findByText('Lea Dubois');
    expect(
      alexName.compareDocumentPosition(leaName) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const chatFeature = await findByText('chat');
    const summaryFeature = await findByText('summary');
    expect(
      chatFeature.compareDocumentPosition(summaryFeature) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('switches to the custom preset', async () => {
    const user = userEvent.setup();
    const handler = vi.fn().mockResolvedValue(buildMockMetrics());
    const { getByRole, findAllByText, findByText } = render(
      <AiMetrics session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(await findByText('Group by')).toBeInTheDocument();
    expect(await findByText('Top users')).toBeInTheDocument();
    expect((await findAllByText('Sort by')).length).toBe(2);

    await user.click(getByRole('button', { name: 'Custom' }));

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
    });

    expect(
      await findByText('Choose a valid start and end date to load custom metrics.'),
    ).toBeInTheDocument();
  });

  it('renders empty states for trend, user and feature sections', async () => {
    const handler = vi.fn().mockResolvedValue({
      ...buildMockMetrics(),
      trend: [],
      byUser: [],
      byFeature: [],
    });
    const { findByText } = render(
      <AiMetrics session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(await findByText('No trend data for this period.')).toBeInTheDocument();
    expect(await findByText('No feature usage data for this period.')).toBeInTheDocument();
    expect(await findByText('No user usage data for this period.')).toBeInTheDocument();
  });

  it('renders error state when metrics query fails', async () => {
    const user = userEvent.setup();
    const handler = vi.fn().mockRejectedValue(new Error('network unavailable'));
    const { findByText, findByRole } = render(
      <AiMetrics session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(await findByText('Unable to load AI metrics')).toBeInTheDocument();
    expect(await findByText('Try again. Reason: network unavailable')).toBeInTheDocument();
    const retryButton = await findByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
    expect(handler).toHaveBeenCalledTimes(1);

    await user.click(retryButton);

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(2);
    });
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
