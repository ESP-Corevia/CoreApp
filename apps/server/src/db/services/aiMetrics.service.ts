import { z } from 'zod';

export const AiMetricsPresetSchema = z.enum(['7d', '30d', '90d', 'custom']);
export const AiMetricsGroupBySchema = z.enum(['day', 'week']);
export const AiMetricsUserSortSchema = z.enum([
  'costDesc',
  'requestsDesc',
  'tokensDesc',
  'conversationsDesc',
]);
const MAX_MOCK_USERS = 100;

export const AiMetricsInputSchema = z.object({
  preset: AiMetricsPresetSchema.default('30d'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: AiMetricsGroupBySchema.default('day'),
  limit: z.number().int().positive().max(MAX_MOCK_USERS).default(10),
  userSort: AiMetricsUserSortSchema.default('costDesc'),
});

export const AiMetricsSummarySchema = z.object({
  totalCostUsd: z.number(),
  totalTokens: z.number().int(),
  totalRequests: z.number().int(),
  totalConversations: z.number().int(),
  activeUsers: z.number().int(),
  errorRate: z.number(),
});

export const AiMetricsTrendPointSchema = z.object({
  date: z.date(),
  costUsd: z.number(),
  tokens: z.number().int(),
  requests: z.number().int(),
  conversations: z.number().int(),
  errorRate: z.number(),
});

export const AiMetricsByUserSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.email(),
  costUsd: z.number(),
  tokens: z.number().int(),
  requests: z.number().int(),
  conversations: z.number().int(),
  errorRate: z.number(),
});

export const AiMetricsByFeatureSchema = z.object({
  feature: z.string(),
  costUsd: z.number(),
  tokens: z.number().int(),
  requests: z.number().int(),
  conversations: z.number().int(),
  errorRate: z.number(),
  activeUsers: z.number().int(),
});

export const AiMetricsOutputSchema = z.object({
  isMock: z.literal(true),
  generatedAt: z.date(),
  period: z.object({
    preset: AiMetricsPresetSchema,
    from: z.date(),
    to: z.date(),
    groupBy: AiMetricsGroupBySchema,
  }),
  summary: AiMetricsSummarySchema,
  trend: z.array(AiMetricsTrendPointSchema),
  byUser: z.array(AiMetricsByUserSchema),
  byFeature: z.array(AiMetricsByFeatureSchema),
});

type AiMetricsInput = z.infer<typeof AiMetricsInputSchema>;
type AiMetricsOutput = z.infer<typeof AiMetricsOutputSchema>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rounds a number to 2 decimal places. */
function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Normalizes a date to UTC midnight to keep generated periods stable. */
function startOfUtcDay(input: Date) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

