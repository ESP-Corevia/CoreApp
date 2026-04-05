import { Check, ShieldAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ToolApprovalCard({
  toolName,
  input,
  approvalId,
  onApprove,
  onDeny,
}: {
  toolName: string;
  input: unknown;
  approvalId: string;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-50/40 shadow-xs dark:bg-amber-950/15">
      <div className="flex items-center gap-2 border-amber-500/15 border-b bg-amber-100/40 px-3 py-2 dark:bg-amber-900/15">
        <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold text-amber-800 text-xs dark:text-amber-300">
          {t('ai.approvalRequired', 'Approval required')}
        </span>
      </div>
      <div className="space-y-2.5 px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{t('ai.tool', 'Tool')}:</span>
          <code className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-xs">{toolName}</code>
        </div>
        <pre className="max-h-40 overflow-auto rounded-lg bg-muted/40 p-2.5 font-mono text-xs leading-relaxed">
          {JSON.stringify(input, null, 2)}
        </pre>
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onApprove(approvalId)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-medium text-white text-xs shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.97]"
          >
            <Check className="size-3.5" />
            {t('ai.approve', 'Approve')}
          </button>
          <button
            type="button"
            onClick={() => onDeny(approvalId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 font-medium text-xs shadow-xs transition-all hover:bg-muted active:scale-[0.97]"
          >
            <X className="size-3.5" />
            {t('ai.deny', 'Deny')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToolApprovalBadge({
  toolName,
  approved,
  reason,
}: {
  toolName: string;
  approved: boolean;
  reason?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`my-1 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
        approved
          ? 'border-emerald-500/25 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/15 dark:text-emerald-400'
          : 'border-red-500/25 bg-red-50/40 text-red-700 dark:bg-red-950/15 dark:text-red-400'
      }`}
    >
      {approved ? <Check className="size-3" /> : <X className="size-3" />}
      <code className="font-mono">{toolName}</code>
      <span>{approved ? t('ai.approved', 'approved') : t('ai.denied', 'denied')}</span>
      {reason && <span className="text-muted-foreground">— {reason}</span>}
    </div>
  );
}
