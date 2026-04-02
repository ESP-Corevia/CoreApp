import LandingRoute from '@/features/landing/routes/index';
import type { Route } from './+types/_index';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Corevia — Votre compagnon sante intelligent' },
    {
      name: 'description',
      content:
        'Corevia vous accompagne au quotidien : suivi de vos constantes, rappels de traitement, assistant IA, teleconsultation. Simple, securise, humain.',
    },
  ];
}

export default function Home() {
  return <LandingRoute />;
}
