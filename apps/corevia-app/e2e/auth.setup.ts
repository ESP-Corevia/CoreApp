import { expect } from '@playwright/test';

import {
  DOCTOR_STATE,
  E2E_DOCTOR,
  E2E_PATIENT,
  PATIENT_STATE,
  test as setup,
  signIn,
} from './fixtures';

/**
 * Signs the seeded patient and doctor in once each and stores their browser state, so the journey
 * specs start authenticated instead of replaying the login form.
 */
setup('authenticate as the seeded patient', async ({ page }) => {
  await signIn(page, E2E_PATIENT.email);

  // The patient landing screen is only reachable with a complete patient profile.
  await expect(page).toHaveURL(/\/patient\/home/, { timeout: 30_000 });

  await page.context().storageState({ path: PATIENT_STATE });
});

setup('authenticate as the seeded doctor', async ({ page }) => {
  await signIn(page, E2E_DOCTOR.email);

  await expect(page).toHaveURL(/\/doctor\/home/, { timeout: 30_000 });

  await page.context().storageState({ path: DOCTOR_STATE });
});
