import type { UIMessage } from 'ai';
import { getToolName, isToolUIPart } from 'ai';
import { Bot, Check, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function ChatEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent">
        <Bot className="size-7 text-amber-600/70 dark:text-amber-400/70" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground">{t('ai.title')}</h3>
        <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
          {t('ai.emptyChat')}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-transparent">
      <Sparkles className="size-3 text-amber-600 dark:text-amber-300" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool approval components
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
    <div className="my-2 overflow-hidden rounded-xl border border-amber-500/25 bg-amber-50/30 dark:bg-amber-950/10">
      <div className="flex items-center gap-2 border-amber-500/15 border-b bg-amber-100/30 px-3 py-2 dark:bg-amber-900/10">
        <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
        <span className="font-medium text-amber-800 text-xs dark:text-amber-300">
          {t('ai.approvalRequired', 'Approval required')}
        </span>
      </div>
      <div className="space-y-2.5 px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{t('ai.tool', 'Tool')}:</span>
          <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-xs">{toolName}</code>
        </div>
        <pre className="max-h-36 overflow-auto rounded-lg bg-muted/30 p-2.5 font-mono text-xs leading-relaxed">
          {JSON.stringify(input, null, 2)}
        </pre>
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={() => onApprove(approvalId)}>
            <Check className="size-3.5" />
            {t('ai.approve', 'Approve')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDeny(approvalId)}>
            <X className="size-3.5" />
            {t('ai.deny', 'Deny')}
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
      className={`my-1 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
        approved
          ? 'border-emerald-500/20 bg-emerald-50/30 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400'
          : 'border-red-500/20 bg-red-50/30 text-red-700 dark:bg-red-950/10 dark:text-red-400'
      }`}
    >
      {approved ? <Check className="size-3" /> : <X className="size-3" />}
      <code className="font-mono">{toolName}</code>
      <span>{approved ? t('ai.approved', 'approved') : t('ai.denied', 'denied')}</span>
      {reason && <span className="text-muted-foreground">— {reason}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

export function ChatMessage({
  message,
  isLastMessage,
  isStreaming,
  onApprove,
  onDeny,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  // Consolidate reasoning parts for a cleaner display
  const reasoningParts = message.parts.filter(p => p.type === 'reasoning' && p.text);
  const reasoningText = reasoningParts.map(p => (p as { text: string }).text).join('\n\n');
  const hasReasoning = reasoningParts.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming = isLastMessage && isStreaming && lastPart?.type === 'reasoning';

  return (
    <Message from={message.role}>
      <div className={`flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}>
        {!isUser && <AssistantAvatar />}
        <MessageContent
          className={
            isUser
              ? 'rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-background text-sm shadow-sm'
              : undefined
          }
        >
          {/* Consolidated reasoning block */}
          {!isUser && hasReasoning && (
            <Reasoning isStreaming={isReasoningStreaming}>
              <ReasoningTrigger />
              <ReasoningContent>{reasoningText}</ReasoningContent>
            </Reasoning>
          )}

          {/* Render non-reasoning parts */}
          {message.parts.map((part, idx) => {
            // Skip reasoning parts (already consolidated above)
            if (part.type === 'reasoning') return null;

            if (part.type === 'text') {
              return isUser ? (
                <p key={idx} className="whitespace-pre-wrap">
                  {part.text}
                </p>
              ) : (
                <MessageResponse key={idx} isAnimating={isLastMessage && isStreaming}>
                  {part.text}
                </MessageResponse>
              );
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

              // Auto-executed tool states
              if (
                part.state === 'input-streaming' ||
                part.state === 'input-available' ||
                part.state === 'output-available' ||
                part.state === 'output-error'
              ) {
                const toolHeaderProps =
                  part.type === 'dynamic-tool'
                    ? { type: part.type as 'dynamic-tool', state: part.state, toolName: name }
                    : { type: part.type as `tool-${string}`, state: part.state };

                return (
                  <Tool key={idx}>
                    <ToolHeader {...toolHeaderProps} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      {(part.state === 'output-available' || part.state === 'output-error') && (
                        <ToolOutput
                          output={part.state === 'output-available' ? part.output : undefined}
                          errorText={part.state === 'output-error' ? part.errorText : undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }
            }
            return null;
          })}
        </MessageContent>
      </div>
    </Message>
  );
}
