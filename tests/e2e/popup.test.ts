import { test, expect } from './fixtures/extensionFixture';
import { seedStorage } from './helpers/seedStorage';
import { EditorModel } from '../../src/js/types/types';

function makeModel(presetLabel: string, entries: [string, string][] = []): EditorModel {
    return {
        modelVersion: '1.0',
        packages: {
            'popup-pkg': {
                key: 'popup-pkg',
                label: 'Popup Package',
                conditions: {
                    urlPatterns: [{ id: 'u1', value: '*://*/*' }],
                    domSelectors: [],
                },
                presets: {
                    'preset-1': { label: presetLabel, entries },
                },
                paramsWithDelimiter: [],
            },
        },
    };
}

test('shows preset picker when packages exist in localStorage', async ({ context, extensionId }) => {
    await seedStorage(context, extensionId, makeModel('Test Preset'));

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(page.getByPlaceholder('Add preset')).toBeVisible();
});

test('applying a preset adds params to the URL display', async ({ context, extensionId }) => {
    await seedStorage(context, extensionId, makeModel('Staging Preset', [['env', 'staging']]));

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Open the preset picker and select the preset
    await page.getByPlaceholder('Add preset').click();
    await page.getByRole('option', { name: 'Staging Preset' }).click();

    // The param value should appear in the URL param list — the new entry is added last
    await expect(page.getByPlaceholder('Value').last()).toHaveValue('staging');
});

// E2E note: the extension only has `activeTab` (not `tabs`) permission, so
// chrome.tabs.query returns tabs without a `url` field in non-user-invoked contexts.
// The popup falls back to playgroundUrl ('https://www.my-site.com/...').
// URL-pattern tests use that known URL as the anchor for matching.

function makeUrlSpecificModel(pattern: string): EditorModel {
    return {
        modelVersion: '1.0',
        packages: {
            'url-pkg': {
                key: 'url-pkg',
                label: 'URL Package',
                conditions: {
                    urlPatterns: [{ id: 'u1', value: pattern }],
                    domSelectors: [],
                },
                presets: {
                    'p1': { label: 'URL Preset', entries: [['source', 'url-match']] },
                },
                paramsWithDelimiter: [],
            },
        },
    };
}

test('shows preset picker when URL pattern matches the current tab URL', async ({ context, extensionId }) => {
    // *://www.my-site.com/* matches the popup's playground fallback URL
    await seedStorage(context, extensionId, makeUrlSpecificModel('*://www.my-site.com/*'));

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder('Add preset')).toBeVisible();
});

test('does not show preset picker when URL pattern does not match the current tab URL', async ({ context, extensionId }) => {
    // *://example.com/* does not match the popup's playground fallback URL
    await seedStorage(context, extensionId, makeUrlSpecificModel('*://example.com/*'));

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder('Add preset')).not.toBeVisible();
});
