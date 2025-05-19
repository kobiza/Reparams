/// <reference types="chrome"/>
import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, ViewerStore } from "../../types/types";
import { getRelevantPackages, toViewerModel } from "../../utils/utils";
import type { DomSelectorResultMessage, DomSelectorRequestMessage } from "../../types/types";
import { localStorageKey } from "../../utils/consts";


export const ViewerStoreContext = createContext<ViewerStore>({
    state: {
        presets: {},
        paramsWithDelimiter: {},
        quickActions: []
    },
});

const getSettings = (): EditorModel => {
    const appData = localStorage.getItem(localStorageKey)

    return appData ? JSON.parse(appData) : { modelVersion: '', packages: {} }
}


const UseViewerStoreContext = (props: PropsWithChildren<{ currentTabUrl: string }>) => {
    const { currentTabUrl } = props
    const [filterCriteriaResult, setFilterCriteriaResult] = useState<Record<string, boolean>>({})


    const settings = getSettings()


    const domSelectors = Object.keys(Object.values(settings.packages).flatMap(packageSettings => packageSettings.conditions.domSelectors).reduce<Record<string, true>>((acc, curr) => {
        acc[curr.value] = true
        return acc
    }, {}))

    // Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
    useEffect(() => {
        const isRunInChromeExtension = chrome.tabs
        const messageListener = (message: DomSelectorResultMessage) => {
            if (message.type === 'DOM_SELECTOR_RESULT') {
                setFilterCriteriaResult(message.domSelectorResult);
            }
        };

        if (isRunInChromeExtension) {
            // Send message to content script to check for commonConfig
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
                if (tabs[0]?.id) {
                    const message: DomSelectorRequestMessage = { type: 'DOM_SELECTOR_REQUEST', domSelectors };
                    chrome.tabs.sendMessage(tabs[0].id, message);
                }
            });

            // Listen for response from content script
            chrome.runtime.onMessage.addListener(messageListener);
        }


        // Cleanup listener when component unmounts
        return () => {
            if (isRunInChromeExtension) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);

    return (
        <ViewerStoreContext.Provider value={{
            state: toViewerModel(getRelevantPackages(settings, currentTabUrl, filterCriteriaResult), currentTabUrl),
        }}>
            {props.children}
        </ViewerStoreContext.Provider>
    )
}

export default UseViewerStoreContext
