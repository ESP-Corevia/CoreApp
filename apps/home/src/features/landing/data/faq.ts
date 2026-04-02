export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Corevia est-il gratuit ?',
    answer:
      'Oui, Corevia est entièrement gratuit pour les fonctionnalités essentielles : suivi des constantes, rappels de traitement et conseils bien-être. Des fonctionnalités avancées comme la téléconsultation peuvent impliquer des frais liés au professionnel de santé consulté.',
  },
  {
    question: 'Mes données de santé sont-elles protégées ?',
    answer:
      'Absolument. Vos données sont chiffrées de bout en bout (AES-256), hébergées sur des serveurs certifiés pour les données de santé et conformes au RGPD. Vous gardez le contrôle total : vous pouvez exporter ou supprimer vos données à tout moment.',
  },
  {
    question: "L'assistant IA peut-il remplacer mon médecin ?",
    answer:
      "Non, et ce n'est pas son objectif. L'assistant IA de Corevia vous aide à mieux comprendre vos symptômes et à préparer vos consultations. Il ne pose jamais de diagnostic. Pour toute question médicale, consultez toujours un professionnel de santé.",
  },
  {
    question: "À qui s'adresse Corevia ?",
    answer:
      "Corevia est conçu pour tous : les personnes atteintes de maladies chroniques (diabète, hypertension...) qui ont besoin d'un suivi régulier, et les adultes soucieux de leur santé qui souhaitent mieux suivre leur bien-être au quotidien.",
  },
  {
    question: 'Comment fonctionne la téléconsultation ?',
    answer:
      "Vous choisissez un créneau avec un professionnel de santé disponible, et la consultation se déroule en vidéo, audio ou chat directement dans l'application. La connexion est sécurisée et chiffrée, et votre historique médical est accessible pendant la consultation.",
  },
  {
    question: 'Puis-je utiliser Corevia pour toute ma famille ?',
    answer:
      'Chaque membre de votre famille peut créer son propre compte Corevia avec ses données personnelles, ses rappels et son suivi individualisé. Les données de chaque compte sont strictement séparées et protégées.',
  },
];
