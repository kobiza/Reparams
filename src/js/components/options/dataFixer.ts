import { EditorModel, SettingsPackage } from "../../types/types";
import { localStorageKey } from "../../utils/consts";

export const runFixer1 = () => {

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
    // reset
    localStorage.setItem(localStorageKey, '')
}
