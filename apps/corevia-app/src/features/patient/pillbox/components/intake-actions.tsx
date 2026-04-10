import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface IntakeActionsProps {
  status: string;
  onTake: () => void;
  onSkip: () => void;
}

export function IntakeActions({ status, onTake, onSkip }: IntakeActionsProps) {
  const { t } = useTranslation();

  if (status === 'TAKEN') {
    return <Badge variant="default">{t('patient.pillbox.taken')}</Badge>;
  }
  if (status === 'SKIPPED') {
    return <Badge variant="secondary">{t('patient.pillbox.skipped')}</Badge>;
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" onClick={onTake}>
        <Check className="mr-1 h-3 w-3" />
        {t('patient.pillbox.markTaken')}
      </Button>
      <Button size="sm" variant="outline" onClick={onSkip}>
        <X className="mr-1 h-3 w-3" />
        {t('patient.pillbox.markSkipped')}
      </Button>
    </div>
  );
}
