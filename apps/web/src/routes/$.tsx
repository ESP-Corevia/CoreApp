import { Trans, useTranslation } from 'react-i18next';

import { ErrorScreen } from '@/components/errorScreen';

import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: '404 - Not Found' },
    { name: 'description', content: 'The requested page could not be found.' },
  ];
}
export default function CatchAll() {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      code="404"
      title={t('notFound.title', 'Page Not Found')}
      description={
        <Trans i18nKey="notFound.description">The requested page could not be found.</Trans>
      }
    />
  );
}
