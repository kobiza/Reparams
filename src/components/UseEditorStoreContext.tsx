import React, {createContext, PropsWithChildren, useEffect, useState} from "react";
import {EditorModel, EditorStore, SettingsPackage} from "../types/types";
import {removeItem, replaceItem} from "../utils/arrayUtils";
import {getEmptySettingsPackage} from "../utils/utils";

const noop = () => {
}
export const EditorStoreContext = createContext<EditorStore>({
    state: [],
    updatePackagePreset: noop,
    updatePackageParamsWithMultipleValues: noop,
    updatePackageQuickActions: noop,
    updatePackageLabel: noop,
    updatePackageUrlPatterns: noop,
    addNewPackage: noop,
    deletePackage: noop
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

    const updatePackageParamsWithMultipleValues = (packageIndex: number, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => {
        const newPackage = {
            ...appState[packageIndex],
            paramsWithDelimiter
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

    const updatePackageUrlPatterns = (packageIndex: number, urlPatterns: SettingsPackage['urlPatterns']) => {
        const newPackage = {
            ...appState[packageIndex],
            urlPatterns
        }
        _updatePackage(packageIndex, newPackage)
    }

    const addNewPackage: EditorStore['addNewPackage'] = (newPackageOverrides = {}) => {
        const newPackage = {
            ...getEmptySettingsPackage('Untitled package'),
            ...newPackageOverrides
        }

        setAppState((appState) => {
            return [...appState, newPackage]
        })
    }

    const deletePackage = (packageIndex: number) => {
        setAppState((appState) => {
            return removeItem(appState, packageIndex)
        })
    }

    return (
        <EditorStoreContext.Provider value={{
            state: appState,
            updatePackagePreset,
            updatePackageParamsWithMultipleValues,
            updatePackageQuickActions,
            updatePackageLabel,
            updatePackageUrlPatterns,
            addNewPackage,
            deletePackage
        }}>
            {props.children}
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext