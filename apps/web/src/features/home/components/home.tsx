import { useQuery } from '@tanstack/react-query';

import { Trans, useTranslation } from 'react-i18next';

import Shuffle from '@/components/Shuffle';
import { useTrpc } from '@/providers/trpc';

export default function Home({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const trpc = useTrpc();
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const { t } = useTranslation();
  if (!session?.isAuthenticated) {
    return null;
  }
  return (
    <div className="container mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Shuffle
        text="Corevia"
        tag="h1"
        shuffleDirection="right"
        duration={1.1}
        animationMode="evenodd"
        shuffleTimes={1}
        ease="power3.out"
        loop
        loopDelay={0.6}
        stagger={0.03}
        threshold={0.1}
        respectReducedMotion
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 'clamp(2rem, 8vw, 6rem)',
          lineHeight: 1.2,
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
      />

      <div className="mt-8 grid w-full gap-6">
        <section className="rounded-lg border p-4 sm:p-6">
          <h2 className="mb-2 text-base font-medium sm:text-lg">
            <Trans i18nKey="_index.apiStatus">API Status</Trans>
          </h2>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-muted-foreground text-sm sm:text-base">
              {healthCheck.isLoading
                ? t('_index.checking', 'Checking...')
                : healthCheck.data
                  ? t('_index.connected', 'Connected')
                  : t('_index.disconnected', 'Disconnected')}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
