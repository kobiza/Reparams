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
    }
    Object.values(appData.packages).forEach((appDataPackage) => {
        assign(mergedAppData.presets, appDataPackage.presets)
        assign(mergedAppData.paramsWithDelimiter, appDataPackage.paramsWithDelimiter)
    })
    return mergedAppData
}

export const getRelevantPackages = (editorModel: EditorModel, currentTabUrl: string, domSelectorResult: Record<string, boolean>): SettingsPackage[] => {
    return Object.values(editorModel.packages).filter((settingsPackage) => {
        const allUrlPatterns = settingsPackage.conditions.urlPatterns.map(v => v.value)
        const domSelectors = settingsPackage.conditions.domSelectors
        const someUrlPatternMatch = allUrlPatterns.some(urlPattern => matchUrl(currentTabUrl, urlPattern))

        if (someUrlPatternMatch) {
            return true
        }

        const someDomSelectorResult = domSelectors.some(domSelector => {
            return domSelectorResult[domSelector.value]
        })

        if (someDomSelectorResult) {
            return true
        }

        return false
    })
}

export const toViewerModel = (relevantPackages: SettingsPackage[], currentTabUrl: string): ViewerModel => {
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
    })

    return viewerModel
}

export const getEmptySettingsPackage = (label: string): SettingsPackage => {
    return {
        key: uuidv4(),
        label,
        conditions: {
            urlPatterns: [{ id: uuidv4(), value: '*://*/*' }],
            domSelectors: []
        },
        presets: {},
        paramsWithDelimiter: [],
    }
}
