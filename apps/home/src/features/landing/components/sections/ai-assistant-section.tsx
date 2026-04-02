import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Bot, Info, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import FadeContent from '@/components/FadeContent';
import ShinyText from '@/components/ShinyText';
import { cn } from '@/lib/utils';

const chatMessages = [
  {
    role: 'user' as const,
    message: 'J\'ai des maux de tête fréquents depuis 3 jours et une légère fatigue.',
  },
  {
    role: 'assistant' as const,
    message:
      'Je comprends, ces symptômes peuvent être liés à plusieurs facteurs : stress, déshydratation, manque de sommeil ou tension élevée. Je vous recommande de vérifier votre tension artérielle et de bien vous hydrater. Si les symptômes persistent au-delà de 5 jours, consultez votre médecin.',
  },
  {
    role: 'user' as const,
    message: 'Merci, je dois m\'inquiéter ?',
  },
  {
    role: 'assistant' as const,
    message:
      'Ces symptômes sont courants et souvent bénins. Cependant, je ne suis pas médecin. Si la douleur s\'intensifie ou s\'accompagne de troubles visuels, consultez un professionnel de santé rapidement.',
  },
];

/** 3D tilt card that follows mouse position */
function Tilt3DCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { damping: 30, stiffness: 150 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { damping: 30, stiffness: 150 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

export default function AiAssistantSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text content */}
          <FadeContent blur duration={700}>
            <div>
              <Badge className="mb-4 rounded-full bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10">
                Intelligence Artificielle
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Un assistant qui vous{' '}
                <ShinyText
                  text="comprend"
                  speed={4}
                  color="#16A34A"
                  shineColor="#4ADE80"
                  className="font-display text-3xl font-bold tracking-tight md:text-4xl"
                />
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Posez vos questions à tout moment. L'assistant IA de Corevia analyse vos
                symptômes, croise vos données de santé et vous oriente avec des réponses claires et
                personnalisées.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Analyse contextuelle de vos symptômes',
                  'Réponses personnalisées selon votre profil',
                  'Suggestions de consultation quand c\'est nécessaire',
                  'Disponible 24h/24, 7j/7',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <p className="text-sm leading-relaxed text-amber-800">
                  <strong>Important :</strong> L'assistant IA de Corevia est un outil d'aide à la
                  compréhension. Il ne remplace en aucun cas l'avis d'un professionnel de santé.
                </p>
              </div>
            </div>
          </FadeContent>

          {/* Chat mockup with 3D tilt */}
          <FadeContent blur duration={700} delay={200}>
            <Tilt3DCard>
              <Card className="overflow-hidden border-0 shadow-xl">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b bg-primary/5 px-5 py-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                    <Bot className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Assistant Corevia</p>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-primary" />
                      </span>
                      <p className="text-xs text-muted-foreground">En ligne</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <CardContent className="max-h-[400px] space-y-4 overflow-y-auto p-5">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
                    >
                      <div
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full',
                          msg.role === 'user' ? 'bg-muted' : 'bg-primary',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <User className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Bot className="size-3.5 text-white" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'rounded-tr-md bg-primary text-white'
                            : 'rounded-tl-md bg-muted text-foreground',
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Tilt3DCard>
          </FadeContent>
        </div>
      </div>
    </section>
  );
}
