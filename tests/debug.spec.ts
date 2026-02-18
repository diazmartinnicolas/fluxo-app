import { test } from '@playwright/test';
import fs from 'fs';

test('Debug UI state', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(`CONSOLE: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`PAGE ERROR: ${err}`));

    console.log('Navigating to /');
    await page.goto('/');
    logs.push('Navigated to /');

    await page.waitForTimeout(5000);
    logs.push('Waited 5s');

    const spinner = await page.locator('text=Cargando Fluxo').isVisible();
    logs.push(`Spinner visible: ${spinner}`);

    const loginInput = await page.locator('input[type="email"]').isVisible();
    logs.push(`Email input visible: ${loginInput}`);

    const bodyHTML = await page.content();
    logs.push(`Body length: ${bodyHTML.length}`);

    fs.writeFileSync('debug_logs.txt', logs.join('\n'));
    fs.writeFileSync('debug_body_last.html', bodyHTML);
});
