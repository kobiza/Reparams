/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PackageGistLinkActions from '../../src/js/components/options/PackageGistLinkActions';
import { SettingsPackage } from '../../src/js/types/types';

const makeLinkedPackage = (overrides: Partial<SettingsPackage> = {}): SettingsPackage => ({
    key: 'pkg-1',
    label: 'Linked Package',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    gistId: 'a'.repeat(32),
    gistRevision: 'sha-old',
    ...overrides,
});

describe('PackageGistLinkActions — Unlink', () => {
    test('Unlink button opens confirmation; Yes triggers unlinkPackage', async () => {
        const unlinkPackage = jest.fn();
        const addPackages = jest.fn();
        render(
            <PackageGistLinkActions
                packageData={makeLinkedPackage()}
                addPackages={addPackages}
                unlinkPackage={unlinkPackage}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Unlink/ }));
        // Confirmation dialog
        expect(screen.getByText(/will become editable again/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /^Yes$/ }));
        expect(unlinkPackage).toHaveBeenCalledTimes(1);
        expect(unlinkPackage).toHaveBeenCalledWith('pkg-1');
    });

    test('Unlink confirmation No does not call unlinkPackage', async () => {
        const unlinkPackage = jest.fn();
        const addPackages = jest.fn();
        render(
            <PackageGistLinkActions
                packageData={makeLinkedPackage()}
                addPackages={addPackages}
                unlinkPackage={unlinkPackage}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Unlink/ }));
        await userEvent.click(screen.getByRole('button', { name: /^No$/ }));
        expect(unlinkPackage).not.toHaveBeenCalled();
    });
});
