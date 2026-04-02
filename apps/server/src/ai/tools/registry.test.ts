import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getSystemPromptForRole, ROLES } from './registry';

// ---------------------------------------------------------------------------
// Hash-based snapshot for role definitions.
// If a role's tools, scope, refusal, or extra text changes, the hash changes
// and this test will fail — signaling that the system prompt needs review.
// To update: run `pnpm test -- --update` or replace the hash below.
// ---------------------------------------------------------------------------

function hashRole(role: string): string {
  const def = ROLES[role];
  if (!def) return '';
  return createHash('sha256').update(JSON.stringify(def)).digest('hex').slice(0, 12);
}

const EXPECTED_HASHES: Record<string, string> = {
  patient: 'bec1a987092f',
  doctor: '7609623714ba',
  admin: '23bec7a4d03b',
};

describe('AI registry — role definitions', () => {
  it.each(Object.keys(EXPECTED_HASHES))('role "%s" definition matches expected hash', role => {
    expect(hashRole(role)).toBe(EXPECTED_HASHES[role]);
  });
});

describe('getSystemPromptForRole', () => {
  it('returns a fallback prompt for unknown roles', () => {
    const prompt = getSystemPromptForRole('unknown');
    expect(prompt).toContain('no tools');
    expect(prompt).toContain('Refuse all requests');
  });

  it.each(['patient', 'doctor', 'admin'])('generates a prompt for role "%s"', role => {
    const prompt = getSystemPromptForRole(role);
    const def = ROLES[role];

    // Contains the role's tool names
    for (const tool of def.tools) {
      expect(prompt).toContain(tool);
    }

    // Contains scope description
    expect(prompt).toContain(def.scope);

    // Contains refusal text
    expect(prompt).toContain(def.refusal);

    // Contains required structural sections
    expect(prompt).toContain('## Your tools');
    expect(prompt).toContain('## Scope');
    expect(prompt).toContain('## Rules');
    expect(prompt).toContain('## Examples');

    // Contains Corevia branding
    expect(prompt).toContain('Corevia Assistant');
  });

  it('prompts include emoji and markdown instructions', () => {
    const prompt = getSystemPromptForRole('admin');
    expect(prompt).toContain('emojis');
    expect(prompt).toContain('markdown');
  });

  it('prompts include prompt injection protection', () => {
    const prompt = getSystemPromptForRole('admin');
    expect(prompt).toContain('prompt injection');
    expect(prompt).toContain('ignore rules');
  });

  it('prompts include language instruction', () => {
    const prompt = getSystemPromptForRole('patient');
    expect(prompt).toContain('same language');
    expect(prompt).toContain('French');
  });
});
