import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeContent from '@/components/FadeContent';
import Magnet from '@/components/Magnet';

export default function CtaSection() {
  return (
    <section id="cta" className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-br from-primary via-primary to-health-blue-600">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.62_0.19_245/0.3),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.55_0.16_160/0.2),transparent_50%)]" />

      {/* Central glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-[80px] md:h-80 md:w-80" aria-hidden="true" />

      {/* Orbiting ring decorations */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 rounded-full border border-white/8 md:size-64" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full border border-white/4 md:size-96" aria-hidden="true" />

      {/* Floating geometric shapes */}
      <div className="pointer-events-none absolute top-[15%] left-[20%] size-16 rounded-2xl border border-white/8 rotate-12 depth-slow" />
      <div className="pointer-events-none absolute bottom-[20%] right-[15%] size-12 rounded-full border border-white/6 depth-fast" />
      <div className="pointer-events-none absolute top-[60%] left-[10%] size-8 rounded-lg bg-white/4 depth-slow" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute top-[20%] left-[25%] size-2 rounded-full bg-white/15 depth-slow" />
      <div className="pointer-events-none absolute bottom-[25%] right-[30%] size-1.5 rounded-full bg-white/10 depth-fast" />
      <div className="pointer-events-none absolute top-[60%] right-[15%] size-1 rounded-full bg-white/20 depth-slow" />

      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <FadeContent blur duration={700}>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/15 p-3 animate-heartbeat">
            <Heart className="size-6 text-white" />
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Pret a prendre soin de vous ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Rejoignez des milliers d'utilisateurs qui ont simplifie leur suivi de sante. Commencez
            des aujourd'hui, c'est gratuit.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Magnet padding={80} magnetStrength={3}>
              <Button
                size="lg"
                className="h-13 cursor-pointer rounded-full bg-white px-8 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
              >
                Commencer gratuitement
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </Magnet>
            <Magnet padding={80} magnetStrength={3}>
              <Button
                variant="outline"
                size="lg"
                className="h-13 cursor-pointer rounded-full border-white/30 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Telecharger l'application
              </Button>
            </Magnet>
          </div>

          <p className="mt-6 text-sm text-white/60">
            Aucune carte bancaire requise • Configuration en 2 minutes
          </p>
        </div>
      </FadeContent>
    </section>
  );
}
