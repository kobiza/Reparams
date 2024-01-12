import {isEmpty} from "lodash";
import React, {MouseEventHandler, useState} from 'react';
import SearchParams from "../common/SearchParams";
import PresetsPicker, {PresetsPickerProps} from "./PresetsPicker";

import {
    ParamsWithDelimiterViewModel,
    PresetsEntriesMapViewModel,
    QuickActionData
} from "../../types/types";
import {AppBar, Box, Button, Fab, Typography} from "@mui/material";

import QuickActions from "./QuickActions";
import './UrlEditor.scss'
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {Send, Star} from "@mui/icons-material";
import QuickActionsMenu from "./QuickActionsMenu";

type UrlEditorProps = {
    currentTabUrl: string,
    updateCurrentTabUrl: (newUrl: string) => void,
    openNewTab: (newUrl: string) => void,
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel,
    quickActions: QuickActionData
    className?: string,
}

const addEntries = (url: string, newEntries: Array<[string, string]>) => {
    const newSearch = new URLSearchParams(newEntries).toString()
    const newUrlData = new URL(url)

    newUrlData.search = newSearch

    return newUrlData.toString()
}

function UrlEditor({
                       currentTabUrl,
                       updateCurrentTabUrl,
                       openNewTab,
                       className,
                       presets,
                       paramsWithDelimiter,
                       quickActions
                   }: UrlEditorProps) {
    // const urlData = new URL(url)
    const [newUrl, setNewUrl] = useState(currentTabUrl)
    const newUrlData = new URL(newUrl)
    const searchParamsEntries = [...newUrlData.searchParams.entries()]
    const setSearchParamsEntries = (newSearchParamsEntries: Array<[string, string]>) => {
        setNewUrl((prevUrl) => {
            return addEntries(prevUrl, newSearchParamsEntries)
        })
    }

    const addEntriesAndNavigate: PresetsPickerProps['addEntriesAndNavigate'] = (newSearchParamsEntries, shouldOpenNewTab) => {
        setNewUrl((prevUrl) => {
            const nextUrl = addEntries(prevUrl, newSearchParamsEntries)

            if (shouldOpenNewTab) {
                openNewTab(nextUrl)
            } else {
                updateCurrentTabUrl(nextUrl)
            }

            return nextUrl
        })
    }


    const applyUrl: MouseEventHandler<HTMLButtonElement> = (e) => {
        const shouldOpenNewTab = e.metaKey

        if (shouldOpenNewTab) {
            openNewTab(newUrl)
        } else {
            updateCurrentTabUrl(newUrl)
        }
    }

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="url-editor">
            {!isEmpty(presets) && (
                <div className="presets-picker-container">
                    <PresetsPicker className="presets-picker" entries={searchParamsEntries}
                                   setEntries={setSearchParamsEntries} presets={presets}
                                   paramsWithDelimiter={paramsWithDelimiter}
                                   addEntriesAndNavigate={addEntriesAndNavigate}/>
                </div>
            )}
            <SearchParams className="search-params-container" entries={searchParamsEntries}
                          setEntries={setSearchParamsEntries} paramsWithDelimiter={paramsWithDelimiter}/>
            {/*<div className="row4">*/}
            {/*    {quickActions.length > 0 &&*/}
            {/*        <QuickActions entries={searchParamsEntries} setEntries={setSearchParamsEntries} presets={presets}*/}
            {/*                      paramsWithDelimiter={paramsWithDelimiter} quickActions={quickActions}*/}
            {/*                      addEntriesAndNavigate={addEntriesAndNavigate}/>}*/}
            {/*</div>*/}
            <Box className="actions-bar" sx={{'& > :not(style)': {m: 1}}}>
                {quickActions.length > 0 && (
                    <QuickActionsMenu entries={searchParamsEntries} setEntries={setSearchParamsEntries} presets={presets}
                                      paramsWithDelimiter={paramsWithDelimiter} quickActions={quickActions}
                                      addEntriesAndNavigate={addEntriesAndNavigate}/>
                )}
                <Fab size="medium" color="primary" onClick={applyUrl} variant="extended">
                    <Send sx={{mr: 1}}/>
                    Apply
                </Fab>
            </Box>
        </div>
    );
}

export default UrlEditor;
