import type { LucideIcon } from 'lucide-react';
import { Activity, Bell, Brain, CalendarCheck, Heart, Video } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export const features: Feature[] = [
  {
    icon: Activity,
    title: 'Suivi des constantes',
    description:
      'Glycemie, tension arterielle, saturation en oxygene... Suivez vos indicateurs de sante en temps reel et visualisez vos tendances.',
    color: 'text-health-blue-500',
    bgColor: 'bg-health-blue-50',
  },
  {
    icon: Bell,
    title: 'Rappels intelligents',
    description:
      "Ne manquez plus jamais un traitement. Des rappels personnalises qui s'adaptent a votre rythme de vie et a vos habitudes.",
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
  {
    icon: Brain,
    title: 'Assistant IA',
    description:
      'Posez vos questions sur vos symptomes et recevez des pistes de comprehension claires. Une aide intelligente, pas un diagnostic.',
    color: 'text-health-blue-500',
    bgColor: 'bg-health-blue-50',
  },
  {
    icon: CalendarCheck,
    title: 'Prise de rendez-vous',
    description:
      'Trouvez un professionnel de sante et reservez votre consultation en quelques clics, selon vos disponibilites.',
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
  {
    icon: Video,
    title: 'Teleconsultation',
    description:
      'Consultez un medecin depuis chez vous, en toute securite. Video, audio ou chat — a vous de choisir.',
    color: 'text-health-blue-500',
    bgColor: 'bg-health-blue-50',
  },
  {
    icon: Heart,
    title: 'Conseils bien-etre',
    description:
      'Des recommandations personnalisees pour ameliorer votre quotidien : alimentation, activite physique, sommeil.',
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
];
