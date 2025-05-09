import { EditorModel, ParamsWithDelimiter, PresetsEntriesMap, QuickActionData } from "../types/types";

export const presets: PresetsEntriesMap = {
    "debug": {
        "label": "debug",
        "entries": [
            [
                "debug",
                "true"
            ]
        ]
    },
    "debugPlus": {
        "label": "debugPlus",
        "entries": [
            [
                "debug",
                "true"
            ],
            [
                "user",
                "test"
            ]
        ]
    },
    "experiments-refactor": {
        "label": "experiments-refactor",
        "entries": [
            [
                "experiments",
                "spec.refactor"
            ]
        ]
    },
    "experiments1-2": {
        "label": "experiments1-2",
        "entries": [
            [
                "experiments",
                "experiment1,experiment2"
            ]
        ]
    },
    "experiments2-3": {
        "label": "experiments2-3",
        "entries": [
            [
                "experiments",
                "experiment2,experiment3"
            ]
        ]
    },
    "local": {
        "label": "local",
        "entries": [
            [
                "appSource",
                "http://localhost:3333/"
            ]
        ]
    },
    "moshe": {
        "label": "moshe",
        "entries": [
            [
                "name",
                "Moshe"
            ]
        ]
    },
    "age23": {
        "label": "age23",
        "entries": [
            [
                "age",
                "23"
            ]
        ]
    }
}

export const paramsWithDelimiter: ParamsWithDelimiter = [{
    id: 'param-1',
    label: 'experiments',
    separator: ','
}]

const quickActions: QuickActionData = [
    {
        id: 'qa-1',
        label: 'debug-refactor',
        shortcut: 1,
        presets: [
            'debug',
            'experiments-refactor'
        ]
    },
    {
        id: 'qa-2',
        label: 'moshe-23',
        shortcut: 2,
        presets: [
            'moshe',
            'age23'
        ]
    },
    {
        id: 'qa-3',
        label: 'local-debug',
        shortcut: 1,
        presets: [
            'local',
            'debug'
        ]
    },
]

export const appData: EditorModel = [{
    key: 'kobiz-package',
    label: 'kobiz package',
    conditions: {
        urlPatterns: [{ id: 'p-1', value: '*://*/*' }],
        filterCriteria: []
    },
    presets,
    paramsWithDelimiter,
    quickActions
}]
