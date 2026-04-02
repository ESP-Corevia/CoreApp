import { ArrowRight, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FadeContent from '@/components/FadeContent';
import CountUp from '@/components/CountUp';

const problems = [
  {
    pain: 'Suivi manuel et oublis frequents',
    painDetail: 'Carnet papier, oublis de prise, donnees eparpillees...',
    solution: 'Suivi automatique et rappels intelligents',
    solutionDetail: 'Tout est centralise et vous etes notifie au bon moment.',
  },
  {
    pain: 'Informations de sante eparpillees',
    painDetail: "Resultats d'analyses ici, ordonnances la, pas de vue d'ensemble...",
    solution: 'Toutes vos donnees en un seul endroit',
    solutionDetail: "Un tableau de bord clair pour comprendre votre sante en un coup d'oeil.",
  },
  {
    pain: "Difficile d'acceder a un medecin rapidement",
    painDetail: "Delais d'attente longs, deplacements penibles...",
    solution: 'Teleconsultation en quelques clics',
    solutionDetail: 'Consultez depuis chez vous, sans attente, en toute securite.',
  },
];

const stats = [
  { value: 96, suffix: '%', label: 'Satisfaction patients' },
  { value: 2400, suffix: '+', label: 'Patients suivis' },
  { value: 3600, suffix: '+', label: 'Rappels envoyes / jour' },
];

export default function ProblemSolutionSection() {
  return (
    <section id="probleme" className="relative bg-muted/30 py-20 md:py-28 overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none absolute top-10 right-10 h-48 w-48 rounded-full bg-health-blue-400/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
              Le probleme
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Gerer sa sante ne devrait pas etre{' '}
            <span className="bg-gradient-to-r from-health-blue-500 to-primary bg-clip-text text-transparent">
              complique
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Trop d'outils, trop de papier, trop de stress. Corevia simplifie tout.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((item, i) => (
            <FadeContent key={item.pain} blur duration={700} delay={i * 150}>
              <Card className="glassmorphism h-full overflow-hidden !border-white/30 !shadow-lg transition-all duration-500 hover:!shadow-xl hover:-translate-y-1">
                <CardContent className="p-0">
                  {/* Pain */}
                  <div className="border-b border-white/20 bg-red-50/60 p-6">
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

                  {/* Arrow — blue-green gradient */}
                  <div className="relative z-10 -my-3 flex justify-center">
                    <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-health-blue-500 to-primary shadow-sm">
                      <ArrowRight className="size-3 rotate-90 text-white" />
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="bg-health-blue-50/30 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-health-blue-100">
                        <Check className="size-4 text-health-blue-500" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-health-blue-500">
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
                <div className="font-display text-3xl font-extrabold bg-gradient-to-r from-health-blue-500 to-primary bg-clip-text text-transparent md:text-4xl">
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
