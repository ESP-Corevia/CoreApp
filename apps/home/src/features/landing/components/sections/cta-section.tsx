import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeContent from '@/components/FadeContent';
import Magnet from '@/components/Magnet';

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 md:py-28">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.65_0.18_145/0.3),transparent_60%),radial-gradient(circle_at_70%_80%,oklch(0.55_0.16_160/0.25),transparent_50%)]" />

      {/* Floating 3D orbs */}
      <div className="pointer-events-none absolute top-10 left-[15%] size-20 rounded-full bg-white/5 blur-xl depth-slow" />
      <div className="pointer-events-none absolute bottom-10 right-[20%] size-16 rounded-full bg-white/5 blur-lg depth-fast" />

      {/* Dot pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <FadeContent blur duration={700}>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          {/* Heartbeat animated icon */}
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/15 p-3 animate-heartbeat">
            <Heart className="size-6 text-white" />
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Prêt à prendre soin de vous ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Rejoignez des milliers d'utilisateurs qui ont simplifié leur suivi de santé. Commencez
            dès aujourd'hui, c'est gratuit.
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
                Télécharger l'application
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
