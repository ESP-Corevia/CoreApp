import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { testimonials } from '../../data/testimonials';
import FadeContent from '@/components/FadeContent';

export default function TestimonialsSection() {
  return (
    <section id="temoignages" className="bg-muted/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              Témoignages
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ils nous font{' '}
            <span className="text-primary">confiance</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Des milliers d'utilisateurs ont déjà simplifié leur suivi de santé avec Corevia.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <FadeContent key={testimonial.name} blur duration={700} delay={i * 150}>
              <Card className="h-full border-0 shadow-sm transition-all duration-500 hover:shadow-md">
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm leading-relaxed text-foreground">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="mt-5 flex items-center gap-3 border-t pt-4">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
