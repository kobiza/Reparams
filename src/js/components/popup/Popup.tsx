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
        </div>
    );
}

export default Popup;
