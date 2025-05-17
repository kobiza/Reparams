import { EditorModel, SettingsPackage } from "../../types/types";

export const runFixer1 = () => {
    const localStorageKey = 'paparamsAppData'
    // reset
    // localStorage.setItem(localStorageKey, '')
    // fixer
    const a = localStorage.getItem(localStorageKey)
    if (a) {
        const model = JSON.parse(a) as Array<SettingsPackage>
        const fixed = {
            modelVersion: '1.0.0',
            packages: model.reduce((acc, v) => {
                acc[v.key] = v
                return acc
            }, {} as { [key: string]: SettingsPackage })
        } as EditorModel

        localStorage.setItem(localStorageKey, JSON.stringify(fixed))
    }
}

export const reset = () => {
    const localStorageKey = 'paparamsAppData'
    // reset
    localStorage.setItem(localStorageKey, '')
}
