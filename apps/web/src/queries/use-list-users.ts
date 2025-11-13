import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';

import { adminQueryKeys } from './query-keys';

interface UseListUsersParams {
  page: number;
  perPage: number;
  search: string;
  sortBy: string;
  sortDirection: string;
  enabled?: boolean;
  filterBy?: string;
}

export function useListUsers({
  page,
  perPage,
  search,
  sortBy,
  sortDirection,
  filterBy,
  enabled = true,
}: UseListUsersParams) {
  return useQuery({
    queryKey: adminQueryKeys.usersList({ page, perPage, search, sortBy, sortDirection }),
    queryFn: async () => {
      const res = await authClient.admin.listUsers({
        query: {
          limit: perPage,
          offset: (page - 1) * perPage,
          ...(search && {
            searchValue: search,
            searchOperator: 'contains',
          }),
          sortBy,
          filterField: filterBy,
          sortDirection: sortDirection as 'asc' | 'desc',
        },
      });

      return 'data' in res ? res.data : res;
    },
    enabled,
  });
}
export function useListSessions() {
  return useQuery({
    queryKey: ['list-sessions'],
    queryFn: async () => {
      const res = await authClient.listSessions();

      return 'data' in res ? res.data : res;
    },
    enabled: true,
  });
}
