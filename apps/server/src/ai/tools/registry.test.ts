import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getSystemPromptForRole, getToolsForRole, ROLES } from './registry';

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

describe('getToolsForRole', () => {
  it('returns patient tools for patient sessions', () => {
    const tools = getToolsForRole(
      'patient',
      {
        caller: {
          appointments: { listMine: async () => [] },
          pillbox: { today: async () => [] },
        },
      } as never,
    );

    expect(tools.map(tool => tool.name)).toEqual(['get_my_appointments', 'get_my_today_pillbox']);
  });

  it('returns doctor tools for doctor sessions', () => {
    const tools = getToolsForRole(
      'doctor',
      {
        caller: {
          doctor: {
            appointments: {
              listMine: async () => [],
              detail: async () => ({}),
              updateStatus: async () => ({}),
            },
          },
        },
      } as never,
    );

    expect(tools.map(tool => tool.name)).toEqual([
      'get_my_appointments',
      'get_appointment_detail',
      'update_appointment_status',
    ]);
  });

  it('returns admin tools for admin sessions', () => {
    const tools = getToolsForRole(
      'admin',
      {
        caller: {
          admin: {
            listUsers: async () => [],
            listAppointments: async () => [],
            listDoctors: async () => [],
            listPatients: async () => [],
            adminListPillbox: async () => [],
            adminTodayByPatient: async () => [],
            createAppointment: async () => ({}),
            updateAppointment: async () => ({}),
            deleteAppointment: async () => ({}),
            updateAppointmentStatus: async () => ({}),
            createDoctor: async () => ({}),
            updateDoctor: async () => ({}),
            createPatient: async () => ({}),
            updatePatient: async () => ({}),
            deletePatient: async () => ({}),
          },
          auth: {},
          headers: new Headers(),
        },
        auth: {
          api: {
            adminUpdateUser: async () => ({}),
            banUser: async () => ({}),
            unbanUser: async () => ({}),
            removeUser: async () => ({}),
            setUserPassword: async () => ({}),
            userHasPermission: async () => ({}),
          },
        },
        headers: new Headers(),
      } as never,
    );

    expect(tools.map(tool => tool.name)).toEqual([
      'list_users',
      'list_appointments',
      'list_doctors',
      'list_patients',
      'list_medications',
      'get_patient_today_pillbox',
      'check_user_permission',
      'create_appointment',
      'update_appointment',
      'delete_appointment',
      'update_appointment_status',
      'create_doctor',
      'update_doctor',
      'create_patient',
      'update_patient',
      'delete_patient',
      'update_user',
      'ban_user',
      'unban_user',
      'remove_user',
      'set_user_password',
    ]);
  });

  it('returns no tools for unknown roles', () => {
    expect(getToolsForRole('visitor', {} as never)).toEqual([]);
  });
});
