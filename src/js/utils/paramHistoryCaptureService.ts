import { EditorModel, SearchParamsEntries, SettingsPackage } from "../types/types";
import { loadAndMigrateAppData } from "./dataFixer";
import { matchUrl } from "./urlMatchChecker";
import { localStorageKey, PARAM_HISTORY_MAX_ENTRIES } from "./consts";
import { mergeParamHistory } from "./paramHistoryUtils";

const packageMatchesUrl = (pkg: SettingsPackage, url: string): boolean => {
    const patterns = pkg.conditions?.urlPatterns ?? [];
    return patterns.some(({ value }) => {
        if (!value) return false;
        try {
            return matchUrl(url, value);
        } catch {
            return false;
        }
    });
};

export const captureParamHistory = (
    appliedUrl: string,
    entries: SearchParamsEntries
): void => {
    if (!entries.length) return;

    const result = loadAndMigrateAppData();
    if (!result.ok) return;

    const model: EditorModel = result.model;
    const packages = model.packages ?? {};
    const packageKeys = Object.keys(packages);
    if (!packageKeys.length) return;

    let modelChanged = false;
    const nextPackages: { [key: string]: SettingsPackage } = { ...packages };

    for (const key of packageKeys) {
        const pkg = packages[key];
        if (!packageMatchesUrl(pkg, appliedUrl)) continue;

        const nextHistory = mergeParamHistory(pkg.paramHistory, entries, PARAM_HISTORY_MAX_ENTRIES);
        const prevHistory = pkg.paramHistory ?? [];
        if (
            nextHistory.length === prevHistory.length &&
            nextHistory.every((e, i) => e.key === prevHistory[i]?.key && e.value === prevHistory[i]?.value)
        ) {
            continue;
        }

        nextPackages[key] = { ...pkg, paramHistory: nextHistory };
        modelChanged = true;
    }

    if (!modelChanged) return;

    const nextModel: EditorModel = { ...model, packages: nextPackages };
    localStorage.setItem(localStorageKey, JSON.stringify(nextModel));
};
