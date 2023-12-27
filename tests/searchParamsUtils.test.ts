import {removeEntries} from "../src/js/utils/searchParamsUtils";
import {paramsWithDelimiter} from "../src/js/utils/dummyData";
import {ParamsWithDelimiterViewModel, SearchParamsEntries} from "../src/js/types/types";


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
        const entries: SearchParamsEntries = [['key1', 'value1'], ['users', 'Jonathan,Tal,Bar,Joni']]
        const paramsWithDelimiter: ParamsWithDelimiterViewModel = {'users': {separator: ','}}

        const newEntries = removeEntries(entries, [['users', 'Tal,Joni']], paramsWithDelimiter)

        expect(newEntries).toEqual([['key1', 'value1'], ['users', 'Jonathan,Bar']])
    })
})