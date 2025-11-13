import Shuffle from '@/components/Shuffle';
import Footer from './footer';
import Header from './header';

export default function Landing({
  session
}: {
  session : { isAuthenticated: boolean; userId: string } | null
}) {
  const brandColor = '#008000';
  const stats = [
    { label: 'Patients monitored daily', value: '2.4k' },
    { label: 'Medication adherence lift', value: '38%' },
    { label: 'Critical alerts resolved <5m', value: '96%' },
    { label: 'Clinician hours saved / wk', value: '120' },
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Header alreadyLogin={session?.isAuthenticated} />

      <main
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
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
            wordBreak: 'break-word',
            color: brandColor,
        }}/>
        <div>
          <p
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: '#222222',
            }}
          >
            Built for modern care teams, Corevia unifies patient vitals, automates outreach sequences,
            and surfaces real-time risk signals so clinicians can intervene faster with less effort.
          </p>
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                margin: 0,
                color: '#0f172a',
              }}
              >
                Deliver proactive care with zero guesswork.
            </h2>
            <p
              style={{
                margin: 0,
                color: '#475569',
                fontSize: '1rem',
                maxWidth: '480px',
              }}
              >
                Connect EHR data, automate follow-ups, and keep every patient plan on track without
                drowning in admin work.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <a
                href="/signup"
                style={{
                  backgroundColor: brandColor,
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '0.85rem 1.75rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Get started
              </a>
              <a
                href="#features"
                style={{
                  border: `2px solid ${brandColor}`,
                  color: brandColor,
                  borderRadius: '9999px',
                  padding: '0.75rem 1.6rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                See it in action
              </a>
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.25rem',
              width: '100%',
              maxWidth: '720px',
            }}
          >
            {stats.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: brandColor,
                    marginBottom: '0.25rem',
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: '#475569',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {/* TODO des trucs en plus si on a des idées */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
