import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BlurText from '@/components/BlurText';
import GradientText from '@/components/GradientText';
import RotatingText from '@/components/RotatingText';
import Magnet from '@/components/Magnet';
import FadeContent from '@/components/FadeContent';
import HeroDashboardMockup from '../hero-dashboard-mockup';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="hero-mesh relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden"
    >
      {/* Ambient blur orbs — blue + green */}
      <div className="pointer-events-none absolute top-16 -left-20 h-56 w-56 rounded-full bg-health-blue-500/8 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full bg-primary/6 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-health-blue-400/5 blur-3xl animate-[float_12s_ease-in-out_infinite]" />

      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <FadeContent blur duration={600}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-health-blue-200/40 bg-health-blue-50/60 px-4 py-1.5 text-sm font-medium text-health-blue-600 backdrop-blur-sm">
                <Sparkles className="size-4" />
                Votre compagnon sante intelligent
              </div>
            </FadeContent>

            <BlurText
              text="Prenez le controle de votre sante,"
              className="font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-7xl"
              delay={80}
              animateBy="words"
              direction="bottom"
            />
            <GradientText
              colors={['#3B82F6', '#16A34A', '#10B981', '#3B82F6']}
              animationSpeed={6}
              className="mt-1 lg:!justify-start"
            >
              <span className="font-display text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-7xl">
                simplement et en toute serenite
              </span>
            </GradientText>

            <FadeContent blur duration={800} delay={400}>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:mx-0">
                Corevia vous accompagne au quotidien :{' '}
                <span className="inline-flex items-baseline">
                  <RotatingText
                    texts={[
                      'suivi de vos constantes',
                      'rappels de traitement',
                      'assistant IA',
                      'teleconsultation',
                    ]}
                    mainClassName="text-health-blue-500 font-semibold overflow-hidden"
                    staggerFrom="last"
                    staggerDuration={0.025}
                    rotationInterval={3000}
                    transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                  />
                </span>
                . Simple, securise, humain.
              </p>
            </FadeContent>

            <FadeContent blur duration={800} delay={600}>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Magnet padding={60} magnetStrength={3}>
                  <Button
                    size="lg"
                    className="cta-glow h-12 cursor-pointer rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Magnet>
                <Magnet padding={60} magnetStrength={3}>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="h-12 cursor-pointer rounded-full border-health-blue-200/60 px-8 text-base font-semibold hover:bg-health-blue-50/50"
                  >
                    <a href="#fonctionnalites">Decouvrir</a>
                  </Button>
                </Magnet>
              </div>
            </FadeContent>

            <FadeContent blur duration={800} delay={900}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                >
                  <ShieldCheck className="size-3.5 text-primary" />
                  RGPD Conforme
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                >
                  <Lock className="size-3.5 text-health-blue-500" />
                  Chiffrement AES-256
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                >
                  <Sparkles className="size-3.5 text-health-blue-500" />
                  100% Gratuit
                </Badge>
              </div>
            </FadeContent>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative flex items-center justify-center" aria-hidden="true">
            {/* Decorative elements behind the mockup */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-56 w-56 rounded-full bg-health-blue-400/6 blur-3xl animate-[float_6s_ease-in-out_infinite]" />
            </div>
            <div className="pointer-events-none absolute size-72 rounded-full border border-health-blue-200/15 animate-[float_8s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute size-52 rounded-full border border-primary/10 animate-[float_10s_ease-in-out_infinite_reverse]" />

            {/* Floating dots */}
            <div className="pointer-events-none absolute top-8 right-4 size-2 rounded-full bg-health-blue-400/30 depth-slow" />
            <div className="pointer-events-none absolute bottom-12 left-8 size-1.5 rounded-full bg-primary/40 depth-fast" />
            <div className="pointer-events-none absolute top-1/2 right-0 size-1 rounded-full bg-health-blue-400/20 depth-slow" />

            {/* Dashboard mockup with float animation */}
            <div className="depth-slow">
              <HeroDashboardMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
