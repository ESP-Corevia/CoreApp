import { ArrowDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Conversation = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom>) => (
  <StickToBottom
    role="log"
    initial="smooth"
    resize="smooth"
    className={cn('relative flex-1 overflow-y-hidden', className)}
    {...props}
  />
);

export const ConversationContent = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom.Content>) => (
  <StickToBottom.Content className={cn('flex flex-col gap-5 p-4', className)} {...props} />
);

export const ConversationScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => scrollToBottom()}
      className="-translate-x-1/2 absolute bottom-3 left-1/2 size-8 rounded-full shadow-md"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="size-4" aria-hidden="true" />
    </Button>
  );
};
