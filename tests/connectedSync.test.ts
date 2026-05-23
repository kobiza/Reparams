import { checkConnectedPackagesForUpdates, pullPackageFromSource } from '../src/js/utils/connectedSync';
import { SettingsPackage } from '../src/js/types/types';

const makePackage = (overrides: Partial<SettingsPackage> & { key: string; label: string }): SettingsPackage => ({
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

// Strip the cache-buster query param added by fetchModelFromUrl so test
// fixtures can key by the canonical URL.
const stripCacheBuster = (urlStr: string): string => {
    try {
        const u = new URL(urlStr);
        u.searchParams.delete('_t');
        const out = u.toString();
        return out.endsWith('?') ? out.slice(0, -1) : out;
    } catch {
        return urlStr;
    }
};

const installFetchMap = (map: Record<string, { ok: boolean; text?: string; status?: number }>) => {
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
        const entry = map[stripCacheBuster(url)];
        if (!entry) return Promise.reject(new Error(`unmocked URL ${url}`));
        const response = {
            ok: entry.ok,
            status: entry.status ?? (entry.ok ? 200 : 500),
            text: async () => entry.text ?? '',
        } as unknown as Response;
        return Promise.resolve(response);
    });
};

describe('checkConnectedPackagesForUpdates', () => {
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('dedupes fetches by URL — one HTTP call per unique URL', async () => {
        const url = 'https://example.com/data.json';
        const remoteModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': makePackage({ key: 'pkg-1', label: 'A remote' }),
                'pkg-2': makePackage({ key: 'pkg-2', label: 'B remote' }),
            },
        };
        installFetchMap({ [url]: { ok: true, text: JSON.stringify(remoteModel) } });

        const local = {
            'pkg-1': makePackage({ key: 'pkg-1', label: 'A local', sourceUrl: url }),
            'pkg-2': makePackage({ key: 'pkg-2', label: 'B local', sourceUrl: url }),
        };
        const result = await checkConnectedPackagesForUpdates(local);

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect(result.checked).toBe(2);
        expect(result.autoApplied).toHaveLength(2);
        expect(result.overrideConflicts).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
    });

    test('partitions overridden packages into overrideConflicts', async () => {
        const url = 'https://example.com/data.json';
        const remoteModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': makePackage({ key: 'pkg-1', label: 'remote' }),
                'pkg-2': makePackage({ key: 'pkg-2', label: 'remote' }),
            },
        };
        installFetchMap({ [url]: { ok: true, text: JSON.stringify(remoteModel) } });

        const local = {
            'pkg-1': makePackage({ key: 'pkg-1', label: 'local', sourceUrl: url }),
            'pkg-2': makePackage({ key: 'pkg-2', label: 'local', sourceUrl: url, isOverride: true }),
        };
        const result = await checkConnectedPackagesForUpdates(local);

        expect(result.autoApplied.map(u => u.pkg.key)).toEqual(['pkg-1']);
        expect(result.overrideConflicts.map(u => u.pkg.key)).toEqual(['pkg-2']);
        // Pulling means accepting the source version → drop the local override flag.
        expect(result.overrideConflicts[0].replacement.isOverride).toBeUndefined();
    });

    test('reports package-missing-in-source when key is absent in fetched model', async () => {
        const url = 'https://example.com/data.json';
        installFetchMap({
            [url]: {
                ok: true,
                text: JSON.stringify({ modelVersion: 1, packages: {} }),
            },
        });

        const local = {
            'pkg-1': makePackage({ key: 'pkg-1', label: 'local', sourceUrl: url }),
        };
        const result = await checkConnectedPackagesForUpdates(local);

        expect(result.autoApplied).toHaveLength(0);
        expect(result.errors).toEqual([{ packageKey: 'pkg-1', reason: 'package-missing-in-source' }]);
    });

    test('reports fetch failures for packages with that URL only', async () => {
        const goodUrl = 'https://example.com/good.json';
        const badUrl = 'https://example.com/bad.json';
        installFetchMap({
            [goodUrl]: {
                ok: true,
                text: JSON.stringify({
                    modelVersion: 1,
                    packages: { 'pkg-1': makePackage({ key: 'pkg-1', label: 'remote' }) },
                }),
            },
            [badUrl]: { ok: false, status: 404 },
        });

        const local = {
            'pkg-1': makePackage({ key: 'pkg-1', label: 'local', sourceUrl: goodUrl }),
            'pkg-2': makePackage({ key: 'pkg-2', label: 'local', sourceUrl: badUrl }),
        };
        const result = await checkConnectedPackagesForUpdates(local);

        expect(result.autoApplied.map(u => u.pkg.key)).toEqual(['pkg-1']);
        expect(result.errors.map(e => e.packageKey)).toEqual(['pkg-2']);
    });

    test('ignores packages without sourceUrl', async () => {
        installFetchMap({});
        const local = {
            'pkg-1': makePackage({ key: 'pkg-1', label: 'local' }),
        };
        const result = await checkConnectedPackagesForUpdates(local);
        expect(result.checked).toBe(0);
        expect((global as any).fetch).not.toHaveBeenCalled();
    });
});

describe('pullPackageFromSource', () => {
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('returns replacement that preserves key/sourceUrl and drops isOverride', async () => {
        const url = 'https://example.com/data.json';
        const remoteModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': makePackage({ key: 'pkg-1', label: 'remote' }),
            },
        };
        installFetchMap({ [url]: { ok: true, text: JSON.stringify(remoteModel) } });

        const local = makePackage({ key: 'pkg-1', label: 'local', sourceUrl: url, isOverride: true });
        const result = await pullPackageFromSource(local);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.replacement.key).toBe('pkg-1');
            expect(result.replacement.sourceUrl).toBe(url);
            // After pull, the package is back in sync with the source — no override.
            expect(result.replacement.isOverride).toBeUndefined();
            expect(result.replacement.label).toBe('remote');
        }
    });

    test('returns package-missing-in-source when fetched model has no matching key', async () => {
        const url = 'https://example.com/data.json';
        installFetchMap({
            [url]: {
                ok: true,
                text: JSON.stringify({ modelVersion: 1, packages: {} }),
            },
        });
        const local = makePackage({ key: 'pkg-1', label: 'local', sourceUrl: url });
        const result = await pullPackageFromSource(local);
        expect(result).toEqual({ ok: false, reason: 'package-missing-in-source' });
    });
});
