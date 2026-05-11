/**
 * @jest-environment jsdom
 */
import { checkForUpdates, syncPackage } from '../src/js/utils/gistSync';
import { SettingsPackage } from '../src/js/types/types';

const makePackage = (overrides: Partial<SettingsPackage> & Pick<SettingsPackage, 'key' | 'label'>): SettingsPackage => ({
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

const mockFetchResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}): Response => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
} as unknown as Response);

const gistBody = (packagesObj: { [k: string]: SettingsPackage }, version: string) => ({
    files: { 'data.json': { content: JSON.stringify({ modelVersion: 1, packages: packagesObj }) } },
    history: [{ version }],
});

describe('syncPackage', () => {
    let fetchMock: jest.Mock;
    beforeEach(() => {
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;
    });
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('returns up-to-date when fetched SHA equals stored gistRevision', async () => {
        const pkg = makePackage({ key: 'a', label: 'A', gistId: 'a'.repeat(32), gistRevision: 'sha1' });
        fetchMock.mockResolvedValue(mockFetchResponse(gistBody({ a: pkg }, 'sha1')));

        const result = await syncPackage(pkg);
        expect(result.outcome.kind).toBe('up-to-date');
        expect(result.replacement).toBeUndefined();
    });

    test('returns synced with replacement when SHAs differ', async () => {
        const stored = makePackage({ key: 'a', label: 'Old', gistId: 'a'.repeat(32), gistRevision: 'sha1' });
        const remote = makePackage({ key: 'a', label: 'New' });
        fetchMock.mockResolvedValue(mockFetchResponse(gistBody({ a: remote }, 'sha2')));

        const result = await syncPackage(stored);
        expect(result.outcome.kind).toBe('synced');
        if (result.outcome.kind === 'synced') {
            expect(result.outcome.newRevision).toBe('sha2');
        }
        expect(result.replacement?.label).toBe('New');
        expect(result.replacement?.gistId).toBe('a'.repeat(32));
        expect(result.replacement?.gistRevision).toBe('sha2');
    });

    test('returns package-missing-in-gist when the key is gone from the Gist', async () => {
        const stored = makePackage({ key: 'gone', label: 'Gone', gistId: 'a'.repeat(32), gistRevision: 'sha1' });
        fetchMock.mockResolvedValue(mockFetchResponse(gistBody({ other: makePackage({ key: 'other', label: 'Other' }) }, 'sha2')));

        const result = await syncPackage(stored);
        expect(result.outcome.kind).toBe('error');
        if (result.outcome.kind === 'error') {
            expect(result.outcome.reason).toBe('package-missing-in-gist');
        }
    });

    test('returns error with fetch-failed reason on HTTP 404', async () => {
        const stored = makePackage({ key: 'a', label: 'A', gistId: 'a'.repeat(32), gistRevision: 'sha1' });
        fetchMock.mockResolvedValue(mockFetchResponse({}, { ok: false, status: 404 }));

        const result = await syncPackage(stored);
        expect(result.outcome.kind).toBe('error');
        if (result.outcome.kind === 'error') {
            expect(result.outcome.reason).toBe('fetch-failed');
        }
    });

    test('returns invalid-input when gistId or gistRevision is missing', async () => {
        const noLink = makePackage({ key: 'a', label: 'A' });
        const result = await syncPackage(noLink);
        expect(result.outcome.kind).toBe('error');
        if (result.outcome.kind === 'error') {
            expect(result.outcome.reason).toBe('invalid-input');
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('checkForUpdates', () => {
    let fetchMock: jest.Mock;
    beforeEach(() => {
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;
    });
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('fetches each unique gistId exactly once (dedupe)', async () => {
        const gistA = 'a'.repeat(32);
        const gistB = 'b'.repeat(32);
        const pkg1 = makePackage({ key: 'p1', label: 'P1', gistId: gistA, gistRevision: 'oldA' });
        const pkg2 = makePackage({ key: 'p2', label: 'P2', gistId: gistA, gistRevision: 'oldA' });
        const pkg3 = makePackage({ key: 'p3', label: 'P3', gistId: gistB, gistRevision: 'oldB' });

        fetchMock.mockImplementation((url: string) => {
            if (url.includes(gistA)) {
                return Promise.resolve(mockFetchResponse(gistBody({ p1: pkg1, p2: pkg2 }, 'newA')));
            }
            return Promise.resolve(mockFetchResponse(gistBody({ p3: pkg3 }, 'newB')));
        });

        const result = await checkForUpdates({ p1: pkg1, p2: pkg2, p3: pkg3 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.checked).toBe(3);
        expect(result.outOfDate).toHaveLength(3);
    });

    test('skips packages without gistId', async () => {
        const linked = makePackage({ key: 'linked', label: 'Linked', gistId: 'a'.repeat(32), gistRevision: 'old' });
        const unlinked = makePackage({ key: 'unlinked', label: 'Unlinked' });
        fetchMock.mockResolvedValue(mockFetchResponse(gistBody({ linked }, 'new')));

        const result = await checkForUpdates({ linked, unlinked });
        expect(result.checked).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('records errors per package but does not abort the rest', async () => {
        const gistA = 'a'.repeat(32);
        const gistBroken = 'b'.repeat(32);
        const okPkg = makePackage({ key: 'ok', label: 'OK', gistId: gistA, gistRevision: 'old' });
        const errPkg = makePackage({ key: 'err', label: 'Err', gistId: gistBroken, gistRevision: 'old' });
        fetchMock.mockImplementation((url: string) => {
            if (url.includes(gistA)) return Promise.resolve(mockFetchResponse(gistBody({ ok: okPkg }, 'new')));
            return Promise.resolve(mockFetchResponse({}, { ok: false, status: 404 }));
        });

        const result = await checkForUpdates({ ok: okPkg, err: errPkg });
        expect(result.outOfDate).toHaveLength(1);
        expect(result.outOfDate[0].pkg.key).toBe('ok');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].packageKey).toBe('err');
        expect(result.errors[0].reason).toBe('fetch-failed');
    });
});
