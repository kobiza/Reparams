/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportDialog from '../../src/js/components/options/ImportDialog';
import { SettingsPackage } from '../../src/js/types/types';

const makePackage = (key: string, label: string): SettingsPackage => ({
    key,
    label,
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
});

const setClipboardText = (text: string) => {
    (navigator as any).clipboard = {
        readText: jest.fn().mockResolvedValue(text),
    };
};

describe('ImportDialog — clipboard import with migrateModel', () => {
    test('legacy-shape import migrates to current-version packages', async () => {
        const legacyBlob = JSON.stringify({
            modelVersion: '1.0',
            packages: { 'pkg-1': makePackage('pkg-1', 'Legacy Package') },
        });
        setClipboardText(legacyBlob);

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Read from Clipboard/ }));

        // After the fetched data is parsed, the checkbox list renders with the legacy package
        await waitFor(() => {
            expect(screen.getByText('Legacy Package')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: /Import Selected/ }));

        expect(addPackages).toHaveBeenCalledTimes(1);
        const [importedPackages, replace] = addPackages.mock.calls[0];
        expect(replace).toBe(false);
        expect(importedPackages['pkg-1']).toBeDefined();
        expect(importedPackages['pkg-1'].label).toBe('Legacy Package');
    });

    test('legacy array-shape import migrates to map', async () => {
        const legacyArray = JSON.stringify([makePackage('pkg-a', 'Array Pkg')]);
        setClipboardText(legacyArray);

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Read from Clipboard/ }));

        await waitFor(() => {
            expect(screen.getByText('Array Pkg')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: /Import Selected/ }));

        expect(addPackages).toHaveBeenCalledTimes(1);
        const [importedPackages] = addPackages.mock.calls[0];
        expect(importedPackages['pkg-a'].key).toBe('pkg-a');
    });
});

describe('ImportDialog — error surfacing', () => {
    test('malformed JSON shows parse error and does not call addPackages', async () => {
        setClipboardText('not-json-at-all');

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Read from Clipboard/ }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid JSON format/)).toBeInTheDocument();
        });
        expect(addPackages).not.toHaveBeenCalled();
    });

    test('future-version import shows upgrade-required error', async () => {
        setClipboardText(JSON.stringify({ modelVersion: 999, packages: {} }));

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Read from Clipboard/ }));

        await waitFor(() => {
            expect(screen.getByText(/newer extension version/i)).toBeInTheDocument();
        });
        expect(addPackages).not.toHaveBeenCalled();
    });
});
