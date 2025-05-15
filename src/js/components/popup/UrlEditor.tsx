import { isEmpty } from "lodash";
import React, { MouseEventHandler, useState } from 'react';
import SearchParams from "../common/SearchParams";
import PresetsPicker, { PresetsPickerProps } from "./PresetsPicker";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import {
    ParamsWithDelimiterViewModel,
    PresetsEntriesMapViewModel,
    QuickActionData
} from "../../types/types";
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';

import QuickActions from "./QuickActions";
import './UrlEditor.scss'
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";

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

    return (
        <div className="url-editor">
            <AppBar className="row1" position="relative" component="nav">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                fontFamily: ['Leckerli One', 'monospace'].join(','),
                                fontWeight: 700,
                                letterSpacing: '2px',
                                color: 'inherit',
                                textDecoration: 'none',
                                flexGrow: 1
                            }}
                        >
                            ReParams
                        </Typography>
                    </Toolbar>
                </Container>
            </AppBar>
            {!isEmpty(presets) && (
                <div className="presets-picker-container row2">
                    <PresetsPicker className="presets-picker" entries={searchParamsEntries}
                        setEntries={setSearchParamsEntries} presets={presets}
                        paramsWithDelimiter={paramsWithDelimiter}
                        addEntriesAndNavigate={addEntriesAndNavigate} />
                </div>
            )}
            <SearchParams className="search-params-container row3" entries={searchParamsEntries}
                setEntries={setSearchParamsEntries} paramsWithDelimiter={paramsWithDelimiter} />
            <Fab color="primary" onClick={applyUrl} sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
            }}>
                <RocketLaunchIcon />
            </Fab>
        </div>
    );
}

export default UrlEditor;
