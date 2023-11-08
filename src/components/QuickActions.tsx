import React, {MouseEventHandler} from 'react'
import type {
    AddEntriesAndNavigate,
    ParamsWithMultipleValuesViewModel,
    PresetsEntriesMapViewModel
} from '../types/types'

import './PresetsPicker.scss'
import {QuickActionData, SearchParamsEntries, SetEntries} from "../types/types";
import {mergeEntries} from "../utils/searchParamsUtils";
import {Button, Grid, Typography} from "@mui/material";


// const PresetsPicker = ({presetsNames, allPresetsNames}: PresetsPickerProps) => {


export type PresetsPickerProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries,
    addEntriesAndNavigate: AddEntriesAndNavigate,
    presets: PresetsEntriesMapViewModel
    quickActions: QuickActionData
    paramsWithMultipleValues: ParamsWithMultipleValuesViewModel
}

const PresetsPicker = (props: PresetsPickerProps) => {
    const {presets, paramsWithMultipleValues, entries, setEntries, quickActions, addEntriesAndNavigate} = props

    const addPresetsAndNavigate = (presetsKeys: Array<string>, shouldOpenNewTab: boolean) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithMultipleValues)

        addEntriesAndNavigate(newEntries, shouldOpenNewTab)
    }

    const quickActionButtons = quickActions.map((quickActionData) => {
        const {label, presets} = quickActionData

        const quickActionCb: MouseEventHandler<HTMLButtonElement> = (e) => {
            const shouldOpenNewTab = e.metaKey
            addPresetsAndNavigate(presets, shouldOpenNewTab)
        }

        return (
            <Button key={`quick-action-${label}`} variant="outlined" onClick={quickActionCb}>{label}</Button>
        )
    })

    return (
        <div className="quick-actions">
            <Typography>
                <Typography variant="h6" padding={1}>Quick actions:</Typography>
            </Typography>
            <div className="quick-action-buttons">
                {quickActionButtons}
            </div>
        </div>

    )
}

export default PresetsPicker