/** Builds a deterministic numeric seed from a set of period-related parts. */
function buildSeed(parts: Array<number | string>) {
  let hash = 2166136261;
  const raw = parts.join('|');
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Returns a deterministic pseudo-random generator based on the provided seed. */
function createSeededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distributes an integer total across buckets while preserving the exact sum. */
function distributeInt(total: number, weights: number[]) {
  const sumWeights = weights.reduce((acc, w) => acc + w, 0);
  const raw = weights.map(w => (total * w) / sumWeights);
  const floorValues = raw.map(v => Math.floor(v));
  const remaining = total - floorValues.reduce((acc, v) => acc + v, 0);
  const order = raw
    .map((v, idx) => ({ idx, frac: v - floorValues[idx] }))
    .sort((a, b) => b.frac - a.frac)
    .map(x => x.idx);

  for (let i = 0; i < remaining; i += 1) {
    floorValues[order[i % order.length]] += 1;
  }
  return floorValues;
}

/** Distributes a float total across buckets while preserving a 2-decimal total. */
function distributeFloat(total: number, weights: number[]) {
  const sumWeights = weights.reduce((acc, w) => acc + w, 0);
  const values = weights.map(w => round2((total * w) / sumWeights));
  const current = round2(values.reduce((acc, v) => acc + v, 0));
  const delta = round2(total - current);
  values[values.length - 1] = round2(values[values.length - 1] + delta);
  return values;
}

/** Maps preset labels to day counts used for default period resolution. */
function getPresetDays(preset: z.infer<typeof AiMetricsPresetSchema>) {
  if (preset === '7d') return 7;
  if (preset === '90d') return 90;
  return 30;
}

/** Resolves and normalizes the effective period for the requested filters. */
function resolvePeriod(params: AiMetricsInput) {
  if (params.preset === 'custom' && params.from && params.to) {
    const from = startOfUtcDay(params.from <= params.to ? params.from : params.to);
    const to = startOfUtcDay(params.to >= params.from ? params.to : params.from);
    return { from, to };
  }

  const days = getPresetDays(params.preset);
  const to = startOfUtcDay(new Date());
  const from = new Date(to.getTime() - (days - 1) * DAY_MS);
  return { from, to };
}

/** Builds deterministic trend points (day/week) for the selected period. */
function buildTrend({
  from,
  to,
  groupBy,
  seed,
}: {
  from: Date;
  to: Date;
  groupBy: z.infer<typeof AiMetricsGroupBySchema>;
  seed: number;
}) {
  const stepDays = groupBy === 'week' ? 7 : 1;
  const totalDays = Math.max(1, Math.floor((to.getTime() - from.getTime()) / DAY_MS) + 1);
  const points = Math.max(1, Math.ceil(totalDays / stepDays));
  const random = createSeededRandom(seed);
  const baseRequests = 740 + Math.floor(random() * 220);
  const requestStep = 28 + Math.floor(random() * 31);
  const baseTokensPerRequest = 480 + Math.floor(random() * 160);
  const costPerKToken = 0.0022 + random() * 0.0006;
  const baseErrorRate = 0.85 + random() * 0.45;

  const trend = Array.from({ length: points }, (_, index) => {
    const currentDate = new Date(from.getTime() + index * stepDays * DAY_MS);
    const requestsJitter = Math.floor((random() - 0.5) * 90);
    const requests = Math.max(
      120,
      baseRequests + index * requestStep + (index % 4) * 21 + requestsJitter,
    );
    const tokensPerRequest = baseTokensPerRequest + (index % 5) * 26 + Math.floor(random() * 20);
    const tokens = requests * tokensPerRequest;
    const costUsd = round2((tokens / 1000) * costPerKToken);
    const conversations = Math.round(requests * 0.38);
    const errorRate = round2(baseErrorRate + (index % 5) * 0.14);

    return {
      date: currentDate,
      requests,
      tokens,
      costUsd,
      conversations,
      errorRate,
    };
  });

  return trend;
}

/** Sorts user aggregates according to the requested dashboard sort. */
function sortUsers(
  users: z.infer<typeof AiMetricsByUserSchema>[],
  userSort: z.infer<typeof AiMetricsUserSortSchema>,
) {
  const rows = [...users];
  const comparator = (() => {
    if (userSort === 'requestsDesc')
      return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.requests - a.requests;
    if (userSort === 'tokensDesc')
      return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.tokens - a.tokens;
    if (userSort === 'conversationsDesc') {
      return (a: (typeof rows)[number], b: (typeof rows)[number]) =>
        b.conversations - a.conversations;
    }
    return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.costUsd - a.costUsd;
  })();

  rows.sort(comparator);
  return rows;
}

/** Builds deterministic per-user aggregates before any user-facing sorting or limiting is applied. */
function buildUsers({
  totalUsers,
  totalRequests,
  totalTokens,
  totalCostUsd,
  totalConversations,
  seed,
}: {
  totalUsers: number;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  totalConversations: number;
  seed: number;
}) {
  const templates = [
    { userId: 'mobile-u-001', userName: 'Alex Martin', userEmail: 'alex.martin@corevia.app' },
    { userId: 'mobile-u-002', userName: 'Sarah Kim', userEmail: 'sarah.kim@corevia.app' },
    { userId: 'mobile-u-003', userName: 'Noah Brown', userEmail: 'noah.brown@corevia.app' },
    { userId: 'mobile-u-004', userName: 'Emma Rossi', userEmail: 'emma.rossi@corevia.app' },
    { userId: 'mobile-u-005', userName: 'Liam Garcia', userEmail: 'liam.garcia@corevia.app' },
    { userId: 'mobile-u-006', userName: 'Maya Lopez', userEmail: 'maya.lopez@corevia.app' },
    { userId: 'mobile-u-007', userName: 'Jules Bernard', userEmail: 'jules.bernard@corevia.app' },
    { userId: 'mobile-u-008', userName: 'Chloe Nguyen', userEmail: 'chloe.nguyen@corevia.app' },
    { userId: 'mobile-u-009', userName: 'Ethan Scott', userEmail: 'ethan.scott@corevia.app' },
    { userId: 'mobile-u-010', userName: 'Lea Moreau', userEmail: 'lea.moreau@corevia.app' },
  ];

  const selected = Array.from({ length: totalUsers }, (_, index) => {
    const existing = templates[index];
    if (existing) return existing;
    const userIndex = index + 1;
    const suffix = String(userIndex).padStart(3, '0');
    return {
      userId: `mobile-u-${suffix}`,
      userName: `Mobile User ${userIndex}`,
      userEmail: `mobile.user.${userIndex}@corevia.app`,
    };
  });
  const random = createSeededRandom(seed ^ 0xa11ce);
  const requestWeights = selected.map(
    (_, index) => 1 + random() * 6 + (selected.length - index) * 0.09,
  );
  const tokenWeights = selected.map((_, index) => 1 + random() * 5 + ((index % 7) + 1) * 0.45);
  const conversationWeights = selected.map(
    (_, index) => 1 + random() * 4 + ((selected.length - index + 3) % 9) * 0.4,
  );
  const costWeights = selected.map(
    (_, index) =>
      requestWeights[index] * 0.45 +
      tokenWeights[index] * 0.4 +
      conversationWeights[index] * 0.15 +
      random(),
  );

  const requestsByUser = distributeInt(totalRequests, requestWeights);
  const tokensByUser = distributeInt(totalTokens, tokenWeights);
  const conversationsByUser = distributeInt(totalConversations, conversationWeights);
  const costByUser = distributeFloat(totalCostUsd, costWeights);

  return selected.map((user, index) => ({
    ...user,
    requests: requestsByUser[index],
    tokens: tokensByUser[index],
    costUsd: costByUser[index],
    conversations: conversationsByUser[index],
    errorRate: round2(0.9 + index * 0.18),
  }));
}

/** Builds deterministic per-feature aggregates for the selected period. */
function buildFeatures({
  totalRequests,
  totalTokens,
  totalCostUsd,
  totalConversations,
}: {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  totalConversations: number;
}) {
  const features = ['chat', 'summary', 'recommendation', 'ocr', 'voice'];
  const weights = [36, 24, 18, 12, 10];

  const requestsByFeature = distributeInt(totalRequests, weights);
  const tokensByFeature = distributeInt(totalTokens, weights);
  const conversationsByFeature = distributeInt(totalConversations, weights);
  const costByFeature = distributeFloat(totalCostUsd, weights);
  const activeUsersByFeature = distributeInt(520, [34, 26, 20, 11, 9]);

  return features.map((feature, index) => ({
    feature,
    requests: requestsByFeature[index],
    tokens: tokensByFeature[index],
    costUsd: costByFeature[index],
    conversations: conversationsByFeature[index],
    errorRate: round2(1 + index * 0.28),
    activeUsers: activeUsersByFeature[index],
  }));
}

/** AI metrics service returning deterministic mock usage data for admin analytics pages. */
export const createAiMetricsService = () => ({
  /** Returns mock AI usage metrics with stable output for identical filter inputs. */
  getMetrics: ({
    params,
  }: {
    params: AiMetricsInput;
    requesterUserId: string;
  }): Promise<AiMetricsOutput> => {
    const { from, to } = resolvePeriod(params);
    const seed = buildSeed([from.toISOString(), to.toISOString(), params.groupBy, params.preset]);
    const trend = buildTrend({ from, to, groupBy: params.groupBy, seed });

    const summary = {
      totalCostUsd: round2(trend.reduce((acc, point) => acc + point.costUsd, 0)),
      totalTokens: trend.reduce((acc, point) => acc + point.tokens, 0),
      totalRequests: trend.reduce((acc, point) => acc + point.requests, 0),
      totalConversations: trend.reduce((acc, point) => acc + point.conversations, 0),
      activeUsers: 520,
      errorRate: round2(trend.reduce((acc, point) => acc + point.errorRate, 0) / trend.length),
    };
    const users = buildUsers({
      totalUsers: MAX_MOCK_USERS,
      totalRequests: summary.totalRequests,
      totalTokens: summary.totalTokens,
      totalCostUsd: summary.totalCostUsd,
      totalConversations: summary.totalConversations,
      seed,
    });

    return Promise.resolve({
      isMock: true,
      generatedAt: to,
      period: {
        preset: params.preset,
        from,
        to,
        groupBy: params.groupBy,
      },
      summary,
      trend,
      byUser: sortUsers(users, params.userSort).slice(0, params.limit),
      byFeature: buildFeatures({
        totalRequests: summary.totalRequests,
        totalTokens: summary.totalTokens,
        totalCostUsd: summary.totalCostUsd,
        totalConversations: summary.totalConversations,
      }),
    });
  },
});
