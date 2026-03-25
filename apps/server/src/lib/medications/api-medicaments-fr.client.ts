import { z } from 'zod';

import { env } from '../../env';
import { logger } from '../logger';

import { getIconKey, normalizeForm } from './medication-forms';

const RawCompositionSchema = z.object({
  cis: z.number().optional(),
  elementPharmaceutique: z.string().optional(),
  codeSubstance: z.number().optional(),
  denominationSubstance: z.string().optional(),
  dosage: z.string().optional(),
  referenceDosage: z.string().optional(),
  natureComposant: z.string().optional(),
});

const RawPresentationSchema = z.object({
  cis: z.number().optional(),
  cip7: z.number().optional(),
  libelle: z.string().optional(),
  statusAdministratif: z.string().optional(),
  etatComercialisation: z.string().optional(),
  dateDeclaration: z.string().optional(),
  cip13: z.number().optional(),
  agreement: z.string().optional(),
  tauxRemboursement: z.string().optional(),
  prix: z.number().nullable().optional(),
});

const RawMedicamentSchema = z.object({
  cis: z.number(),
  elementPharmaceutique: z.string(),
  formePharmaceutique: z.string().optional(),
  voiesAdministration: z.array(z.string()).nullable().optional(),
  statusAutorisation: z.string().optional(),
  typeProcedure: z.string().optional(),
  etatComercialisation: z.string().optional(),
  dateAMM: z.string().optional(),
  titulaire: z.string().optional(),
  surveillanceRenforcee: z.string().optional(),
  composition: z.array(RawCompositionSchema).nullable().optional(),
  generiques: z.unknown().nullable().optional(),
  presentation: z.array(RawPresentationSchema).nullable().optional(),
  conditions: z.array(z.string()).nullable().optional(),
});

// ─── Internal Normalized Model ──────────────────────────────────────────────

export interface MedicationSearchResult {
  externalId: string | null;
  cis: string | null;
  cip: string | null;
  name: string;
  shortLabel: string;
  form: string | null;
  route: string | null;
  status: string | null;
  marketingStatus: string | null;
  reimbursementRate: string | null;
  price: string | null;
  laboratory: string | null;
  activeSubstances: string[];
  normalizedForm: string;
  iconKey: string;
  source: 'api-medicaments-fr';
}

export interface MedicationSearchResponse {
  items: MedicationSearchResult[];
  total: number;
  page: number;
  limit: number;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

const searchCache = new Map<string, { data: MedicationSearchResponse; expiresAt: number }>();
const detailCache = new Map<string, { data: MedicationSearchResult; expiresAt: number }>();

function getCacheTTL(): number {
  return env.API_MEDICAMENTS_CACHE_TTL;
}

function cacheKey(query: string, page: number, limit: number): string {
  return `${query}:${page}:${limit}`;
}

// ─── Mapping ────────────────────────────────────────────────────────────────

function mapToInternal(raw: z.infer<typeof RawMedicamentSchema>): MedicationSearchResult {
  // Extract active substances from composition
  const activeSubstances = (raw.composition ?? [])
    .filter(c => c.natureComposant === 'SA' && c.denominationSubstance)
    .map(c => c.denominationSubstance as string)
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  // Get first presentation for price/reimbursement/CIP
  const firstPresentation = raw.presentation?.[0];

  const name = raw.elementPharmaceutique;
  const cis = String(raw.cis);

  return {
    externalId: cis,
    cis,
    cip: firstPresentation?.cip13 ? String(firstPresentation.cip13) : null,
    name,
    shortLabel: name.length > 80 ? `${name.substring(0, 77)}...` : name,
    form: raw.formePharmaceutique ?? null,
    route: raw.voiesAdministration?.join(', ') ?? null,
    status: raw.statusAutorisation ?? null,
    marketingStatus: raw.etatComercialisation ?? null,
    reimbursementRate: firstPresentation?.tauxRemboursement ?? null,
    price: firstPresentation?.prix != null ? String(firstPresentation.prix) : null,
    laboratory: raw.titulaire ?? null,
    activeSubstances,
    normalizedForm: normalizeForm(raw.formePharmaceutique ?? null) as string,
    iconKey: getIconKey(normalizeForm(raw.formePharmaceutique ?? null)),
    source: 'api-medicaments-fr',
  };
}

// ─── Provider Factory ───────────────────────────────────────────────────────

export function createMedicationsProvider() {
  const baseUrl = env.API_MEDICAMENTS_URL;
  const timeout = env.API_MEDICAMENTS_TIMEOUT;

  async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    /**
     * Search medications by name.
     * Uses paginated endpoint GET /v1/medicaments?page=X&pageSize=Y
     * combined with search GET /v1/medicaments?search=X (returns flat array, max 250).
     *
     * Strategy: use `search` param for filtering, which returns a flat array (max 250).
     * We do client-side pagination on the result.
     */
    async search(
      query: string,
      page: number = 1,
      limit: number = 20,
    ): Promise<MedicationSearchResponse> {
      const key = cacheKey(query, page, limit);
      const cached = searchCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug({ query, page }, 'Medications search cache hit');
        return cached.data;
      }

      // Strip accents and format query for the API (words separated by +)
      const sanitized = query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      const url = `${baseUrl}/v1/medicaments?search=${encodeURIComponent(sanitized)}`;
      logger.info({ url }, 'Fetching medications from external API');

      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          if (response.status === 404) {
            const empty: MedicationSearchResponse = { items: [], total: 0, page, limit };
            searchCache.set(key, { data: empty, expiresAt: Date.now() + getCacheTTL() });
            return empty;
          }
          logger.error({ status: response.status, url }, 'External API error');
          throw new Error(`API returned ${response.status}`);
        }

