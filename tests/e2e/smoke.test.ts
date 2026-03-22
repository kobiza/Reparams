import { test, expect } from './fixtures/extensionFixture';

test('options page loads without errors', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('ReParams - Settings')).toBeVisible();
});
