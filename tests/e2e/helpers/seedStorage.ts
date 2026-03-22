import { BrowserContext } from '@playwright/test';
import { EditorModel } from '../../../src/js/types/types';

/**
 * Seeds the extension's localStorage with the given EditorModel data.
 * All extension pages (options.html, popup.html) share the same origin,
 * so data seeded here is visible across all of them.
 */
export async function seedStorage(
    context: BrowserContext,
    extensionId: string,
    data: EditorModel
): Promise<void> {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.evaluate((d) => {
        localStorage.setItem('reparamsAppData', JSON.stringify(d));
    }, data);
    await page.close();
}

/**
 * Clears the extension's localStorage.
 */
export async function clearStorage(
    context: BrowserContext,
    extensionId: string
): Promise<void> {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.evaluate(() => localStorage.clear());
    await page.close();
}
