import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BlurText from '@/components/BlurText';
import GradientText from '@/components/GradientText';
import RotatingText from '@/components/RotatingText';
import Magnet from '@/components/Magnet';
import FadeContent from '@/components/FadeContent';

export default function HeroSection() {
  return (
    <section className="hero-mesh relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      {/* Floating 3D decorative elements */}
      <div className="pointer-events-none absolute top-16 -left-20 h-48 w-48 rounded-full bg-primary/8 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-secondary/6 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-32 w-32 rounded-full bg-primary/4 blur-2xl animate-[float_12s_ease-in-out_infinite_2s]" />

      {/* Dot pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center md:py-28">
        {/* Top badge */}
        <FadeContent blur duration={600}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Votre compagnon santé intelligent
          </div>
        </FadeContent>

        {/* Headline with blur reveal */}
        <div className="mx-auto max-w-4xl">
          <BlurText
            text="Prenez le contrôle de votre santé,"
            className="font-display text-4xl leading-[1.1] font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
            delay={80}
            animateBy="words"
            direction="bottom"
          />
          {/* Animated gradient keyword */}
          <GradientText
            colors={['#16A34A', '#059669', '#10B981', '#16A34A']}
            animationSpeed={6}
            className="mt-2"
          >
            <span className="font-display text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              en toute sérénité
            </span>
          </GradientText>
        </div>

        {/* Subtitle */}
        <FadeContent blur duration={800} delay={400}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Corevia vous accompagne au quotidien :{' '}
            {/* Rotating feature keywords */}
            <span className="inline-flex items-baseline">
              <RotatingText
                texts={['suivi de vos constantes', 'rappels de traitement', 'assistant IA', 'téléconsultation']}
                mainClassName="text-primary font-semibold overflow-hidden"
                staggerFrom="last"
                staggerDuration={0.025}
                rotationInterval={3000}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              />
            </span>
            .{' '}Simple, sécurisé, humain.
          </p>
        </FadeContent>

        {/* CTAs with magnet */}
        <FadeContent blur duration={800} delay={600}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                className="h-12 cursor-pointer rounded-full px-8 text-base font-semibold"
              >
                <a href="#fonctionnalites">Découvrir les fonctionnalités</a>
              </Button>
            </Magnet>
          </div>
        </FadeContent>

        {/* Trust badges */}
        <FadeContent blur duration={800} delay={900}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Badge variant="outline" className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <ShieldCheck className="size-3.5 text-primary" />
              RGPD Conforme
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Lock className="size-3.5 text-secondary" />
              Chiffrement AES-256
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-3.5 text-primary" />
              100% Gratuit
            </Badge>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
