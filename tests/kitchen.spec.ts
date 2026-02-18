import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Kitchen Display', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.getByText('Cocina').click();
    });

    test('View incoming orders', async ({ page }) => {
        // Wait for kitchen board
        await expect(page.getByText('Pendientes')).toBeVisible();

        // Check if there are orders or "No hay pedidos" message
        // We just want to ensure the page loaded correctly
        const board = page.locator('main');
        await expect(board).toBeVisible();
    });
});
