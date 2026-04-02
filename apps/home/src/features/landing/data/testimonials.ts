export interface Testimonial {
  name: string;
  role: string;
  initials: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Marie D.',
    role: 'Patiente diabétique de type 2',
    initials: 'MD',
    quote:
      "Depuis que j'utilise Corevia, je ne rate plus aucune prise d'insuline. Le suivi de ma glycémie est devenu simple et rassurant. Mon diabétologue a même remarqué l'amélioration de mes résultats.",
    rating: 5,
  },
  {
    name: 'Dr. Thomas R.',
    role: 'Médecin généraliste',
    initials: 'TR',
    quote:
      "Je recommande Corevia à mes patients qui ont besoin d'un suivi régulier. L'application leur donne de l'autonomie tout en me permettant de garder un œil sur leurs constantes. Un vrai gain de temps pour tous.",
    rating: 5,
  },
  {
    name: 'Sophie L.',
    role: 'Utilisatrice soucieuse de sa santé',
    initials: 'SL',
    quote:
      "Je n'ai pas de maladie chronique, mais j'aime suivre ma tension et mon bien-être général. Corevia est intuitif, les conseils sont pertinents, et je me sens plus en contrôle de ma santé au quotidien.",
    rating: 5,
  },
];
