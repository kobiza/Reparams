import { isEmpty } from "lodash";
import React, { MouseEventHandler, useState } from 'react';
import SearchParams from "../common/SearchParams";
import PresetsPicker, { PresetsPickerProps } from "./PresetsPicker";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Switch from '@mui/material/Switch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Drawer from '@mui/material/Drawer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

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
    className,
    presets,
    paramsWithDelimiter,
    quickActions,
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Typography variant="h6">Settings</Typography>
                    <IconButton onClick={handleDrawerClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </div>
                <Typography variant="subtitle2" sx={{ mb: 1, letterSpacing: 1 }}>MODE</Typography>
                <ToggleButtonGroup
                    value={themeMode}
                    exclusive
                    onChange={(_e, value) => value && setThemeMode(value)}
                    fullWidth
                    sx={{ mb: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', p: 0.5 }}
                >
                    <ToggleButton value="light" sx={{ flex: 1, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <LightModeIcon sx={{ mb: 0.5 }} />
                        Light
                    </ToggleButton>
                    <ToggleButton value="dark" sx={{ flex: 1, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <DarkModeIcon sx={{ mb: 0.5 }} />
                        Dark
                    </ToggleButton>
                </ToggleButtonGroup>
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
                right: 30,
            }}>
                <RocketLaunchIcon />
            </Fab>
        </Paper>
    );
}

export default UrlEditor;
