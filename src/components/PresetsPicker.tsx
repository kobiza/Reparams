import React from 'react'
import type {
    AddEntriesAndNavigate,
    ParamsWithMultipleValuesViewModel,
    PresetsEntriesMapViewModel
} from '../types/types'
import {toTrueObj} from "../utils/arrayUtils";
import {max, pick, sortBy} from 'lodash'

import './PresetsPicker.scss'
import {QuickActionData, SearchParamsEntries, SetEntries} from "../types/types";
import {mergeEntries, removeEntries} from "../utils/searchParamsUtils";
import Tags, {TagsProps} from "./Tags";


// const PresetsPicker = ({presetsNames, allPresetsNames}: PresetsPickerProps) => {


type PresetsPickerProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries,
    addEntriesAndNavigate: AddEntriesAndNavigate,
    presets: PresetsEntriesMapViewModel
    quickActions: QuickActionData
    paramsWithMultipleValues: ParamsWithMultipleValuesViewModel
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
    entriesMap: EntriesMap, key: string, value: string, paramsWithMultipleValues: ParamsWithMultipleValuesViewModel
}
const isPresetOn = ({entriesMap, key, value, paramsWithMultipleValues}: PredicateArgs) => {
    const paramsWithMultipleValuesData = paramsWithMultipleValues[key]

    if (!entriesMap[key]) {
        return false
    }
    if (!paramsWithMultipleValuesData) {
        return entriesMap[key].value === value
    }
    const {separator} = paramsWithMultipleValuesData
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


const getSelectedPresets = ({presets, entries, paramsWithMultipleValues}: PresetsPickerProps): Array<string> => {
    const presetsKeys = Object.keys(presets)
    const entriesMap = getEntriesMap(entries)

    const selected = presetsKeys.filter(presetKey => {
        const presetEntries = presets[presetKey]

        return presetEntries.length > 0 && presetEntries.every(([key, value]) => {
            return isPresetOn({entriesMap, paramsWithMultipleValues, key, value})
        })
    })

    return sortBy(selected, (presetKey) => {
        const presetEntries = presets[presetKey]
        const entriesIndexes = presetEntries.map(([entryKey]) => entriesMap[entryKey].index)

        return max(entriesIndexes)
    })
}

const PresetsPicker = (props: PresetsPickerProps) => {
    const {presets, paramsWithMultipleValues, entries, setEntries, quickActions, addEntriesAndNavigate} = props
    const presetsKeys = Object.keys(presets)

    const selectedPresets = getSelectedPresets(props)

    const removePreset = (presetKey: string) => {
        const otherPresets = selectedPresets.filter(currPresetKey => currPresetKey !== presetKey)
        const otherEntries = Object.values(pick(presets, otherPresets))
        const mergedEntries = mergeEntries(otherEntries, paramsWithMultipleValues)
        const otherEntriesMap = getEntriesMap(mergedEntries)
        const entriesToRemove = presets[presetKey].reduce<Array<[string, string]>>((acc, entry) => {
            const [key, value] = entry
            const multiData = paramsWithMultipleValues[key]

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

        const newEntries = removeEntries(entries, entriesToRemove, paramsWithMultipleValues)

        setEntries(newEntries)
    }

    // todo - switch to https://github.com/i-like-robots/react-tag-autocomplete

    const selected = selectedPresets.map(presetKey => ({value: presetKey, label: presetKey}))
    const suggestions = presetsKeys.map(presetKey => ({value: presetKey, label: presetKey}))

    const addPresets = (presetsKeys: Array<string>) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithMultipleValues)

        addEntriesAndNavigate(newEntries)
    }

    const addPresetsAndNavigate = (presetsKeys: Array<string>) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithMultipleValues)

        setEntries(newEntries)
    }

    const onAdd: TagsProps['onAdd'] = ({value}) => {
        addPresets([(value as string)])
    }

    const onDelete: TagsProps['onDelete'] = (tagIndex) => {
        const presetKey = selectedPresets[tagIndex]
        return removePreset(presetKey)
    }

    const quickActionButtons = quickActions.map((quickActionData) => {
        const {label, presets} = quickActionData

        const quickActionCb = () => addPresets(presets)

        return (
            <button className="app-button quick-action-button" key={`quick-action-${label}`}
                    onClick={quickActionCb}>{label}</button>
        )
    })

    return (
        <div className="presets-picker">
            <h2>Presets:</h2>
            <Tags
                onAdd={onAdd}
                onDelete={onDelete}
                selected={selected}
                suggestions={suggestions}
                placeholderText="Add new preset"
            />
            <div className="quick-actions">
                <h2>Quick actions:</h2>
                <div className="quick-actions-buttons">
                    {quickActionButtons}
                </div>
            </div>
        </div>

    )
}

export default PresetsPicker
