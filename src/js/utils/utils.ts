import {
    EditorModel,
    MergedAppData,
    ParamsWithDelimiterViewModel,
    PresetsEntriesMapViewModel,
    SettingsPackage,
    ViewerModel
} from "../types/types";
import { assign } from "lodash";
import { matchUrl } from "./urlMatchChecker";

export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        // @ts-ignore
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export const mergeAppDataPackages = (appData: EditorModel): MergedAppData => {
    const mergedAppData: MergedAppData = {
        presets: {},
        paramsWithDelimiter: [],
        quickActions: []
    }

    appData.forEach((appDataPackage) => {
        assign(mergedAppData.presets, appDataPackage.presets)
        assign(mergedAppData.paramsWithDelimiter, appDataPackage.paramsWithDelimiter)
        mergedAppData.quickActions = [...mergedAppData.quickActions, ...appDataPackage.quickActions]
    })

    return mergedAppData
}

export const getRelevantPackages = (editorModel: EditorModel, currentTabUrl: string, isCommonConfig: boolean): EditorModel => {
    return editorModel.filter((settingsPackage) => {
        const allUrlPatterns = settingsPackage.urlPatterns.map(v => v.value)
        const matchesUrl = allUrlPatterns.some(urlPattern => matchUrl(currentTabUrl, urlPattern))

        if (isCommonConfig) {
            return matchesUrl || settingsPackage.label === 'common'
        }

        return matchesUrl
    })
}

export const toViewerModel = (relevantPackages: EditorModel, currentTabUrl: string): ViewerModel => {
    const packagesDataToMerge = relevantPackages.map(settingsPackage => {
        const presets: PresetsEntriesMapViewModel = Object.keys(settingsPackage.presets).reduce<PresetsEntriesMapViewModel>((acc, presetKey) => {
            const { label, entries } = settingsPackage.presets[presetKey]
            acc[label] = entries

            return acc
        }, {})
        const paramsWithDelimiter: ParamsWithDelimiterViewModel = settingsPackage.paramsWithDelimiter.reduce<ParamsWithDelimiterViewModel>((acc, paramData) => {
            const { label, separator } = paramData
            acc[label] = { separator }

            return acc
        }, {})

        return {
            presets,
            paramsWithDelimiter,
            quickActions: settingsPackage.quickActions
        }
    })

    const viewerModel: ViewerModel = {
        presets: {},
        paramsWithDelimiter: {},
        quickActions: []
    }

    packagesDataToMerge.forEach((appDataPackage) => {
        assign(viewerModel.presets, appDataPackage.presets)
        assign(viewerModel.paramsWithDelimiter, appDataPackage.paramsWithDelimiter)
        viewerModel.quickActions = [...viewerModel.quickActions, ...appDataPackage.quickActions]
    })

    return viewerModel
}

export const getEmptySettingsPackage = (label: string): SettingsPackage => {
    return {
        key: uuidv4(),
        label,
        urlPatterns: [{ id: uuidv4(), value: '*://*/*' }],
        presets: {},
        paramsWithDelimiter: [{
            id: uuidv4(),
            label: '',
            separator: ''
        }],
        quickActions: []
    }
}
