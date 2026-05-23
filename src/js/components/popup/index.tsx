import React, { useState, useEffect, useMemo } from 'react'
import '../common/App.scss'
import { createRoot } from 'react-dom/client'
import Popup from "./Popup";
import UseViewerStoreContext from "./UseViewerStoreContext";
import { GlobalStyles, ThemeProvider } from "@mui/material";
import getMuiTheme from "../../utils/getMuiTheme";
import { localStoragePreferencesKey } from '../../utils/consts';
import { useDataIssue } from '../../utils/useDataIssue';
import DataIssueDialog from '../common/DataIssueDialog';
import { perfMark, perfMeasure, initPerfObservers } from '../../utils/perf';

perfMark('rp:scriptStart');
initPerfObservers();

const root = createRoot(document.getElementById('root')!);

const getPreferences = (): { themeMode: 'light' | 'dark' } => {
    const appData = localStorage.getItem(localStoragePreferencesKey)
    return appData ? JSON.parse(appData) : { themeMode: 'light' }
}

const playgroundUrl = 'https://www.my-site.com/?name=Bar&age=25&experiments=spec1,spec2'

const App = () => {
    const [tabInfo, setTabInfo] = useState<{ url: string; tabId: number } | null>(null);
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => getPreferences().themeMode);
    const { issue, dismiss, reset } = useDataIssue();

    useEffect(() => {
        localStorage.setItem(localStoragePreferencesKey, JSON.stringify({ themeMode }));
    }, [themeMode]);

    useEffect(() => {
        perfMark('rp:tabsQueryStart');
        // @ts-ignore
        if (chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                perfMark('rp:tabsQueryEnd');
                perfMeasure('rp:tabsQuery', 'rp:tabsQueryStart', 'rp:tabsQueryEnd');
                const url = tabs[0]?.url ?? playgroundUrl;
                const tabId = tabs[0]?.id ?? 1;
                setTabInfo({ url, tabId });
            });
        } else {
            const fallbackUrl = __DEV__ ? (new URLSearchParams(location.search).get('devUrl') || playgroundUrl) : playgroundUrl;
            perfMark('rp:tabsQueryEnd');
            setTabInfo({ url: fallbackUrl, tabId: 1 });
        }
    }, []);

    const theme = useMemo(() => getMuiTheme(themeMode), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles styles={{ html: { backgroundColor: theme.palette.background.default } }} />
            {tabInfo && (
                <UseViewerStoreContext currentTabUrl={tabInfo.url}>
                    <div className="App" data-theme={themeMode}>
                        <Popup
                            currentTabUrl={tabInfo.url}
                            tabId={tabInfo.tabId}
                            themeMode={themeMode}
                            setThemeMode={setThemeMode}
                        />
                    </div>
                </UseViewerStoreContext>
            )}
            <DataIssueDialog
                isOpen={!!issue}
                reason={issue?.reason ?? 'parse'}
                onDismiss={dismiss}
                onReset={reset}
            />
        </ThemeProvider>
    )
}

perfMark('rp:renderStart');
root.render(<App />);
