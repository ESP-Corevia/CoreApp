import { useQuery } from '@tanstack/react-query';

import { Trans, useTranslation } from 'react-i18next';

import { useTrpc } from '@/providers/trpc';

const TITLE_TEXT = `
  ░██████                                            ░██           
 ░██   ░██                                                         
░██         ░███████  ░██░████  ░███████  ░██    ░██ ░██ ░██████   
░██        ░██    ░██ ░███     ░██    ░██ ░██    ░██ ░██      ░██  
░██        ░██    ░██ ░██      ░█████████  ░██  ░██  ░██ ░███████  
 ░██   ░██ ░██    ░██ ░██      ░██          ░██░██   ░██░██   ░██  
  ░██████   ░███████  ░██       ░███████     ░███    ░██ ░█████░██ 
`;

export default function Home() {
  const trpc = useTrpc();
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const { t } = useTranslation();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm" aria-label="Corevia">
        {TITLE_TEXT}
      </pre>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">
            <Trans i18nKey="_index.apiStatus">API Status</Trans>
          </h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-muted-foreground text-sm">
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
