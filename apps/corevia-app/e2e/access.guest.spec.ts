import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';

import { adminApi, findUserId, removePatientProfile } from './api';
import {
  E2E_NEW_PATIENT,
  E2E_PASSWORD,
  E2E_PATIENT,
  E2E_UNVERIFIED_DOCTOR,
  signIn,
  test,
} from './fixtures';

/**
 * Access journeys: authentication, the three guards of the app (session, role, account state) and
 * signing out.
 */
test.describe('access and guards', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await adminApi();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('sends an anonymous visitor to the login screen', async ({ page }) => {
    await page.goto('/patient/home');

    await expect(page).toHaveURL(/\/login/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 60_000 });

    await page.getByLabel('Email').fill(E2E_PATIENT.email);
    await page.getByLabel('Password').fill(`${E2E_PASSWORD}-wrong`);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('routes a patient to the patient home', async ({ page }) => {
    await signIn(page, E2E_PATIENT.email);

    await expect(page).toHaveURL(/\/patient\/home/, { timeout: 30_000 });
  });

  test('keeps an unverified doctor on the pending verification screen', async ({ page }) => {
    await signIn(page, E2E_UNVERIFIED_DOCTOR.email);

    await expect(page).toHaveURL(/\/doctor\/pending-verification/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Verification Pending' }).first()).toBeVisible();
  });

  test('walks a new patient through onboarding', async ({ page }) => {
    // Removing the profile first makes the test replayable: onboarding only shows up while the
    // patient has no profile.
    const userId = await findUserId(api, E2E_NEW_PATIENT.name);
    await removePatientProfile(api, userId);

    await signIn(page, E2E_NEW_PATIENT.email);

    await expect(page).toHaveURL(/\/patient\/onboarding/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Complete Your Profile' })).toBeVisible();

    await page.getByLabel('Date of Birth').fill('1994-05-17');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Female' }).click();
    await page.getByLabel('Phone').fill('+33600000000');
    await page.getByLabel('Address').fill('3 rue des Tests, Paris');
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    await expect(page).toHaveURL(/\/patient\/home/, { timeout: 30_000 });
  });

  test('signs a patient out from the settings screen', async ({ page }) => {
    await signIn(page, E2E_PATIENT.email);

    await page.goto('/patient/settings');
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sign Out' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });
});
