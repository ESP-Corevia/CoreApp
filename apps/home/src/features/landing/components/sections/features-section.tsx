import { features } from '../../data/features';
import FadeContent from '@/components/FadeContent';
import FeatureCard3D from '../feature-card-3d';

export default function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle background orbs */}
      <div className="pointer-events-none absolute top-20 -left-32 h-64 w-64 rounded-full bg-health-blue-400/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 -right-32 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-health-blue-200/40 bg-health-blue-50/60 px-4 py-1.5 text-sm font-semibold text-health-blue-600">
              Fonctionnalites
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Tout ce dont vous avez besoin,{' '}
            <span className="bg-gradient-to-r from-health-blue-500 to-primary bg-clip-text text-transparent">
              au meme endroit
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Une application complete pour suivre, comprendre et ameliorer votre sante au quotidien.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeContent key={feature.title} blur duration={700} delay={i * 100}>
              <FeatureCard3D
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                iconColor={feature.color}
                iconBgColor={feature.bgColor}
              />
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
