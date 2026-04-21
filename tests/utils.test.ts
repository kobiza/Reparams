import { uuidv4, getEmptySettingsPackage, mergeAppDataPackages, getRelevantPackages, toViewerModel } from '../src/js/utils/utils';
import { EditorModel, PresetsEntriesMap, SettingsPackage } from '../src/js/types/types';

// Helper to build SettingsPackage fixtures without boilerplate
function makePackage(
    key: string,
    label: string,
    urlPatterns: string[],
    domSelectors: string[] = [],
    presets: PresetsEntriesMap = {}
): SettingsPackage {
    return {
        key,
        label,
        conditions: {
            urlPatterns: urlPatterns.map((v, i) => ({ id: `url-${i}`, value: v })),
            domSelectors: domSelectors.map((v, i) => ({ id: `dom-${i}`, value: v })),
        },
        presets,
        paramsWithDelimiter: [],
    };
}

// ---------------------------------------------------------------------------
describe('uuidv4', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    test('returns a string matching UUID v4 format', () => {
        expect(uuidv4()).toMatch(UUID_REGEX);
    });

    test('returns unique values on each call', () => {
        expect(uuidv4()).not.toBe(uuidv4());
    });
});

// ---------------------------------------------------------------------------
describe('getEmptySettingsPackage', () => {
    test('sets the provided label', () => {
        const pkg = getEmptySettingsPackage('My Package');
        expect(pkg.label).toBe('My Package');
    });

    test('generates a UUID key', () => {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pkg = getEmptySettingsPackage('X');
        expect(pkg.key).toMatch(UUID_REGEX);
    });

    test('has a single default urlPattern of *://*/*', () => {
        const pkg = getEmptySettingsPackage('X');
        expect(pkg.conditions.urlPatterns).toHaveLength(1);
        expect(pkg.conditions.urlPatterns[0].value).toBe('*://*/*');
    });

    test('has empty domSelectors and presets', () => {
        const pkg = getEmptySettingsPackage('X');
        expect(pkg.conditions.domSelectors).toEqual([]);
        expect(pkg.presets).toEqual({});
    });
});

// ---------------------------------------------------------------------------
describe('mergeAppDataPackages', () => {
    test('merges presets from multiple packages', () => {
        const pkg1 = makePackage('p1', 'Pkg1', ['*://*/*'], [], {
            preset1: { label: 'Preset A', entries: [['a', '1']] },
        });
        const pkg2 = makePackage('p2', 'Pkg2', ['*://*/*'], [], {
            preset2: { label: 'Preset B', entries: [['b', '2']] },
        });
        const model: EditorModel = { modelVersion: 1, packages: { p1: pkg1, p2: pkg2 } };

        const merged = mergeAppDataPackages(model);
        expect(merged.presets).toHaveProperty('preset1');
        expect(merged.presets).toHaveProperty('preset2');
    });

    test('later package wins when preset keys collide', () => {
        const pkg1 = makePackage('p1', 'Pkg1', ['*://*/*'], [], {
            shared: { label: 'First', entries: [] },
        });
        const pkg2 = makePackage('p2', 'Pkg2', ['*://*/*'], [], {
            shared: { label: 'Second', entries: [] },
        });
        const model: EditorModel = { modelVersion: 1, packages: { p1: pkg1, p2: pkg2 } };

        const merged = mergeAppDataPackages(model);
        expect(merged.presets.shared.label).toBe('Second');
    });
});

// ---------------------------------------------------------------------------
describe('getRelevantPackages', () => {
    const googlePkg = makePackage('g', 'Google', ['https://google.com/*']);
    const githubPkg = makePackage('gh', 'GitHub', ['https://github.com/*']);
    const domPkg = makePackage('d', 'DOM', [], ['.my-class']);
    const model: EditorModel = {
        modelVersion: 1,
        packages: { g: googlePkg, gh: githubPkg, d: domPkg },
    };

    test('returns packages matching the current URL', () => {
        const result = getRelevantPackages(model, 'https://google.com/path', {});
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('g');
    });

    test('returns packages matching a DOM selector', () => {
        const result = getRelevantPackages(model, 'https://nothing.com/', { '.my-class': true });
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('d');
    });

    test('returns empty array when nothing matches', () => {
        const result = getRelevantPackages(model, 'https://nothing.com/', {});
        expect(result).toHaveLength(0);
    });

    test('returns multiple packages when each matches by a different criterion', () => {
        const result = getRelevantPackages(model, 'https://google.com/', { '.my-class': true });
        const keys = result.map(p => p.key);
        expect(keys).toContain('g');
        expect(keys).toContain('d');
    });
});

// ---------------------------------------------------------------------------
describe('toViewerModel', () => {
    test('returns empty model for empty input', () => {
        const result = toViewerModel([], 'https://test.com/');
        expect(result.presets).toEqual({});
        expect(result.paramsWithDelimiter).toEqual({});
        expect(result.quickActions).toEqual([]);
    });

    test('maps preset entries to label-keyed format', () => {
        const pkg = makePackage('p1', 'Pkg', ['*://*/*'], [], {
            preset1: { label: 'My Preset', entries: [['key', 'val']] },
        });
        const result = toViewerModel([pkg], 'https://test.com/');
        expect(result.presets['My Preset']).toEqual([['key', 'val']]);
    });

    test('merges presets from multiple packages into one flat object', () => {
        const pkg1 = makePackage('p1', 'Pkg1', ['*://*/*'], [], {
            a: { label: 'Preset A', entries: [] },
        });
        const pkg2 = makePackage('p2', 'Pkg2', ['*://*/*'], [], {
            b: { label: 'Preset B', entries: [] },
        });
        const result = toViewerModel([pkg1, pkg2], 'https://test.com/');
        expect(result.presets).toHaveProperty('Preset A');
        expect(result.presets).toHaveProperty('Preset B');
    });
});
