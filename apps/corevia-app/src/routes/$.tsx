import { useTranslation } from 'react-i18next';
import { ErrorScreen } from '@/components/error-screen';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      code="404"
      title={t('errors.notFound.title')}
      description={t('errors.notFound.description')}
    />
  );
}
