import {dropEmptyEntries, mergeEntries, parseQuickPaste, removeEntries, updateEntryKey, updateEntryValue} from "../src/js/utils/searchParamsUtils";
import {ParamsWithDelimiterViewModel, SearchParamsEntries} from "../src/js/types/types";

describe('dropEmptyEntries', () => {
    test('removes rows where both key and value are empty', () => {
        const entries: SearchParamsEntries = [['k', 'v'], ['', ''], ['k2', 'v2']]
        expect(dropEmptyEntries(entries)).toEqual([['k', 'v'], ['k2', 'v2']])
    })

    test('keeps rows where key is non-empty even if value is empty', () => {
        const entries: SearchParamsEntries = [['key', '']]
        expect(dropEmptyEntries(entries)).toEqual([['key', '']])
    })

    test('keeps rows where value is non-empty even if key is empty', () => {
        const entries: SearchParamsEntries = [['', 'val']]
        expect(dropEmptyEntries(entries)).toEqual([['', 'val']])
    })

    test('returns empty array when all rows are fully empty', () => {
        const entries: SearchParamsEntries = [['', ''], ['', '']]
        expect(dropEmptyEntries(entries)).toEqual([])
    })
})

describe('updateEntryKey', () => {
    test('should work', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]

        const newEntries = updateEntryKey(entries, 'key3', 1)

        expect(newEntries).toEqual([['key1', 'value1'], ['key3', 'value2']])
    })
})

describe('updateEntryValue', () => {
    test('should work', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]

        const newEntries = updateEntryValue(entries, 'value3', 1)

        expect(newEntries).toEqual([['key1', 'value1'], ['key2', 'value3']])
    })
})

describe('removeEntries', () => {
    test('remove first', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]

        const newEntries = removeEntries(entries, [['key1', 'value1']], {})

        expect(newEntries).toEqual(entries.slice(1))
    })

    test('remove more than one entry', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2'], ['key3', 'value3'], ['key4', 'value4']]

        const newEntries = removeEntries(entries, [['key2', 'value2'], ['key4', 'value4']], {})

        expect(newEntries).toEqual([['key1', 'value1'], ['key3', 'value3']])
    })

    test('should not remove entry with same key but different value', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]

        const newEntries = removeEntries(entries, [['key1', 'new value1']], {})

        expect(newEntries).toEqual(entries)
    })

    describe('params with delimiter', () => {
        test('should remove partial values', () => {
            const entries: SearchParamsEntries = [['key1', 'value1'], ['users', 'Jonathan,Tal,Bar,Joni']]
            const paramsWithDelimiter: ParamsWithDelimiterViewModel = {'users': {separator: ','}}

            const newEntries = removeEntries(entries, [['users', 'Tal,Joni']], paramsWithDelimiter)

            expect(newEntries).toEqual([['key1', 'value1'], ['users', 'Jonathan,Bar']])
        })

        test('should return same value if the values to remove are not exists', () => {
            const entries: SearchParamsEntries = [['key1', 'value1'], ['users', 'Jonathan,Tal,Bar,Joni']]
            const paramsWithDelimiter: ParamsWithDelimiterViewModel = {'users': {separator: ','}}

            const newEntries = removeEntries(entries, [['users', 'Dan']], paramsWithDelimiter)

            expect(newEntries).toEqual([['key1', 'value1'], ['users', 'Jonathan,Tal,Bar,Joni']])
        })
    })
})

describe('encoded string handling', () => {
    // The utils layer receives pre-decoded strings from the UI (decode happens on paste).
    // These tests document the contract: encoded strings are treated as opaque literals here.

    test('updateEntryValue stores an encoded value as-is (no auto-decode at utils layer)', () => {
        const entries: SearchParamsEntries = [['name', 'original']]
        const newEntries = updateEntryValue(entries, 'John%20Doe', 0)
        expect(newEntries).toEqual([['name', 'John%20Doe']])
    })

    test('updateEntryKey stores an encoded key as-is', () => {
        const entries: SearchParamsEntries = [['key%3Done', 'value']]
        const newEntries = updateEntryKey(entries, 'key%3Dtwo', 0)
        expect(newEntries).toEqual([['key%3Dtwo', 'value']])
    })

    test('mergeEntries treats encoded value strings as opaque literals', () => {
        const entries: SearchParamsEntries = [['name', 'Alice']]
        const preset: SearchParamsEntries = [['name', 'John%20Doe']]
        const newEntries = mergeEntries([entries, preset], {})
        expect(newEntries).toEqual([['name', 'John%20Doe']])
    })
})

