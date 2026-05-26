import React, { MouseEventHandler, useState, useMemo, useLayoutEffect, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContrastIcon from '@mui/icons-material/Contrast';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
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
import { DraftFlushContext, createDraftFlushRegistry } from "../common/DraftFlushContext";
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
    themeMode: 'light' | 'dark',
    setThemeMode: (mode: 'light' | 'dark') => void,
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
    themeMode,
    setThemeMode,
}: UrlEditorProps) {
    const [newUrl, setNewUrl] = useState(currentTabUrl)
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
    const searchParamsEntries = useMemo(() => [...new URL(newUrl).searchParams.entries()], [newUrl])

    const draftFlush = useMemo(() => createDraftFlushRegistry(), [])
    const newUrlRef = useRef(newUrl)
    useEffect(() => { newUrlRef.current = newUrl }, [newUrl])

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

    const flushAndNavigate = (shouldOpenNewTab: boolean) => {
        flushSync(() => draftFlush.flushAll())
        navigateWith(newUrlRef.current, shouldOpenNewTab)
    }

    const applyUrl: MouseEventHandler<HTMLButtonElement> = (e) => {
        flushAndNavigate(e.metaKey)
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
                callback: () => flushAndNavigate(false),
                description: 'Apply URL changes'
            },
            {
                keys: ['Meta', 'Shift', 'Enter'],
                callback: () => flushAndNavigate(true),
                description: 'Apply URL changes in new tab'
            }
        ],
        enabled: true
    });

    return (
        <DraftFlushContext.Provider value={draftFlush}>
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
                <Tooltip title="Menu" placement="bottom-start">
                    <IconButton aria-label="menu" onClick={e => setMenuAnchor(e.currentTarget)} sx={{ flexShrink: 0 }}>
                        <MoreVertIcon />
                    </IconButton>
                </Tooltip>
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
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <MenuItem onClick={() => { setThemeMode(themeMode === 'light' ? 'dark' : 'light'); setMenuAnchor(null); }}>
                    <ListItemIcon>
                        <ContrastIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Theme</ListItemText>
                    <Typography variant="body2" sx={{ ml: 3, opacity: 0.5, textTransform: 'capitalize' }}>
                        {themeMode}
                    </Typography>
                </MenuItem>
                <MenuItem onClick={() => { openOptionsPage(); setMenuAnchor(null); }}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                    <OpenInNewIcon fontSize="small" sx={{ ml: 3, opacity: 0.5 }} />
                </MenuItem>
            </Menu>
        </Paper>
        </DraftFlushContext.Provider>
    );
}

export default UrlEditor;
