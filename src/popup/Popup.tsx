import React from 'react'
import '../components/App.scss'
import { createRoot } from 'react-dom/client'
import Popup from "../components/Popup";
import UseViewerStoreContext from "../components/UseViewerStoreContext";

const root = createRoot(document.getElementById('root')!);

const App = () => {
    return (
        <UseViewerStoreContext>
            <div className="App" data-theme="jigglypuff">
                <Popup/>
            </div>
        </UseViewerStoreContext>
    )
}
root.render(<App/>);