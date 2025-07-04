import { isEmpty } from "lodash";
import React, { MouseEventHandler, useState } from 'react';
import SearchParams from "../common/SearchParams";
import PresetsPicker, { PresetsPickerProps } from "./PresetsPicker";
import useKeyboardShortcuts from "../common/useKeyboardShortcuts";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

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
    PresetsEntriesMapViewModel,
    QuickActionData
} from "../../types/types";
import AppBar from '@mui/material/AppBar';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import './UrlEditor.scss'
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Paper from '@mui/material/Paper';

type UrlEditorProps = {
    currentTabUrl: string,
    updateCurrentTabUrl: (newUrl: string) => void,
    openNewTab: (newUrl: string) => void,
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel,
    quickActions: QuickActionData
    className?: string,
    themeMode: 'light' | 'dark',
    setThemeMode: (mode: 'light' | 'dark') => void,
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
    presets,
    paramsWithDelimiter,
    themeMode,
    setThemeMode
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

    const [drawerOpen, setDrawerOpen] = useState(false);
    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const theme = useTheme();

    // Add keyboard shortcuts for Command + Enter and Command + Shift + Enter
    // useKeyboardShortcuts({
    //     shortcuts: [
    //         {
    //             keys: ['Meta', 'Enter'],
    //             callback: () => updateCurrentTabUrl(newUrl),
    //             description: 'Apply URL changes'
    //         },
    //         {
    //             keys: ['Meta', 'Shift', 'Enter'],
    //             callback: () => openNewTab(newUrl),
    //             description: 'Apply URL changes in new tab'
    //         }
    //     ],
    //     enabled: true
    // });

    const openOptionsPage = () => {
        if (chrome.runtime) {
            chrome.runtime.openOptionsPage();
        }
    }

    return (
        <Paper className="url-editor" sx={{ p: 2, bgcolor: 'background.paper', boxShadow: 'none' }}>
            <AppBar className="row1" position="relative" component="nav" elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ justifyContent: 'center', position: 'relative', minHeight: 56 }}>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                margin: 'auto',
                                textAlign: 'center',
                                width: 'fit-content',
                                color: theme.palette.text.primary,
                                fontFamily: ['Leckerli One', 'monospace'].join(','),
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textDecoration: 'none',
                            }}
                        >
                            ReParams
                        </Typography>
                        <IconButton
                            size="large"
                            edge="end"
                            aria-label="menu"
                            onClick={handleDrawerOpen}
                            sx={{ position: 'absolute', right: 0, color: theme.palette.text.primary }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>
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
                bottom: 20,
                right: 20,
            }}>
                <RocketLaunchIcon />
            </Fab>
        </Paper>
    );
}

export default UrlEditor;
