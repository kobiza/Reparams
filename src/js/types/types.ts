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
    conditions: {
        urlPatterns: Array<{ id: string, value: string }>
        domSelectors: Array<{ id: string, value: string }>
    }
    presets: PresetsEntriesMap
    paramsWithDelimiter: ParamsWithDelimiter
}

export type MergedAppData = {
    presets: PresetsEntriesMap
    paramsWithDelimiter: ParamsWithDelimiter

}

export type EditorModel = {
    modelVersion: string
    packages: { [key: string]: SettingsPackage }
}

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
    updatePackagePreset: (packageKey: string, presets: SettingsPackage['presets']) => void
    updatePackageParamsWithDelimiter: (packageKey: string, paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']) => void
    updatePackageLabel: (packageKey: string, label: string) => void
    updatePackageUrlPatterns: (packageKey: string, urlPatterns: SettingsPackage['conditions']['urlPatterns']) => void
    updatePackageDomSelectors: (packageKey: string, domSelectors: SettingsPackage['conditions']['domSelectors']) => void
    addNewPackage: (newPackageOverrides?: Partial<SettingsPackage>) => void
    addPackages: (packagesToAdd: { [key: string]: SettingsPackage }, replace: boolean) => void
    deletePackage: (packageKey: string) => void
}

export type ViewerModel = {
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    quickActions: QuickActionData
}

export type ViewerStore = {
    state: ViewerModel
}

export type DomSelectorRequestMessage = {
    type: 'DOM_SELECTOR_REQUEST';
    domSelectors: Array<string>;
}

export type DomSelectorResultMessage = {
    type: 'DOM_SELECTOR_RESULT';
    domSelectorResult: Record<string, boolean>;
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
