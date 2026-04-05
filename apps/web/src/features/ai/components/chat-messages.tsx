import type { ChatStatus, UIMessage } from 'ai';
import { getToolName, isToolUIPart } from 'ai';
import { Bot, ChevronRight, Sparkles } from 'lucide-react';
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
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 ring-1 ring-violet-500/10">
        <Bot className="size-8 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-base text-foreground">{t('ai.title')}</h3>
        <p className="mt-1.5 max-w-sm text-muted-foreground text-sm leading-relaxed">
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
      <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/80 px-3.5 py-2 shadow-xs backdrop-blur-sm">
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
        <Sparkles className="size-3 text-violet-500/60" />
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
// Avatar
// ---------------------------------------------------------------------------

function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 ring-1 ring-violet-500/10">
      <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400" />
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
            ? 'max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground text-sm shadow-xs'
            : 'min-w-0 max-w-[85%] text-sm'
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
          }
          return null;
        })}
      </div>
    </div>
  );
}
