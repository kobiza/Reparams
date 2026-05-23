import { isGistUrl, resolveGistUrl } from '../src/js/utils/sourceUrl';

describe('isGistUrl', () => {
    test('returns true for a gist.github.com URL', () => {
        expect(isGistUrl('https://gist.github.com/some-user/' + 'a'.repeat(32))).toBe(true);
    });

    test('returns false for other hosts', () => {
        expect(isGistUrl('https://github.com/user/repo')).toBe(false);
        expect(isGistUrl('https://example.com/packages.json')).toBe(false);
    });

    test('returns false for invalid URL strings', () => {
        expect(isGistUrl('not-a-url')).toBe(false);
        expect(isGistUrl('')).toBe(false);
    });
});

const mockFetchOnce = (init: { ok: boolean; status?: number; body?: unknown }) => {
    const response = {
        ok: init.ok,
        status: init.status ?? (init.ok ? 200 : 500),
        json: async () => init.body,
    } as unknown as Response;
    (global as any).fetch = jest.fn().mockResolvedValue(response);
};

describe('resolveGistUrl', () => {
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('returns unpinned raw URL by stripping the revision SHA', async () => {
        const gistId = 'a'.repeat(32);
        const sha = 'b'.repeat(40);
        mockFetchOnce({
            ok: true,
            body: {
                files: {
                    'data.json': {
                        raw_url: `https://gist.githubusercontent.com/user/${gistId}/raw/${sha}/data.json`,
                    },
                },
            },
        });
        const result = await resolveGistUrl(`https://gist.github.com/user/${gistId}`);
        expect(result).toEqual({
            ok: true,
            rawUrl: `https://gist.githubusercontent.com/user/${gistId}/raw/data.json`,
        });
    });

    test('returns invalid-input for a URL with no gist ID segment', async () => {
        const result = await resolveGistUrl('https://gist.github.com/user/');
        expect(result).toEqual({ ok: false, reason: 'invalid-input' });
    });

    test('returns fetch-failed when the API returns non-200', async () => {
        mockFetchOnce({ ok: false, status: 404 });
        const result = await resolveGistUrl('https://gist.github.com/user/' + 'a'.repeat(32));
        expect(result).toEqual({ ok: false, reason: 'fetch-failed' });
    });

    test('returns no-json-file when the gist has no .json file', async () => {
        mockFetchOnce({
            ok: true,
            body: {
                files: {
                    'README.md': { raw_url: 'https://gist.githubusercontent.com/user/abc/raw/README.md' },
                },
            },
        });
        const result = await resolveGistUrl('https://gist.github.com/user/' + 'a'.repeat(32));
        expect(result).toEqual({ ok: false, reason: 'no-json-file' });
    });
});
