/// <reference types="chrome"/>
import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, ViewerStore } from "../../types/types";
import { getRelevantPackages, toViewerModel } from "../../utils/utils";
import type { DomSelectorResultMessage, DomSelectorRequestMessage } from "../../types/types";


export const ViewerStoreContext = createContext<ViewerStore>({
    state: {
        presets: {},
        paramsWithDelimiter: {},
        quickActions: []
    },
});

const localStorageKey = 'paparamsAppData'
const getSettings = (): EditorModel => {
    const appData = localStorage.getItem(localStorageKey)

    return appData ? JSON.parse(appData) : []
}


const UseViewerStoreContext = (props: PropsWithChildren<{ currentTabUrl: string }>) => {
    const { currentTabUrl } = props
    const [filterCriteriaResult, setFilterCriteriaResult] = useState<Record<string, boolean>>({})


    const settings = getSettings()


    const domSelectors = Object.keys(settings.flatMap(setting => setting.conditions.domSelectors).reduce<Record<string, true>>((acc, curr) => {
        acc[curr.value] = true
        return acc
    }, {}))

    console.log('domSelectors', domSelectors)

    useEffect(() => {
        const isRunInChromeExtension = chrome.tabs
        const messageListener = (message: DomSelectorResultMessage) => {
            if (message.type === 'DOM_SELECTOR_RESULT') {
                console.log('message.domSelectorResult', message.domSelectorResult)
                console.log('received domSelectorResult', filterCriteriaResult)
                setFilterCriteriaResult(message.domSelectorResult);
            }
        };

        if (isRunInChromeExtension) {
            // Send message to content script to check for commonConfig
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
                if (tabs[0]?.id) {
                    const message: DomSelectorRequestMessage = { type: 'DOM_SELECTOR_REQUEST', domSelectors };
                    console.log('send DOM_SELECTOR_REQUEST', message)
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
