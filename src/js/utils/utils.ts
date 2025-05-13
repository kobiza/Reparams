import {
    EditorModel,
    FilterCriteriaItem,
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

export const getFilterCriteriaKey = (filterCriteriaItem: FilterCriteriaItem) => {
    return `${filterCriteriaItem.path}-${filterCriteriaItem.condition}-${filterCriteriaItem.value}`
}

export const getRelevantPackages = (editorModel: EditorModel, currentTabUrl: string, filterCriteriaResult: Record<string, boolean>): EditorModel => {
    return editorModel.filter((settingsPackage) => {
        console.log('getRelevantPackages', settingsPackage.label)
        const allUrlPatterns = settingsPackage.conditions.urlPatterns.map(v => v.value)
        const filterCriteria = settingsPackage.conditions.filterCriteria
        const someUrlPatternMatch = allUrlPatterns.some(urlPattern => matchUrl(currentTabUrl, urlPattern))

        if (someUrlPatternMatch) {
            console.log('someUrlPatternMatch', settingsPackage.label)
            return true
        }

        const someFilterCriteriaResult = filterCriteria.some(filterCriteriaItem => {
            const filterCriteriaKey = getFilterCriteriaKey(filterCriteriaItem)
            return filterCriteriaResult[filterCriteriaKey]
        })

        if (someFilterCriteriaResult) {
            console.log('someFilterCriteriaResult', settingsPackage.label)
            return true
        }

        return false
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
        conditions: {
            urlPatterns: [{ id: uuidv4(), value: '*://*/*' }],
            filterCriteria: []
        },
        presets: {},
        paramsWithDelimiter: [],
        quickActions: []
    }
}
