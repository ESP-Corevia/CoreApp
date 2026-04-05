import type { ChatStatus, UIMessage } from 'ai';
import { getToolName, isToolUIPart } from 'ai';
import { Bot, Check, ChevronRight, Loader2, Sparkles, Terminal, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Streamdown } from 'streamdown';

import { ShiningText } from '@/components/ui/shining-text';

import { ToolApprovalBadge, ToolApprovalCard } from './tool-approval';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function ChatEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 rounded-3xl border border-border border-dashed px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <Bot className="size-7 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-xl">{t('ai.title')}</h3>
        <p className="mt-2 max-w-md text-muted-foreground text-sm leading-relaxed">
          {t('ai.emptyChat')}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thinking indicator
// ---------------------------------------------------------------------------

export function ThinkingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar />
      <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/90 px-3.5 py-2 shadow-xs backdrop-blur-sm">
        <ShiningText text={t('ai.thinking')} className="text-sm" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thinking block — collapsible
// ---------------------------------------------------------------------------

function ThinkingBlock({ content }: { content: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border/30 bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/30"
      >
        <Sparkles className="size-3 text-amber-500/70" />
        <span className="font-medium">{t('ai.thoughtProcess')}</span>
        <span
          className="ml-auto transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <ChevronRight className="size-3" />
        </span>
      </button>
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 500}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          className="whitespace-pre-wrap border-border/20 border-t px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed"
        >
          {content}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool invocation — collapsible card for auto-executed tools
// ---------------------------------------------------------------------------

function ToolInvocationCard({
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
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isRunning = state === 'input-streaming' || state === 'input-available';
  const isError = state === 'output-error';

  return (
    <div
      className={`my-2 overflow-hidden rounded-lg border ${
        isError
          ? 'border-red-500/30 bg-red-50/20 dark:bg-red-950/10'
          : 'border-border/30 bg-muted/10'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/30"
      >
        {isRunning ? (
          <Loader2 className="size-3 animate-spin text-amber-500" />
        ) : isError ? (
          <X className="size-3 text-red-500" />
        ) : (
          <Check className="size-3 text-emerald-500" />
        )}
        <Terminal className="size-3 text-muted-foreground" />
        <code className="font-mono text-muted-foreground">{toolName}</code>
        <span className="text-muted-foreground/60">
          {isRunning
            ? t('ai.toolRunning', 'running…')
            : isError
              ? t('ai.toolError', 'error')
              : t('ai.toolDone', 'done')}
        </span>
        <span
          className="ml-auto transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <ChevronRight className="size-3" />
        </span>
      </button>
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 500}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="space-y-2 border-border/20 border-t px-3 py-2">
          {input != null && (
            <div>
              <span className="font-medium text-muted-foreground text-xs">
                {t('ai.toolInput', 'Input')}
              </span>
              <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-background/60 p-2 font-mono text-xs leading-relaxed">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {state === 'output-available' && output != null && (
            <div>
              <span className="font-medium text-muted-foreground text-xs">
                {t('ai.toolOutput', 'Output')}
              </span>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-background/60 p-2 font-mono text-xs leading-relaxed">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {isError && errorText && (
            <div className="text-red-600 text-xs dark:text-red-400">{errorText}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent shadow-[0_10px_24px_-18px_rgba(217,119,6,0.95)]">
      <Sparkles className="size-3.5 text-amber-600 dark:text-amber-300" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

export function ChatMessage({
  message,
  status,
  onApprove,
  onDeny,
}: {
  message: UIMessage;
  status: ChatStatus;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}>
      {!isUser && <AssistantAvatar />}
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-[1.4rem] rounded-br-md bg-foreground px-4 py-3 text-background text-sm shadow-[0_18px_35px_-24px_rgba(15,23,42,0.65)]'
            : 'min-w-0 max-w-[88%] text-sm'
        }
      >
        {message.parts.map((part, idx) => {
          if (part.type === 'text') {
            return isUser ? (
              <p key={idx} className="whitespace-pre-wrap">
                {part.text}
              </p>
            ) : (
              <Streamdown
                key={idx}
                className="max-w-none text-sm"
                isAnimating={status === 'streaming'}
              >
                {part.text}
              </Streamdown>
            );
          }
          if (part.type === 'reasoning' && part.text) {
            return <ThinkingBlock key={idx} content={part.text} />;
          }
          if (isToolUIPart(part)) {
            const name = getToolName(part);

            // Approval flow states
            if (part.state === 'approval-requested') {
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

            // Auto-executed tool states (no approval)
            if (
              part.state === 'input-streaming' ||
              part.state === 'input-available' ||
              part.state === 'output-available' ||
              part.state === 'output-error'
            ) {
              return (
                <ToolInvocationCard
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
