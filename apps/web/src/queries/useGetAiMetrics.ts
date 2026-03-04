import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

export type AiMetricsPreset = '7d' | '30d' | '90d' | 'custom';
export type AiMetricsGroupBy = 'day' | 'week';

/** Query params used to fetch admin AI metrics from the backend mock API. */
interface UseGetAiMetricsParams {
  preset: AiMetricsPreset;
  groupBy: AiMetricsGroupBy;
  limit: number;
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
      from,
      to,
    }),
    enabled,
  });
}
