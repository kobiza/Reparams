import { fetchModelFromUrl } from '../src/js/utils/urlImport';

const mockFetchOnce = (init: { ok: boolean; status?: number; text?: string; throws?: boolean }) => {
    if (init.throws) {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));
        return;
    }
    const response = {
        ok: init.ok,
        status: init.status ?? (init.ok ? 200 : 500),
        text: async () => init.text ?? '',
    } as unknown as Response;
    (global as any).fetch = jest.fn().mockResolvedValue(response);
};

describe('fetchModelFromUrl', () => {
    afterEach(() => {
        delete (global as any).fetch;
    });

    test('appends a cache-busting _t query param and disables HTTP cache', async () => {
        mockFetchOnce({ ok: true, text: JSON.stringify({ modelVersion: 1, packages: {} }) });
        await (await import('../src/js/utils/urlImport')).fetchModelFromUrl('https://example.com/data.json');
        const fn = (global as any).fetch as jest.Mock;
        expect(fn).toHaveBeenCalledTimes(1);
        const [calledUrl, options] = fn.mock.calls[0];
        expect(calledUrl).toMatch(/^https:\/\/example\.com\/data\.json\?_t=\d+$/);
        expect(options).toEqual({ cache: 'no-store' });
    });

    test('returns migrated model on success', async () => {
        mockFetchOnce({
            ok: true,
            text: JSON.stringify({
                modelVersion: 1,
                packages: {
                    'pkg-1': {
                        key: 'pkg-1',
                        label: 'OK',
                        conditions: { urlPatterns: [], domSelectors: [] },
                        presets: {},
                        paramsWithDelimiter: [],
                    },
                },
            }),
        });
        const result = await fetchModelFromUrl('https://example.com/data.json');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model.packages['pkg-1'].label).toBe('OK');
        }
    });

    test('returns fetch-failed on network error', async () => {
        mockFetchOnce({ throws: true, ok: false });
        const result = await fetchModelFromUrl('https://example.com/data.json');
        expect(result).toEqual({ ok: false, reason: 'fetch-failed' });
    });

    test('returns fetch-failed with httpStatus on HTTP error', async () => {
        mockFetchOnce({ ok: false, status: 404 });
        const result = await fetchModelFromUrl('https://example.com/missing.json');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe('fetch-failed');
            expect(result.httpStatus).toBe(404);
        }
    });

    test('returns parse error on malformed JSON', async () => {
        mockFetchOnce({ ok: true, text: 'not-json' });
        const result = await fetchModelFromUrl('https://example.com/garbage');
        expect(result).toEqual({ ok: false, reason: 'parse' });
    });

    test('returns future-version on newer modelVersion', async () => {
        mockFetchOnce({ ok: true, text: JSON.stringify({ modelVersion: 999, packages: {} }) });
        const result = await fetchModelFromUrl('https://example.com/future.json');
        expect(result).toEqual({ ok: false, reason: 'future-version' });
    });
});
