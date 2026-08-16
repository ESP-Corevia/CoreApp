import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';

import { adminApi, resetPillbox, resetTodaysAppointment, type SeededIds, seededIds } from './api';
import { E2E_PATIENT, SEEDED_MEDICATION, test } from './fixtures';

/**
 * Doctor journey on the mobile app: today's agenda, the appointment lifecycle, and the read-only
 * view of a patient pillbox.
 *
 * The appointment of the day is recreated before each test through the admin API, so status changes
 * never leak from one test (or one retry) to the next.
 */
test.describe('doctor journey', () => {
  let api: APIRequestContext;
  let ids: SeededIds;

  test.beforeAll(async () => {
    api = await adminApi();
    ids = await seededIds(api);
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test.beforeEach(async () => {
    await resetTodaysAppointment(api, ids);
  });

  test("lists today's appointment on the home screen", async ({ page }) => {
    await page.goto('/doctor/home');

    await expect(page.getByText("Today's Appointments")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(E2E_PATIENT.name).first()).toBeVisible();
    await expect(page.getByText('17:30').first()).toBeVisible();
  });

  test('confirms a pending appointment', async ({ page }) => {
    await page.goto('/doctor/appointments');

    const card = page.getByText(E2E_PATIENT.name).first();
    await expect(card).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Confirm' }).first().click();

    await expect(page.getByText('Confirmed').first()).toBeVisible({ timeout: 30_000 });
  });

  test('completes an appointment once it is confirmed', async ({ page }) => {
    await page.goto('/doctor/appointments');
    await expect(page.getByText(E2E_PATIENT.name).first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Confirm' }).first().click();
    await expect(page.getByText('Confirmed').first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Complete' }).first().click();

    await expect(page.getByText('Completed').first()).toBeVisible({ timeout: 30_000 });
  });

  test('cancels a pending appointment', async ({ page }) => {
    await page.goto('/doctor/appointments');
    await expect(page.getByText(E2E_PATIENT.name).first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Cancel' }).first().click();

    await expect(page.getByText('Cancelled').first()).toBeVisible({ timeout: 30_000 });
  });

  test('opens the appointment detail from the agenda', async ({ page }) => {
    await page.goto('/doctor/appointments');
    await expect(page.getByText(E2E_PATIENT.name).first()).toBeVisible({ timeout: 60_000 });

    await page.getByText(E2E_PATIENT.name).first().click();

    await expect(page).toHaveURL(/\/doctor\/appointments\/[0-9a-f-]{36}/, { timeout: 30_000 });
    await expect(page.getByText(E2E_PATIENT.name).first()).toBeVisible();
  });

  test('reads the pillbox of a patient', async ({ page }) => {
    await resetPillbox(api, ids.patientId);

    await page.goto(`/doctor/patients/${ids.patientId}/pillbox`);

    await expect(page.getByText('Patient Medications')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(SEEDED_MEDICATION).first()).toBeVisible();
  });

  test('refuses the patient area', async ({ page }) => {
    await page.goto('/patient/home');

    // `useRoleGuard('patient')` sends a doctor session to the forbidden screen.
    await expect(page).toHaveURL(/\/403/, { timeout: 60_000 });
  });
});
