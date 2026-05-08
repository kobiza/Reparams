/**
 * @jest-environment jsdom
 */
import { captureParamHistory } from '../src/js/utils/paramHistoryCaptureService';
import { CURRENT_MODEL_VERSION } from '../src/js/utils/dataFixer';
import { localStorageKey, PARAM_HISTORY_MAX_ENTRIES } from '../src/js/utils/consts';
import { EditorModel, SettingsPackage } from '../src/js/types/types';

const makePackage = (
    key: string,
    urlPatterns: string[],
    overrides: Partial<SettingsPackage> = {}
): SettingsPackage => ({
    key,
    label: key,
    conditions: {
        urlPatterns: urlPatterns.map((value, i) => ({ id: `${key}-up-${i}`, value })),
        domSelectors: [],
    },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

const writeModel = (packages: { [k: string]: SettingsPackage }) => {
    const model: EditorModel = { modelVersion: CURRENT_MODEL_VERSION, packages };
    localStorage.setItem(localStorageKey, JSON.stringify(model));
};

const readModel = (): EditorModel => {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) throw new Error('expected model to be persisted');
    return JSON.parse(raw) as EditorModel;
};

beforeEach(() => {
    localStorage.clear();
});

describe('captureParamHistory', () => {
    test('captures entries to a single matching package', () => {
        writeModel({
            site: makePackage('site', ['https://example.com/*']),
        });

        captureParamHistory('https://example.com/page', [['foo', 'bar'], ['debug', 'true']]);

        const model = readModel();
        expect(model.packages.site.paramHistory).toEqual([
            { key: 'foo', value: 'bar' },
            { key: 'debug', value: 'true' },
        ]);
    });

    test('captures to multiple matching packages', () => {
        writeModel({
            siteA: makePackage('siteA', ['https://example.com/*']),
            siteB: makePackage('siteB', ['https://*/*']),
            other: makePackage('other', ['https://other.com/*']),
        });

        captureParamHistory('https://example.com/page', [['k', 'v']]);

        const model = readModel();
        expect(model.packages.siteA.paramHistory).toEqual([{ key: 'k', value: 'v' }]);
        expect(model.packages.siteB.paramHistory).toEqual([{ key: 'k', value: 'v' }]);
        expect(model.packages.other.paramHistory).toBeUndefined();
    });

    test('no-op when no packages match', () => {
        writeModel({
            other: makePackage('other', ['https://other.com/*']),
        });

        captureParamHistory('https://example.com/page', [['k', 'v']]);

        const model = readModel();
        expect(model.packages.other.paramHistory).toBeUndefined();
    });

    test('no-op when entries are empty', () => {
        writeModel({
            site: makePackage('site', ['https://example.com/*']),
        });

        captureParamHistory('https://example.com/page', []);

        const model = readModel();
        expect(model.packages.site.paramHistory).toBeUndefined();
    });

    test('appends new entries to existing history (recent-first), dedupes', () => {
        writeModel({
            site: makePackage('site', ['https://example.com/*'], {
                paramHistory: [
                    { key: 'foo', value: 'bar' },
                    { key: 'old', value: '1' },
                ],
            }),
        });

        captureParamHistory('https://example.com/page', [['fresh', 'A'], ['foo', 'bar']]);

        const model = readModel();
        expect(model.packages.site.paramHistory).toEqual([
            { key: 'fresh', value: 'A' },
            { key: 'foo', value: 'bar' },
            { key: 'old', value: '1' },
        ]);
    });

    test('caps at PARAM_HISTORY_MAX_ENTRIES', () => {
        const seedHistory = Array.from({ length: PARAM_HISTORY_MAX_ENTRIES }, (_, i) => ({
            key: `k${i}`,
            value: `v${i}`,
        }));
        writeModel({
            site: makePackage('site', ['https://example.com/*'], { paramHistory: seedHistory }),
        });

        captureParamHistory('https://example.com/page', [['fresh', 'X']]);

        const model = readModel();
        const history = model.packages.site.paramHistory!;
        expect(history.length).toBe(PARAM_HISTORY_MAX_ENTRIES);
        expect(history[0]).toEqual({ key: 'fresh', value: 'X' });
        expect(history[history.length - 1]).toEqual({ key: `k${PARAM_HISTORY_MAX_ENTRIES - 2}`, value: `v${PARAM_HISTORY_MAX_ENTRIES - 2}` });
    });

    test('does not write to localStorage when nothing changes (all entries already present)', () => {
        writeModel({
            site: makePackage('site', ['https://example.com/*'], {
                paramHistory: [{ key: 'foo', value: 'bar' }],
            }),
        });
        const before = localStorage.getItem(localStorageKey);

        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
        captureParamHistory('https://example.com/page', [['foo', 'bar']]);
        setItemSpy.mockRestore();

        expect(localStorage.getItem(localStorageKey)).toEqual(before);
    });

    test('skips entries with empty key or value', () => {
        writeModel({
            site: makePackage('site', ['https://example.com/*']),
        });

        captureParamHistory('https://example.com/page', [['', 'v'], ['k', ''], ['valid', 'one']]);

        const model = readModel();
        expect(model.packages.site.paramHistory).toEqual([{ key: 'valid', value: 'one' }]);
    });

    test('handles package with no url patterns gracefully', () => {
        writeModel({
            site: makePackage('site', []),
        });

        captureParamHistory('https://example.com/page', [['k', 'v']]);

        const model = readModel();
        expect(model.packages.site.paramHistory).toBeUndefined();
    });
});
