import { useTranslation } from 'react-i18next';
import { ErrorScreen } from '@/components/error-screen';

export default function Forbidden() {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      code="403"
      title={t('errors.forbidden.title')}
      description={t('errors.forbidden.description')}
    />
  );
}
