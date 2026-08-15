import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_PASSWORD, E2E_PATIENT, signIn } from './fixtures';

/**
 * Guest journey: the login form and the guard protecting the back-office.
 */
test.describe('sign-in and route protection', () => {
  test('redirects an anonymous visitor away from the back-office', async ({ page }) => {
    await page.goto('/appointments');

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('blocks submission of a malformed email address', async ({ page }) => {
    await page.goto('/login');

    const email = page.getByLabel('Email');
    await email.fill('not-an-email');
    await page.getByLabel('Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // The email input is type="email": the browser blocks the submit before the form validator
    // runs, so the request is never sent and the user stays on the login page.
    const validity = await email.evaluate(node => {
      const input = node as HTMLInputElement;
      return { valid: input.validity.valid, typeMismatch: input.validity.typeMismatch };
    });
    expect(validity).toEqual({ valid: false, typeMismatch: true });
    await expect(page.getByText('Sign in successful')).toBeHidden();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows a validation error for a password below the minimum length', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(E2E_ADMIN.email);
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('rejects a wrong password without signing the user in', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(E2E_ADMIN.email);
    await page.getByLabel('Password').fill(`${E2E_PASSWORD}-wrong`);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('signs the administrator in and back out again', async ({ page }) => {
    await signIn(page, E2E_ADMIN.email, E2E_PASSWORD);

    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Signing out drops the session, so the guarded shell sends the browser back to the form.
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('keeps a patient account out of the back-office', async ({ page }) => {
    await signIn(page, E2E_PATIENT.email, E2E_PASSWORD);

    await page.goto('/appointments');

    // The patient role has no `panel:access` permission: the guard moves it off the page.
    await expect(page).not.toHaveURL(/\/appointments/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Appointments Management' })).toBeHidden();
  });
});
