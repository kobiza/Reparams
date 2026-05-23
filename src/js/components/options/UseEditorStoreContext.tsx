import React, { createContext, PropsWithChildren, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { EditorModel, EditorStore, PendingFirstEdit, SettingsPackage } from "../../types/types";
import { getEmptySettingsPackage, uuidv4 } from "../../utils/utils";
import { localStorageKey } from "../../utils/consts";
import { CURRENT_MODEL_VERSION, loadAndMigrateAppData } from "../../utils/dataFixer";
import FirstEditPromptDialog from "./FirstEditPromptDialog";


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
    disconnectPackage: noop,
    pendingFirstEdit: null,
    confirmOverride: noop,
    forkAsNewPackage: noop,
    cancelPendingEdit: noop,
    showNotification: noop,
});

const getInitialState = (): EditorModel => {
    const result = loadAndMigrateAppData()
    return result.ok ? result.model : { modelVersion: CURRENT_MODEL_VERSION, packages: {} }
}

// Mutations are classified as 'data' (edits to a package's contents — gated
// by the first-edit prompt for connected, not-yet-overridden packages) or
// 'structural' (delete, disconnect, clear-history — bypass the prompt). This
// is the single source of truth for the lock-equivalent behavior.
type MutationKind = 'data' | 'structural';

const UseEditorStoreContext = (props: PropsWithChildren) => {
    const [appState, setAppState] = useState(getInitialState)
    const [pendingFirstEdit, setPendingFirstEdit] = useState<PendingFirstEdit | null>(null)
    // A counter-keyed notification lives at the provider scope so it survives any
    // re-renders or remounts deeper in the tree (e.g. when addPackages triggers a
    // store update at the same time the originating component would set state).
    const notificationIdRef = useRef(0)
    const [notification, setNotification] = useState<{ id: number; message: string } | null>(null)

    const showNotification = (message: string) => {
        notificationIdRef.current += 1
        setNotification({ id: notificationIdRef.current, message })
    }

    const handleNotificationClose = (_: unknown, reason?: string) => {
        if (reason === 'clickaway') return
        setNotification(null)
    }

    useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(appState))
    }, [appState])

    const applyTransform = (packageKey: string, transform: (pkg: SettingsPackage) => SettingsPackage) => {
        setAppState((prevState) => {
            const pkg = prevState.packages[packageKey]
            if (!pkg) return prevState
            return {
                ...prevState,
                packages: {
                    ...prevState.packages,
                    [packageKey]: transform(pkg),
                },
            }
        })
    }

    const guardFirstEdit = (
        packageKey: string,
        kind: MutationKind,
        transform: (pkg: SettingsPackage) => SettingsPackage
    ) => {
        const pkg = appState.packages[packageKey]
        if (!pkg) return
        if (kind === 'data' && pkg.sourceUrl && !pkg.isOverride) {
            setPendingFirstEdit({ packageKey, packageLabel: pkg.label, transform })
            return
        }
        applyTransform(packageKey, transform)
    }

    const updatePackagePreset = (packageKey: string, presets: SettingsPackage['presets']) => {
        guardFirstEdit(packageKey, 'data', (pkg) => ({ ...pkg, presets }))
    }

    const updatePackageParamsWithDelimiter = (packageKey: string, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => {
        guardFirstEdit(packageKey, 'data', (pkg) => ({ ...pkg, paramsWithDelimiter }))
    }

    const updatePackageLabel = (packageKey: string, label: string) => {
        guardFirstEdit(packageKey, 'data', (pkg) => ({ ...pkg, label }))
    }

    const updatePackageUrlPatterns = (packageKey: string, urlPatterns: SettingsPackage['conditions']['urlPatterns']) => {
        guardFirstEdit(packageKey, 'data', (pkg) => ({
            ...pkg,
            conditions: { ...pkg.conditions, urlPatterns },
        }))
    }

    const updatePackageDomSelectors = (packageKey: string, domSelectors: SettingsPackage['conditions']['domSelectors']) => {
        guardFirstEdit(packageKey, 'data', (pkg) => ({
            ...pkg,
            conditions: { ...pkg.conditions, domSelectors },
        }))
    }

    const clearPackageParamHistory = (packageKey: string) => {
        guardFirstEdit(packageKey, 'structural', (pkg) => ({ ...pkg, paramHistory: [] }))
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

    const disconnectPackage = (packageKey: string) => {
        setAppState((prevState) => {
            const pkg = prevState.packages[packageKey]
            if (!pkg) return prevState
            const { sourceUrl, isOverride, ...rest } = pkg
            return {
                ...prevState,
                packages: {
                    ...prevState.packages,
                    [packageKey]: rest as SettingsPackage,
                },
            }
        })
    }

    // Combine the override flip and the captured transformer in a single
    // state update so the snapshot inside `transform` doesn't clobber
    // isOverride back to undefined.
    const confirmOverride = () => {
        if (!pendingFirstEdit) return
        const pending = pendingFirstEdit
        setAppState((prevState) => {
            const pkg = prevState.packages[pending.packageKey]
            if (!pkg) return prevState
            const overridden = { ...pkg, isOverride: true }
            return {
                ...prevState,
                packages: {
                    ...prevState.packages,
                    [pending.packageKey]: pending.transform(overridden),
                },
            }
        })
        setPendingFirstEdit(null)
    }

    const forkAsNewPackage = () => {
        if (!pendingFirstEdit) return
        const pkg = appState.packages[pendingFirstEdit.packageKey]
        if (pkg) {
            addNewPackage({
                label: `Copy of ${pkg.label}`,
                paramsWithDelimiter: pkg.paramsWithDelimiter,
                conditions: pkg.conditions,
            })
        }
        setPendingFirstEdit(null)
    }

    const cancelPendingEdit = () => setPendingFirstEdit(null)

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
            disconnectPackage,
            pendingFirstEdit,
            confirmOverride,
            forkAsNewPackage,
            cancelPendingEdit,
            showNotification,
        }}>
            {props.children}
            <FirstEditPromptDialog />
            <Snackbar
                key={notification?.id ?? 'closed'}
                open={notification !== null}
                autoHideDuration={4000}
                onClose={handleNotificationClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification?.message ?? ''}
                </Alert>
            </Snackbar>
        </EditorStoreContext.Provider>
    )
}

export default UseEditorStoreContext
