import { Outlet, useNavigation } from 'react-router';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { Header } from '@/components/header';
import { AppSidebar } from '@/components/sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { state } = useNavigation();
  const isNavigating = state !== 'idle';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-0.5 overflow-hidden"
      >
        {isNavigating && <div className="h-full w-full animate-progress-bar bg-primary" />}
      </div>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <SidebarInset className="flex flex-1 flex-col">
            <header
              className={cn(
                'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-border border-b px-3 md:px-4',
                'bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70',
                'safe-top',
              )}
            >
              <SidebarTrigger className="-ml-1 hidden md:inline-flex" aria-label="Toggle sidebar" />
              <div className="mx-1 hidden h-4 w-px bg-border md:block" />
              <Header />
            </header>

            <main
              aria-busy={isNavigating || undefined}
              className="flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8"
            >
              <div
                className={cn(
                  'container mx-auto max-w-screen-xl space-y-4 p-4 md:p-6 lg:p-8',
                  'transition-opacity duration-150',
                  isNavigating && 'pointer-events-none opacity-60',
                )}
              >
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>

      <BottomTabBar />
    </div>
  );
}
