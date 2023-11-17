import React, {createContext, PropsWithChildren, useEffect, useState} from "react";
import {EditorModel, EditorStore, SettingsPackage} from "../types/types";
import {replaceItem} from "../utils/arrayUtils";
import {getEmptySettingsPackage} from "../utils/utils";

const noop = () => {
}
export const EditorStoreContext = createContext<EditorStore>({
    state: [],
    updatePackagePreset: noop,
    updatePackageParamsWithMultipleValues: noop,
    updatePackageQuickActions: noop,
    updatePackageLabel: noop,
    updatePackageUrlPattern: noop,
    addNewPackage: noop
});

const localStorageKey = 'paparamsAppData'
const getInitialState = (): EditorModel => {
    const appData = localStorage.getItem(localStorageKey)

    return appData ? JSON.parse(appData) : []
}

const UseEditorStoreContext = (props: PropsWithChildren) => {
    const [appState, setAppState] = useState(getInitialState)

    useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(appState))
    }, [appState])

    const _updatePackage = (packageIndex: number, newPackage: SettingsPackage) => {
        const newAppState = replaceItem<SettingsPackage>(appState, newPackage, packageIndex)

        setAppState(newAppState)
    }

    const updatePackagePreset = (packageIndex: number, presets: SettingsPackage['presets']) => {
        const newPackage = {
            ...appState[packageIndex],
            presets
        }
        _updatePackage(packageIndex, newPackage)
    }

    const updatePackageParamsWithMultipleValues = (packageIndex: number, paramsWithMultipleValues: SettingsPackage['paramsWithMultipleValues']) => {
        const newPackage = {
            ...appState[packageIndex],
            paramsWithMultipleValues
        }
        _updatePackage(packageIndex, newPackage)
    }

    const updatePackageQuickActions = (packageIndex: number, quickActions: SettingsPackage['quickActions']) => {
        const newPackage = {
            ...appState[packageIndex],
            quickActions
        }
        _updatePackage(packageIndex, newPackage)
    }

    const updatePackageLabel = (packageIndex: number, label: string) => {
        const newPackage = {
            ...appState[packageIndex],
            label
        }
        _updatePackage(packageIndex, newPackage)
    }

    const updatePackageUrlPattern = (packageIndex: number, urlPattern: string) => {
        const newPackage = {
            ...appState[packageIndex],
            urlPattern
        }
        _updatePackage(packageIndex, newPackage)
    }

    const addNewPackage = () => {
        const newPackage = getEmptySettingsPackage('Untitled package')

        setAppState((appState) => {
            return [...appState, newPackage]
        })
    }

    return (
        <EditorStoreContext.Provider value={{
            state: appState,
            updatePackagePreset,
            updatePackageParamsWithMultipleValues,
            updatePackageQuickActions,
            updatePackageLabel,
            updatePackageUrlPattern,
            addNewPackage
        }}>
            {props.children}
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext