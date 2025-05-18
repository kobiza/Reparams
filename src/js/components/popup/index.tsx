import React, { useState, useEffect } from 'react'
import '../common/App.scss'
import { createRoot } from 'react-dom/client'
import Popup from "./Popup";
import UseViewerStoreContext from "./UseViewerStoreContext";
import { ThemeProvider } from "@mui/material";
import getMuiTheme from "../../utils/getMuiTheme";
import { localStoragePreferencesKey } from '../../utils/consts';



const root = createRoot(document.getElementById('root')!);

const getPreferences = (): { themeMode: 'light' | 'dark' } => {
    const appData = localStorage.getItem(localStoragePreferencesKey)

    return appData ? JSON.parse(appData) : { themeMode: 'light' }
}



const App = ({ currentTabUrl, tabId }: { currentTabUrl: string; tabId: number }) => {
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => getPreferences().themeMode);
    useEffect(() => {
        localStorage.setItem(localStoragePreferencesKey, JSON.stringify({ themeMode }));
    }, [themeMode]);
    useEffect(() => {
        document.body.setAttribute('data-theme', themeMode);
    }, [themeMode]);
    return (
        <ThemeProvider theme={getMuiTheme(themeMode)}>
            <UseViewerStoreContext currentTabUrl={currentTabUrl}>
                <div className="App" data-theme={themeMode}>
                    <Popup
                        currentTabUrl={currentTabUrl}
                        tabId={tabId}
                        themeMode={themeMode}
                        setThemeMode={setThemeMode}
                    />
                </div>
            </UseViewerStoreContext>
        </ThemeProvider>
    )
}

const playgroundUrl = 'https://www.my-site.com/?name=Bar&age=25&experiments=spec1,spec2'

// @ts-ignore
if (chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const { id, url } = tabs[0]
        root.render(<App currentTabUrl={url!} tabId={id!} />);
    })
} else {
    root.render(<App currentTabUrl={playgroundUrl} tabId={1} />);
}

