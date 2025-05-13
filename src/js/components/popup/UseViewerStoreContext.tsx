/// <reference types="chrome"/>
import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, ViewerStore } from "../../types/types";
import { getFilterCriteriaKey, getRelevantPackages, toViewerModel } from "../../utils/utils";
import type { FilterCriteriaResultMessage, FilterCriteriaRequestMessage } from "../../types/types";


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


    const filterCriteria = Object.keys(settings.flatMap(setting => setting.conditions.filterCriteria).reduce<Record<string, true>>((acc, curr) => {
        acc[getFilterCriteriaKey(curr)] = true
        return acc
    }, {}))

    console.log('filterCriteria', filterCriteria)

    useEffect(() => {
        const isRunInChromeExtension = chrome.tabs
        const messageListener = (message: FilterCriteriaResultMessage) => {
            if (message.type === 'FILTER_CRITERIA_RESULT') {
                console.log('message.filterCriteriaResult', message.filterCriteriaResult)
                console.log('received filterCriteriaResult', filterCriteriaResult)
                setFilterCriteriaResult(message.filterCriteriaResult);
            }
        };

        if (isRunInChromeExtension) {
            // Send message to content script to check for commonConfig
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
                if (tabs[0]?.id) {
                    const message: FilterCriteriaRequestMessage = { type: 'FILTER_CRITERIA_REQUEST', filterCriteria };
                    console.log('send FILTER_CRITERIA_REQUEST', message)
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
