import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, EditorStore, SettingsPackage } from "../../types/types";
import { getEmptySettingsPackage, uuidv4 } from "../../utils/utils";
import { localStorageKey } from "../../utils/consts";


const noop = () => {
}
export const EditorStoreContext = createContext<EditorStore>({
    state: { modelVersion: '', packages: {} },
    updatePackagePreset: noop,
    updatePackageParamsWithDelimiter: noop,
    updatePackageLabel: noop,
    updatePackageUrlPatterns: noop,
    updatePackageDomSelectors: noop,
    addNewPackage: noop,
    addPackages: noop,
    deletePackage: noop
});

const getInitialState = (): EditorModel => {
    const appData = localStorage.getItem(localStorageKey)
    return appData ? JSON.parse(appData) : { modelVersion: '', packages: {} }
}

const UseEditorStoreContext = (props: PropsWithChildren) => {
    const [appState, setAppState] = useState(getInitialState)

    useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(appState))
    }, [appState])

    const _updatePackage = (packageKey: string, newPackage: SettingsPackage) => {
        setAppState((prevState) => ({
            ...prevState,
            packages: {
                ...prevState.packages,
                [packageKey]: newPackage
            }
        }))
    }

    const updatePackagePreset = (packageKey: string, presets: SettingsPackage['presets']) => {
        const newPackage = {
            ...appState.packages[packageKey],
            presets
        }
        _updatePackage(packageKey, newPackage)
    }

    const updatePackageParamsWithDelimiter = (packageKey: string, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => {
        const newPackage = {
            ...appState.packages[packageKey],
            paramsWithDelimiter
        }
        _updatePackage(packageKey, newPackage)
    }



    const updatePackageLabel = (packageKey: string, label: string) => {
        const newPackage = {
            ...appState.packages[packageKey],
            label
        }
        _updatePackage(packageKey, newPackage)
    }

    const updatePackageUrlPatterns = (packageKey: string, urlPatterns: SettingsPackage['conditions']['urlPatterns']) => {
        const prevPackage = appState.packages[packageKey]
        const newPackage = {
            ...prevPackage,
            conditions: {
                ...prevPackage.conditions,
                urlPatterns
            }
        }
        _updatePackage(packageKey, newPackage)
    }

    const addNewPackage: EditorStore['addNewPackage'] = (newPackageOverrides = {}) => {
        const newPackage = {
            ...getEmptySettingsPackage('Untitled package'),
            ...newPackageOverrides
        }
        setAppState((prevState) => ({
            ...prevState,
            packages: {
                ...prevState.packages,
                [newPackage.key]: newPackage
            }
        }))
    }

    const addAndDuplicateExistingPackages = (packagesToAdd: { [key: string]: SettingsPackage }) => {
        setAppState((prevState) => {
            const currentPackagesKeys = { ...prevState.packages }
            const packagesToAddWithNewIds: { [key: string]: SettingsPackage } = {}
            Object.values(packagesToAdd).forEach(v => {
                if (!currentPackagesKeys[v.key]) {
                    packagesToAddWithNewIds[v.key] = v
                } else {
                    const newKey = uuidv4()
                    packagesToAddWithNewIds[newKey] = { ...v, key: newKey }
                }
            })
            return {
                ...prevState,
                packages: {
                    ...prevState.packages,
                    ...packagesToAddWithNewIds
                }
            }
        })
    }

    const addAndReplaceExistingPackages = (packagesToAdd: { [key: string]: SettingsPackage }) => {
        setAppState((prevState) => {
            const newPackagesKey = { ...packagesToAdd }
            const packagesToKeep = Object.fromEntries(
                Object.entries(prevState.packages).filter(([key]) => !newPackagesKey[key])
            )
            return {
                ...prevState,
                packages: {
                    ...packagesToKeep,
                    ...packagesToAdd
                }
            }
        })
    }

    const addPackages: EditorStore['addPackages'] = (packagesToAdd, replace) => {
        if (replace) {
            addAndReplaceExistingPackages(packagesToAdd)
        } else {
            addAndDuplicateExistingPackages(packagesToAdd)
        }
    }

    const deletePackage = (packageKey: string) => {
        setAppState((prevState) => {
            const { [packageKey]: _, ...rest } = prevState.packages
            return {
                ...prevState,
                packages: rest
            }
        })
    }

    const updatePackageDomSelectors = (packageKey: string, domSelectors: SettingsPackage['conditions']['domSelectors']) => {
        const newPackage = {
            ...appState.packages[packageKey],
            conditions: { ...appState.packages[packageKey].conditions, domSelectors }
        }
        _updatePackage(packageKey, newPackage)
    }
    return (
        <EditorStoreContext.Provider value={{
            state: appState,
            updatePackagePreset,
            updatePackageParamsWithDelimiter,
            updatePackageLabel,
            updatePackageUrlPatterns,
            updatePackageDomSelectors,
            addNewPackage,
            addPackages,
            deletePackage
        }}>
            {props.children}
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext
