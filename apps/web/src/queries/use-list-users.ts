import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';
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

// export function useListUsers({
//   page,
//   perPage,
//   search,
//   searchInFields,
//   sortBy,
//   sortDirection,
//   filters,
//   enabled = true,
// }: UseListUsersParams) {
//   return useQuery({
//     queryKey: adminQueryKeys.usersList({ page, perPage, search, sortBy, sortDirection }),
//     queryFn: async () => {
//       const res = await authClient.admin.listUsers({
//         query: {
//           limit: perPage,
//           offset: (page - 1) * perPage,
//           ...(search && {
//             searchValue: search,
//             searchOperator: 'contains',
//           }),
//           sortBy,
//           // filterField: filters,
//           sortDirection: sortDirection as 'asc' | 'desc',
//         },
//       });

//       return 'data' in res ? res.data : res;
//     },
//     enabled,
//   });
// }
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
