import React, { useContext } from 'react';
import './popup.scss'
import UrlEditor from "./UrlEditor";
import { ViewerStoreContext } from "./UseViewerStoreContext";
import Switch from '@mui/material/Switch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

// import Settings from "./Settings";

function Popup({ currentTabUrl, tabId, themeMode, setThemeMode }: {
    currentTabUrl: string;
    tabId: number;
    themeMode: 'light' | 'dark';
    setThemeMode: (mode: 'light' | 'dark') => void;
}) {
    const { state } = useContext(ViewerStoreContext)

    const updateCurrentTabUrl = (newUrl: string) => {
        chrome.tabs.update(tabId, { url: newUrl }, () => window.close());
    }

    const openNewTab = (newUrl: string) => {
        chrome.tabs.create({ url: newUrl });
    }

    return (
        <div className="popup">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                <LightModeIcon fontSize="small" />
                <Switch
                    checked={themeMode === 'dark'}
                    onChange={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                    color="default"
                />
                <DarkModeIcon fontSize="small" />
            </div>
            {/*<AddressBar currentUrl={currentUrl} setCurrentUrl={setCurrentUrl}/>*/}
            <UrlEditor
                currentTabUrl={currentTabUrl}
                updateCurrentTabUrl={updateCurrentTabUrl}
                openNewTab={openNewTab}
                presets={state.presets}
                paramsWithDelimiter={state.paramsWithDelimiter}
                quickActions={state.quickActions} />
            {/*<Settings/>*/}
        </div>
    );
}

export default Popup;
