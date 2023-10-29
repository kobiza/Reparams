export type SearchParamsEntries = Array<[key: string, value: string]>

export type SetEntries = (newSearchParamsEntries: SearchParamsEntries) => void
export type AddEntriesAndNavigate = (newSearchParamsEntries: SearchParamsEntries) => void

export type PresetsEntriesMap = {
    [id: string]: {
        label: string
        entries: SearchParamsEntries
    }
}

export type PresetsEntriesMapViewModel = {
    [label: string]: SearchParamsEntries
}

export type ParamsWithMultipleValues = {
    [id: string]: {
        label: string
        separator: string
    }
}

export type ParamsWithMultipleValuesViewModel = {
    [label: string]: {
        separator: string
    }
}

export type SettingsPackage = {
    key: string
    label: string
    presets: PresetsEntriesMap
    paramsWithMultipleValues: ParamsWithMultipleValues
    quickActions: QuickActionData
}

export type MergedAppData = {
    presets: PresetsEntriesMap
    paramsWithMultipleValues: ParamsWithMultipleValues
    quickActions: QuickActionData
}

export type EditorModel = Array<SettingsPackage>

export type Option = {
    id: string,
    name: string
}

export type QuickActionData = Array<{
    id: string
    label: string
    presets: Array<string>
    shortcut?: number
}>

export type EditorStore = {
    state: EditorModel
    updatePackagePreset: (packageIndex: number, presets: SettingsPackage['presets']) => void
    updatePackageParamsWithMultipleValues: (packageIndex: number, paramsWithMultipleValues: SettingsPackage['paramsWithMultipleValues']) => void
    updatePackageQuickActions: (packageIndex: number, quickActions: SettingsPackage['quickActions']) => void
    updatePackageLabel: (packageIndex: number, label: string) => void
    addNewPackage: () => void
}

export type ViewerModel = {
    presets: PresetsEntriesMapViewModel
    paramsWithMultipleValues: ParamsWithMultipleValuesViewModel
    quickActions: QuickActionData
}

export type ViewerStore = {
    state: ViewerModel
}