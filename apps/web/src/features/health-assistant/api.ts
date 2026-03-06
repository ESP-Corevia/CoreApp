import { DEFAULT_DISCLAIMER, HEALTH_EXPERT_PROFILES } from './constants';
import type { HealthExpertProfileId } from './constants';

export interface HealthChatMessagePayload {
  message: string;
  profile?: HealthExpertProfileId;
  context?: Record<string, unknown>;
}

export interface HealthChatbotResponse {
  role: 'assistant';
  content: string;
  profile: HealthExpertProfileId;
  profileLabel: string;
  disclaimer: string;
  suggestions: string[];
}

const PROFILE_KEYWORDS: Record<HealthExpertProfileId, string[]> = {
  general: [
    'malade',
    'douleur',
    'fatigue',
    'fièvre',
    'symptôme',
    'toux',
    'maux',
    'généraliste',
  ],
  psychology: [
    'stress',
    'anxiété',
    'angoisse',
    'déprime',
    'sommeil',
    'insomnie',
    'burnout',
    'émotion',
  ],
  fitness: [
    'sport',
    'cardio',
    'muscu',
    'musculation',
    'hiit',
    'entrainement',
    'running',
    'courir',
  ],
  nutrition: [
    'repas',
    'nutrition',
    'calorie',
    'protéine',
    'glucide',
    'régime',
    'menu',
    'aliment',
  ],
  dermatology: [
    'peau',
    'acné',
    'eczéma',
    'bouton',
    'tache',
    'rash',
    'irritation',
    'dermato',
  ],
};

const PROFILE_TIPS: Record<HealthExpertProfileId, string> = {
  general:
    'Observe l’évolution de tes symptômes, hydrate-toi correctement et n’hésite pas à consulter si la situation se dégrade.',
  psychology:
    'Respire profondément, instaure un petit rituel apaisant (écriture, musique, marche) et demande de l’aide si la tension reste forte.',
  fitness:
    'Commence doucement, échauffe-toi, garde un mouvement contrôlé et priorise la régularité plutôt que l’intensité.',
  nutrition:
    'Structure ta journée avec 3 repas équilibrés et 1 ou 2 collations légères, en veillant à l’hydratation et aux légumes.',
  dermatology:
    'Nettoie la peau en douceur, applique une crème adaptée et surveille toute réaction inhabituelle après soleil ou cosmétique.',
};

const FOLLOW_UP_SUGGESTIONS: Record<HealthExpertProfileId, string[]> = {
  general: ['Quels signes doivent m’inquiéter ?', 'Puis-je continuer mes activités ?'],
  psychology: ['Aurais-tu un exercice de respiration ?', 'Comment améliorer mon sommeil ?'],
  fitness: ['Peux-tu proposer un échauffement rapide ?', 'Comment récupérer après la séance ?'],
  nutrition: ['As-tu une idée de menu pour la semaine ?', 'Comment éviter les grignotages ?'],
  dermatology: ['Quel soin quotidien privilégier ?', 'Comment protéger ma peau en extérieur ?'],
};

function detectProfile(message: string): HealthExpertProfileId {
  const lowerMessage = message.toLowerCase();
  let bestMatch: { profile: HealthExpertProfileId; score: number } = { profile: 'general', score: 0 };

  (Object.keys(PROFILE_KEYWORDS) as HealthExpertProfileId[]).forEach(profile => {
    const score = PROFILE_KEYWORDS[profile].reduce((acc, keyword) => {
      return lowerMessage.includes(keyword) ? acc + 1 : acc;
    }, 0);

    if (score > bestMatch.score) {
      bestMatch = { profile, score };
    }
  });

  return bestMatch.score === 0 ? 'general' : bestMatch.profile;
}

function composeAssistantMessage(message: string, profile: HealthExpertProfileId): string {
  const cleaned = message.trim();
  const profileLabel =
    HEALTH_EXPERT_PROFILES.find(p => p.id === profile)?.label?.toLowerCase() ?? 'profil spécialisé';
  const intro = cleaned
    ? `Tu mentionnes : "${cleaned}". Voici la perspective ${profile === 'general' ? 'du médecin généraliste' : `du ${profileLabel}`}.`
    : `Voici une recommandation ${profile === 'general' ? 'générale' : `du profil ${profileLabel}`}.`;

  return [
    intro,
    PROFILE_TIPS[profile],
    'Ces informations restent indicatives : contacte un professionnel si tu observes une aggravation ou un doute.',
  ].join('\n\n');
}

const MOCK_DELAY_MS = 350;

export async function sendHealthAssistantMessage(
  payload: HealthChatMessagePayload
): Promise<HealthChatbotResponse> {
  const resolvedProfile =
    payload.profile ?? detectProfile(payload.message ?? payload.context?.lastTopic?.toString() ?? '');
  const profileMetadata = HEALTH_EXPERT_PROFILES.find(profile => profile.id === resolvedProfile);

  const response: HealthChatbotResponse = {
    role: 'assistant',
    profile: resolvedProfile,
    profileLabel: profileMetadata?.label ?? 'Expert santé',
    content: composeAssistantMessage(payload.message, resolvedProfile),
    disclaimer: DEFAULT_DISCLAIMER,
    suggestions: FOLLOW_UP_SUGGESTIONS[resolvedProfile] ?? [],
  };

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
  return response;
}
