import { Outlet, useNavigation } from 'react-router';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { Header } from '@/components/header';
import { AppSidebar } from '@/components/sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

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

export function AppShell() {
  const { state } = useNavigation();
  const isNavigating = state !== 'idle';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="fixed top-0 right-0 left-0 z-50 h-1 overflow-hidden">
        {isNavigating && <div className="h-full animate-progress-bar bg-primary" />}
      </div>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <SidebarInset className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 hidden h-14 shrink-0 items-center gap-2 border-border border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex">
              <SidebarTrigger className="-ml-1" />
              <div className="mx-2 h-4 w-px bg-border" />
              <Header />
            </header>

            <main className="flex-1 overflow-auto pb-20 md:pb-0">
              <div className="container mx-auto max-w-screen-xl space-y-4 p-4 md:p-6 lg:p-8">
                {isNavigating && <PageLoadingSkeleton />}
                <div style={isNavigating ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                  <Outlet />
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>

      <BottomTabBar />
    </div>
  );
}
