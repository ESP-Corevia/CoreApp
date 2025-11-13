import Header from './header';
import Footer from './footer';
import Shuffle from '@/components/Shuffle';

export default function Landing({
  
}: {
  
}) {
  return (
    <div>
      <Header />

      <main>
        <Shuffle
          text="Corevia"
          tag="h1"
          shuffleDirection="right"
          duration={1.1}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          loop
          loopDelay={0.6}
          stagger={0.03}
          threshold={0.1}
          respectReducedMotion
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            lineHeight: 1.2,
            textAlign: 'center',
            wordBreak: 'break-word',
        }}/>
        <div>
          {/* TODO faire le paragraphe d'intro de l'app */}
        </div>
        <div>
          {/* TODO le call to action */}
        </div>
        <div>
          {/* TODO Les chiffre randoms bidons */}
        </div>
        <div>
          {/* TODO des trucs en plus si on a des idées */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
