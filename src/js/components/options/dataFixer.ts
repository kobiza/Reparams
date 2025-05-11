import { EditorModel } from "../../types/types";

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
                // @ts-ignore
                urlPatterns,
                ...rest
            } = v

            return {
                ...rest,
                conditions: {
                    ...rest.conditions,
                    urlPatterns: urlPatterns || [],
                }
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
