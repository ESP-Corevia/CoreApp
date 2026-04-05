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
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={t('ai.inputPlaceholder')}
        disabled={disabled}
        className="flex-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:shadow-none"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
