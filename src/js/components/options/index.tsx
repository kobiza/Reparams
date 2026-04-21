import React, { useEffect, useState } from 'react'
import '../common/App.scss'
import { createRoot } from 'react-dom/client'
import Settings from "./Settings";
import UseEditorStoreContext from "./UseEditorStoreContext";
import getMuiTheme from "../../utils/getMuiTheme";
import { GlobalStyles, ThemeProvider } from "@mui/material";
import { localStoragePreferencesKey } from '../../utils/consts';
import { useDataIssue } from '../../utils/useDataIssue';
import DataIssueDialog from '../common/DataIssueDialog';

const getThemeMode = () => {
    try {
        const prefs = localStorage.getItem(localStoragePreferencesKey);
        if (prefs) {
            const { themeMode } = JSON.parse(prefs);
            if (themeMode === 'dark' || themeMode === 'light') return themeMode;
        }
    } catch { }
    return 'light';
};


const root = createRoot(document.getElementById('root')!);

const App = () => {
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(getThemeMode());
    const { issue, dismiss, reset } = useDataIssue();

    useEffect(() => {
        localStorage.setItem(localStoragePreferencesKey, JSON.stringify({ themeMode }));
    }, [themeMode]);


    const theme = getMuiTheme(themeMode);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles styles={{ html: { backgroundColor: theme.palette.background.default } }} />
            <UseEditorStoreContext>
                <div className="App" data-theme="jigglypuff">
                    <Settings themeMode={themeMode} onThemeChange={setThemeMode} />
                </div>
            </UseEditorStoreContext>
            <DataIssueDialog
                isOpen={!!issue}
                reason={issue?.reason ?? 'parse'}
                onDismiss={dismiss}
                onReset={reset}
            />
        </ThemeProvider>
    )
}
root.render(<App />);
