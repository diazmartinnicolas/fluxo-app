import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Authentication', () => {
    test('Login with valid credentials reaches dashboard', async ({ page }) => {
        await login(page);

        // Verify successful login by checking URL or dashboard element
        await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

        // Check for dashboard indicator (Sidebar)
        await expect(page.locator('aside')).toBeVisible();
    });

    test('Invalid credentials show error', async ({ page }) => {
        await page.goto('/login');

        // Wait for inputs
        await page.locator('input[type="email"]').waitFor({ state: 'visible' });

        await page.locator('input[type="email"]').fill('invalid@example.com');
        await page.locator('input[type="password"]').fill('WrongPass!');
        await page.locator('button[type="submit"]').click();

        // Expect error message container
        // Using a broad text match for error messages
        await expect(page.getByText(/error|incorrect|invalid|credenciales/i)).toBeVisible();

        await expect(page).toHaveURL(/\/login/);
    });
});
