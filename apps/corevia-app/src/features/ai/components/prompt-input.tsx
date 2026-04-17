import type { ChatStatus } from 'ai';
import { CornerDownLeft, Loader2, Square } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  status: ChatStatus;
  placeholder?: string;
}

export function PromptInput({ onSend, onStop, status, placeholder }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isGenerating = status === 'submitted' || status === 'streaming';

  const submit = () => {
    const text = value.trim();
    if (!text || isGenerating) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        'flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm transition-colors',
        'focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/20',
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ask anything…'}
        rows={1}
        className="max-h-44 min-h-[22px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Message"
      />
      <Button
        type={isGenerating && onStop ? 'button' : 'submit'}
        size="icon"
        onClick={e => {
          if (isGenerating && onStop) {
            e.preventDefault();
            onStop();
          }
        }}
        disabled={!isGenerating && value.trim().length === 0}
        aria-label={isGenerating ? 'Stop' : 'Send'}
        className="size-8 shrink-0 rounded-full"
      >
        {status === 'submitted' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : status === 'streaming' ? (
          <Square className="size-3.5" aria-hidden="true" />
        ) : (
          <CornerDownLeft className="size-4" aria-hidden="true" />
        )}
      </Button>
    </form>
  );
}
