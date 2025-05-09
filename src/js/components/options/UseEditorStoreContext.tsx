import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, EditorStore, SettingsPackage } from "../../types/types";
import { removeItem, replaceItem, toTrueObj } from "../../utils/arrayUtils";
import { getEmptySettingsPackage, uuidv4 } from "../../utils/utils";
import * as repl from "repl";

const noop = () => {
}
export const EditorStoreContext = createContext<EditorStore>({
    state: [],
    updatePackagePreset: noop,
    updatePackageParamsWithDelimiter: noop,
    updatePackageQuickActions: noop,
    updatePackageLabel: noop,
    updatePackageUrlPatterns: noop,
    updatePackageFilterCriteria: noop,
    addNewPackage: noop,
    addPackages: noop,
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

    const updatePackageParamsWithDelimiter = (packageIndex: number, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => {
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

    const updatePackageUrlPatterns = (packageIndex: number, urlPatterns: SettingsPackage['conditions']['urlPatterns']) => {
        const prevPackage = appState[packageIndex]
        const newPackage = {
            ...prevPackage,
            conditions: {
                ...prevPackage.conditions,
                urlPatterns
            }
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

    const addAndDuplicateExistingPackages = (packagesToAdd: Array<SettingsPackage>) => {
        setAppState((appState) => {
            const currentPackagesKeys = toTrueObj(appState, v => v.key)
            const packagesToAddWithNewIds = packagesToAdd.map(v => {
                if (!currentPackagesKeys[v.key]) {
                    return v
                }

                return {
                    ...v,
                    key: uuidv4()
                }
            })

            return [...appState, ...packagesToAddWithNewIds]
        })
    }

    const addAndReplaceExistingPackages = (packagesToAdd: Array<SettingsPackage>) => {
        setAppState((appState) => {
            const newPackagesKey = toTrueObj(packagesToAdd, v => v.key)
            const packagesToKeep = appState.filter(v => !newPackagesKey[v.key])

            return [...packagesToKeep, ...packagesToAdd]
        })
    }

    const addPackages: EditorStore['addPackages'] = (packagesToAdd, replace) => {
        if (replace) {
            addAndReplaceExistingPackages(packagesToAdd)
        } else {
            addAndDuplicateExistingPackages(packagesToAdd)
        }
    }

    const deletePackage = (packageIndex: number) => {
        setAppState((appState) => {
            return removeItem(appState, packageIndex)
        })
    }

    const updatePackageFilterCriteria = (packageIndex: number, filterCriteria: SettingsPackage['conditions']['filterCriteria']) => {
        const newPackage = {
            ...appState[packageIndex],
            conditions: { ...appState[packageIndex].conditions, filterCriteria }
        }
        _updatePackage(packageIndex, newPackage)
    }
    return (
        <EditorStoreContext.Provider value={{
            state: appState,
            updatePackagePreset,
            updatePackageParamsWithDelimiter,
            updatePackageQuickActions,
            updatePackageLabel,
            updatePackageUrlPatterns,
            updatePackageFilterCriteria,
            addNewPackage,
            addPackages,
            deletePackage
        }}>
            {props.children}
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext
