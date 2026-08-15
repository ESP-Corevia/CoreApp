import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Accounts created by `pnpm --filter server db:seed:e2e` (see `apps/server/scripts/e2eSeed.ts`).
 * Keep both files in sync: the specs assert on these exact values.
 */
export const E2E_PASSWORD = 'E2ePassword!';

export const E2E_ADMIN = { email: 'e2e-admin@corevia.test', name: 'E2E Admin' };
export const E2E_DOCTOR = { email: 'e2e-doctor@corevia.test', name: 'E2E Doctor' };
export const E2E_PATIENT = { email: 'e2e-patient@corevia.test', name: 'E2E Patient' };

export const ADMIN_STATE = 'e2e/.auth/admin.json';

/**
 * Signs in through the real login form.
 *
 * The success toast is the only signal common to every role: the landing screen differs between
 * patients (public home) and staff (back-office shell).
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Sign in successful')).toBeVisible({ timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/login/);
}
