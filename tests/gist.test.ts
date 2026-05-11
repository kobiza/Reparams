/**
 * @jest-environment jsdom
 */
import { fetchGist, parseGistInput } from '../src/js/utils/gist';

describe('parseGistInput', () => {
    test('accepts a raw hex ID', () => {
        const id = 'a'.repeat(32);
        expect(parseGistInput(id)).toBe(id);
    });

    test('accepts an uppercase hex ID', () => {
        const id = 'ABCDEF1234567890'.repeat(2);
        expect(parseGistInput(id)).toBe(id);
    });

    test('extracts the ID from a gist.github.com URL with a user segment', () => {
        const id = 'b'.repeat(32);
        expect(parseGistInput(`https://gist.github.com/some-user/${id}`)).toBe(id);
    });

    test('extracts the ID from a gist.github.com URL without a user segment', () => {
        const id = 'c'.repeat(32);
        expect(parseGistInput(`https://gist.github.com/${id}`)).toBe(id);
    });

    test('trims surrounding whitespace', () => {
        const id = 'd'.repeat(32);
        expect(parseGistInput(`   ${id}\n`)).toBe(id);
    });

    test('returns null for a non-gist URL', () => {
        expect(parseGistInput('https://github.com/user/repo')).toBeNull();
    });

    test('returns null for garbage input', () => {
        expect(parseGistInput('not-a-gist')).toBeNull();
    });

    test('returns null for empty input', () => {
        expect(parseGistInput('   ')).toBeNull();
    });
});

const mockFetchResponse = (init: { ok: boolean; status?: number; body?: unknown }): Response => ({
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    json: async () => init.body,
} as unknown as Response);

const validPackageJson = JSON.stringify({
    modelVersion: 1,
    packages: {
        'pkg-a': {
            key: 'pkg-a',
            label: 'Package A',
            conditions: { urlPatterns: [], domSelectors: [] },
            presets: {},
            paramsWithDelimiter: [],
        },
    },
});

describe('fetchGist', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;
    });

    afterEach(() => {
        delete (global as any).fetch;
    });

    test('happy path: returns migrated model and revision SHA', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({
            ok: true,
            body: {
                files: { 'data.json': { content: validPackageJson } },
                history: [{ version: 'sha1' }],
            },
        }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.revision).toBe('sha1');
            expect(result.model.packages['pkg-a']?.key).toBe('pkg-a');
        }
    });

    test('returns invalid-input without calling fetch when input is unparseable', async () => {
        const result = await fetchGist('not-a-gist');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('invalid-input');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('returns fetch-failed with httpStatus on 404', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 404 }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe('fetch-failed');
            expect(result.httpStatus).toBe(404);
        }
    });

    test('returns fetch-failed when fetch itself rejects', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('fetch-failed');
    });

    test('returns no-json-file when the Gist contains no .json file', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({
            ok: true,
            body: {
                files: { 'README.md': { content: '# readme' } },
                history: [{ version: 'sha1' }],
            },
        }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('no-json-file');
    });

    test('returns parse when the JSON file content is malformed', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({
            ok: true,
            body: {
                files: { 'data.json': { content: 'not-json' } },
                history: [{ version: 'sha1' }],
            },
        }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('parse');
    });

    test('returns future-version when modelVersion exceeds CURRENT_MODEL_VERSION', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({
            ok: true,
            body: {
                files: { 'data.json': { content: JSON.stringify({ modelVersion: 999, packages: {} }) } },
                history: [{ version: 'sha1' }],
            },
        }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('future-version');
    });

    test('returns fetch-failed when the JSON file is truncated', async () => {
        fetchMock.mockResolvedValue(mockFetchResponse({
            ok: true,
            body: {
                files: { 'data.json': { content: '{}', truncated: true } },
                history: [{ version: 'sha1' }],
            },
        }));

        const result = await fetchGist('a'.repeat(32));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('fetch-failed');
    });
});
