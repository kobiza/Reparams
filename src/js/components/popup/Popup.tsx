import React, { useContext, useState } from 'react';
import './popup.scss'
import UrlEditor from "./UrlEditor";
import { ViewerStoreContext } from "./UseViewerStoreContext";
import Switch from '@mui/material/Switch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import HttpsIcon from '@mui/icons-material/Https';
import DevModeIndicator from '../common/DevModeIndicator';

// import Settings from "./Settings";

function Popup({ currentTabUrl, tabId, themeMode, setThemeMode }: {
    currentTabUrl: string;
    tabId: number;
    themeMode: 'light' | 'dark';
    setThemeMode: (mode: 'light' | 'dark') => void;
}) {
    const { state } = useContext(ViewerStoreContext)

    const isLocalDev = __DEV__ && !chrome?.tabs
    const [urlInput, setUrlInput] = useState(currentTabUrl)

    const updateCurrentTabUrl = (newUrl: string) => {
        if (isLocalDev) {
            window.location.replace('popup.html?devUrl=' + encodeURIComponent(newUrl))
            return
        }
        chrome.tabs.update(tabId, { url: newUrl }, () => window.close());
    }

    const openNewTab = (newUrl: string) => {
        if (isLocalDev) {
            window.location.replace('popup.html?devUrl=' + encodeURIComponent(newUrl))
            return
        }
        chrome.tabs.create({ url: newUrl });
    }

    return (
        <div className="popup">
            {isLocalDev && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', px: 1.5, py: '5px', mb: 0.5, bgcolor: 'action.hover', borderRadius: '20px', overflow: 'hidden' }}>
                    <HttpsIcon sx={{ fontSize: 14, flexShrink: 0, opacity: 0.5 }} />
                    <InputBase
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onFocus={e => e.target.select()}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                window.location.replace('popup.html?devUrl=' + encodeURIComponent(urlInput))
                            }
                            if (e.key === 'Escape') {
                                setUrlInput(currentTabUrl)
                                e.currentTarget.blur()
                            }
                        }}
                        sx={{ flex: 1, minWidth: 0, fontSize: '0.75rem' }}
                        inputProps={{ style: { padding: 0 } }}
                    />
                </Box>
            )}
            {/* Removed the theme toggle from here, only in Drawer now */}
            <UrlEditor
                currentTabUrl={currentTabUrl}
                updateCurrentTabUrl={updateCurrentTabUrl}
                openNewTab={openNewTab}
                presets={state.presets}
                paramsWithDelimiter={state.paramsWithDelimiter}
                quickActions={state.quickActions}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
            />
            {/*<Settings/>*/}
            <DevModeIndicator />
        </div>
    );
}

export default Popup;
