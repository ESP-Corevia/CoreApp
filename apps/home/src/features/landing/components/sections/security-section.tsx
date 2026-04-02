import { Lock, ShieldCheck, UserCheck } from 'lucide-react';
import FadeContent from '@/components/FadeContent';
import BorderGlow from '@/components/BorderGlow';
import { cn } from '@/lib/utils';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Chiffrement de bout en bout',
    description:
      "Toutes vos donnees de sante sont protegees par un chiffrement AES-256, le meme standard utilise par les institutions bancaires. Personne d'autre que vous n'y a acces.",
    color: 'text-blue-400',
  },
  {
    icon: ShieldCheck,
    title: 'Conformite RGPD',
    description:
      'Corevia respecte strictement le Reglement General sur la Protection des Donnees. Vos donnees sont hebergees en Europe, sur des serveurs certifies pour les donnees de sante.',
    color: 'text-emerald-400',
  },
  {
    icon: UserCheck,
    title: 'Vous gardez le controle',
    description:
      "Exportez, modifiez ou supprimez vos donnees a tout moment. Aucune donnee n'est partagee sans votre consentement explicite. Votre sante, vos regles.",
    color: 'text-sky-400',
  },
];

export default function SecuritySection() {
  return (
    <section id="securite" className="relative bg-[#0a0f1a] py-20 md:py-28 overflow-hidden">
      {/* Background atmosphere — blue-green glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-health-blue-500/8 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-emerald-500/5 blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-400">
              Securite & Confidentialite
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Vos donnees de sante meritent la{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              meilleure protection
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/60">
            La securite n'est pas une option. C'est le fondement de Corevia.
          </p>
        </FadeContent>

        {/* Decorative glow rings */}
        <div className="relative mx-auto my-10 flex h-20 items-center justify-center md:h-24" aria-hidden="true">
          <div className="absolute size-32 rounded-full border border-blue-400/10 md:size-40" />
          <div className="absolute size-20 rounded-full border border-blue-400/20 md:size-28" />
          <div className="absolute size-24 rounded-full bg-blue-500/5 blur-2xl md:size-32" />
          <div className="absolute size-16 rounded-full border border-blue-400/15 pulse-ring" />
          <div className="absolute size-16 rounded-full border border-blue-400/10 pulse-ring-delayed" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {securityFeatures.map((feature, i) => (
            <FadeContent key={feature.title} blur duration={700} delay={i * 150}>
              <BorderGlow
                className="h-full"
                backgroundColor="#111827"
                borderRadius={20}
                glowColor="220 70 60"
                colors={['#3B82F6', '#16A34A', '#10B981']}
                glowIntensity={0.6}
                animated={i === 1}
              >
                <div className="p-6 text-center">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/5 relative">
                    <feature.icon className={cn('size-7', feature.color)} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {feature.description}
                  </p>
                </div>
              </BorderGlow>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
