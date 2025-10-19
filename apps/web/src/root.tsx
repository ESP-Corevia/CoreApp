import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Trans, useTranslation } from 'react-i18next';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from 'react-router';

import Loader from '@/components/loader';
import { I18nProvider } from '@/providers/i18n';
import './index.css';
import { ThemeProvider } from '@/providers/theme';
import { TrpcProvider, createRuntimeTrpcClient } from '@/providers/trpc';

import Header from './components/header';
import { Toaster } from './components/ui/sonner';
import { QueryProvider, queryClient } from './providers/query';

import type { Route } from './+types/root';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const trpcClient = createRuntimeTrpcClient();
  const { state } = useNavigation();
  const isNavigating = state !== 'idle';
  return (
    <QueryProvider>
      <TrpcProvider client={trpcClient} queryClient={queryClient}>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            storageKey="corevia-ui-theme"
          >
            <div className="grid h-svh grid-rows-[auto_1fr]">
              <Header />
              <Loader open={isNavigating} aria-busy={isNavigating} />
              <Outlet />
            </div>
            <Toaster richColors />
          </ThemeProvider>
        </I18nProvider>
      </TrpcProvider>
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let message = t('ErrorBoundary.oops', 'Oops!');
  let details = t('ErrorBoundary.unexpected', 'An unexpected error occurred.');
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : t('ErrorBoundary.generic', 'Error');
    details =
      error.status === 404
        ? t('ErrorBoundary.notFound', 'The requested page could not be found.')
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
export function HydrateFallback() {
  return (
    <I18nProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        storageKey="corevia-ui-theme"
      >
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          <main className="container mx-auto p-4 pt-16">
            <Trans i18nKey="HydrateFallback.loading">Loading…</Trans>
          </main>
        </div>
      </ThemeProvider>
    </I18nProvider>
  );
}
