import { getToolName, isToolUIPart, type UIMessage } from 'ai';
import {
  Check,
  ChevronDown,
  CircleDashed,
  CircleSlash2,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Streamdown } from 'streamdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  message: UIMessage;
  initials?: string;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
}

const MessageResponse = memo(
  ({ children }: { children: string }) => (
    <Streamdown className="size-full text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {children}
    </Streamdown>
  ),
  (prev, next) => prev.children === next.children,
);
MessageResponse.displayName = 'MessageResponse';

// ---------------------------------------------------------------------------
// Tool approval UI
// ---------------------------------------------------------------------------

function ToolApprovalCard({
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
    <div className="my-1 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/15">
      <div className="flex items-center gap-2 border-amber-500/20 border-b bg-amber-100/40 px-3 py-1.5 dark:bg-amber-900/15">
        <ShieldAlert
          className="size-3.5 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <span className="font-medium text-[11px] text-amber-800 uppercase tracking-wide dark:text-amber-300">
          {t('ai.approvalRequired', { defaultValue: 'Approval required' })}
        </span>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{t('ai.tool', { defaultValue: 'Tool' })}</span>
          <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]">
            {toolName}
          </code>
        </div>
        <pre className="max-h-32 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(input, null, 2)}
        </pre>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => onApprove(approvalId)}>
            <Check className="size-3.5" aria-hidden="true" />
            {t('ai.approve', { defaultValue: 'Approve' })}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 px-2.5"
            onClick={() => onDeny(approvalId)}
          >
            <X className="size-3.5" aria-hidden="true" />
            {t('ai.deny', { defaultValue: 'Deny' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolApprovalBadge({
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
      className={cn(
        'my-0.5 inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px]',
        approved
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-destructive/25 bg-destructive/10 text-destructive',
      )}
    >
      {approved ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <X className="size-3" aria-hidden="true" />
      )}
      <code className="font-mono">{toolName}</code>
      <span>
        {approved
          ? t('ai.approved', { defaultValue: 'approved' })
          : t('ai.denied', { defaultValue: 'denied' })}
      </span>
      {reason && <span className="text-muted-foreground">— {reason}</span>}
    </div>
  );
}

function ToolCall({
  toolName,
  state,
  input,
  output,
  errorText,
}: {
  toolName: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input: unknown;
  output?: unknown;
  errorText?: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  let Icon = Wrench;
  let label = t('ai.toolCalling', { defaultValue: 'Calling' });
  let tone = 'text-muted-foreground';
  if (state === 'input-streaming' || state === 'input-available') {
    Icon = Loader2;
    tone = 'text-muted-foreground';
    label = t('ai.toolCalling', { defaultValue: 'Calling' });
  } else if (state === 'output-available') {
    Icon = CircleDashed;
    tone = 'text-emerald-600 dark:text-emerald-500';
    label = t('ai.toolCompleted', { defaultValue: 'Used' });
  } else if (state === 'output-error') {
    Icon = CircleSlash2;
    tone = 'text-destructive';
    label = t('ai.toolFailed', { defaultValue: 'Failed' });
  }

  const isRunning = state === 'input-streaming' || state === 'input-available';

  return (
    <div className="my-1 overflow-hidden rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-muted/50"
        aria-expanded={expanded}
      >
        <Icon
          className={cn('size-3.5 shrink-0', tone, isRunning && 'animate-spin')}
          aria-hidden="true"
        />
        <span className={cn('font-medium', tone)}>{label}</span>
        <code className="truncate rounded bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">
          {toolName}
        </code>
        <ChevronDown
          className={cn(
            'ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div className="space-y-2 border-t bg-background/40 px-2.5 py-2">
          <div>
            <p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
              {t('ai.toolInput', { defaultValue: 'Input' })}
            </p>
            <pre className="max-h-40 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {state === 'output-available' && (
            <div>
              <p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                {t('ai.toolOutput', { defaultValue: 'Output' })}
              </p>
              <pre className="max-h-48 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {state === 'output-error' && errorText && (
            <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive text-xs">
              {errorText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

export function ChatMessage({ message, initials, onApprove, onDeny }: Props) {
  const isUser = message.role === 'user';

  const textParts = message.parts.filter(p => p.type === 'text');
  const text = textParts.map(p => (p as { text: string }).text).join('');
  const hasAnyRenderablePart = message.parts.some(
    p => p.type === 'text' || isToolUIPart(p),
  );

  const avatar = (
    <Avatar className="size-7 shrink-0">
      {isUser ? (
        <AvatarFallback className="bg-primary/15 font-medium text-[11px] text-primary">
          {initials ?? '?'}
        </AvatarFallback>
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-amber-500/25 to-orange-500/10 text-amber-600 dark:text-amber-400">
          <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (isUser) {
    return (
      <div className="flex flex-row-reverse items-start gap-2">
        {avatar}
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-primary-foreground text-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-start gap-2">
      {avatar}
      <div className="flex min-w-0 max-w-[90%] flex-col gap-1.5">
        {!hasAnyRenderablePart && (
          <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3.5 py-2">
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1 text-muted-foreground text-sm"
            >
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </span>
          </div>
        )}

        {message.parts.map((part, idx) => {
          if (part.type === 'text') {
            if (!part.text || !part.text.trim()) return null;
            return (
              <div
                key={idx}
                className="rounded-2xl rounded-tl-sm bg-muted/60 px-3.5 py-2 text-foreground"
              >
                <MessageResponse>{part.text}</MessageResponse>
              </div>
            );
          }

          if (isToolUIPart(part)) {
            const name = getToolName(part);

            if (part.state === 'approval-requested' && onApprove && onDeny) {
              return (
                <ToolApprovalCard
                  key={idx}
                  toolName={name}
                  input={part.input}
                  approvalId={part.approval.id}
                  onApprove={onApprove}
                  onDeny={onDeny}
                />
              );
            }
            if (part.state === 'approval-responded' || part.state === 'output-denied') {
              return (
                <ToolApprovalBadge
                  key={idx}
                  toolName={name}
                  approved={part.approval.approved}
                  reason={part.approval.reason}
                />
              );
            }
            if (part.state === 'output-available' && part.approval) {
              return (
                <ToolApprovalBadge
                  key={idx}
                  toolName={name}
                  approved={part.approval.approved}
                  reason={part.approval.reason}
                />
              );
            }
            if (
              part.state === 'input-streaming' ||
              part.state === 'input-available' ||
              part.state === 'output-available' ||
              part.state === 'output-error'
            ) {
              return (
                <ToolCall
                  key={idx}
                  toolName={name}
                  state={part.state}
                  input={part.input}
                  output={part.state === 'output-available' ? part.output : undefined}
                  errorText={part.state === 'output-error' ? part.errorText : undefined}
                />
              );
            }
          }
          return null;
        })}
      </div>
    </div>
  );
}
