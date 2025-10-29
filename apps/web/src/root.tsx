import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { useTheme } from 'next-themes';
import { Trans } from 'react-i18next';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useLocation,
} from 'react-router';

import { AppSidebar } from '@/components/appSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/userMenu';
import { I18nProvider } from '@/providers/i18n';
import './index.css';
import { ThemeProvider } from '@/providers/theme';
import { TrpcProvider, createRuntimeTrpcClient } from '@/providers/trpc';

import ClickSpark from './components/ClickSpark';
import Header from './components/header';
import { Skeleton } from './components/ui/skeleton';
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
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground h-screen min-h-screen font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const ROUTES_WITHOUT_LAYOUT = ['/login', '/register', '/forgot-password'];

function ThemedShell() {
  const { resolvedTheme } = useTheme();
  const { state } = useNavigation();
  const location = useLocation();
  const isNavigating = state !== 'idle';

  const shouldShowLayout = !ROUTES_WITHOUT_LAYOUT.includes(location.pathname);

  function LoadingBar() {
    return (
      <div className="fixed top-0 right-0 left-0 z-50 h-1 overflow-hidden">
        {isNavigating && <div className="bg-primary animate-progress-bar h-full" />}
      </div>
    );
  }

  if (!shouldShowLayout) {
    return (
      <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
        <LoadingBar />
        <ClickSpark
          sparkColor={resolvedTheme === 'dark' ? '#fff' : '#000000ff'}
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          <Outlet />
        </ClickSpark>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
      <LoadingBar />
      <SidebarProvider>
        <div className="bg-background flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            {/* Header */}
            <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
              <SidebarTrigger className="-ml-1" />
              <div className="bg-border mx-2 h-4 w-px" />
              <Header />
              <div className="flex-1" />
              <UserMenu />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              <ClickSpark
                sparkColor={resolvedTheme === 'dark' ? '#fff' : '#000000ff'}
                sparkSize={10}
                sparkRadius={15}
                sparkCount={8}
                duration={400}
              >
                <div className="container mx-auto max-w-screen-2xl space-y-4 p-4 md:p-6 lg:p-8">
                  {isNavigating && <PageLoadingSkeleton />}
                  <div style={isNavigating ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                    <Outlet />
                  </div>
                </div>
              </ClickSpark>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

function PageLoadingSkeleton() {
  return (
    <div className="mb-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const trpcClient = createRuntimeTrpcClient();

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
            <ThemedShell />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </I18nProvider>
      </TrpcProvider>
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-destructive text-6xl font-bold">{message}</h1>
          <p className="text-muted-foreground text-xl">{details}</p>
        </div>

        {stack && (
          <details className="text-left">
            <summary className="mb-2 cursor-pointer text-sm font-medium">Stack trace</summary>
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
              <code>{stack}</code>
            </pre>
          </details>
        )}

        <div className="flex justify-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2"
          >
            Go Back
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function HydrateFallback() {
  const trpcClient = createRuntimeTrpcClient();
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
            <div className="flex min-h-screen items-center justify-center">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
                <p className="text-muted-foreground">
                  <Trans i18nKey="HydrateFallback.loading">Loading…</Trans>
                </p>
              </div>
            </div>
          </ThemeProvider>
        </I18nProvider>
      </TrpcProvider>
    </QueryProvider>
  );
}
