import {PaletteColorOptions} from "@mui/material";

export type SearchParamsEntries = Array<[key: string, value: string]>

export type SetEntries = (newSearchParamsEntries: SearchParamsEntries) => void
export type AddEntriesAndNavigate = (newSearchParamsEntries: SearchParamsEntries, shouldOpenNewTab: boolean) => void

export type PresetsEntriesMap = {
    [id: string]: {
        label: string
        entries: SearchParamsEntries
    }
}

export type PresetsEntriesMapViewModel = {
    [label: string]: SearchParamsEntries
}

export type ParamsWithDelimiter = Array<{
    id: string
    label: string
    separator: string
}>

export type ParamsWithDelimiterViewModel = {
    [label: string]: {
        separator: string
    }
}

export type SettingsPackage = {
    key: string
    label: string
    urlPatterns: Array<{ id: string, value: string }>
    presets: PresetsEntriesMap
    paramsWithDelimiter: ParamsWithDelimiter
    quickActions: QuickActionData
}

export type MergedAppData = {
    presets: PresetsEntriesMap
    paramsWithDelimiter: ParamsWithDelimiter
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
    updatePackageParamsWithDelimiter: (packageIndex: number, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => void
    updatePackageQuickActions: (packageIndex: number, quickActions: SettingsPackage['quickActions']) => void
    updatePackageLabel: (packageIndex: number, label: string) => void
    updatePackageUrlPatterns: (packageIndex: number, urlPatterns: SettingsPackage['urlPatterns']) => void
    addNewPackage: (newPackageOverrides?: Partial<SettingsPackage>) => void
    addPackages: (packagesToAdd: Array<SettingsPackage>, replace: boolean) => void
    deletePackage: (packageIndex: number) => void
}

export type ViewerModel = {
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    quickActions: QuickActionData
}

export type ViewerStore = {
    state: ViewerModel
}


// declare module '@mui/material/styles' {
//     interface CustomPalette {
//         mycolor1: PaletteColorOptions;
//     }
//     interface Palette extends CustomPalette {}
//     interface PaletteOptions extends CustomPalette {}
// }
//
// declare module '@mui/material/Button' {
//     interface ButtonPropsColorOverrides {
//         mycolor1: true;
//     }
// }
