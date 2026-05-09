import {ParamsWithDelimiter, ParamsWithDelimiterViewModel, SearchParamsEntries} from "../types/types";
import {removeItem, replaceItem, toTrueObj} from "./arrayUtils";

const mergeValues = (values1: Array<string>, values2: Array<string>): Array<string> => {
    const alreadyAdded: Record<string, true> = {}
    const result: Array<string> = []

    const addArrayToResult = (arr: Array<string>) => {
        arr.forEach(v => {
            if (alreadyAdded[v]) {
                return
            }

            result.push(v)
            alreadyAdded[v] = true
        })
    }

    addArrayToResult(values1)
    addArrayToResult(values2)

    return result
}

export const updateEntryValue = (entries: SearchParamsEntries, newValue: string, index: number): SearchParamsEntries => {
    const [key] = entries[index]

    const newEntry: [string, string] = [key, newValue]
    return replaceItem(entries, newEntry, index)
}

export const dropEmptyEntries = (entries: SearchParamsEntries): SearchParamsEntries => {
    return entries.filter(([k, v]) => !(k === '' && v === ''))
}

export const updateEntryKey = (entries: SearchParamsEntries, newKey: string, index: number): SearchParamsEntries => {
    const [, value] = entries[index]

    const newEntry: [string, string] = [newKey, value]
    return replaceItem(entries, newEntry, index)
}

const mergeEntryValues = (entries: SearchParamsEntries, newValue: string, index: number, paramsWithDelimiter: ParamsWithDelimiterViewModel): SearchParamsEntries => {
    const key = entries[index][0]

    const multipleValuesData = paramsWithDelimiter[key]

    if (multipleValuesData) {
        const multipleValuesSeparator = multipleValuesData.separator
        const currValueParts = entries[index][1].split(multipleValuesSeparator)
        const valuePartsToAdd = newValue.split(multipleValuesSeparator)
        const newValueParts = mergeValues(currValueParts, valuePartsToAdd)
        const newEntry: [string, string] = [key, newValueParts.join(multipleValuesSeparator)]

        return replaceItem(entries, newEntry, index)
    } else {
        // single value
        return updateEntryValue(entries, newValue, index)
    }
}

const addOrReplaceEntry = (entries: SearchParamsEntries, entry: [string, string], paramsWithDelimiter: ParamsWithDelimiterViewModel): SearchParamsEntries => {
    const [newKey, newValue] = entry
    const entryIndex = entries.findIndex(([key]) => key === newKey)

    if (entryIndex === -1) {
        // add
        return [...entries, entry]
    }

    // replace
    return mergeEntryValues(entries, newValue, entryIndex, paramsWithDelimiter)
}

const removeEntry = (entries: SearchParamsEntries, [entryKey, valueToRemove]: [string, string], paramsWithDelimiter: ParamsWithDelimiterViewModel): SearchParamsEntries => {
    const entryIndex = entries.findIndex(([key]) => key === entryKey)

    if (entryIndex !== -1) {
        const multipleValuesData = paramsWithDelimiter[entryKey]
        if (multipleValuesData) {
            const {separator} = multipleValuesData
            const [, currVal] = entries[entryIndex]
            const currValues = currVal.split(separator)
            const valuesToRemoveMap = toTrueObj(valueToRemove.split(separator), v => v)
            const newValue = currValues.filter(v => !valuesToRemoveMap[v]).join(separator)

            if (newValue) {
                return updateEntryValue(entries, newValue, entryIndex)
            } else {
                return removeItem(entries, entryIndex)
            }
        } else {
            const [, currVal] = entries[entryIndex]
            if (currVal === valueToRemove) {
                return removeItem(entries, entryIndex)
            }
        }
    }

    return entries
}

export const mergeEntries = (entriesArr: Array<SearchParamsEntries>, paramsWithDelimiter: ParamsWithDelimiterViewModel): SearchParamsEntries => {
    if (entriesArr.length === 0) {
        return []
    }
    if(entriesArr.length === 1) {
        return entriesArr[0]
    }

    const [first, ...rest] = entriesArr

    let lastEntries = [...first]

    rest.forEach(arr => {
        arr.forEach((entry => {
            lastEntries = addOrReplaceEntry(lastEntries, entry, paramsWithDelimiter)
        }))
    })

    return lastEntries
}

export const removeEntries = (entries: SearchParamsEntries, entriesToRemove: SearchParamsEntries, paramsWithDelimiter: ParamsWithDelimiterViewModel): SearchParamsEntries => {
    let lastEntries = entries

    entriesToRemove.forEach((entry) => {
        lastEntries = removeEntry(lastEntries, entry, paramsWithDelimiter)
    })

    return lastEntries
}

export const parseQuickPaste = (text: string): Array<[string, string]> | null => {
    if (!text.includes('=')) return null

    let searchParams: URLSearchParams
    try {
        // Full URL pasted (e.g. https://example.com?key=value) — extract its query params
        searchParams = new URL(text).searchParams
    } catch {
        try {
            // Raw query string (e.g. key1=v1&key2=v2) — wrap in a dummy URL to parse
            searchParams = new URL(`https://x.com?${text}`).searchParams
        } catch {
            return null
        }
    }

    const pairs = [...searchParams.entries()].filter(([key]) => key !== '') as Array<[string, string]>
    return pairs.length > 0 ? pairs : null
}