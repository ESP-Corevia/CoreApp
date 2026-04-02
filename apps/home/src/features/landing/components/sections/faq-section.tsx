import FadeContent from '@/components/FadeContent';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '../../data/faq';

export default function FaqSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-health-blue-200/40 bg-health-blue-50/60 px-4 py-1.5 font-semibold text-health-blue-600 text-sm">
              FAQ
            </span>
          </div>
          <h2 className="mx-auto max-w-2xl text-center font-bold font-display text-3xl text-foreground tracking-tight md:text-4xl">
            Vous avez des questions ?{' '}
            <span className="bg-gradient-to-r from-health-blue-500 to-primary bg-clip-text text-transparent">
              Nous avons les reponses.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted-foreground">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </FadeContent>

        <FadeContent blur duration={700} delay={200}>
          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-border/60 transition-all data-[state=open]:border-l-2 data-[state=open]:border-l-health-blue-500 data-[state=open]:pl-4"
                >
                  <AccordionTrigger className="text-left font-semibold text-base text-foreground hover:text-health-blue-500 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
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
