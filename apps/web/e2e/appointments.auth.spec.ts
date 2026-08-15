import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { E2E_DOCTOR, E2E_PATIENT } from './fixtures';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

interface AdminListedUser {
  userId: string | null;
  name: string | null;
}

/**
 * Back-office journey driven through the real UI as the seeded administrator: search the
 * appointment list, move an appointment through its lifecycle, create a new one from the dialog and
 * delete it again.
 *
 * The list is always narrowed with the search box because the database can hold any amount of other
 * appointments; the specs must only ever assert on the seeded fixtures.
 */
test.describe('back-office appointment management', () => {
  /** Resolves the seeded doctor and patient user ids through the admin API. */
  async function seededIds(request: APIRequestContext) {
    const doctorsRes = await request.get(
      `${API_URL}/trpc/admin.listDoctors?input=${encodeURIComponent(
        JSON.stringify({ page: 1, perPage: 50, search: 'E2E' }),
      )}`,
    );
    expect(doctorsRes.ok(), 'admin.listDoctors must answer').toBeTruthy();
    const patientsRes = await request.get(
      `${API_URL}/trpc/admin.listPatients?input=${encodeURIComponent(
        JSON.stringify({ page: 1, perPage: 50, search: 'E2E' }),
      )}`,
    );
    expect(patientsRes.ok(), 'admin.listPatients must answer').toBeTruthy();

    const doctors: AdminListedUser[] = (await doctorsRes.json()).result.data.doctors;
    const patients: AdminListedUser[] = (await patientsRes.json()).result.data.patients;

    const doctorId = doctors.find(entry => entry.name === E2E_DOCTOR.name)?.userId;
    const patientId = patients.find(entry => entry.name === E2E_PATIENT.name)?.userId;

    expect(doctorId, 'seeded doctor must exist — run db:seed:e2e').toBeTruthy();
    expect(patientId, 'seeded patient must exist — run db:seed:e2e').toBeTruthy();

    return { doctorId: doctorId as string, patientId: patientId as string };
  }

  /** Opens the appointment list filtered on the seeded patient. */
  async function openSeededList(page: Page): Promise<Locator> {
    await page.goto('/appointments');
    const search = page.getByRole('textbox', { name: /search by patient or doctor name/i });
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(E2E_PATIENT.name);

    return page.getByRole('row').filter({ hasText: E2E_PATIENT.name });
  }

  function futureDate(daysAhead: number): string {
    return new Date(Date.now() + daysAhead * 86_400_000).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Paris',
    });
  }

  async function createAppointment(
    page: Page,
    {
      doctorId,
      patientId,
      date,
      time,
    }: { doctorId: string; patientId: string; date: string; time: string },
  ): Promise<Locator> {
    await page.getByRole('button', { name: 'Create Appointment' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Appointment' });
    await dialog.getByLabel('Doctor ID').fill(doctorId);
    await dialog.getByLabel('Patient ID').fill(patientId);
    await dialog.getByLabel('Date').fill(date);
    await dialog.getByLabel('Time').click();
    await page.getByRole('option', { name: time, exact: true }).click();
    await dialog.getByRole('button', { name: 'Create Appointment' }).click();

    return dialog;
  }

  async function deleteRow(page: Page, row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'Open appointment menu' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(row).toBeHidden({ timeout: 30_000 });
  }

  test('finds the seeded appointment with its patient, doctor and status', async ({ page }) => {
    const row = await openSeededList(page);

    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText(E2E_DOCTOR.name);
    await expect(row).toContainText('09:00');
    await expect(row.getByText('Pending')).toBeVisible();
  });

  test('confirms then completes an appointment from the actions menu', async ({ page }) => {
    const row = await openSeededList(page);
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole('button', { name: 'Open appointment menu' }).click();
    await page.getByRole('menuitem', { name: 'Confirm' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();

    await expect(row.getByText('Confirmed')).toBeVisible({ timeout: 30_000 });

    await row.getByRole('button', { name: 'Open appointment menu' }).click();
    await page.getByRole('menuitem', { name: 'Complete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Complete' }).click();

    await expect(row.getByText('Completed')).toBeVisible({ timeout: 30_000 });
  });

  test('rejects an appointment form filled with an invalid doctor id', async ({ page }) => {
    await page.goto('/appointments');
    await page.getByRole('button', { name: 'Create Appointment' }).click();

    const dialog = page.getByRole('dialog', { name: 'New Appointment' });
    await dialog.getByLabel('Doctor ID').fill('not-a-uuid');
    await dialog.getByLabel('Patient ID').fill('also-not-a-uuid');

    await expect(dialog.getByText('Valid doctor ID is required')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create Appointment' })).toBeDisabled();
  });

  test('creates an appointment from the dialog and deletes it again', async ({ page }) => {
    const { doctorId, patientId } = await seededIds(page.request);
    const date = futureDate(12);

    const row = await openSeededList(page);
    const dialog = await createAppointment(page, { doctorId, patientId, date, time: '16:30' });
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const createdRow = row.filter({ hasText: '16:30' });
    await expect(createdRow).toBeVisible({ timeout: 30_000 });

    await deleteRow(page, createdRow);
  });

  test('refuses to book a slot that is already taken', async ({ page }) => {
    const { doctorId, patientId } = await seededIds(page.request);
    const date = futureDate(13);
    const slot = { doctorId, patientId, date, time: '17:00' };

    const row = await openSeededList(page);
    const firstDialog = await createAppointment(page, slot);
    await expect(firstDialog).toBeHidden({ timeout: 30_000 });

    const secondDialog = await createAppointment(page, slot);

    await expect(page.getByText(/already booked/i)).toBeVisible({ timeout: 30_000 });
    await expect(secondDialog).toBeVisible();

    // Clean up so the spec can run again against the same database.
    await page.getByRole('button', { name: 'Cancel' }).click();
    await deleteRow(page, row.filter({ hasText: '17:00' }));
  });
});
