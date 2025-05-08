import React, {useContext, useEffect, useState} from 'react';
import './popup.scss'
import UrlEditor from "./UrlEditor";
import {ViewerStoreContext} from "./UseViewerStoreContext";

// import Settings from "./Settings";

function Popup({currentTabUrl, tabId}: { currentTabUrl: string; tabId: number }) {
    const {state} = useContext(ViewerStoreContext)

    const updateCurrentTabUrl = (newUrl: string) => {
        chrome.tabs.update(tabId, {url: newUrl}, () => window.close());
    }

    const openNewTab = (newUrl: string) => {
        chrome.tabs.create({url: newUrl});
    }

    return (
        <div className="popup">
            {/*<AddressBar currentUrl={currentUrl} setCurrentUrl={setCurrentUrl}/>*/}
            <UrlEditor
                currentTabUrl={currentTabUrl}
                updateCurrentTabUrl={updateCurrentTabUrl}
                openNewTab={openNewTab}
                presets={state.presets}
                paramsWithDelimiter={state.paramsWithDelimiter}
                quickActions={state.quickActions}/>
            {/*<Settings/>*/}
        </div>
    );
}

export default Popup;
