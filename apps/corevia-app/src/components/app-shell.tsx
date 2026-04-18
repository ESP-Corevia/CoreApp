import { Outlet, useNavigation } from 'react-router';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { Header } from '@/components/header';
import { AppSidebar } from '@/components/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AiChatProvider } from '@/features/ai/components/ai-chat-provider';
import { AiChatSheet } from '@/features/ai/components/ai-chat-sheet';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { state } = useNavigation();
  const isNavigating = state !== 'idle';

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-0.5 overflow-hidden"
      >
        {isNavigating && <div className="h-full w-full animate-progress-bar bg-primary" />}
      </div>

      <SidebarProvider className="h-svh bg-background text-foreground">
        <AiChatProvider>
          <AppSidebar />

          <SidebarInset className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
            <header
              className={cn(
                'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-border/70 border-b px-4 md:px-6',
                'bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70',
                'safe-top',
              )}
            >
              <Header />
            </header>

            <main
              aria-busy={isNavigating || undefined}
              className="min-h-0 flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8"
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
          <AiChatSheet />
        </AiChatProvider>
      </SidebarProvider>

      <BottomTabBar />
    </>
  );
}
