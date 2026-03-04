import { describe, expect, it } from 'vitest';

import { AiMetricsOutputSchema, createAiMetricsService } from './aiMetrics.service';

describe('aiMetrics.service', () => {
  const service = createAiMetricsService();

  it('returns valid mock metrics with default values', async () => {
    const result = await service.getMetrics({
      params: {
        preset: '30d',
        from: undefined,
        to: undefined,
        groupBy: 'day',
        limit: 10,
      },
      requesterUserId: 'admin-user',
    });

    expect(() => AiMetricsOutputSchema.parse(result)).not.toThrow();
    expect(result.isMock).toBe(true);
    expect(result.period.preset).toBe('30d');
    expect(result.period.groupBy).toBe('day');
    expect(result.trend.length).toBeGreaterThan(0);
    expect(result.byUser).toHaveLength(10);
    expect(result.byFeature).toHaveLength(5);
    expect(result.summary.totalRequests).toBeGreaterThan(0);
    expect(result.summary.totalTokens).toBeGreaterThan(0);
    expect(result.summary.totalCostUsd).toBeGreaterThan(0);
  });

  it('supports custom period and week grouping', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T00:00:00.000Z');

    const result = await service.getMetrics({
      params: {
        preset: 'custom',
        from,
        to,
        groupBy: 'week',
        limit: 5,
      },
      requesterUserId: 'admin-user',
    });

    expect(result.period.preset).toBe('custom');
    expect(result.period.from.toISOString()).toBe(from.toISOString());
    expect(result.period.to.toISOString()).toBe(to.toISOString());
    expect(result.period.groupBy).toBe('week');
    expect(result.byUser).toHaveLength(5);
    expect(result.trend.length).toBeLessThanOrEqual(5);
  });

  it('normalizes custom period when dates are inverted', async () => {
    const from = new Date('2026-02-10T00:00:00.000Z');
    const to = new Date('2026-02-01T00:00:00.000Z');

    const result = await service.getMetrics({
      params: {
        preset: 'custom',
        from,
        to,
        groupBy: 'day',
        limit: 3,
      },
      requesterUserId: 'admin-user',
    });

    expect(result.period.from.getTime()).toBeLessThanOrEqual(result.period.to.getTime());
    expect(result.period.from.toISOString()).toBe(to.toISOString());
    expect(result.period.to.toISOString()).toBe(from.toISOString());
  });

  it('supports 7d and 90d presets and keeps aggregates consistent', async () => {
    const result7d = await service.getMetrics({
      params: {
        preset: '7d',
        from: undefined,
        to: undefined,
        groupBy: 'day',
        limit: 6,
      },
      requesterUserId: 'admin-user',
    });

    const result90d = await service.getMetrics({
      params: {
        preset: '90d',
        from: undefined,
        to: undefined,
        groupBy: 'week',
        limit: 6,
      },
      requesterUserId: 'admin-user',
    });

    expect(result7d.period.preset).toBe('7d');
    expect(result7d.trend).toHaveLength(7);
    expect(result90d.period.preset).toBe('90d');
    expect(result90d.trend.length).toBeGreaterThanOrEqual(12);
    expect(result90d.trend.length).toBeLessThanOrEqual(13);

    const sumRequestsByUser = result90d.byUser.reduce((acc, item) => acc + item.requests, 0);
    const sumTokensByUser = result90d.byUser.reduce((acc, item) => acc + item.tokens, 0);
    const sumConversationsByUser = result90d.byUser.reduce(
      (acc, item) => acc + item.conversations,
      0,
    );
    const sumCostByUser = result90d.byUser.reduce((acc, item) => acc + item.costUsd, 0);

    expect(sumRequestsByUser).toBe(result90d.summary.totalRequests);
    expect(sumTokensByUser).toBe(result90d.summary.totalTokens);
    expect(sumConversationsByUser).toBe(result90d.summary.totalConversations);
    expect(Math.abs(sumCostByUser - result90d.summary.totalCostUsd)).toBeLessThanOrEqual(0.01);
  });

  it('returns deterministic mock data for the same period filters', async () => {
    const params = {
      preset: 'custom' as const,
      from: new Date('2026-02-01T00:00:00.000Z'),
      to: new Date('2026-02-28T00:00:00.000Z'),
      groupBy: 'day' as const,
      limit: 8,
    };

    const first = await service.getMetrics({
      params,
      requesterUserId: 'admin-user',
    });
    const second = await service.getMetrics({
      params,
      requesterUserId: 'admin-user',
    });

    expect(second).toEqual(first);
  });

  it('falls back to preset period when custom dates are missing', async () => {
    const result = await service.getMetrics({
      params: {
        preset: 'custom',
        from: undefined,
        to: undefined,
        groupBy: 'day',
        limit: 2,
      },
      requesterUserId: 'admin-user',
    });

    expect(result.period.preset).toBe('custom');
    expect(result.trend.length).toBe(30);
    expect(result.byUser).toHaveLength(2);
  });
});