        const json = await response.json();

        // Search endpoint returns a flat array
        const RawArraySchema = z.array(RawMedicamentSchema);
        const parsed = RawArraySchema.safeParse(json);

        if (!parsed.success) {
          logger.warn(
            { errors: parsed.error.flatten() },
            'Partial parse failure from external API',
          );
        }

        const allItems = (parsed.success ? parsed.data : []).map(mapToInternal);
        const total = allItems.length;

        // Client-side pagination
        const offset = (page - 1) * limit;
        const items = allItems.slice(offset, offset + limit);

        const result: MedicationSearchResponse = { items, total, page, limit };

        searchCache.set(key, { data: result, expiresAt: Date.now() + getCacheTTL() });

        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          logger.error({ url, timeout }, 'External API timeout');
          throw new Error('Medications API timeout');
        }
        throw error;
      }
    },

    /**
     * Get a single medication by CIS code, CIP code, or external ID.
     * - CIS: GET /v1/medicaments/{cis}
     * - CIP: GET /v1/medicaments?cip={cip}
     */
    async getByCode(params: {
      cis?: string;
      cip?: string;
      externalId?: string;
    }): Promise<MedicationSearchResult | null> {
      const code = params.cis ?? params.externalId ?? params.cip;
      if (!code) return null;

      const cached = detailCache.get(code);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }

      let url: string;
      if (params.cis || params.externalId) {
        // CIS lookup — direct endpoint
        const cis = params.cis ?? (params.externalId as string);
        url = `${baseUrl}/v1/medicaments/${encodeURIComponent(cis)}`;
      } else {
        // CIP lookup — search by CIP param
        url = `${baseUrl}/v1/medicaments?cip=${encodeURIComponent(params.cip as string)}`;
      }

      logger.info({ url }, 'Fetching medication detail from external API');

      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`API returned ${response.status}`);
        }

        const json = await response.json();

        // CIS returns a single object, CIP search returns an array
        const raw = Array.isArray(json) ? json[0] : json;
        if (!raw) return null;

        const parsed = RawMedicamentSchema.safeParse(raw);
        if (!parsed.success) {
          logger.warn({ errors: parsed.error.flatten() }, 'Parse failure for medication detail');
          return null;
        }

        const result = mapToInternal(parsed.data);
        detailCache.set(code, { data: result, expiresAt: Date.now() + getCacheTTL() });

        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Medications API timeout');
        }
        throw error;
      }
    },

    clearCache() {
      searchCache.clear();
      detailCache.clear();
    },
  };
}

export type MedicationsProvider = ReturnType<typeof createMedicationsProvider>;
