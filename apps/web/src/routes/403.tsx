import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { ErrorScreen } from '@/components/errorScreen';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

import type { Route } from './+types/_index';
// eslint-disable-next-line no-unused-vars
export function meta(_: Route.MetaArgs) {
  return [
    { title: '403 - Forbidden' },
    { name: 'description', content: 'You do not have permission to access this resource.' },
  ];
}

export default function ForbiddenRoute() {
  const { t } = useTranslation();
  const primaryTo = '/';
  const primaryLabel = t('forbidden.goBackHome', 'Go Back Home');
  const navigate = useNavigate();

  return (
    <ErrorScreen
      code="403"
      title="Forbidden"
      description={
        <Trans i18nKey="forbidden.description">
          Access to this resource is forbidden. You don&apos;t have the necessary permissions to
          view this page.
        </Trans>
      }
      primaryButton={
        <Button
          asChild
          onClick={async () => {
            await authClient.signOut().finally(async () => {
              await navigate('/');
            });
          }}
        >
          <Link to={primaryTo}>{primaryLabel}</Link>
        </Button>
      }
    />
  );
}
