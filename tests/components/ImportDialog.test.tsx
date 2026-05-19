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

const mockFetchSequence = (responses: Array<{ ok: boolean; status?: number; body?: unknown; text?: string }>) => {
    const fn = jest.fn();
    responses.forEach((r) => {
        const response = {
            ok: r.ok,
            status: r.status ?? (r.ok ? 200 : 500),
            json: async () => r.body,
            text: async () => r.text ?? JSON.stringify(r.body),
        } as unknown as Response;
        fn.mockResolvedValueOnce(response);
    });
    (global as any).fetch = fn;
    return fn;
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

        await waitFor(() => {
            expect(screen.getByText('Legacy Package')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: /Import Selected/ }));

        expect(addPackages).toHaveBeenCalledTimes(1);
        const [importedPackages, replace] = addPackages.mock.calls[0];
        expect(replace).toBe(false);
        expect(importedPackages['pkg-1']).toBeDefined();
        expect(importedPackages['pkg-1'].label).toBe('Legacy Package');
        // Clipboard import doesn't stamp sourceUrl
        expect(importedPackages['pkg-1'].sourceUrl).toBeUndefined();
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

describe('ImportDialog — From URL tab', () => {
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('plain JSON URL import stamps sourceUrl on imported packages', async () => {
        const url = 'https://example.com/packages.json';
        const body = JSON.stringify({
            modelVersion: 1,
            packages: { 'pkg-x': makePackage('pkg-x', 'Fetched Package') },
        });
        mockFetchSequence([{ ok: true, text: body }]);

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('tab', { name: /From URL/ }));
        await userEvent.type(screen.getByLabelText(/JSON or Gist URL/), url);
        await userEvent.click(screen.getByRole('button', { name: /^Fetch$/ }));

        await waitFor(() => {
            expect(screen.getByText('Fetched Package')).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: /Import Selected/ }));

        expect(addPackages).toHaveBeenCalledTimes(1);
        const [importedPackages] = addPackages.mock.calls[0];
        expect(importedPackages['pkg-x'].sourceUrl).toBe(url);
    });

    test('gist.github.com URL is auto-resolved to unpinned raw URL and stamped as sourceUrl', async () => {
        const gistPageUrl = 'https://gist.github.com/some-user/' + 'a'.repeat(32);
        const rawUrlWithSha = 'https://gist.githubusercontent.com/some-user/' + 'a'.repeat(32) + '/raw/' + 'b'.repeat(40) + '/data.json';
        const expectedUnpinned = 'https://gist.githubusercontent.com/some-user/' + 'a'.repeat(32) + '/raw/data.json';
        const gistApiBody = {
            files: {
                'data.json': { raw_url: rawUrlWithSha },
            },
        };
        const packagesBody = JSON.stringify({
            modelVersion: 1,
            packages: { 'pkg-gist': makePackage('pkg-gist', 'From Gist') },
        });
        const fetchFn = mockFetchSequence([
            { ok: true, body: gistApiBody },  // resolveGistUrl
            { ok: true, text: packagesBody }, // fetchModelFromUrl
        ]);

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('tab', { name: /From URL/ }));
        await userEvent.type(screen.getByLabelText(/JSON or Gist URL/), gistPageUrl);
        await userEvent.click(screen.getByRole('button', { name: /^Fetch$/ }));

        await waitFor(() => {
            expect(screen.getByText('From Gist')).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: /Import Selected/ }));

        expect(fetchFn).toHaveBeenCalledTimes(2);
        // Second fetch is the unpinned URL with a cache-buster query param.
        expect(fetchFn.mock.calls[1][0]).toMatch(new RegExp('^' + expectedUnpinned.replace(/[.]/g, '\\.') + '\\?_t=\\d+$'));
        expect(addPackages).toHaveBeenCalledTimes(1);
        const [importedPackages] = addPackages.mock.calls[0];
        // sourceUrl stays canonical (no cache-buster) — only the fetch is busted.
        expect(importedPackages['pkg-gist'].sourceUrl).toBe(expectedUnpinned);
    });

    test('URL fetch 404 surfaces error and does not call addPackages', async () => {
        mockFetchSequence([{ ok: false, status: 404 }]);

        const addPackages = jest.fn();
        render(
            <ImportDialog
                isOpen
                closeDialog={() => { }}
                packages={{}}
                addPackages={addPackages}
            />
        );

        await userEvent.click(screen.getByRole('tab', { name: /From URL/ }));
        await userEvent.type(screen.getByLabelText(/JSON or Gist URL/), 'https://example.com/missing.json');
        await userEvent.click(screen.getByRole('button', { name: /^Fetch$/ }));

        await waitFor(() => {
            expect(screen.getByText(/Couldn't reach the URL/)).toBeInTheDocument();
        });
        expect(addPackages).not.toHaveBeenCalled();
    });
});
