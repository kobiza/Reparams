import React, {MouseEventHandler} from 'react'
import type {
    AddEntriesAndNavigate,
    ParamsWithDelimiterViewModel,
    PresetsEntriesMapViewModel
} from '../../types/types'

import {QuickActionData, SearchParamsEntries, SetEntries} from "../../types/types";
import {mergeEntries} from "../../utils/searchParamsUtils";
import {Fab} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import {Star} from "@mui/icons-material";


export type QuickActionsProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries,
    addEntriesAndNavigate: AddEntriesAndNavigate,
    presets: PresetsEntriesMapViewModel
    quickActions: QuickActionData
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    className?: string
}

const QuickActionsMenu = (props: QuickActionsProps) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const {presets, paramsWithDelimiter, entries, setEntries, quickActions, addEntriesAndNavigate} = props

    const addPresetsAndNavigate = (presetsKeys: Array<string>, shouldOpenNewTab: boolean) => {
        const entriesToAdd = presetsKeys.map(presetKey => presets[presetKey])
        const newEntries = mergeEntries([entries, ...entriesToAdd], props.paramsWithDelimiter)

        addEntriesAndNavigate(newEntries, shouldOpenNewTab)
    }

    const menuItems = quickActions.map((quickActionData) => {
        const {label, presets} = quickActionData

        const quickActionCb: MouseEventHandler<HTMLElement> = (e) => {
            const shouldOpenNewTab = e.metaKey
            addPresetsAndNavigate(presets, shouldOpenNewTab)
        }

        return (
            <MenuItem key={`quick-action-${label}`} onClick={quickActionCb}>{label}</MenuItem>
        )
    })

    return (
        <>
            <Fab size="medium" color="secondary" onClick={handleMenuClick}>
                <Star/>
            </Fab>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                {menuItems}
            </Menu>
        </>
    )
}

export default QuickActionsMenu
