import Header from './header';
import Footer from './footer';
import ScrollProgressBar from './scroll-progress-bar';
import HeroSection from './sections/hero-section';
import ProblemSolutionSection from './sections/problem-solution-section';
import FeaturesSection from './sections/features-section';
import AiAssistantSection from './sections/ai-assistant-section';
import SecuritySection from './sections/security-section';
import TestimonialsSection from './sections/testimonials-section';
import CtaSection from './sections/cta-section';
import FaqSection from './sections/faq-section';

export default function Landing() {
  return (
    <div className="min-h-svh bg-background">
      <ScrollProgressBar />
      <Header />

      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <AiAssistantSection />
        <SecuritySection />
        <TestimonialsSection />
        <CtaSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
