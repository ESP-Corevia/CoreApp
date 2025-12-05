import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTRPCClient, type TRPCClient, type TRPCLink } from '@trpc/client';
// import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { observable } from '@trpc/server/observable';

import { render as rtlRender } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/providers/theme';
import { TrpcProvider } from '@/providers/trpc';

import { createTestI18n } from './i18n';

import type { AppRouter } from '@server/routers';

type Options = {
  router?: React.ComponentProps<typeof MemoryRouter>;
  lang?: 'en' | 'fr';
  queryClient?: QueryClient;
  // eslint-disable-next-line no-unused-vars
  trpcHandlers?: Record<string, (input: unknown) => unknown | Promise<unknown>>;
};

export function render(ui: React.ReactElement, opts: Options = {}) {
  const {
    router,
    lang = 'en',
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    trpcHandlers = {},
    ...rtlOpts
  } = opts;

  const i18n = createTestI18n(lang);

  // Build a test link that routes by path into handlers
  const testLink: TRPCLink<AppRouter> = () => {
    return ({ op }) =>
      observable(observer => {
        const fn = trpcHandlers[op.path];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        Promise.resolve(fn ? fn(op.input) : { _mock: true, path: op.path })
          .then(data => {
            observer.next({ result: { type: 'data', data } });
            observer.complete();
          })
          .catch(err => observer.error(err));
      });
  };

  const trpcClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({ links: [testLink] });

  function AllProviders({ children }: { children: React.ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="test-theme">
          <QueryClientProvider client={queryClient}>
            <TrpcProvider client={trpcClient} queryClient={queryClient}>
              <SidebarProvider>
                <MemoryRouter
                  initialEntries={router?.initialEntries}
                  initialIndex={router?.initialIndex}
                >
                  <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
                </MemoryRouter>
              </SidebarProvider>
            </TrpcProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </I18nextProvider>
    );
  }

  return rtlRender(ui, { wrapper: AllProviders, ...rtlOpts });
}
