import React from 'react'
import '../App.scss'
import { createRoot } from 'react-dom/client'
import Popup from "../Popup";
import UseViewerStoreContext from "../UseViewerStoreContext";
import {ThemeProvider} from "@mui/material";
import getMuiTheme from "../../utils/getMuiTheme";



const root = createRoot(document.getElementById('root')!);

const App = ({currentTabUrl, tabId}: { currentTabUrl: string; tabId: string }) => {
    return (
        <ThemeProvider theme={getMuiTheme()}>
            <UseViewerStoreContext currentTabUrl={currentTabUrl}>
                <div className="App" data-theme="jigglypuff">
                    <Popup currentTabUrl={currentTabUrl} tabId={tabId}/>
                </div>
            </UseViewerStoreContext>
        </ThemeProvider>
    )
}

// @ts-ignore
if (chrome.tabs) {
    // @ts-ignore
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const {id, url} = tabs[0]
        root.render(<App currentTabUrl={url} tabId={id}/>);
    })
} else {
    root.render(<App currentTabUrl={'https://www.my-site.com/?name=Bar&age=25'} tabId={'tab'}/>);
}

