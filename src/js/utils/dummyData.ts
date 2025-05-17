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


export const appData: EditorModel = {
    modelVersion: '1.0.0',
    packages: {
        'kobiz-package': {
            key: 'kobiz-package',
            label: 'kobiz package',
            conditions: {
                urlPatterns: [{ id: 'p-1', value: '*://*/*' }],
                domSelectors: []
            },
            presets,
            paramsWithDelimiter,
        }
    }
}
