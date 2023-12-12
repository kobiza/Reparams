import {EditorModel} from "../../types/types";

export const runFixer1 = () => {
    const localStorageKey = 'paparamsAppData'
// reset
// localStorage.setItem(localStorageKey, '')
// fixer
    const a = localStorage.getItem(localStorageKey)
    if (a) {
        const model = JSON.parse(a) as EditorModel
        const fixed = model.map(v => {
            const {
                key,
                label,
                urlPatterns,
                presets,
                // @ts-ignore
                paramsWithMultipleValues,
                quickActions
            } = v

            const paramsWithDelimiter = Object.keys(paramsWithMultipleValues).map(v => ({
                id: v,
                label: paramsWithMultipleValues[v].label,
                separator: paramsWithMultipleValues[v].separator
            }))

            return {
                key,
                label,
                urlPatterns,
                presets,
                paramsWithDelimiter,
                quickActions
            }
        })

        localStorage.setItem(localStorageKey, JSON.stringify(fixed))
    }
}

export const reset = () => {
    const localStorageKey = 'paparamsAppData'
// reset
    localStorage.setItem(localStorageKey, '')
}