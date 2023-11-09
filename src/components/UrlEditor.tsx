import React, {MouseEventHandler, useState} from 'react';
import './App.scss';
import SearchParams from "./SearchParams";
import PresetsPicker, {PresetsPickerProps} from "./PresetsPicker";

import {
    ParamsWithMultipleValuesViewModel,
    PresetsEntriesMapViewModel,
    QuickActionData
} from "../types/types";
import {AppBar, Box, Button, Grid, Paper, Typography} from "@mui/material";

import QuickActions from "./QuickActions";
import './UrlEditor.scss'
import {Add} from "@mui/icons-material";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";

type UrlEditorProps = {
    currentTabUrl: string,
    updateCurrentTabUrl: (newUrl: string) => void,
    openNewTab: (newUrl: string) => void,
    presets: PresetsEntriesMapViewModel
    paramsWithMultipleValues: ParamsWithMultipleValuesViewModel,
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
                       paramsWithMultipleValues,
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

    return (
        <div className="url-editor">
            <AppBar position="relative" component="nav">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                flexGrow: 1
                            }}
                        >
                            REPARAMS
                        </Typography>
                    </Toolbar>
                </Container>
            </AppBar>
            <div className="presets-picker-container">
                <PresetsPicker className="presets-picker" entries={searchParamsEntries} setEntries={setSearchParamsEntries} presets={presets}
                               paramsWithMultipleValues={paramsWithMultipleValues}
                               addEntriesAndNavigate={addEntriesAndNavigate}/>
                <Button variant="contained" onClick={applyUrl}>Apply</Button>
            </div>
            <SearchParams entries={searchParamsEntries} setEntries={setSearchParamsEntries}/>
            <QuickActions entries={searchParamsEntries} setEntries={setSearchParamsEntries} presets={presets}
                          paramsWithMultipleValues={paramsWithMultipleValues} quickActions={quickActions}
                          addEntriesAndNavigate={addEntriesAndNavigate}/>
        </div>
    );
}

export default UrlEditor;
