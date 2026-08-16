import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

/**
 * CSS animations make elements move while Playwright waits for them to be "stable", which times out
 * clicks on Radix dialogs, sheets and dropdowns on slow machines. Every spec therefore imports this
 * `test` instead of the one from `@playwright/test`.
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

export const E2E_PATIENT = { email: 'e2e-patient@corevia.test', name: 'E2E Patient' };
export const E2E_NEW_PATIENT = { email: 'e2e-new-patient@corevia.test', name: 'E2E New Patient' };
export const E2E_DOCTOR = { email: 'e2e-doctor@corevia.test', name: 'E2E Doctor' };
export const E2E_UNVERIFIED_DOCTOR = {
  email: 'e2e-unverified-doctor@corevia.test',
  name: 'E2E Unverified Doctor',
};

export const PATIENT_STATE = 'e2e/.auth/patient.json';
export const DOCTOR_STATE = 'e2e/.auth/doctor.json';

/** The medication seeded in the patient pillbox. */
export const SEEDED_MEDICATION = 'Doliprane 1000 mg';

/** Signs in through the real login form and waits for the success toast. */
export async function signIn(page: Page, email: string, password = E2E_PASSWORD): Promise<void> {
  await page.goto('/login');
  // The very first navigation waits for the on-demand Vite build of the whole app.
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 60_000 });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Signed in successfully')).toBeVisible({ timeout: 30_000 });
}

/** `YYYY-MM-DD` in the Europe/Paris timezone, the timezone the booking rules use. */
export function parisDate(daysAhead = 0): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Paris',
  });
}
