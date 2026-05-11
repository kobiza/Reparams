import React, { createContext, PropsWithChildren, useEffect, useState } from "react";
import { EditorModel, EditorStore, SettingsPackage } from "../../types/types";
import { getEmptySettingsPackage, uuidv4 } from "../../utils/utils";
import { localStorageKey } from "../../utils/consts";
import { CURRENT_MODEL_VERSION, loadAndMigrateAppData } from "../../utils/dataFixer";


const noop = () => {
}
export const EditorStoreContext = createContext<EditorStore>({
    state: { modelVersion: CURRENT_MODEL_VERSION, packages: {} },
    updatePackagePreset: noop,
    updatePackageParamsWithDelimiter: noop,
    updatePackageLabel: noop,
    updatePackageUrlPatterns: noop,
    updatePackageDomSelectors: noop,
    addNewPackage: noop,
    addPackages: noop,
    deletePackage: noop,
    clearPackageParamHistory: noop,
    unlinkPackage: noop
});

const getInitialState = (): EditorModel => {
    const result = loadAndMigrateAppData()
    return result.ok ? result.model : { modelVersion: CURRENT_MODEL_VERSION, packages: {} }
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

    // Linked-to-Gist packages are read-only. Sync (Phase 3) replaces the whole
    // package via `addPackages`, which is intentionally NOT guarded.
    const isLocked = (packageKey: string) => !!appState.packages[packageKey]?.gistId;

    const updatePackagePreset = (packageKey: string, presets: SettingsPackage['presets']) => {
        if (isLocked(packageKey)) return;
        const newPackage = {
            ...appState.packages[packageKey],
            presets
        }
        _updatePackage(packageKey, newPackage)
    }

    const updatePackageParamsWithDelimiter = (packageKey: string, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => {
        if (isLocked(packageKey)) return;
        const newPackage = {
            ...appState.packages[packageKey],
            paramsWithDelimiter
        }
        _updatePackage(packageKey, newPackage)
    }



    const updatePackageLabel = (packageKey: string, label: string) => {
        if (isLocked(packageKey)) return;
        const newPackage = {
            ...appState.packages[packageKey],
            label
        }
        _updatePackage(packageKey, newPackage)
    }

    const updatePackageUrlPatterns = (packageKey: string, urlPatterns: SettingsPackage['conditions']['urlPatterns']) => {
        if (isLocked(packageKey)) return;
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
        if (isLocked(packageKey)) return;
        setAppState((prevState) => {
            const { [packageKey]: _, ...rest } = prevState.packages
            return {
                ...prevState,
                packages: rest
            }
        })
    }

    const updatePackageDomSelectors = (packageKey: string, domSelectors: SettingsPackage['conditions']['domSelectors']) => {
        if (isLocked(packageKey)) return;
        const newPackage = {
            ...appState.packages[packageKey],
            conditions: { ...appState.packages[packageKey].conditions, domSelectors }
        }
        _updatePackage(packageKey, newPackage)
    }

    const clearPackageParamHistory = (packageKey: string) => {
        if (isLocked(packageKey)) return;
        const prevPackage = appState.packages[packageKey]
        if (!prevPackage) return
        const newPackage = { ...prevPackage, paramHistory: [] }
        _updatePackage(packageKey, newPackage)
    }

    // The lock is *driven by* gistId, so unlink must bypass the lock guard.
    const unlinkPackage = (packageKey: string) => {
        const prevPackage = appState.packages[packageKey]
        if (!prevPackage) return
        const { gistId, gistRevision, ...rest } = prevPackage
        _updatePackage(packageKey, rest as SettingsPackage)
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
            deletePackage,
            clearPackageParamHistory,
            unlinkPackage
        }}>
            {props.children}
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext
