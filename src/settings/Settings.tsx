import React from 'react'
import '../components/App.scss'
import {createRoot} from 'react-dom/client'
import Settings from "../components/Settings";
import UseEditorStoreContext from "../components/UseEditorStoreContext";
import getMuiTheme from "../utils/getMuiTheme";
import {ThemeProvider} from "@mui/material";

const root = createRoot(document.getElementById('root')!);

const App = () => {
    return (
        <ThemeProvider theme={getMuiTheme()}>
            <UseEditorStoreContext>
                <div className="App" data-theme="jigglypuff">
                    <Settings/>
                </div>
            </UseEditorStoreContext>
        </ThemeProvider>
    )
}
root.render(<App/>);