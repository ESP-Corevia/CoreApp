import { ArrowRight, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FadeContent from '@/components/FadeContent';
import CountUp from '@/components/CountUp';

const problems = [
  {
    pain: 'Suivi manuel et oublis fréquents',
    painDetail: 'Carnet papier, oublis de prise, données éparpillées...',
    solution: 'Suivi automatique et rappels intelligents',
    solutionDetail: 'Tout est centralisé et vous êtes notifié au bon moment.',
  },
  {
    pain: 'Informations de santé éparpillées',
    painDetail: 'Résultats d\'analyses ici, ordonnances là, pas de vue d\'ensemble...',
    solution: 'Toutes vos données en un seul endroit',
    solutionDetail: 'Un tableau de bord clair pour comprendre votre santé en un coup d\'œil.',
  },
  {
    pain: 'Difficile d\'accéder à un médecin rapidement',
    painDetail: 'Délais d\'attente longs, déplacements pénibles...',
    solution: 'Téléconsultation en quelques clics',
    solutionDetail: 'Consultez depuis chez vous, sans attente, en toute sécurité.',
  },
];

const stats = [
  { value: 96, suffix: '%', label: 'Satisfaction patients' },
  { value: 2400, suffix: '+', label: 'Patients suivis' },
  { value: 3600, suffix: '+', label: 'Rappels envoyés / jour' },
];

export default function ProblemSolutionSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              Le problème
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Gérer sa santé ne devrait pas être{' '}
            <span className="text-primary">compliqué</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Trop d'outils, trop de papier, trop de stress. Corevia simplifie tout.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((item, i) => (
            <FadeContent key={item.pain} blur duration={700} delay={i * 150}>
              <Card className="h-full overflow-hidden border-0 shadow-sm transition-all duration-500 hover:shadow-md">
                <CardContent className="p-0">
                  {/* Pain */}
                  <div className="border-b bg-red-50/60 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-red-100">
                        <X className="size-4 text-red-500" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        Avant
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{item.pain}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.painDetail}</p>
                  </div>

                  {/* Arrow */}
                  <div className="relative z-10 -my-3 flex justify-center">
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary shadow-sm">
                      <ArrowRight className="size-3 rotate-90 text-white" />
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="bg-health-green-50/50 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-green-100">
                        <Check className="size-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Avec Corevia
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{item.solution}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.solutionDetail}</p>
                  </div>
                </CardContent>
              </Card>
            </FadeContent>
          ))}
        </div>

        {/* Animated stats */}
        <div className="mt-16 grid grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <FadeContent key={stat.label} blur duration={600} delay={500 + i * 150}>
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-primary md:text-4xl">
                  <CountUp to={stat.value} duration={2.5} separator=" " />
                  {stat.suffix}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
