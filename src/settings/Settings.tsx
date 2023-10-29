import React from 'react'
import '../components/App.scss'
import { createRoot } from 'react-dom/client'
import Settings from "../components/Settings";
import UseEditorStoreContext from "../components/UseEditorStoreContext";

const root = createRoot(document.getElementById('root')!);

const App = () => {
    return (
        <UseEditorStoreContext>
            <div className="App" data-theme="jigglypuff">
                <Settings/>
            </div>
        </UseEditorStoreContext>
    )
}
root.render(<App/>);