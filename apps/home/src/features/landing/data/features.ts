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
      'Glycémie, tension artérielle, saturation en oxygène... Suivez vos indicateurs de santé en temps réel et visualisez vos tendances.',
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
  {
    icon: Bell,
    title: 'Rappels intelligents',
    description:
      'Ne manquez plus jamais un traitement. Des rappels personnalisés qui s\'adaptent à votre rythme de vie et à vos habitudes.',
    color: 'text-secondary',
    bgColor: 'bg-health-emerald-50',
  },
  {
    icon: Brain,
    title: 'Assistant IA',
    description:
      'Posez vos questions sur vos symptômes et recevez des pistes de compréhension claires. Une aide intelligente, pas un diagnostic.',
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
  {
    icon: CalendarCheck,
    title: 'Prise de rendez-vous',
    description:
      'Trouvez un professionnel de santé et réservez votre consultation en quelques clics, selon vos disponibilités.',
    color: 'text-secondary',
    bgColor: 'bg-health-emerald-50',
  },
  {
    icon: Video,
    title: 'Téléconsultation',
    description:
      'Consultez un médecin depuis chez vous, en toute sécurité. Vidéo, audio ou chat — à vous de choisir.',
    color: 'text-primary',
    bgColor: 'bg-health-green-50',
  },
  {
    icon: Heart,
    title: 'Conseils bien-être',
    description:
      'Des recommandations personnalisées pour améliorer votre quotidien : alimentation, activité physique, sommeil.',
    color: 'text-secondary',
    bgColor: 'bg-health-emerald-50',
  },
];
