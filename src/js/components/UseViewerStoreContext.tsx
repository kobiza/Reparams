import React, {createContext, PropsWithChildren} from "react";
import {EditorModel, ViewerStore} from "../types/types";
import {toViewerModel} from "../utils/utils";

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

const UseViewerStoreContext = (props: PropsWithChildren<{currentTabUrl: string}>) => {
    const {currentTabUrl} = props
    return (
        <ViewerStoreContext.Provider value={{
            state: toViewerModel(getSettings(), currentTabUrl),
        }}>
            {props.children}
        </ViewerStoreContext.Provider>
    )
}

export default UseViewerStoreContext