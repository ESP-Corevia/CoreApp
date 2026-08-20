import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

/**
 * CSS animations make elements move while Playwright waits for them to be "stable", which times
 * out clicks on Radix dialogs and dropdowns on slow machines (observed on the CI runner, never
 * locally). Every spec therefore imports this `test` instead of the one from `@playwright/test`.
 */
const DISABLE_ANIMATIONS_CSS = `*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}`;

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(css => {
      const inject = () => {
        const style = document.createElement('style');
        style.setAttribute('data-e2e', 'disable-animations');
        style.textContent = css;
        document.head.append(style);
      };

      if (document.head) {
        inject();
      } else {
        document.addEventListener('DOMContentLoaded', inject, { once: true });
      }
    }, DISABLE_ANIMATIONS_CSS);

    await use(page);
  },
});

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
