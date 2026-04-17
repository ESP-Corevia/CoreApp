import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IntakeActionsProps {
  status: string;
  onTake: () => void;
  onSkip: () => void;
}

export function IntakeActions({ status, onTake, onSkip }: IntakeActionsProps) {
  const { t } = useTranslation();

  if (status === 'TAKEN' || status === 'SKIPPED') {
    const isTaken = status === 'TAKEN';
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 font-medium text-[11px]',
          isTaken
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {isTaken ? t('patient.pillbox.taken') : t('patient.pillbox.skipped')}
      </span>
    );
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-9 min-w-[44px] border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
        onClick={onTake}
        aria-label={t('patient.pillbox.markTaken')}
        title={t('patient.pillbox.markTaken')}
      >
        <Check className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-9 min-w-[44px] text-muted-foreground"
        onClick={onSkip}
        aria-label={t('patient.pillbox.markSkipped')}
        title={t('patient.pillbox.markSkipped')}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
