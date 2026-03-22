/**
 * Medication Form Normalization
 *
 * Maps raw pharmaceutical form labels from API Médicaments FR (BDPM)
 * into 4 canonical categories for emoji icon rendering.
 */

export const MEDICATION_FORMS = [
  'TABLET_CAPSULE',
  'SYRUP_LIQUID',
  'INJECTABLE',
  'DROPS',
  'UNKNOWN',
] as const;

export type MedicationForm = (typeof MEDICATION_FORMS)[number];

// Order matters: specific categories first, broad fallback last.
const NORMALIZATION_RULES: readonly [readonly string[], MedicationForm][] = [
  // Syrups and oral liquids (before TABLET_CAPSULE to catch "poudre pour suspension buvable")
  [
    [
      'sirop',
      'syrup',
      'suspension buvable',
      'solution buvable',
      'oral solution',
      'oral suspension',
      'oral liquid',
      'émulsion buvable',
      'emulsion buvable',
      'poudre pour suspension buvable',
    ],
    'SYRUP_LIQUID',
  ],
  // Injectables (before TABLET_CAPSULE to catch "poudre pour solution injectable")
  [
    [
      'injectable',
      'injection',
      'solution pour injection',
      'poudre pour solution injectable',
      'lyophilisat',
      'solution pour perfusion',
      'perfusion',
      'suspension injectable',
      'seringue',
      'syringe',
    ],
    'INJECTABLE',
  ],
  // Drops
  [
    [
      'collyre',
      'gouttes',
      'drops',
      'instillation',
      'solution ophtalmique',
      'solution auriculaire',
      'solution nasale',
      'eye drops',
      'nasal drops',
    ],
    'DROPS',
  ],
  // Everything else falls into TABLET_CAPSULE (💊 fallback for all solid/topical/other forms)
  [
    [
      'comprimé',
      'comprime',
      'gélule',
      'gelule',
      'capsule',
      'tablet',
      'dragée',
      'dragee',
      'pastille',
      'lozenge',
      'pilule',
      'crème',
      'creme',
      'cream',
      'pommade',
      'ointment',
      'gel',
      'suppositoire',
      'suppository',
      'ovule',
      'patch',
      'transdermique',
      'transdermal',
      'poudre',
      'powder',
      'sachet',
      'granulés',
      'granules',
      'spray',
      'aérosol',
      'aerosol',
      'inhalation',
      'inhaler',
    ],
    'TABLET_CAPSULE',
  ],
];

export function normalizeForm(rawForm: string | null | undefined): MedicationForm {
  if (!rawForm || rawForm.trim() === '') return 'UNKNOWN';

  const lower = rawForm.toLowerCase().trim();

  for (const [patterns, category] of NORMALIZATION_RULES) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        return category;
      }
    }
  }

  return 'UNKNOWN';
}

export function getIconKey(form: MedicationForm): string {
  return form.toLowerCase().replace(/_/g, '-');
}
