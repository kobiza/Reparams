/// <reference types="chrome"/>
import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, ViewerStore } from "../../types/types";
import { getRelevantPackages, toViewerModel } from "../../utils/utils";

type CommonConfigMessage = {
    type: 'COMMON_CONFIG_STATUS';
    isCommonConfigExist: boolean;
}

type CheckCommonConfigMessage = {
    type: 'CHECK_COMMON_CONFIG';
}

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
    const [isCommonConfigExist, setIsCommonConfigExist] = useState(false)

    useEffect(() => {
        // Send message to content script to check for commonConfig
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
            if (tabs[0]?.id) {
                const message: CheckCommonConfigMessage = { type: 'CHECK_COMMON_CONFIG' };
                chrome.tabs.sendMessage(tabs[0].id, message);
            }
        });

        // Listen for response from content script
        const messageListener = (message: CommonConfigMessage) => {
            if (message.type === 'COMMON_CONFIG_STATUS') {
                console.log('message.isCommonConfigExist', message.isCommonConfigExist)
                setIsCommonConfigExist(message.isCommonConfigExist);
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Cleanup listener when component unmounts
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return (
        <ViewerStoreContext.Provider value={{
            state: toViewerModel(getRelevantPackages(getSettings(), currentTabUrl, isCommonConfigExist), currentTabUrl),
        }}>
            {props.children}
        </ViewerStoreContext.Provider>
    )
}

export default UseViewerStoreContext
