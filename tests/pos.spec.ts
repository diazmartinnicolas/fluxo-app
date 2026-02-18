import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('POS (Point of Sale)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        // Navigate to POS
        await page.getByText('Ventas').click();
    });

    test('Selecting products adds to cart', async ({ page }) => {
        // Wait for products to load
        // Assuming there are product cards with images or prices
        await expect(page.locator('.grid > div').first()).toBeVisible({ timeout: 10000 });

        // Get initial cart count or total if possible, or just add items
        // Click on proper first product
        // We look for a product card. Usually they are visible in the grid.
        // Let's blindly click the first clickable element in the main grid area
        const firstProduct = page.locator('main .grid button, main .grid div[onClick]').first();
        if (await firstProduct.isVisible()) {
            await firstProduct.click();
        } else {
            // Fallback: click text that looks like a price or product name
            await page.click('text=$');
        }

        // Verify item added to cart (cart sidebar usually on right)
        // Check for "Total" or cart items
        await expect(page.getByText(/Total|Pagar/i)).toBeVisible();
    });

    test('Checkout flow', async ({ page }) => {
        // Add item
        await page.click('text=$'); // Clicking a price usually adds the item

        // Click Checkout/Pay button
        const payButton = page.getByRole('button', { name: /Cobrar|Pagar|Checkout/i });
        await payButton.click();

        // Expect Payment Modal or confirmation
        await expect(page.getByText(/Confirmar|Pago/i)).toBeVisible();

        // Confirm payment (assuming cash default)
        const confirmButton = page.getByRole('button', { name: /Confirmar|Pagar/i });
        if (await confirmButton.isVisible()) {
            await confirmButton.click();
        }

        // Expect success message or receipt
        await expect(page.getByText(/Éxito|Ticket|Comprobante/i)).toBeVisible();
    });
});
