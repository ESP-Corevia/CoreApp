import { useMemo, useState } from 'react';
import { Sparkles, Activity, Clock, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { HEALTH_EXPERT_PROFILES, type HealthExpertProfileId } from '../constants';
import HealthChatbot, { type ProfileSelection } from './HealthChatbot';

const AGENT_HISTORY: Record<
  HealthExpertProfileId,
  { id: string; title: string; preview: string; time: string }[]
> = {
  general: [
    { id: 'gen-1', title: 'Gestion fièvre légère', preview: 'Hydratation + repos conseillé…', time: 'Aujourd’hui' },
    { id: 'gen-2', title: 'Prévention saison froide', preview: 'Focus sur immunité…', time: 'Hier' },
  ],
  psychology: [
    { id: 'psy-1', title: 'Routine anti-stress', preview: 'Respiration box & micro-pauses…', time: 'Aujourd’hui' },
    { id: 'psy-2', title: 'Sommeil fractionné', preview: 'Conseils pour limiter les réveils…', time: '8 déc.' },
  ],
  fitness: [
    { id: 'fit-1', title: 'HIIT 20 min', preview: 'Formats Tabata + récupération active…', time: 'Aujourd’hui' },
    { id: 'fit-2', title: 'Renfo mobilité', preview: 'Travail de hanches + épaules…', time: '7 déc.' },
  ],
  nutrition: [
    { id: 'nut-1', title: 'Batch cooking veggie', preview: '3 repas complets à l’avance…', time: 'Aujourd’hui' },
    { id: 'nut-2', title: 'Équilibre post-training', preview: 'Associer glucides rapides et protéines…', time: '6 déc.' },
  ],
  dermatology: [
    { id: 'der-1', title: 'Routine hiver', preview: 'Layering hydratant + SPF doux…', time: 'Aujourd’hui' },
    { id: 'der-2', title: 'Acné hormonale', preview: 'Approche progressive, actifs non irritants…', time: '5 déc.' },
  ],
};

export default function HealthAssistantPage({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const [selectedProfile, setSelectedProfile] = useState<HealthExpertProfileId>('general');
  const [metrics, setMetrics] = useState({
    height: '175',
    weight: '72',
    age: '29',
    goal: 'Tonifier',
  });
  const [lastSaved, setLastSaved] = useState<string>('il y a 2 jours');

  if (!session?.isAuthenticated) {
    return null;
  }

  const activeProfile = useMemo(
    () => HEALTH_EXPERT_PROFILES.find(profile => profile.id === selectedProfile),
    [selectedProfile]
  );
  const history = AGENT_HISTORY[selectedProfile];

  const handleMetricChange = (field: keyof typeof metrics, value: string) => {
    setMetrics(prev => ({ ...prev, [field]: value }));
  };

  const saveMetrics = () => {
    setLastSaved('à l’instant');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05050a] via-[#090c16] to-[#05050a] text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 lg:px-8">
        <section className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Multi-experts Corevia</p>
              <h1 className="text-3xl font-semibold">Contacte l’expert adapté en un clic</h1>
              <p className="text-white/70 text-sm sm:text-base">
                Chaque avatar représente un spécialiste. Sélectionne le profil désiré pour afficher son interface
                dédiée et conserver un historique indépendant.
              </p>
            </div>
            <Button className="rounded-full bg-white text-black hover:bg-white/90">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau chat
            </Button>
          </div>

          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {HEALTH_EXPERT_PROFILES.map(profile => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfile(profile.id)}
                className={cn(
                  'flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                  selectedProfile === profile.id
                    ? 'border-transparent bg-gradient-to-r from-indigo-500/70 via-purple-500/70 to-pink-500/70 text-white shadow-xl'
                    : 'border-white/10 bg-black/30 text-white/75 hover:bg-black/40'
                )}
              >
                <img
                  src={profile.avatar}
                  alt={profile.label}
                  className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{profile.label}</p>
                  <p className="text-xs text-white/70">{profile.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Données perso</p>
                  <p className="text-sm text-white/70">
                    Aide chaque expert à contextualiser ses recommandations.
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-indigo-300" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-white/60">Taille (cm)</Label>
                  <Input
                    value={metrics.height}
                    onChange={event => handleMetricChange('height', event.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/60">Poids (kg)</Label>
                  <Input
                    value={metrics.weight}
                    onChange={event => handleMetricChange('weight', event.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/60">Âge</Label>
                  <Input
                    value={metrics.age}
                    onChange={event => handleMetricChange('age', event.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/60">Objectif</Label>
                  <Select value={metrics.goal} onValueChange={value => handleMetricChange('goal', value)}>
                    <SelectTrigger className="mt-1 border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Objectif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tonifier">Tonifier</SelectItem>
                      <SelectItem value="Perdre du poids">Perdre du poids</SelectItem>
                      <SelectItem value="Reprendre l’énergie">Reprendre l’énergie</SelectItem>
                      <SelectItem value="Sérénité mentale">Sérénité mentale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={saveMetrics}
                  className="rounded-full bg-white text-black hover:bg-white/90 sm:px-8"
                >
                  Mettre à jour le profil
                </Button>
                <p className="text-xs text-white/60">Dernière mise à jour {lastSaved}</p>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/5 bg-black/40 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Interface dédiée</p>
                <h2 className="text-2xl font-semibold">Chat actif — {activeProfile?.label}</h2>
                <p className="text-sm text-white/60">
                  Ton historique est conservé pour chaque expert. Tu peux changer d’avatar à tout moment pour
                  obtenir un autre angle de conseil.
                </p>
              </div>
              <HealthChatbot
                key={selectedProfile}
                selectedProfile={selectedProfile as ProfileSelection}
                showProfileSelector={false}
              />
            </section>
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeProfile?.avatar}
                  alt={activeProfile?.label}
                  className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Profil actif</p>
                  <p className="text-lg font-semibold">{activeProfile?.label}</p>
                  <p className="text-sm text-white/60">{activeProfile?.description}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-white/70">
                <div>
                  <p className="text-xs text-white/40">Sessions ouvertes</p>
                  <p className="text-lg font-semibold">4</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Temps moyen</p>
                  <p className="text-lg font-semibold">6 min</p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-white/5 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Activity className="h-4 w-4 text-emerald-300" />
                Historique
              </div>
              <div className="mt-4 space-y-3">
                {history.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/80"
                  >
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-white/60">{entry.preview}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {entry.time}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
