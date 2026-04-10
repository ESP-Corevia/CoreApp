import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';

import { AppShell } from '@/components/app-shell';
import { ErrorScreen } from '@/components/error-screen';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/providers/i18n';
import { QueryProvider } from '@/providers/query';
import { ThemeProvider } from '@/providers/theme';
import './index.css';

export function links() {
  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap',
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-title" content="Corevia" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const ROUTES_WITHOUT_LAYOUT = ['/login', '/403'];

export default function App() {
  const location = useLocation();
  const showShell = !ROUTES_WITHOUT_LAYOUT.includes(location.pathname);

  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          storageKey="corevia-app-theme"
        >
          {showShell ? <AppShell /> : <Outlet />}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </I18nProvider>
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let code = 'Oops!';
  let title = 'Error';
  let description: React.ReactNode = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    code = String(error.status);
    title = error.statusText || 'Error';
    description = error.data ?? description;
  } else if (import.meta.env.DEV && error instanceof Error) {
    code = 'Error';
    title = 'Something went wrong';
    description = error.message || description;
  }

  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="corevia-app-theme">
          <ErrorScreen code={code} title={title} description={description} />
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
