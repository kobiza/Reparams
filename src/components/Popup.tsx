import React, {useContext, useEffect, useState} from 'react';
import UrlEditor from "./UrlEditor";
import {ViewerStoreContext} from "./UseViewerStoreContext";

// import Settings from "./Settings";

function Popup() {
    const [currentUrl, setCurrentUrl] = useState<string | null>(null)
    const {state} = useContext(ViewerStoreContext)

    useEffect(() => {
        // @ts-ignores
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            setCurrentUrl(tabs[0].url)
        });
    }, [])

    const updateUrlHandler = (newUrl: string) => {
        setCurrentUrl(newUrl)
        // @ts-ignores
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            // @ts-ignores
            chrome.tabs.update(tabs[0].id, {url: newUrl}, () => window.close());
        });
    }

    return (
        <div className="popup">
            {/*<AddressBar currentUrl={currentUrl} setCurrentUrl={setCurrentUrl}/>*/}
            {currentUrl && <UrlEditor url={currentUrl} updateUrl={updateUrlHandler} presets={state.presets}
                                      paramsWithMultipleValues={state.paramsWithMultipleValues}
                                      quickActions={state.quickActions}/>}
            {/*<Settings/>*/}
        </div>
    );
}

export default Popup;
