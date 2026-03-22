import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv = vi.hoisted(() => ({
  API_MEDICAMENTS_URL: 'https://api.test.local',
  API_MEDICAMENTS_TIMEOUT: 5000,
  API_MEDICAMENTS_CACHE_TTL: 60000,
}));

vi.mock('../../env', () => ({
  env: mockEnv,
}));

vi.mock('../logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { createMedicationsProvider } from './api-medicaments-fr.client';

const rawMed = {
  cis: 60234100,
  elementPharmaceutique: 'DOLIPRANE 500 mg, comprimé',
  formePharmaceutique: 'comprimé',
  voiesAdministration: ['orale'],
  statusAutorisation: 'Autorisé',
  etatComercialisation: 'Commercialisée',
  titulaire: 'SANOFI',
  composition: [
    { denominationSubstance: 'PARACÉTAMOL', natureComposant: 'SA' },
    { denominationSubstance: 'AMIDON', natureComposant: 'FT' },
  ],
  presentation: [{ cip13: 3400930234567, tauxRemboursement: '65%', prix: 2.18 }],
};

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

describe('createMedicationsProvider', () => {
  let provider: ReturnType<typeof createMedicationsProvider>;

  beforeEach(() => {
    provider = createMedicationsProvider();
    provider.clearCache();
    vi.restoreAllMocks();
  });

  describe('search()', () => {
    it('returns parsed results from API', async () => {
      global.fetch = mockFetchOk([rawMed]);

      const result = await provider.search('doliprane');

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);

      const item = result.items[0];
      expect(item.externalId).toBe('60234100');
      expect(item.cis).toBe('60234100');
      expect(item.cip).toBe('3400930234567');
      expect(item.name).toBe('DOLIPRANE 500 mg, comprimé');
      expect(item.form).toBe('comprimé');
      expect(item.route).toBe('orale');
      expect(item.status).toBe('Autorisé');
      expect(item.marketingStatus).toBe('Commercialisée');
      expect(item.reimbursementRate).toBe('65%');
      expect(item.price).toBe('2.18');
      expect(item.laboratory).toBe('SANOFI');
      expect(item.activeSubstances).toEqual(['PARACÉTAMOL']);
      expect(item.source).toBe('api-medicaments-fr');
    });

    it('strips accents from query', async () => {
      global.fetch = mockFetchOk([]);

      await provider.search('éàü');

      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('search=eau');
    });

    it('returns cached result on second call', async () => {
      global.fetch = mockFetchOk([rawMed]);

      await provider.search('doliprane');
      const result = await provider.search('doliprane');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
    });

    it('client-side pagination works (page 2)', async () => {
      const meds = Array.from({ length: 3 }, (_, i) => ({
        ...rawMed,
        cis: 60234100 + i,
        elementPharmaceutique: `Med ${i}`,
      }));
      global.fetch = mockFetchOk(meds);

      const result = await provider.search('test', 2, 2);

      expect(result.total).toBe(3);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Med 2');
    });

    it('throws on non-ok response', async () => {
      global.fetch = mockFetchError(500);

      await expect(provider.search('test')).rejects.toThrow('API returned 500');
    });

    it('returns empty items on parse failure (invalid data)', async () => {
      global.fetch = mockFetchOk([{ invalid: true }]);

      const result = await provider.search('test');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('wraps AbortError as timeout error', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(provider.search('test')).rejects.toThrow('Medications API timeout');
    });

    it('re-throws non-abort errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      await expect(provider.search('test')).rejects.toThrow('Network failure');
    });

    it('aborts fetch when timeout fires', async () => {
      mockEnv.API_MEDICAMENTS_TIMEOUT = 10;
      provider = createMedicationsProvider();

      global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      });

      await expect(provider.search('timeout-test')).rejects.toThrow('Medications API timeout');
      mockEnv.API_MEDICAMENTS_TIMEOUT = 5000;
    });
  });

  describe('getByCode()', () => {
    it('returns null when no code provided', async () => {
      const result = await provider.getByCode({});
      expect(result).toBeNull();
    });

    it('fetches by CIS code (direct endpoint)', async () => {
      global.fetch = mockFetchOk(rawMed);

      const result = await provider.getByCode({ cis: '60234100' });

      expect(result).not.toBeNull();
      expect(result!.cis).toBe('60234100');
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe('https://api.test.local/v1/medicaments/60234100');
    });

    it('fetches by CIP code (search endpoint)', async () => {
      global.fetch = mockFetchOk([rawMed]);

      const result = await provider.getByCode({ cip: '3400930234567' });

      expect(result).not.toBeNull();
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe('https://api.test.local/v1/medicaments?cip=3400930234567');
    });

    it('fetches by externalId', async () => {
      global.fetch = mockFetchOk(rawMed);

      const result = await provider.getByCode({ externalId: '60234100' });

      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('60234100');
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe('https://api.test.local/v1/medicaments/60234100');
    });

    it('returns cached result on second call', async () => {
      global.fetch = mockFetchOk(rawMed);

      await provider.getByCode({ cis: '60234100' });
      const result = await provider.getByCode({ cis: '60234100' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
    });

    it('returns null on 404', async () => {
      global.fetch = mockFetchError(404);

      const result = await provider.getByCode({ cis: '99999' });
      expect(result).toBeNull();
    });

    it('throws on non-404 error response', async () => {
      global.fetch = mockFetchError(500);

      await expect(provider.getByCode({ cis: '60234100' })).rejects.toThrow('API returned 500');
    });

    it('returns null on empty array response (CIP search)', async () => {
      global.fetch = mockFetchOk([]);

      const result = await provider.getByCode({ cip: '0000000000000' });
      expect(result).toBeNull();
    });

    it('returns null on parse failure', async () => {
      global.fetch = mockFetchOk({ invalid: 'data' });

      const result = await provider.getByCode({ cis: '60234100' });
      expect(result).toBeNull();
    });

    it('wraps AbortError as timeout error', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(provider.getByCode({ cis: '60234100' })).rejects.toThrow(
        'Medications API timeout',
      );
    });

    it('re-throws non-abort errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      await expect(provider.getByCode({ cis: '60234100' })).rejects.toThrow('Network failure');
    });
  });

  describe('mapToInternal (tested via search)', () => {
    it('extracts active substances (SA only, deduplicated)', async () => {
      const med = {
        ...rawMed,
        composition: [
          { denominationSubstance: 'PARACÉTAMOL', natureComposant: 'SA' },
          { denominationSubstance: 'PARACÉTAMOL', natureComposant: 'SA' },
          { denominationSubstance: 'AMIDON', natureComposant: 'FT' },
        ],
      };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].activeSubstances).toEqual(['PARACÉTAMOL']);
    });

    it('truncates long names to shortLabel', async () => {
      const longName = 'A'.repeat(100);
      const med = { ...rawMed, elementPharmaceutique: longName };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].shortLabel).toBe('A'.repeat(77) + '...');
      expect(result.items[0].name).toBe(longName);
    });

    it('handles missing presentation (null cip, price, reimbursement)', async () => {
      const med = { ...rawMed, presentation: null };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      const item = result.items[0];
      expect(item.cip).toBeNull();
      expect(item.price).toBeNull();
      expect(item.reimbursementRate).toBeNull();
    });

    it('handles null voiesAdministration', async () => {
      const med = { ...rawMed, voiesAdministration: null };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].route).toBeNull();
    });

    it('handles missing voiesAdministration', async () => {
      const { voiesAdministration: _, ...med } = rawMed;
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].route).toBeNull();
    });

    it('handles missing composition', async () => {
      const med = { ...rawMed, composition: null };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].activeSubstances).toEqual([]);
    });

    it('handles missing formePharmaceutique', async () => {
      const { formePharmaceutique: _, ...med } = rawMed;
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].form).toBeNull();
    });

    it('handles presentation with null prix', async () => {
      const med = {
        ...rawMed,
        presentation: [{ cip13: 3400930234567, tauxRemboursement: '65%', prix: null }],
      };
      global.fetch = mockFetchOk([med]);

      const result = await provider.search('test');
      expect(result.items[0].price).toBeNull();
    });

    it('handles missing optional fields', async () => {
      const minimalMed = {
        cis: 12345,
        elementPharmaceutique: 'Test Med',
      };
      global.fetch = mockFetchOk([minimalMed]);

      const result = await provider.search('test');
      const item = result.items[0];
      expect(item.form).toBeNull();
      expect(item.route).toBeNull();
      expect(item.status).toBeNull();
      expect(item.marketingStatus).toBeNull();
      expect(item.laboratory).toBeNull();
      expect(item.cip).toBeNull();
      expect(item.price).toBeNull();
      expect(item.reimbursementRate).toBeNull();
    });
  });

  describe('clearCache()', () => {
    it('clears both caches so subsequent calls refetch', async () => {
      global.fetch = mockFetchOk([rawMed]);

      await provider.search('doliprane');
      await provider.getByCode({ cis: '60234100' });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      provider.clearCache();

      global.fetch = mockFetchOk([rawMed]);
      await provider.search('doliprane');
      await provider.getByCode({ cis: '60234100' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
