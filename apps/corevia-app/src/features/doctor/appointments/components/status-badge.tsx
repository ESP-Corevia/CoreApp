import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  PENDING: 'secondary',
  CANCELLED: 'destructive',
  COMPLETED: 'outline',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const variant = statusVariantMap[status] ?? 'outline';

  return <Badge variant={variant}>{t(`patient.appointments.status.${status}`, status)}</Badge>;
}
