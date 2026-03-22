import { test, expect } from './fixtures/extensionFixture';
import { EditorModel } from '../../src/js/types/types';

const DOM_SELECTOR = '#reparams-test-element';

const DOM_SELECTOR_MODEL: EditorModel = {
    modelVersion: '1.0',
    packages: {
        'dom-pkg': {
            key: 'dom-pkg',
            label: 'DOM Package',
            conditions: {
                // Also match the popup's playground fallback URL so the package is
                // visible when popup.html is opened as a regular tab (E2E limitation:
                // chrome.tabs.query returns the popup tab itself, not the test page).
                urlPatterns: [{ id: 'u1', value: '*://www.my-site.com/*' }],
                domSelectors: [{ id: 'd1', value: DOM_SELECTOR }],
            },
            presets: {
                'p1': { label: 'DOM Preset', entries: [['source', 'dom']] },
            },
            paramsWithDelimiter: [],
        },
    },
};

test('popup shows DOM-selector-matched package presets', async ({ context, extensionId }) => {
    // Serve a test page containing the known DOM element
    await context.route('https://e2e-test.reparams.local/', route => {
        route.fulfill({
            contentType: 'text/html',
            body: `<html><body><div id="reparams-test-element">test target</div></body></html>`,
        });
    });

    // Navigate to the test page — content script is injected here
    const page1 = await context.newPage();
    await page1.goto('https://e2e-test.reparams.local/');
    await page1.waitForLoadState('domcontentloaded');

    // Seed localStorage from the test page's tab (same extension origin via evaluate is not
    // available from a non-extension page, so open options briefly then come back)
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.evaluate((data) => {
        localStorage.setItem('reparamsAppData', JSON.stringify(data));
    }, DOM_SELECTOR_MODEL);
    await optionsPage.close();

    // Ensure the test page is the active tab so chrome.tabs.query returns it
    await page1.bringToFront();
    // Small wait for content script to be ready
    await page1.waitForTimeout(300);

    // Open the popup — it will query page1 (active tab) for DOM selectors
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('networkidle');

    // If the content script correctly reported the selector, the popup shows the preset picker
    await expect(popupPage.getByPlaceholder('Add preset')).toBeVisible();
});
