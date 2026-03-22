import { cn } from '@/lib/utils';

const EMOJI_MAP: Record<string, string> = {
  'tablet-capsule': '💊',
  'syrup-liquid': '🧴',
  injectable: '💉',
  drops: '🧪',
  unknown: '💊',
};

const LABEL_MAP: Record<string, string> = {
  'tablet-capsule': 'Comprimé / Gélule',
  'syrup-liquid': 'Sirop / Liquide oral',
  injectable: 'Injectable',
  drops: 'Gouttes / Collyre',
  unknown: 'Médicament',
};

interface MedicationFormIconProps {
  iconKey?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withBackground?: boolean;
  title?: string;
}

const SIZE_CLASSES = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
} as const;

const BG_SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

export default function MedicationFormIcon({
  iconKey,
  className,
  size = 'md',
  withBackground = false,
  title,
}: MedicationFormIconProps) {
  const key = iconKey ?? 'unknown';
  const emoji = EMOJI_MAP[key] ?? EMOJI_MAP['unknown']!;
  const label = title ?? LABEL_MAP[key] ?? LABEL_MAP['unknown']!;

  if (withBackground) {
    return (
      <div
        className={cn(
          'bg-muted flex shrink-0 items-center justify-center rounded-lg',
          BG_SIZE_CLASSES[size],
          className
        )}
        role="img"
        aria-label={label}
        title={label}
      >
        <span className={SIZE_CLASSES[size]}>{emoji}</span>
      </div>
    );
  }

  return (
    <span
      className={cn('shrink-0 leading-none', SIZE_CLASSES[size], className)}
      role="img"
      aria-label={label}
      title={label}
    >
      {emoji}
    </span>
  );
}
