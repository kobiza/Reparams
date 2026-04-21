import { test, expect } from './fixtures/extensionFixture';
import { seedStorage } from './helpers/seedStorage';
import { EditorModel } from '../../src/js/types/types';

const SEEDED_MODEL: EditorModel = {
    modelVersion: 1,
    packages: {
        'e2e-pkg': {
            key: 'e2e-pkg',
            label: 'E2E Package',
            conditions: {
                urlPatterns: [{ id: 'u1', value: '*://*/*' }],
                domSelectors: [],
            },
            presets: {},
            paramsWithDelimiter: [],
        },
    },
};

test('creates a new package', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await page.getByRole('button', { name: 'Add Package' }).click();

    await expect(page.getByText('Untitled package')).toBeVisible();
});

test('adds a preset to a package', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Create a package
    await page.getByRole('button', { name: 'Add Package' }).click();
    await expect(page.getByText('Untitled package')).toBeVisible();

    // Expand the accordion by clicking the summary
    await page.getByText('Untitled package').click();

    // Select the Presets tab (it may already be active, but click to be sure)
    await page.getByRole('tab', { name: 'Presets' }).click();

    // Add a preset
    await page.getByRole('button', { name: 'Add Preset' }).click();

    // Fill in the preset name
    await page.getByLabel('Preset name').fill('My E2E Preset');

    await expect(page.getByLabel('Preset name')).toHaveValue('My E2E Preset');
});

test('deletes a package with confirmation', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Create a package
    await page.getByRole('button', { name: 'Add Package' }).click();
    await expect(page.getByText('Untitled package')).toBeVisible();

    // Expand accordion
    await page.getByText('Untitled package').click();

    // Go to Settings tab
    await page.getByRole('tab', { name: 'Settings' }).click();

    // Click Delete Package
    await page.getByRole('button', { name: 'Delete Package' }).click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Yes' }).click();

    await expect(page.getByText('Untitled package')).not.toBeVisible();
});

test('exports packages via clipboard tab', async ({ context, extensionId }) => {
    // Seed a package so the export dialog has something to show
    await seedStorage(context, extensionId, SEEDED_MODEL);

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Open the settings drawer
    await page.getByRole('button', { name: 'menu' }).click();

    // Click Export
    await page.getByText('Export').click();

    // Assert dialog is open
    await expect(page.getByText('Export packages')).toBeVisible();

    // Assert the seeded package label appears inside the dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('E2E Package')).toBeVisible();

    // Click Copy to Clipboard
    await page.getByRole('button', { name: 'Copy to Clipboard' }).click();

    // Dialog should close
    await expect(page.getByText('Export packages')).not.toBeVisible();
});
