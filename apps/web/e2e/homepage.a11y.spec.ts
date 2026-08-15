import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility gate for the entry screen. An anonymous visitor is always routed to the login form,
 * so that is the surface scanned here.
 *
 * The dev-only TanStack Query devtools widget is excluded: it is not part of a production bundle.
 * Only `serious` and `critical` findings fail the build; lower-impact findings are printed so they
 * stay visible without blocking.
 */
test.describe('Login page accessibility @a11y', () => {
  test('has no serious or critical accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({
      timeout: 30_000,
    });

    const results = await new AxeBuilder({ page })
      .exclude('#tsqd-parent-container')
      .exclude('.tsqd-parent-container')
      .analyze();

    const blocking = results.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical',
    );
    const advisory = results.violations.filter(
      violation => violation.impact !== 'serious' && violation.impact !== 'critical',
    );

    if (advisory.length > 0) {
      test.info().annotations.push({
        type: 'a11y-advisory',
        description: advisory.map(violation => `${violation.id} (${violation.impact})`).join(', '),
      });
    }

    expect(
      blocking.map(violation => ({ id: violation.id, nodes: violation.nodes.length })),
    ).toEqual([]);
  });
});
