import React from 'react'
import '../common/App.scss'
import { createRoot } from 'react-dom/client'
import Popup from "./Popup";
import UseViewerStoreContext from "./UseViewerStoreContext";
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

const v = 'experiments=my-app-spec-name-0,my-app-spec-name-1,my-app-spec-name-2,my-app-spec-name-3,my-app-spec-name-4,my-app-spec-name-5,my-app-spec-name-6,my-app-spec-name-7,my-app-spec-name-8,my-app-spec-name-9,my-app-spec-name-10,my-app-spec-name-11,my-app-spec-name-12,my-app-spec-name-13,my-app-spec-name-14,my-app-spec-name-15,my-app-spec-name-16,my-app-spec-name-17,my-app-spec-name-18,my-app-spec-name-19,my-app-spec-name-20,my-app-spec-name-21,my-app-spec-name-22,my-app-spec-name-23,my-app-spec-name-24,my-app-spec-name-25,my-app-spec-name-26,my-app-spec-name-27,my-app-spec-name-28,my-app-spec-name-29,my-app-spec-name-30,my-app-spec-name-31,my-app-spec-name-32,my-app-spec-name-33,my-app-spec-name-34,my-app-spec-name-35,my-app-spec-name-36,my-app-spec-name-37,my-app-spec-name-38,my-app-spec-name-39'
const playgroundUrl = 'https://www.my-site.com/?name=Bar&age=25' + `&${v}`

// @ts-ignore
if (chrome.tabs) {
    // @ts-ignore
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const {id, url} = tabs[0]
        root.render(<App currentTabUrl={url} tabId={id}/>);
    })
} else {
    root.render(<App currentTabUrl={playgroundUrl} tabId={'tab'}/>);
}

