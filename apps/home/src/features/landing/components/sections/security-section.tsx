import { Lock, ShieldCheck, UserCheck } from 'lucide-react';
import FadeContent from '@/components/FadeContent';
import BorderGlow from '@/components/BorderGlow';
import { cn } from '@/lib/utils';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Chiffrement de bout en bout',
    description:
      'Toutes vos données de santé sont protégées par un chiffrement AES-256, le même standard utilisé par les institutions bancaires. Personne d\'autre que vous n\'y a accès.',
    color: 'text-emerald-400',
  },
  {
    icon: ShieldCheck,
    title: 'Conformité RGPD',
    description:
      'Corevia respecte strictement le Règlement Général sur la Protection des Données. Vos données sont hébergées en Europe, sur des serveurs certifiés pour les données de santé.',
    color: 'text-green-400',
  },
  {
    icon: UserCheck,
    title: 'Vous gardez le contrôle',
    description:
      'Exportez, modifiez ou supprimez vos données à tout moment. Aucune donnée n\'est partagée sans votre consentement explicite. Votre santé, vos règles.',
    color: 'text-emerald-400',
  },
];

export default function SecuritySection() {
  return (
    <section id="securite" className="bg-[#0a0f1a] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeContent blur duration={600}>
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
              Sécurité & Confidentialité
            </span>
          </div>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Vos données de santé méritent la{' '}
            <span className="text-emerald-400">meilleure protection</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/60">
            La sécurité n'est pas une option. C'est le fondement de Corevia.
          </p>
        </FadeContent>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {securityFeatures.map((feature, i) => (
            <FadeContent key={feature.title} blur duration={700} delay={i * 150}>
              <BorderGlow
                className="h-full"
                backgroundColor="#111827"
                borderRadius={20}
                glowColor="150 60 50"
                colors={['#16A34A', '#059669', '#10B981']}
                glowIntensity={0.6}
                animated={i === 1}
              >
                <div className="p-6 text-center">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/5">
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
