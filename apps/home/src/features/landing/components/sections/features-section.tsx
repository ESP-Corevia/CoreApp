import { features } from '../../data/features';
import FadeContent from '@/components/FadeContent';
import SpotlightCard from '@/components/SpotlightCard';
import { cn } from '@/lib/utils';

export default function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              Fonctionnalités
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Tout ce dont vous avez besoin,{' '}
            <span className="text-primary">au même endroit</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Une application complète pour suivre, comprendre et améliorer votre santé au quotidien.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeContent key={feature.title} blur duration={700} delay={i * 100}>
              {/* SpotlightCard with green-tinted spotlight on light bg */}
              <SpotlightCard
                className="!bg-white !border-border/60 !rounded-2xl !p-0 h-full transition-all duration-500 hover:-translate-y-1 hover:shadow-lg group"
                spotlightColor="rgba(22, 163, 74, 0.08)"
              >
                <div className="p-6">
                  <div
                    className={cn(
                      'mb-4 flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
                      feature.bgColor,
                    )}
                  >
                    <feature.icon className={cn('size-6', feature.color)} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </SpotlightCard>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
