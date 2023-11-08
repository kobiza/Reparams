import React, {useContext, useEffect, useState} from 'react';
import UrlEditor from "./UrlEditor";
import {ViewerStoreContext} from "./UseViewerStoreContext";

// import Settings from "./Settings";

function Popup({currentTabUrl, tabId}: { currentTabUrl: string; tabId: string }) {
    const {state} = useContext(ViewerStoreContext)

    const updateCurrentTabUrl = (newUrl: string) => {
        // @ts-ignores
        chrome.tabs.update(tabId, {url: newUrl}, () => window.close());
    }

    const openNewTab = (newUrl: string) => {
        // @ts-ignores
        chrome.tabs.create({url: newURL});
    }

    return (
        <div className="popup">
            {/*<AddressBar currentUrl={currentUrl} setCurrentUrl={setCurrentUrl}/>*/}
            <UrlEditor
                currentTabUrl={currentTabUrl}
                updateCurrentTabUrl={updateCurrentTabUrl}
                openNewTab={openNewTab}
                presets={state.presets}
                paramsWithMultipleValues={state.paramsWithMultipleValues}
                quickActions={state.quickActions}/>
            {/*<Settings/>*/}
        </div>
    );
}

export default Popup;
