import { ParamSuggestions, SettingsPackage } from "../types/types";

export const buildSuggestions = (packages: SettingsPackage[]): ParamSuggestions => {
    const keys: string[] = [];
    const seenKeys = new Set<string>();
    const valuesByKey: { [key: string]: string[] } = {};
    const seenValuesByKey: { [key: string]: Set<string> } = {};

    const addEntry = (key: string, value: string, delimiterByKey: { [key: string]: string }) => {
        if (!key || !value) return;

        const separator = delimiterByKey[key];
        if (separator) {
            for (const rawToken of value.split(separator)) {
                const token = rawToken.trim();
                if (!token) continue;
                addEntry(key, token, {});
            }
            return;
        }

        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            keys.push(key);
        }

        let valueSet = seenValuesByKey[key];
        if (!valueSet) {
            valueSet = new Set<string>();
            seenValuesByKey[key] = valueSet;
            valuesByKey[key] = [];
        }
        if (!valueSet.has(value)) {
            valueSet.add(value);
            valuesByKey[key].push(value);
        }
    };

    for (const pkg of packages) {
        const delimiterByKey: { [key: string]: string } = {};
        for (const param of pkg.paramsWithDelimiter ?? []) {
            if (param?.label && param.separator) {
                delimiterByKey[param.label] = param.separator;
            }
        }

        const history = pkg.paramHistory ?? [];
        for (const entry of history) {
            if (!entry) continue;
            addEntry(entry.key, entry.value, delimiterByKey);
        }

        const presets = pkg.presets ?? {};
        for (const presetId of Object.keys(presets)) {
            const entries = presets[presetId]?.entries ?? [];
            for (const [key, value] of entries) {
                addEntry(key, value, delimiterByKey);
            }
        }
    }

    return { keys, valuesByKey };
};
