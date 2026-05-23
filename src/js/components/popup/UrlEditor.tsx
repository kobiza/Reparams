import React, { MouseEventHandler, useState, useMemo, useLayoutEffect, useRef } from 'react';
import { perfMark, perfMeasure } from '../../utils/perf';
import SearchParams from "../common/SearchParams";
import PresetsPicker, { PresetsPickerProps } from "./PresetsPicker";
import useCommandShortcuts from "../common/useCommandShortcuts";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import ShortcutHint from "../common/ShortcutHint";

import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';

import {
    ParamsWithDelimiterViewModel,
    ParamSuggestions,
    PresetsEntriesMapViewModel,
    QuickActionData,
    SearchParamsEntries
} from "../../types/types";
import { captureParamHistory } from "../../utils/paramHistoryCaptureService";
import { dropEmptyEntries } from "../../utils/searchParamsUtils";
import './UrlEditor.scss'
import Paper from '@mui/material/Paper';

type UrlEditorProps = {
    currentTabUrl: string,
    updateCurrentTabUrl: (newUrl: string) => void,
    openNewTab: (newUrl: string) => void,
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel,
    quickActions: QuickActionData
    suggestions: ParamSuggestions
    className?: string,
}

const addEntries = (url: string, newEntries: Array<[string, string]>) => {
    const filtered = dropEmptyEntries(newEntries)
    const newSearch = filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    const newUrlData = new URL(url)

    newUrlData.search = newSearch

    return newUrlData.toString()
}

function UrlEditor({
    currentTabUrl,
    updateCurrentTabUrl,
    openNewTab,
    presets,
    paramsWithDelimiter,
    suggestions,
}: UrlEditorProps) {
    // const urlData = new URL(url)
    const [newUrl, setNewUrl] = useState(currentTabUrl)
    const searchParamsEntries = useMemo(() => [...new URL(newUrl).searchParams.entries()], [newUrl])

    const mountedRef = useRef(false);
    useLayoutEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            perfMark('rp:urlEditorReady');
            perfMeasure('rp:timeToAutocompleteInteractive', 'rp:scriptStart', 'rp:urlEditorReady');
        }
    });
    const setSearchParamsEntries = (newSearchParamsEntries: Array<[string, string]>) => {
        setNewUrl((prevUrl) => {
            return addEntries(prevUrl, newSearchParamsEntries)
        })
    }

    const navigateWith = (url: string, shouldOpenNewTab: boolean) => {
        const entries: SearchParamsEntries = [...new URL(url).searchParams.entries()]
        captureParamHistory(url, entries)

        if (shouldOpenNewTab) {
            openNewTab(url)
        } else {
            updateCurrentTabUrl(url)
        }
    }

    const addEntriesAndNavigate: PresetsPickerProps['addEntriesAndNavigate'] = (newSearchParamsEntries, shouldOpenNewTab) => {
        setNewUrl((prevUrl) => {
            const nextUrl = addEntries(prevUrl, newSearchParamsEntries)
            navigateWith(nextUrl, shouldOpenNewTab)
            return nextUrl
        })
    }

    const applyUrl: MouseEventHandler<HTMLButtonElement> = (e) => {
        navigateWith(newUrl, e.metaKey)
    }

    const openOptionsPage = () => {
        if (chrome.runtime) {
            chrome.runtime.openOptionsPage();
        }
    }

    // Add keyboard shortcuts for Command + Enter and Command + Shift + Enter
    useCommandShortcuts({
        shortcuts: [
            {
                keys: ['Meta', 'Enter'],
                callback: () => navigateWith(newUrl, false),
                description: 'Apply URL changes'
            },
            {
                keys: ['Meta', 'Shift', 'Enter'],
                callback: () => navigateWith(newUrl, true),
                description: 'Apply URL changes in new tab'
            }
        ],
        enabled: true
    });

    return (
        <Paper elevation={0} className="url-editor" sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Box
                className="row1"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    mb: 1,
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <PresetsPicker className="presets-picker" entries={searchParamsEntries}
                        setEntries={setSearchParamsEntries} presets={presets}
                        paramsWithDelimiter={paramsWithDelimiter}
                        addEntriesAndNavigate={addEntriesAndNavigate} />
                </Box>
                <Tooltip
                    title={
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 1.5, rowGap: 0.75, alignItems: 'center' }}>
                            <span>Apply</span>
                            <ShortcutHint keys={['Mod', 'Enter']} />
                            <span>New tab</span>
                            <ShortcutHint keys={['Mod', 'Shift', 'Enter']} />
                        </Box>
                    }
                    placement="bottom-end"
                    componentsProps={{ tooltip: { sx: { fontSize: '0.85rem', p: 1.25 } } }}
                >
                    <IconButton aria-label="apply url" color="primary" onClick={applyUrl} sx={{ flexShrink: 0 }}>
                        <RocketLaunchIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <SearchParams className="search-params-container row2" entries={searchParamsEntries}
                setEntries={setSearchParamsEntries} paramsWithDelimiter={paramsWithDelimiter}
                suggestions={suggestions} />
            <Box className="row3" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, mt: 'auto' }}>
                <Typography
                    sx={{
                        fontFamily: ['Leckerli One', 'monospace'].join(','),
                        fontSize: '0.85rem',
                        letterSpacing: '1px',
                        opacity: 0.3,
                        userSelect: 'none',
                    }}
                >
                    ReParams
                </Typography>
                <Tooltip title="Settings" placement="top">
                    <IconButton size="small" onClick={openOptionsPage} sx={{ opacity: 0.3, '&:hover': { opacity: 0.8 } }}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
}

export default UrlEditor;
