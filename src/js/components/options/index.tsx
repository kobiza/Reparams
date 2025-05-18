import React, { useEffect, useState } from 'react'
import '../common/App.scss'
import { createRoot } from 'react-dom/client'
import Settings from "./Settings";
import UseEditorStoreContext from "./UseEditorStoreContext";
import getMuiTheme from "../../utils/getMuiTheme";
import { ThemeProvider } from "@mui/material";
import { runFixer1 } from './dataFixer';
import { localStoragePreferencesKey } from '../../utils/consts';


// runFixer1()
// reset()

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

    useEffect(() => {
        localStorage.setItem(localStoragePreferencesKey, JSON.stringify({ themeMode }));
    }, [themeMode]);

    useEffect(() => {
        document.body.setAttribute('data-theme', themeMode);
    }, [themeMode]);
    return (
        <ThemeProvider theme={getMuiTheme(themeMode)}>
            <UseEditorStoreContext>
                <div className="App" data-theme="jigglypuff">
                    <Settings themeMode={themeMode} onThemeChange={setThemeMode} />
                </div>
            </UseEditorStoreContext>
        </ThemeProvider>
    )
}
root.render(<App />);
