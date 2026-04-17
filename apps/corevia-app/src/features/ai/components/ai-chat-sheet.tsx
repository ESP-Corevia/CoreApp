import { Eraser, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AiChat } from './ai-chat';
import { useAiChat } from './ai-chat-provider';

export function AiChatSheet() {
  const { t } = useTranslation();
  const { messages, clear, status, open, setOpen } = useAiChat();
  const canClear = messages.length > 0 && status !== 'streaming' && status !== 'submitted';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md md:max-w-lg">
        <SheetHeader className="shrink-0 gap-1 border-b px-4 py-3 pr-12">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400"
            >
              <Sparkles className="size-4" strokeWidth={2.25} />
            </span>
            {t('ai.title', { defaultValue: 'Corevia Assistant' })}
          </SheetTitle>
          <div className="flex items-center justify-between gap-2">
            <SheetDescription className="text-xs">
              {t('ai.chatDescription', {
                defaultValue: 'Your personal care assistant.',
              })}
            </SheetDescription>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                disabled={!canClear}
                aria-label={t('ai.clear', { defaultValue: 'Clear conversation' })}
                className="h-7 shrink-0 gap-1.5 px-2 text-muted-foreground text-xs"
              >
                <Eraser className="size-3.5" aria-hidden="true" />
                {t('ai.clear', { defaultValue: 'Clear' })}
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <AiChat />
        </div>
      </SheetContent>
    </Sheet>
  );
}
