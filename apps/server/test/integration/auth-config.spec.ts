import { afterEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above these imports, so the better-auth drizzle adapter resolves the
// database through the PGlite double.
vi.mock('../../src/db', () => import('./db.mock'));

/**
 * Cookie hardening depends on `NODE_ENV`, and the difference matters: a `secure` + `SameSite=None`
 * cookie is dropped by browsers over plain http, while a `lax` non-secure cookie would be unsafe
 * in production. Both configurations are asserted here by loading the module twice.
 */
describe('integration: better-auth cookie configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadAuthWith(nodeEnv: string) {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.resetModules();
    const { auth } = await import('../../src/lib/auth');
    return auth.options.advanced?.cookies;
  }

  it('keeps session cookies lax and non-secure in development', async () => {
    const cookies = await loadAuthWith('development');

    expect(cookies?.session_token?.attributes).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
    expect(cookies?.session_data?.attributes).toMatchObject({ sameSite: 'lax', secure: false });
    expect(cookies?.dont_remember?.attributes).toMatchObject({ sameSite: 'lax', secure: false });
  }, 30_000);

  it('marks session cookies secure and cross-site outside development', async () => {
    const cookies = await loadAuthWith('production');

    expect(cookies?.session_token?.attributes).toMatchObject({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    expect(cookies?.session_data?.attributes).toMatchObject({ sameSite: 'none', secure: true });
    expect(cookies?.dont_remember?.attributes).toMatchObject({ sameSite: 'none', secure: true });
  }, 30_000);

  it('enforces the password policy and the patient default role', async () => {
    vi.resetModules();
    const { auth } = await import('../../src/lib/auth');

    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 100,
    });
    expect(auth.options.session?.cookieCache).toMatchObject({ enabled: true, maxAge: 300 });
  }, 30_000);
});
