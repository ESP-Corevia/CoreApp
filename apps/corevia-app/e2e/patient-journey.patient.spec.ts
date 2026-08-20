import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';

import { adminApi, clearAppointmentsOn, resetPillbox, seededIds } from './api';
import { E2E_DOCTOR, parisDate, SEEDED_MEDICATION, test } from './fixtures';

/**
 * Patient journey on the mobile app: home screen, doctor search, booking a slot, then the pillbox.
 *
 * Each test rebuilds the data it consumes through the admin API, so it can be replayed (CI retries)
 * without depending on the state left by a previous run.
 */
test.describe('patient journey', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await adminApi();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('lands on the home screen with the daily summary', async ({ page }) => {
    await page.goto('/patient/home');

    await expect(page.getByText("Today's Medications").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('link', { name: 'Find a Doctor' })).toBeVisible();
  });

  test('finds the seeded doctor by specialty', async ({ page }) => {
    await page.goto('/patient/doctors');

    const search = page.getByRole('searchbox', { name: /search by name, specialty, city/i });
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill('Cardiology');

    const card = page.getByRole('link', { name: `Book with ${E2E_DOCTOR.name}` });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Cardiology');
  });

  test('reports no result for an unknown specialty', async ({ page }) => {
    await page.goto('/patient/doctors');

    const search = page.getByRole('searchbox', { name: /search by name, specialty, city/i });
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill('Astrophysics');

    await expect(page.getByText('No doctors found')).toBeVisible();
  });

  test('books a free slot with the seeded doctor', async ({ page }) => {
    const date = parisDate(9);
    await clearAppointmentsOn(api, date);

    await page.goto('/patient/doctors');
    const search = page.getByRole('searchbox', { name: /search by name, specialty, city/i });
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill('Cardiology');
    await page.getByRole('link', { name: `Book with ${E2E_DOCTOR.name}` }).click();

    await expect(page.getByLabel('1. Pick a date')).toBeVisible();
    await page.getByLabel('1. Pick a date').fill(date);

    const slot = page.getByRole('button', { name: '09:30', exact: true });
    await expect(slot).toBeVisible();
    await slot.click();

    await page.getByLabel('Reason (optional)').fill('E2E mobile booking');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page.getByText('Appointment booked')).toBeVisible({ timeout: 30_000 });

    await page.goto('/patient/appointments');
    const booked = page.getByText('09:30');
    await expect(booked.first()).toBeVisible({ timeout: 30_000 });
  });

  test('hides a slot that is already booked', async ({ page }) => {
    const date = parisDate(11);
    await clearAppointmentsOn(api, date);
    const { doctorId, patientId } = await seededIds(api);

    // Book 10:00 through the API, then check the UI no longer offers it.
    const created = await api.post('/trpc/admin.createAppointment', {
      data: { doctorId, patientId, date, time: '10:00' },
    });
    expect(created.ok()).toBeTruthy();

    await page.goto(`/patient/doctors/${doctorId}/book`);
    await expect(page.getByLabel('1. Pick a date')).toBeVisible({ timeout: 60_000 });
    await page.getByLabel('1. Pick a date').fill(date);

    await expect(page.getByRole('button', { name: '10:30', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '10:00', exact: true })).toBeHidden();
  });

  test('shows the seeded medication and marks the daily intake as taken', async ({ page }) => {
    const { patientId } = await seededIds(api);
    await resetPillbox(api, patientId);

    await page.goto('/patient/pillbox');

    await expect(page.getByText(SEEDED_MEDICATION).first()).toBeVisible({ timeout: 60_000 });

    const markTaken = page.getByRole('button', { name: 'Mark as Taken' }).first();
    await expect(markTaken).toBeVisible();
    await markTaken.click();

    await expect(page.getByText('Taken').first()).toBeVisible({ timeout: 30_000 });
  });

  test('skips the daily intake', async ({ page }) => {
    const { patientId } = await seededIds(api);
    await resetPillbox(api, patientId);

    await page.goto('/patient/pillbox');
    await expect(page.getByText(SEEDED_MEDICATION).first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Skip' }).first().click();

    await expect(page.getByText('Skipped').first()).toBeVisible({ timeout: 30_000 });
  });

  test('refuses the doctor area', async ({ page }) => {
    await page.goto('/doctor/home');

    // `useRoleGuard('doctor')` sends a patient session to the forbidden screen.
    await expect(page).toHaveURL(/\/403/, { timeout: 60_000 });
  });
});
