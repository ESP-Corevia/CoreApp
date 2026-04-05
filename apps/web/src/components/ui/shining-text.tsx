import { motion } from 'motion/react';

export function ShiningText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={`bg-[length:200%_100%] bg-[linear-gradient(110deg,var(--muted-foreground),35%,var(--foreground),50%,var(--muted-foreground),75%,var(--muted-foreground))] bg-clip-text text-transparent ${className ?? ''}`}
      initial={{ backgroundPosition: '200% 0' }}
      animate={{ backgroundPosition: '-200% 0' }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration: 2,
        ease: 'linear',
      }}
    >
      {text}
    </motion.span>
  );
}
