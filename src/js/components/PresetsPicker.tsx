import React from 'react'
import type {
    AddEntriesAndNavigate,
    ParamsWithDelimiterViewModel,
    PresetsEntriesMapViewModel
} from '../types/types'
import {toTrueObj} from "../utils/arrayUtils";
import {max, pick, sortBy} from 'lodash'

import './PresetsPicker.scss'
import {SearchParamsEntries, SetEntries} from "../types/types";
import {mergeEntries, removeEntries} from "../utils/searchParamsUtils";
import Tags, {TagsProps} from "./MuiTags";


// const PresetsPicker = ({presetsNames, allPresetsNames}: PresetsPickerProps) => {


export type PresetsPickerProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries
    addEntriesAndNavigate: AddEntriesAndNavigate
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    className?: string
}

type EntriesMap = { [entryKey: string]: { value: string, index: number } }

const getEntriesMap = (entries: SearchParamsEntries): EntriesMap => {
    const entriesMap: EntriesMap = {}

    entries.forEach(([key, value], index) => {
        entriesMap[key] = {value, index}
    })

    return entriesMap
}

type PredicateArgs = {
    entriesMap: EntriesMap, key: string, value: string, paramsWithDelimiter: ParamsWithDelimiterViewModel
}
const isPresetOn = ({entriesMap, key, value, paramsWithDelimiter}: PredicateArgs) => {
    const paramsWithDelimiterData = paramsWithDelimiter[key]

    if (!entriesMap[key]) {
        return false
    }
    if (!paramsWithDelimiterData) {
        return entriesMap[key].value === value
    }
    const {separator} = paramsWithDelimiterData
    const currentValue = entriesMap[key].value
    if (!currentValue) {
        return false
    }

    const currentValuesMap = currentValue.split(separator).reduce<{ [s: string]: true }>((acc, singleValue) => {
        acc[singleValue] = true
        return acc
    }, {})
    return value.split(separator).every(singleValue => currentValuesMap[singleValue])
}

const getSelectedPresets = ({presets, paramsWithDelimiter, entries}: {
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    entries: SearchParamsEntries
}): Array<string> => {
    const presetsKeys = Object.keys(presets)
    const entriesMap = getEntriesMap(entries)

    const selected = presetsKeys.filter(presetKey => {
        const presetEntries = presets[presetKey]

        return presetEntries.length > 0 && presetEntries.every(([key, value]) => {
            return isPresetOn({entriesMap, paramsWithDelimiter, key, value})
        })
    })

    return sortBy(selected, (presetKey) => {
        const presetEntries = presets[presetKey]
        const entriesIndexes = presetEntries.map(([entryKey]) => entriesMap[entryKey].index)

        return max(entriesIndexes)
    })
}

const getEntriesToRemoveRemovingPreset = (presetKeyToRemove: string, {presets, paramsWithDelimiter, entries}: {
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    entries: SearchParamsEntries
}) => {
    const _selectedPresets = getSelectedPresets({presets, paramsWithDelimiter, entries})
    const otherPresets = _selectedPresets.filter(currPresetKey => currPresetKey !== presetKeyToRemove)
    const otherEntries = Object.values(pick(presets, otherPresets))
    const mergedEntries = mergeEntries(otherEntries, paramsWithDelimiter)
    const otherEntriesMap = getEntriesMap(mergedEntries)
    const entriesToRemove = presets[presetKeyToRemove].reduce<Array<[string, string]>>((acc, entry) => {
        const [key, value] = entry
        const multiData = paramsWithDelimiter[key]

        // param that used only on the removed preset
        if (!otherEntriesMap[key]) {
            acc.push(entry)
        } else {
            if (multiData) {
                // multi data and exist on other preset -> filter the values that used only on the remove preset
                const {separator} = multiData
                const valuesToKeepMap = toTrueObj(otherEntriesMap[key].value.split(separator), v => v)
                const valuesToRemove = value.split(separator).filter(value => {
                    return !valuesToKeepMap[value]
                })

                acc.push([key, valuesToRemove.join(separator)])
            }
        }


        return acc
    }, [])

    return entriesToRemove
}

const getEntriesAfterRemovingPreset = (sourceEntries: SearchParamsEntries, presetKeyToRemove: string, {paramsWithDelimiter, presets}: {paramsWithDelimiter: ParamsWithDelimiterViewModel, presets: PresetsEntriesMapViewModel}) => {
    const entriesToRemove = getEntriesToRemoveRemovingPreset( presetKeyToRemove, {presets, paramsWithDelimiter, entries: sourceEntries})

    return removeEntries(sourceEntries, entriesToRemove, paramsWithDelimiter)
}

const PresetsPicker = (props: PresetsPickerProps) => {
    const {className, presets, paramsWithDelimiter, entries, setEntries, addEntriesAndNavigate} = props
    const presetsKeys = Object.keys(presets)



    const removePresets = (presetsKeys: Array<string>) => {
        let newEntries = entries

        presetsKeys.forEach(presetKey => {
            newEntries = getEntriesAfterRemovingPreset(newEntries, presetKey, {paramsWithDelimiter, presets})
        })

        setEntries(newEntries)
    }

    // todo - switch to https://github.com/i-like-robots/react-tag-autocomplete

    const selectedPresets = getSelectedPresets(props)
    const selected = selectedPresets.map(presetKey => ({value: presetKey, label: presetKey}))
    const suggestions = presetsKeys.map(presetKey => ({value: presetKey, label: presetKey}))

    const addPresets = (presetsKeys: Array<string>) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithDelimiter)

        setEntries(newEntries)
    }

    const addPresetsAndNavigate = (presetsKeys: Array<string>, shouldOpenNewTab: boolean) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithDelimiter)

        addEntriesAndNavigate(newEntries, shouldOpenNewTab)
    }

    const onAdd: TagsProps['onAdd'] = (itemsToAdd) => {
        addPresets(itemsToAdd.map(v => v.value))
    }

    const onDelete: TagsProps['onDelete'] = (itemsToDelete) => {
        removePresets(itemsToDelete.map(v => v.value))
    }

    return (
        <Tags
            className={className}
            onAdd={onAdd}
            onDelete={onDelete}
            selected={selected}
            suggestions={suggestions}
            placeholderText="Add preset"
        />

    )
}

export default PresetsPicker
