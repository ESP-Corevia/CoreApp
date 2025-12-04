import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';
import type { ExtendedColumnFilter, User, ExtendedColumnSort } from '@/types/data-table';

interface UseListUsersParams {
  page: number;
  perPage: number;
  search: string;
  sorting: ExtendedColumnSort<User>;
  enabled?: boolean;
  filters?: ExtendedColumnFilter<User>[];
  searchInFields?: string[];
}

export function useListUsers({
  page,
  perPage,
  search,
  searchInFields,
  sorting,
  filters,
  enabled = true,
}: UseListUsersParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.admin.listUsers.queryOptions({
      page,
      perPage,
      search,
      searchInFields,
      sorting: JSON.stringify(sorting),
      filters: filters ? JSON.stringify(filters) : undefined,
    }),
    enabled,
  });
}
