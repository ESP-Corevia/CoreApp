import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '../../data/faq';
import FadeContent from '@/components/FadeContent';

export default function FaqSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              FAQ
            </span>
          </div>
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Vous avez des questions ?{' '}
            <span className="text-primary">Nous avons les réponses.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted-foreground">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </FadeContent>

        <FadeContent blur duration={700} delay={200}>
          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
