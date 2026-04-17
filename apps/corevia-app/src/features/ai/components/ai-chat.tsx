import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/providers/trpc';
import { useAiChat } from './ai-chat-provider';
import { Conversation, ConversationContent, ConversationScrollButton } from './conversation';
import { ChatMessage } from './message';
import { PromptInput } from './prompt-input';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AiChat() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const { data: user } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: !!session?.isAuthenticated,
  });

  const role = session?.role as 'patient' | 'doctor' | undefined;
  const initials = getInitials(user?.user.name as string | undefined);

  const { messages, sendMessage, status, stop, error, addToolApprovalResponse } = useAiChat();

  const handleApprove = (id: string) => {
    addToolApprovalResponse({ id, approved: true });
  };
  const handleDeny = (id: string) => {
    addToolApprovalResponse({ id, approved: false, reason: 'User denied the action' });
  };

  const isEmpty = messages.length === 0;

  const patientSuggestions = [
    t('ai.suggestions.patient.nextAppointment', {
      defaultValue: 'When is my next appointment?',
    }),
    t('ai.suggestions.patient.todayIntakes', {
      defaultValue: 'What medications do I have to take today?',
    }),
    t('ai.suggestions.patient.findDoctor', {
      defaultValue: 'Find a cardiologist in my city',
    }),
    t('ai.suggestions.patient.medicationInfo', {
      defaultValue: 'What is paracetamol used for?',
    }),
  ];

  const doctorSuggestions = [
    t('ai.suggestions.doctor.todaysPending', {
      defaultValue: "Which of today's appointments are still pending?",
    }),
    t('ai.suggestions.doctor.weekSchedule', {
      defaultValue: 'Show my appointments this week',
    }),
    t('ai.suggestions.doctor.patientAdherence', {
      defaultValue: "Summarize a patient's medication adherence over the last 14 days",
    }),
    t('ai.suggestions.doctor.lookupMedication', {
      defaultValue: 'Look up dosage and active substances for ibuprofen',
    }),
  ];

  const suggestions = role === 'doctor' ? doctorSuggestions : patientSuggestions;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400"
          >
            <Sparkles className="size-6" strokeWidth={2.25} />
          </span>
          <div className="space-y-1">
            <h2 className="font-semibold text-base">
              {t('ai.emptyTitle', { defaultValue: 'How can I help?' })}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('ai.emptyDescription', {
                defaultValue: 'Ask about your care — appointments, medications, documents.',
              })}
            </p>
          </div>
          <ul className="flex w-full flex-col gap-1.5">
            {suggestions.map(s => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => sendMessage({ text: s })}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                initials={initials}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div className="shrink-0 space-y-2 border-t bg-background p-3">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs"
          >
            {error.message}
          </div>
        )}
        <PromptInput
          onSend={text => sendMessage({ text })}
          onStop={stop}
          status={status}
          placeholder={t('ai.inputPlaceholder', { defaultValue: 'Ask Corevia AI…' })}
        />
        <p className="text-center text-[10px] text-muted-foreground">
          {t('ai.disclaimer', {
            defaultValue: 'AI may be inaccurate. Not a substitute for medical advice.',
          })}
        </p>
      </div>
    </div>
  );
}
