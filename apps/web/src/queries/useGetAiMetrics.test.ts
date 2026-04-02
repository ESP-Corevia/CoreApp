import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useGetAiMetrics } from './useGetAiMetrics';

describe('useGetAiMetrics', () => {
  it('fetches AI metrics with expected params', async () => {
    const mockMetrics = {
      isMock: true,
      generatedAt: new Date('2026-03-02T00:00:00.000Z'),
      period: {
        preset: '30d',
        from: new Date('2026-02-01T00:00:00.000Z'),
        to: new Date('2026-03-02T00:00:00.000Z'),
        groupBy: 'day',
      },
      summary: {
        totalCostUsd: 10,
        totalTokens: 1000,
        totalRequests: 100,
        totalConversations: 45,
        activeUsers: 20,
        errorRate: 1.5,
      },
      trend: [],
      byUser: [],
      byFeature: [],
    };
    const handler = vi.fn().mockResolvedValue(mockMetrics);
    const from = new Date('2026-02-01T00:00:00.000Z');
    const to = new Date('2026-03-02T00:00:00.000Z');

    const { result } = renderHook(
      () =>
        useGetAiMetrics({
          preset: '30d',
          groupBy: 'day',
          limit: 10,
          from,
          to,
        }),
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(handler).toHaveBeenCalledWith({
      preset: '30d',
      groupBy: 'day',
      limit: 10,
      from,
      to,
    });
    expect(result.current.data).toEqual(mockMetrics);
  });

  it('does not run query when enabled is false', () => {
    const handler = vi.fn();

    const { result } = renderHook(
      () =>
        useGetAiMetrics({
          preset: '30d',
          groupBy: 'day',
          limit: 10,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'admin.getAiMetrics': handler,
        },
      },
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
