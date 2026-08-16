import { expect } from '@playwright/test';

import { ADMIN_STATE, E2E_ADMIN, E2E_PASSWORD, test as setup, signIn } from './fixtures';

/**
 * Signs the seeded administrator in once and stores the browser state so the back-office specs
 * start authenticated instead of replaying the login form.
 */
setup('authenticate as the seeded administrator', async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_PASSWORD);

  // The back-office is only reachable with the `panel:access` permission of the admin role.
  await page.goto('/appointments');
  await expect(page.getByRole('button', { name: 'Create Appointment' })).toBeVisible({
    timeout: 30_000,
  });

  await page.context().storageState({ path: ADMIN_STATE });
});
