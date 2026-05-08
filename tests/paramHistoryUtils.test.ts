import { mergeParamHistory } from '../src/js/utils/paramHistoryUtils';
import { ParamHistoryEntry, SearchParamsEntries } from '../src/js/types/types';

describe('mergeParamHistory', () => {
    test('returns empty array when existing is undefined and no new entries', () => {
        expect(mergeParamHistory(undefined, [], 100)).toEqual([]);
    });

    test('adds new entries when existing history is undefined', () => {
        const newEntries: SearchParamsEntries = [['foo', 'bar'], ['debug', 'true']];
        expect(mergeParamHistory(undefined, newEntries, 100)).toEqual([
            { key: 'foo', value: 'bar' },
            { key: 'debug', value: 'true' },
        ]);
    });

    test('places new entries before existing history (recent-first)', () => {
        const existing: ParamHistoryEntry[] = [
            { key: 'old', value: '1' },
        ];
        const newEntries: SearchParamsEntries = [['fresh', 'A']];
        expect(mergeParamHistory(existing, newEntries, 100)).toEqual([
            { key: 'fresh', value: 'A' },
            { key: 'old', value: '1' },
        ]);
    });

    test('dedupes by (key, value): existing duplicate is dropped, new instance bubbles to front', () => {
        const existing: ParamHistoryEntry[] = [
            { key: 'foo', value: 'bar' },
            { key: 'baz', value: 'qux' },
        ];
        const newEntries: SearchParamsEntries = [['foo', 'bar']];
        expect(mergeParamHistory(existing, newEntries, 100)).toEqual([
            { key: 'foo', value: 'bar' },
            { key: 'baz', value: 'qux' },
        ]);
    });

    test('keeps same key with different value as separate entries', () => {
        const existing: ParamHistoryEntry[] = [{ key: 'lang', value: 'en' }];
        const newEntries: SearchParamsEntries = [['lang', 'fr']];
        expect(mergeParamHistory(existing, newEntries, 100)).toEqual([
            { key: 'lang', value: 'fr' },
            { key: 'lang', value: 'en' },
        ]);
    });

    test('dedupes within new entries', () => {
        const newEntries: SearchParamsEntries = [
            ['k', 'v'],
            ['k', 'v'],
            ['k', 'v2'],
        ];
        expect(mergeParamHistory(undefined, newEntries, 100)).toEqual([
            { key: 'k', value: 'v' },
            { key: 'k', value: 'v2' },
        ]);
    });

    test('filters out empty keys and values', () => {
        const newEntries: SearchParamsEntries = [
            ['', 'v'],
            ['k', ''],
            ['valid', 'one'],
        ];
        expect(mergeParamHistory(undefined, newEntries, 100)).toEqual([
            { key: 'valid', value: 'one' },
        ]);
    });

    test('caps merged history at maxEntries (oldest dropped)', () => {
        const existing: ParamHistoryEntry[] = [
            { key: 'a', value: '1' },
            { key: 'b', value: '2' },
            { key: 'c', value: '3' },
        ];
        const newEntries: SearchParamsEntries = [['new', 'x']];
        expect(mergeParamHistory(existing, newEntries, 2)).toEqual([
            { key: 'new', value: 'x' },
            { key: 'a', value: '1' },
        ]);
    });

    test('returns empty array when maxEntries is 0', () => {
        const newEntries: SearchParamsEntries = [['k', 'v']];
        expect(mergeParamHistory(undefined, newEntries, 0)).toEqual([]);
    });

    test('does not mutate inputs', () => {
        const existing: ParamHistoryEntry[] = [{ key: 'a', value: '1' }];
        const existingSnapshot = JSON.parse(JSON.stringify(existing));
        const newEntries: SearchParamsEntries = [['b', '2']];
        mergeParamHistory(existing, newEntries, 100);
        expect(existing).toEqual(existingSnapshot);
    });
});
