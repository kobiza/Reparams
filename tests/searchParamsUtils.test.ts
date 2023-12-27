import {mergeEntries, removeEntries, updateEntryKey, updateEntryValue} from "../src/js/utils/searchParamsUtils";
import {ParamsWithDelimiterViewModel, SearchParamsEntries} from "../src/js/types/types";

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