describe('mergeEntries', () => {
    test('simple merge', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]
        const entriesToAdd: SearchParamsEntries = [['key3', 'value3'], ['key4', 'value4']]

        const newEntries = mergeEntries([entries, entriesToAdd], {})

        expect(newEntries).toEqual([...entries, ...entriesToAdd])
    })

    test('add only new entries', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]
        const entriesToAdd: SearchParamsEntries = [['key2', 'value2'], ['key3', 'value3']]

        const newEntries = mergeEntries([entries, entriesToAdd], {})

        expect(newEntries).toEqual([['key1', 'value1'], ['key2', 'value2'], ['key3', 'value3']])
    })

    test('replace entry', () => {
        const entries: SearchParamsEntries = [['key1', 'value1'], ['key2', 'value2']]
        const entriesToAdd: SearchParamsEntries = [['key2', 'new value2'], ['key3', 'value3']]

        const newEntries = mergeEntries([entries, entriesToAdd], {})

        expect(newEntries).toEqual([['key1', 'value1'], ['key2', 'new value2'], ['key3', 'value3']])
    })

    describe('params with delimiter', () => {
        test('add new entry', () => {
            const entries: SearchParamsEntries = [['key1', 'value1']]
            const entriesToAdd: SearchParamsEntries = [['users', 'Dan,Bar,Ben']]
            const paramsWithDelimiter: ParamsWithDelimiterViewModel = {'users': {separator: ','}}

            const newEntries = mergeEntries([entries, entriesToAdd], paramsWithDelimiter)

            expect(newEntries).toEqual([['key1', 'value1'], ['users', 'Dan,Bar,Ben']])
        })

        test('merge values', () => {
            const entries: SearchParamsEntries = [['key1', 'value1'], ['users', 'Bar,Foo']]
            const entriesToAdd: SearchParamsEntries = [['users', 'Dan,Bar,Ben']]
            const paramsWithDelimiter: ParamsWithDelimiterViewModel = {'users': {separator: ','}}

            const newEntries = mergeEntries([entries, entriesToAdd], paramsWithDelimiter)

            expect(newEntries).toEqual([['key1', 'value1'], ['users', 'Bar,Foo,Dan,Ben']])
        })
    })
})

describe('parseQuickPaste', () => {
    test('returns null for plain text with no = sign', () => {
        expect(parseQuickPaste('plaintext')).toBeNull()
    })

    test('single key=value pair', () => {
        expect(parseQuickPaste('key=value')).toEqual([['key', 'value']])
    })

    test('multiple pairs separated by &', () => {
        expect(parseQuickPaste('key1=v1&key2=v2')).toEqual([['key1', 'v1'], ['key2', 'v2']])
    })

    test('value containing = is kept intact', () => {
        expect(parseQuickPaste('key=v1=v2')).toEqual([['key', 'v1=v2']])
    })

    test('empty key is filtered out, returns null', () => {
        expect(parseQuickPaste('=value')).toBeNull()
    })

    test('URL-encoded value is decoded', () => {
        expect(parseQuickPaste('name=John%20Doe')).toEqual([['name', 'John Doe']])
    })

    test('trailing & is ignored', () => {
        expect(parseQuickPaste('key1=v1&')).toEqual([['key1', 'v1']])
    })

    test('tokens with empty keys are skipped, valid ones are kept', () => {
        expect(parseQuickPaste('key1=v1&=skip&key2=v2')).toEqual([['key1', 'v1'], ['key2', 'v2']])
    })

    test('leading && separators are ignored', () => {
        expect(parseQuickPaste('&&a=1&b=2')).toEqual([['a', '1'], ['b', '2']])
    })

    test('full URL — extracts query params correctly', () => {
        expect(parseQuickPaste('https://example.com?key1=v1&key2=v2')).toEqual([['key1', 'v1'], ['key2', 'v2']])
    })

    test('full URL with no query params returns null', () => {
        expect(parseQuickPaste('https://example.com/path')).toBeNull()
    })

    test('hash fragment is stripped from value', () => {
        expect(parseQuickPaste('key=value#section')).toEqual([['key', 'value']])
    })

    test('+ is decoded as space (URL query string spec)', () => {
        expect(parseQuickPaste('name=John+Doe')).toEqual([['name', 'John Doe']])
    })
})