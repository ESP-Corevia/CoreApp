import coachAvatar from '@/assets/coach.png';
import dermatoAvatar from '@/assets/dermato.png';
import medicAvatar from '@/assets/medic.png';
import nutriAvatar from '@/assets/nutri.png';
import psychoAvatar from '@/assets/psycho.png';

export type HealthExpertProfileId =
  | 'general'
  | 'psychology'
  | 'fitness'
  | 'nutrition'
  | 'dermatology';

export type HealthExpertProfile = {
  id: HealthExpertProfileId;
  label: string;
  description: string;
  accent: string;
  avatar: string;
};

export const HEALTH_EXPERT_PROFILES: HealthExpertProfile[] = [
  {
    id: 'general',
    label: 'Médecin généraliste',
    description: 'Conseils médicaux globaux et premiers réflexes.',
    accent: 'from-blue-500/90 to-sky-400/60',
    avatar: medicAvatar,
  },
  {
    id: 'psychology',
    label: 'Psychologue',
    description: 'Gestion du stress, émotions et sommeil.',
    accent: 'from-rose-500/90 to-pink-400/60',
    avatar: psychoAvatar,
  },
  {
    id: 'fitness',
    label: 'Coach sportif',
    description: 'Entraînements progressifs et motivation.',
    accent: 'from-emerald-500/90 to-lime-400/60',
    avatar: coachAvatar,
  },
  {
    id: 'nutrition',
    label: 'Nutritionniste',
    description: 'Organisation des repas et équilibre alimentaire.',
    accent: 'from-amber-500/90 to-orange-400/60',
    avatar: nutriAvatar,
  },
  {
    id: 'dermatology',
    label: 'Dermatologue',
    description: 'Peau, protection solaire et routines de soin.',
    accent: 'from-purple-500/90 to-indigo-400/60',
    avatar: dermatoAvatar,
  },
];

export const QUICK_TAGS = [
  'Je suis stressé(e)',
  'Idée de repas équilibré',
  'Routine sport rapide',
  'Conseils pour la peau',
];

export const DEFAULT_DISCLAIMER =
  'Ce chatbot donne des conseils généraux. Il ne remplace pas une consultation médicale.';
