import {EditorModel} from "../types/types";

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
                // @ts-ignore
                urlPattern,
                presets,
                paramsWithDelimiter,
                quickActions
            } = v

            return {
                key,
                label,
                urlPatterns: (urlPattern as string).split(';').map((v, index) => ({id: `p-${index}`, value: v})),
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