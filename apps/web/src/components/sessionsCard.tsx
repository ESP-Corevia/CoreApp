import { Monitor } from 'lucide-react';
import { Trans } from 'react-i18next';

import { SessionCell } from '@/components/sessionCell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useListSessions,
  useRevokeOtherSessions,
  useRevokeSession,
  useRevokeSessions,
} from '@/queries';

interface SessionsCardProps {
  currentSessionToken?: string;
}

export default function SessionsCard({ currentSessionToken }: SessionsCardProps) {
  const { data: sessions, isLoading } = useListSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();
  const revokeSessions = useRevokeSessions();

  const handleRevokeSession = (token: string) => {
    revokeSession.mutate(token);
  };

  const handleRevokeOtherSessions = () => {
    revokeOtherSessions.mutate();
  };

  const handleRevokeAllSessions = () => {
    revokeSessions.mutate();
  };

  const otherSessionsCount = sessions?.filter(s => s.token !== currentSessionToken).length ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <Trans i18nKey="sessionsCard.title">Active Sessions</Trans>
          </CardTitle>
          <CardDescription>
            <Trans i18nKey="sessionsCard.description">
              Manage your active sessions across devices
            </Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <Trans i18nKey="sessionsCard.title">Active Sessions</Trans>
        </CardTitle>
        <CardDescription>
          <Trans i18nKey="sessionsCard.description">
            Manage your active sessions across devices
          </Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions && sessions.length > 0 ? (
          <>
            <div className="space-y-3">
              {sessions.map(session => (
                <SessionCell
                  key={session.id}
                  session={session}
                  isCurrentSession={session.token === currentSessionToken}
                  onRevoke={handleRevokeSession}
                  isRevoking={revokeSession.isPending}
                />
              ))}
            </div>

            {otherSessionsCount > 0 && (
              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleRevokeOtherSessions}
                  disabled={revokeOtherSessions.isPending}
                  className="flex-1"
                >
                  {revokeOtherSessions.isPending ? (
                    <Trans i18nKey="sessionsCard.revokingOther">Revoking...</Trans>
                  ) : (
                    <Trans
                      i18nKey="sessionsCard.revokeOther"
                      values={{ count: otherSessionsCount }}
                      defaults="Revoke Other Sessions ({{count}})"
                    />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevokeAllSessions}
                  disabled={revokeSessions.isPending}
                  className="flex-1"
                >
                  {revokeSessions.isPending ? (
                    <Trans i18nKey="sessionsCard.revokingAll">Revoking all...</Trans>
                  ) : (
                    <Trans i18nKey="sessionsCard.revokeAll">Revoke All Sessions</Trans>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            <Trans i18nKey="sessionsCard.noSessions">No active sessions found</Trans>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
