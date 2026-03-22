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
