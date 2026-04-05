import { Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.6rem] border border-border/70 bg-background/95 p-2 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur"
    >
      <div className="flex items-center gap-2.5">
        <input
          id="ai-message"
          aria-label={t('ai.inputLabel')}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('ai.inputPlaceholder')}
          disabled={disabled}
          className="h-12 w-full flex-1 rounded-[1.15rem] border border-border/60 bg-muted/35 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="flex size-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-foreground text-background shadow-[0_20px_36px_-24px_rgba(15,23,42,0.85)] transition-all hover:translate-y-[-1px] hover:bg-foreground/90 active:scale-95 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
        >
          <Send className="size-4" />
        </button>
      </div>
    </form>
  );
}
