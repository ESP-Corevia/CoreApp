export const adminQueryKeys = {
  all: ['admin'] as const,
  users: () => [...adminQueryKeys.all, 'users'] as const,
  usersList: (params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortDirection: string;
  }) => [...adminQueryKeys.users(), params] as const,
};
