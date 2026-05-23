import { isEmpty } from "lodash";
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
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Drawer from '@mui/material/Drawer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ContrastIcon from '@mui/icons-material/Contrast';
import SettingsIcon from '@mui/icons-material/Settings';

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
    setThemeMode
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

    const [drawerOpen, setDrawerOpen] = useState(false);
    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const theme = useTheme();

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

    const openOptionsPage = () => {
        if (chrome.runtime) {
            chrome.runtime.openOptionsPage();
        }
    }

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
                <IconButton
                    size="medium"
                    aria-label="menu"
                    onClick={handleDrawerOpen}
                    sx={{ color: theme.palette.text.primary, flexShrink: 0 }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {!isEmpty(presets) && (
                        <PresetsPicker className="presets-picker" entries={searchParamsEntries}
                            setEntries={setSearchParamsEntries} presets={presets}
                            paramsWithDelimiter={paramsWithDelimiter}
                            addEntriesAndNavigate={addEntriesAndNavigate} />
                    )}
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
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={handleDrawerClose}
                PaperProps={{ sx: { width: 320, bgcolor: 'background.default', color: 'text.primary', p: 2 } }}
            >
                <List>
                    <ListItem>
                        <ListItemIcon><ContrastIcon /></ListItemIcon>
                        <ListItemText primary="Theme" />
                        <ToggleButtonGroup
                            value={themeMode}
                            exclusive
                            onChange={(_e, value) => value && setThemeMode(value)}
                            size="small"
                            sx={{ ml: 2 }}
                        >
                            <ToggleButton value="light"><LightModeIcon /></ToggleButton>
                            <ToggleButton value="dark"><DarkModeIcon /></ToggleButton>
                        </ToggleButtonGroup>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={openOptionsPage}>
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>
            <SearchParams className="search-params-container row2" entries={searchParamsEntries}
                setEntries={setSearchParamsEntries} paramsWithDelimiter={paramsWithDelimiter}
                suggestions={suggestions} />
        </Paper>
    );
}

export default UrlEditor;
