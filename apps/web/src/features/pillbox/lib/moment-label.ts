import type { TFunction } from 'i18next';

export const INTAKE_MOMENT_KEYS = ['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM'] as const;

export type IntakeMomentKey = (typeof INTAKE_MOMENT_KEYS)[number];

export function getIntakeMomentLabel(t: TFunction, moment: string) {
  switch (moment) {
    case 'MORNING':
      return t('pillbox.moments.MORNING', 'Morning');
    case 'NOON':
      return t('pillbox.moments.NOON', 'Noon');
    case 'EVENING':
      return t('pillbox.moments.EVENING', 'Evening');
    case 'BEDTIME':
      return t('pillbox.moments.BEDTIME', 'Bedtime');
    case 'CUSTOM':
      return t('pillbox.moments.CUSTOM', 'Custom');
    default:
      return moment;
  }
}
