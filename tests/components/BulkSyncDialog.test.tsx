/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkSyncDialog from '../../src/js/components/options/BulkSyncDialog';
import { SettingsPackage } from '../../src/js/types/types';

const makePackage = (overrides: Partial<SettingsPackage> & Pick<SettingsPackage, 'key' | 'label'>): SettingsPackage => ({
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

const mockResponse = (body: unknown, ok = true, status = 200): Response => ({
    ok,
    status,
    json: async () => body,
} as unknown as Response);

const gistBody = (pkgs: { [k: string]: SettingsPackage }, version: string) => ({
    files: { 'data.json': { content: JSON.stringify({ modelVersion: 1, packages: pkgs }) } },
    history: [{ version }],
});

describe('BulkSyncDialog', () => {
    let fetchMock: jest.Mock;
    beforeEach(() => {
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;
    });
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('three linked packages across two Gists → exactly 2 fetches, tally shows updates count', async () => {
        const gistA = 'a'.repeat(32);
        const gistB = 'b'.repeat(32);
        const p1 = makePackage({ key: 'p1', label: 'P1', gistId: gistA, gistRevision: 'oldA' });
        const p2 = makePackage({ key: 'p2', label: 'P2', gistId: gistA, gistRevision: 'oldA' });
        const p3 = makePackage({ key: 'p3', label: 'P3', gistId: gistB, gistRevision: 'newB' });

        fetchMock.mockImplementation((url: string) => {
            if (url.includes(gistA)) return Promise.resolve(mockResponse(gistBody({ p1, p2 }, 'newA')));
            return Promise.resolve(mockResponse(gistBody({ p3 }, 'newB')));
        });

        const addPackages = jest.fn();
        render(
            <BulkSyncDialog
                isOpen
                onClose={() => { }}
                packages={{ p1, p2, p3 }}
                addPackages={addPackages}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/2 of 3 linked packages have updates/)).toBeInTheDocument();
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        // P1 and P2 should be listed as out of date; P3 is up to date
        expect(screen.getByText('P1')).toBeInTheDocument();
        expect(screen.getByText('P2')).toBeInTheDocument();
        expect(screen.queryByText('P3')).not.toBeInTheDocument();
    });

    test('Sync all out-of-date calls addPackages with replacements and no additional fetches', async () => {
        const gistA = 'a'.repeat(32);
        const p1 = makePackage({ key: 'p1', label: 'P1 Old', gistId: gistA, gistRevision: 'oldA' });
        const remoteP1 = makePackage({ key: 'p1', label: 'P1 New' });
        fetchMock.mockResolvedValue(mockResponse(gistBody({ p1: remoteP1 }, 'newA')));

        const addPackages = jest.fn();
        render(
            <BulkSyncDialog
                isOpen
                onClose={() => { }}
                packages={{ p1 }}
                addPackages={addPackages}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/1 of 1 linked package has updates/)).toBeInTheDocument();
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await userEvent.click(screen.getByRole('button', { name: /Sync all out-of-date/ }));

        expect(addPackages).toHaveBeenCalledTimes(1);
        const [replacements, replace] = addPackages.mock.calls[0];
        expect(replace).toBe(true);
        expect(replacements.p1.label).toBe('P1 New');
        expect(replacements.p1.gistRevision).toBe('newA');
        // No additional network calls during Sync all
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('shows zero-update message when everything is up to date', async () => {
        const gistA = 'a'.repeat(32);
        const p1 = makePackage({ key: 'p1', label: 'P1', gistId: gistA, gistRevision: 'sha1' });
        fetchMock.mockResolvedValue(mockResponse(gistBody({ p1 }, 'sha1')));

        const addPackages = jest.fn();
        render(
            <BulkSyncDialog
                isOpen
                onClose={() => { }}
                packages={{ p1 }}
                addPackages={addPackages}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/0 of 1 linked package has updates/)).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /Sync all out-of-date/ })).toBeDisabled();
    });
});
