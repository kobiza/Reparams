import { buildSuggestions } from '../src/js/utils/suggestionsCompositor';
import { SettingsPackage } from '../src/js/types/types';

const makePackage = (overrides: Partial<SettingsPackage> = {}): SettingsPackage => ({
    key: 'pkg',
    label: 'pkg',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

describe('buildSuggestions', () => {
    test('empty input returns empty keys and empty valuesByKey', () => {
        expect(buildSuggestions([])).toEqual({ keys: [], valuesByKey: {} });
    });

    test('package with no presets and no history returns empty', () => {
        expect(buildSuggestions([makePackage()])).toEqual({ keys: [], valuesByKey: {} });
    });

    test('preset entries populate keys and valuesByKey', () => {
        const pkg = makePackage({
            presets: {
                p1: { label: 'P1', entries: [['lang', 'en'], ['debug', 'true']] },
            },
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['lang', 'debug']);
        expect(result.valuesByKey).toEqual({
            lang: ['en'],
            debug: ['true'],
        });
    });

    test('history populates keys and valuesByKey', () => {
        const pkg = makePackage({
            paramHistory: [
                { key: 'foo', value: 'bar' },
                { key: 'baz', value: 'qux' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['foo', 'baz']);
        expect(result.valuesByKey).toEqual({
            foo: ['bar'],
            baz: ['qux'],
        });
    });

    test('preset + history are unioned and deduped', () => {
        const pkg = makePackage({
            presets: {
                p1: { label: 'P1', entries: [['lang', 'en']] },
            },
            paramHistory: [
                { key: 'lang', value: 'en' },
                { key: 'lang', value: 'fr' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['lang']);
        expect(result.valuesByKey).toEqual({
            lang: ['en', 'fr'],
        });
    });

    test('same key with different values stacks under one key', () => {
        const pkg = makePackage({
            presets: {
                p1: { label: 'P1', entries: [['flavor', 'vanilla']] },
                p2: { label: 'P2', entries: [['flavor', 'chocolate']] },
            },
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['flavor']);
        expect(result.valuesByKey).toEqual({
            flavor: ['vanilla', 'chocolate'],
        });
    });

    test('same (key,value) across multiple packages is deduped once', () => {
        const a = makePackage({
            key: 'a',
            presets: { p: { label: 'P', entries: [['k', 'v']] } },
        });
        const b = makePackage({
            key: 'b',
            paramHistory: [{ key: 'k', value: 'v' }],
        });

        const result = buildSuggestions([a, b]);

        expect(result.keys).toEqual(['k']);
        expect(result.valuesByKey).toEqual({ k: ['v'] });
    });

    test('skips entries with empty key or value', () => {
        const pkg = makePackage({
            presets: {
                p1: { label: 'P1', entries: [['', 'v'], ['k', ''], ['valid', 'one']] },
            },
            paramHistory: [
                { key: '', value: 'x' },
                { key: 'y', value: '' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['valid']);
        expect(result.valuesByKey).toEqual({ valid: ['one'] });
    });

    test('paramsWithDelimiter labels alone do NOT appear as keys (only seen-in-presets-or-history keys do)', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [
                { id: '1', label: 'experiments', separator: ',' },
                { id: '2', label: 'experimentsOff', separator: ',' },
            ],
            presets: {
                p1: { label: 'P1', entries: [['debug', 'true']] },
            },
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['debug']);
        expect(result.valuesByKey.experiments).toBeUndefined();
        expect(result.valuesByKey.experimentsOff).toBeUndefined();
    });

    test('splits delimited preset values into per-token suggestions', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [{ id: '1', label: 'experiments', separator: ',' }],
            presets: {
                p1: { label: 'P1', entries: [['experiments', 'alpha,beta,gamma']] },
            },
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['experiments']);
        expect(result.valuesByKey.experiments).toEqual(['alpha', 'beta', 'gamma']);
    });

    test('splits delimited history values into per-token suggestions', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [{ id: '1', label: 'experiments', separator: ',' }],
            paramHistory: [
                { key: 'experiments', value: 'foo,bar' },
                { key: 'experiments', value: 'baz' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['experiments']);
        expect(result.valuesByKey.experiments).toEqual(['foo', 'bar', 'baz']);
    });

    test('dedupes tokens across delimited preset + history sources', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [{ id: '1', label: 'experiments', separator: ',' }],
            presets: {
                p1: { label: 'P1', entries: [['experiments', 'alpha,beta']] },
            },
            paramHistory: [
                { key: 'experiments', value: 'beta,gamma' },
            ],
        });

        const result = buildSuggestions([pkg]);

        // history is iterated first (recent-first): beta, gamma; then preset: alpha (beta already seen)
        expect(result.valuesByKey.experiments).toEqual(['beta', 'gamma', 'alpha']);
    });

    test('trims whitespace and skips empty tokens when splitting', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [{ id: '1', label: 'experiments', separator: ',' }],
            paramHistory: [
                { key: 'experiments', value: ' foo ,, bar ' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.valuesByKey.experiments).toEqual(['foo', 'bar']);
    });

    test('does not split a value when its key is not declared as delimited', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [],
            paramHistory: [
                { key: 'note', value: 'hello,world' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.valuesByKey.note).toEqual(['hello,world']);
    });

    test('does not split when separator is empty (declared with empty string)', () => {
        const pkg = makePackage({
            paramsWithDelimiter: [{ id: '1', label: 'experiments', separator: '' }],
            paramHistory: [
                { key: 'experiments', value: 'foo,bar' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.valuesByKey.experiments).toEqual(['foo,bar']);
    });

    test('history items appear before preset entries (recency-first)', () => {
        const pkg = makePackage({
            presets: {
                p1: { label: 'P1', entries: [['preset-only', 'a'], ['shared', 'preset-val']] },
            },
            paramHistory: [
                { key: 'history-fresh', value: '1' },
                { key: 'shared', value: 'history-val' },
            ],
        });

        const result = buildSuggestions([pkg]);

        expect(result.keys).toEqual(['history-fresh', 'shared', 'preset-only']);
        expect(result.valuesByKey.shared).toEqual(['history-val', 'preset-val']);
    });

    test('preserves first-seen order across packages', () => {
        const a = makePackage({
            key: 'a',
            presets: { p: { label: 'P', entries: [['first', '1']] } },
        });
        const b = makePackage({
            key: 'b',
            presets: { p: { label: 'P', entries: [['second', '2'], ['first', '1b']] } },
        });

        const result = buildSuggestions([a, b]);

        expect(result.keys).toEqual(['first', 'second']);
        expect(result.valuesByKey.first).toEqual(['1', '1b']);
    });
});
