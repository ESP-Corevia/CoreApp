import { Quote, Star } from 'lucide-react';
import { motion } from 'motion/react';
import FadeContent from '@/components/FadeContent';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { testimonials } from '../../data/testimonials';

const ringColors = ['ring-health-blue-200', 'ring-primary/30', 'ring-health-blue-300'];

export default function TestimonialsSection() {
  return (
    <section id="temoignages" className="relative overflow-hidden bg-muted/30 py-20 md:py-28">
      <div className="pointer-events-none absolute right-10 bottom-20 h-48 w-48 rounded-full bg-health-blue-400/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 font-semibold text-primary text-sm">
              Temoignages
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-bold font-display text-3xl text-foreground tracking-tight md:text-4xl">
            Ils nous font{' '}
            <span className="bg-gradient-to-r from-health-blue-500 to-primary bg-clip-text text-transparent">
              confiance
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Des milliers d'utilisateurs ont deja simplifie leur suivi de sante avec Corevia.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <FadeContent key={testimonial.name} blur duration={700} delay={i * 150}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="glassmorphism relative h-full p-6"
              >
                {/* Quotation mark decoration */}
                <Quote className="absolute top-4 right-4 size-8 rotate-180 text-health-blue-200/30" />

                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground text-sm leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="mt-5 flex items-center gap-3 border-white/20 border-t pt-4">
                  <Avatar className={`ring-2 ${ringColors[i % ringColors.length]}`}>
                    <AvatarFallback className="bg-gradient-to-br from-health-blue-100 to-health-green-100 font-semibold text-foreground text-sm">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
