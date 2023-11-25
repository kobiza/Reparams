import {
    EditorModel,
    MergedAppData,
    ParamsWithMultipleValuesViewModel,
    PresetsEntriesMapViewModel,
    SettingsPackage,
    ViewerModel
} from "../types/types";
import {assign} from "lodash";
import {matchUrl} from "./urlMatchChecker";

export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        // @ts-ignore
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export const mergeAppDataPackages = (appData: EditorModel): MergedAppData => {
    const mergedAppData: MergedAppData = {
        presets: {},
        paramsWithMultipleValues: {},
        quickActions: []
    }

    appData.forEach((appDataPackage) => {
        assign(mergedAppData.presets, appDataPackage.presets)
        assign(mergedAppData.paramsWithMultipleValues, appDataPackage.paramsWithMultipleValues)
        mergedAppData.quickActions = [...mergedAppData.quickActions, ...appDataPackage.quickActions]
    })

    return mergedAppData
}

export const toViewerModel = (editorModel: EditorModel, currentTabUrl: string): ViewerModel => {
    const packagesDataToMerge = editorModel.filter((settingsPackage) => {
        const allUrlPatterns = settingsPackage.urlPatterns.map(v => v.value)
        return allUrlPatterns.some(urlPattern => matchUrl(currentTabUrl, urlPattern))
    }).map(settingsPackage => {
        const presets: PresetsEntriesMapViewModel = Object.keys(settingsPackage.presets).reduce<PresetsEntriesMapViewModel>((acc, presetKey) => {
            const {label, entries} = settingsPackage.presets[presetKey]
            acc[label] = entries

            return acc
        }, {})
        const paramsWithMultipleValues: ParamsWithMultipleValuesViewModel = Object.keys(settingsPackage.paramsWithMultipleValues).reduce<ParamsWithMultipleValuesViewModel>((acc, id) => {
            const {label, separator} = settingsPackage.paramsWithMultipleValues[id]
            acc[label] = {separator}

            return acc
        }, {})

        return {
            presets,
            paramsWithMultipleValues,
            quickActions: settingsPackage.quickActions
        }
    })

    const viewerModel: ViewerModel = {
        presets: {},
        paramsWithMultipleValues: {},
        quickActions: []
    }

    packagesDataToMerge.forEach((appDataPackage) => {
        assign(viewerModel.presets, appDataPackage.presets)
        assign(viewerModel.paramsWithMultipleValues, appDataPackage.paramsWithMultipleValues)
        viewerModel.quickActions = [...viewerModel.quickActions, ...appDataPackage.quickActions]
    })

    return viewerModel
}

export const getEmptySettingsPackage = (label: string): SettingsPackage => {
    return {
        key: uuidv4(),
        label,
        urlPatterns: [{id: uuidv4(), value: '*://*/*'}],
        presets: {},
        paramsWithMultipleValues: {
            [uuidv4()]: {
                label: '',
                separator: ''
            }
        },
        quickActions: []
    }
}