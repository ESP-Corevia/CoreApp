import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

export type AiMetricsPreset = '7d' | '30d' | '90d' | 'custom';
export type AiMetricsGroupBy = 'day' | 'week';
export type AiMetricsUserSort = 'costDesc' | 'requestsDesc' | 'tokensDesc' | 'conversationsDesc';

/** Query params used to fetch admin AI metrics from the backend mock API. */
interface UseGetAiMetricsParams {
  preset: AiMetricsPreset;
  groupBy: AiMetricsGroupBy;
  limit: number;
  userSort: AiMetricsUserSort;
  from?: Date;
  to?: Date;
  enabled?: boolean;
}

/**
 * Returns AI metrics data for the admin dashboard with React Query caching and filtering.
 *
 * @param params - Query filters used by the admin AI metrics page.
 */
export function useGetAiMetrics({
  preset,
  groupBy,
  limit,
  userSort,
  from,
  to,
  enabled = true,
}: UseGetAiMetricsParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.admin.getAiMetrics.queryOptions({
      preset,
      groupBy,
      limit,
      userSort,
      from,
      to,
    }),
    enabled,
  });
}
