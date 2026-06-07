import { test, expect } from '@playwright/test';

// In keyless mode (no Supabase keys), sign-up must create a device-local
// account and route the user into onboarding — no email confirmation.
// Locators use placeholders, which match SignupForm/LoginForm exactly.
test.describe('keyless accounts', () => {
  test('sign-up creates a local account and routes to onboarding', async ({ page }) => {
    await page.goto('/signup');
    const email = `e2e_${Date.now()}@example.com`;
    await page.getByPlaceholder('Tiger Woods').fill('E2E Tester');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('At least 8 characters').fill('test-password-123');
    await page.getByRole('button', { name: /create.*account/i }).click();
    await expect(page).toHaveURL(/\/start/, { timeout: 10_000 });
  });

  test('sign-in with the wrong password is rejected', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('nobody@example.com');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  });
});
