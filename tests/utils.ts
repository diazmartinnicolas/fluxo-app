import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
    console.log('Login: Navigating...');
    await page.goto('/login');

    // Wait for loading to finish if present
    try {
        await expect(page.locator('text=Cargando Fluxo')).toBeVisible({ timeout: 2000 });
        await page.locator('text=Cargando Fluxo').waitFor({ state: 'hidden', timeout: 30000 });
    } catch (e) {
        // Spinner might not have appeared or already gone
    }

    // Try Demo Login Button first as it's more reliable for testing
    const demoButton = page.getByText('Acceso Demo (Invitado)');
    if (await demoButton.isVisible()) {
        console.log('Login: Clicking Demo Access...');
        await demoButton.click();
    } else {
        console.log('Login: Demo button not found, trying credentials...');
        await page.locator('input[type="email"]').fill('demo@fluxo.com');
        await page.locator('input[type="password"]').fill('fluxo123');
        await page.locator('button[type="submit"]').click();
    }

    // Wait for dashboard
    console.log('Login: Waiting for dashboard...');
    await expect(page.locator('aside')).toBeVisible({ timeout: 30000 });
    console.log('Login: Success.');
}
