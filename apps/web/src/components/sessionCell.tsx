import { Globe, Monitor, Smartphone, Trash2, Wifi } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SessionCellProps {
  session: {
    id: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  isCurrentSession?: boolean;
  onRevoke?: (token: string) => void;
  isRevoking?: boolean;
}

function parseUserAgent(userAgent: string | null | undefined): {
  browser: string;
  os: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
} {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'unknown' };
  }

  let browser = 'Unknown';
  let os = 'Unknown';
  let device: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
    device = 'mobile';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
    device = 'tablet';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'mobile';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  // Check for mobile device patterns
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    device = 'mobile';
  }

  return { browser, os, device };
}

function DeviceIcon({ device }: { device: 'desktop' | 'mobile' | 'tablet' | 'unknown' }) {
  switch (device) {
    case 'mobile':
      return <Smartphone className="h-5 w-5" />;
    case 'tablet':
    case 'desktop':
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

export function SessionCell({
  session,
  isCurrentSession = false,
  onRevoke,
  isRevoking = false,
}: SessionCellProps) {
  const { t } = useTranslation();
  const { browser, os, device } = parseUserAgent(session.userAgent);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">
          <DeviceIcon device={device} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">
              <Trans
                i18nKey="sessionCell.label"
                values={{ browser, os }}
                defaults="{{browser}} on {{os}}"
              />
            </p>
            {isCurrentSession && (
              <Badge variant="default">
                <Wifi className="h-4 w-4" />
                <Trans i18nKey="sessionCell.currentSession">Current</Trans>
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {session.ipAddress && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.ipAddress}
              </span>
            )}
            <span>
              <Trans i18nKey="sessionCell.createdAt">Created:</Trans>{' '}
              {formatDate(session.createdAt)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            <Trans
              i18nKey="sessionCell.expiresAt"
              values={{ date: formatDate(session.expiresAt) }}
              defaults="Expires: {{date}}"
            />
          </p>
        </div>
      </div>
      {!isCurrentSession && onRevoke && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRevoke(session.token)}
          disabled={isRevoking}
          title={t('sessionCell.revokeSession', 'Revoke session')}
        >
          <Trash2 className="text-destructive h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
