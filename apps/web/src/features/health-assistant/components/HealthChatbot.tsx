import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  DEFAULT_DISCLAIMER,
  HEALTH_EXPERT_PROFILES,
  QUICK_TAGS,
  type HealthExpertProfileId,
} from '../constants';
import {
  sendHealthAssistantMessage,
  type HealthChatMessagePayload,
  type HealthChatbotResponse,
} from '../api';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  profileLabel?: string;
  suggestions?: string[];
  createdAt: number;
};

export type ProfileSelection = 'auto' | HealthExpertProfileId;

function createMessage(
  role: ChatRole,
  content: string,
  extras?: Pick<ChatMessage, 'profileLabel' | 'suggestions'>
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: Date.now(),
    ...extras,
  };
}

interface HealthChatbotProps {
  selectedProfile?: ProfileSelection;
  onProfileChange?: (value: ProfileSelection) => void;
  showProfileSelector?: boolean;
}

export default function HealthChatbot({
  selectedProfile,
  onProfileChange,
  showProfileSelector = true,
}: HealthChatbotProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [internalProfile, setInternalProfile] = useState<ProfileSelection>('auto');
  const [disclaimer, setDisclaimer] = useState(DEFAULT_DISCLAIMER);
  const listRef = useRef<HTMLDivElement>(null);

  const effectiveProfile = selectedProfile ?? internalProfile;

  const mutation = useMutation<HealthChatbotResponse, Error, HealthChatMessagePayload>({
    mutationFn: sendHealthAssistantMessage,
    onSuccess(data) {
      setMessages(prev => [
        ...prev,
        createMessage('assistant', data.content, {
          profileLabel: data.profileLabel,
          suggestions: data.suggestions,
        }),
      ]);
      setDisclaimer(data.disclaimer);
    },
    onError(error: Error) {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedProfileLabel = useMemo(() => {
    if (effectiveProfile === 'auto') {
      return 'Auto (Assistant intelligent)';
    }
    const match = HEALTH_EXPERT_PROFILES.find(p => p.id === effectiveProfile);
    return match?.label ?? 'Sélection manuelle';
  }, [effectiveProfile]);

  const handleProfileSelection = (next: ProfileSelection) => {
    onProfileChange?.(next);
    if (selectedProfile === undefined) {
      setInternalProfile(next);
    }
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    setMessages(prev => [...prev, createMessage('user', trimmed)]);
    setInputValue('');
    mutation.mutate({
      message: trimmed,
      profile: effectiveProfile === 'auto' ? undefined : effectiveProfile,
    });
  };

  const isLoading = mutation.isPending;

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Assistant santé
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-2xl font-bold">Chatbot multi-experts</h2>
          <p className="text-sm text-muted-foreground">{selectedProfileLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {showProfileSelector && (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Sélection du profil
              </label>
              <Select
                value={effectiveProfile}
                onValueChange={value => handleProfileSelection(value as ProfileSelection)}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Profil" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="auto">Auto (assistant)</SelectItem>
                  {HEALTH_EXPERT_PROFILES.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {HEALTH_EXPERT_PROFILES.map(profile => (
                <div
                  key={profile.id}
                  className={cn(
                    'rounded-xl border p-3 text-sm shadow-sm transition',
                    effectiveProfile === profile.id
                      ? `border-transparent bg-gradient-to-r text-white shadow-md ${profile.accent}`
                      : 'bg-background/60 text-foreground'
                  )}
                >
                  <p className="font-medium">{profile.label}</p>
                  <p
                    className={cn(
                      'text-muted-foreground',
                      effectiveProfile === profile.id && 'text-white/90'
                    )}
                  >
                    {profile.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map(tag => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => setInputValue(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>

        <div
          ref={listRef}
          className="bg-background/60 relative flex max-h-[360px] flex-col gap-4 overflow-y-auto rounded-2xl border p-4"
        >
          {messages.length === 0 && (
            <div className="text-muted-foreground text-sm">
              Pose ta question en langage naturel, le profil adapté sera sélectionné automatiquement.
            </div>
          )}
          {messages.map(message => (
            <div
              key={message.id}
              className={cn('flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-2xl border px-3 py-2 text-sm shadow-sm sm:max-w-[70%]',
                  message.role === 'user'
                    ? 'border-primary/30 bg-primary/10 text-primary-foreground dark:text-white'
                    : 'bg-card border-border'
                )}
              >
                {message.profileLabel && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {message.profileLabel}
                  </p>
                )}
                <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                {message.role === 'assistant' && message.suggestions && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.suggestions.map(suggestion => (
                      <Badge
                        key={suggestion}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setInputValue(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rédaction de la réponse…
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Textarea
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            placeholder="Décris ta question santé..."
            className="min-h-[100px] flex-1 resize-none"
          />
          <Button
            type="submit"
            className="min-h-[48px] shrink-0 rounded-full px-6"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assistant
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">{disclaimer}</p>
      </div>
    </section>
  );
}
