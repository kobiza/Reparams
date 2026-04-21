// Model migration runner. Add a fixer here ONLY for breaking shape changes
// (rename, restructure, remove, re-semanticize). Additive/optional changes don't
// need a fixer — readers handle `undefined` gracefully.
//
// CURRENT_MODEL_VERSION auto-derives from the registry — do not hardcode.
// Every ingestion path (localStorage load, ImportDialog, future Gist fetch/sync)
// goes through `migrateModel`. Fixers must be deterministic.
// See CLAUDE.md § Model Evolution for the full rule.

import { EditorModel, SettingsPackage } from "../types/types";
import { localStorageKey } from "./consts";

type FixerFn = (prev: any) => any;

const fixers: Record<number, FixerFn> = {
    1: (prev: any): EditorModel => {
        const packages: Record<string, SettingsPackage> = Array.isArray(prev)
            ? prev.reduce<Record<string, SettingsPackage>>((acc, v: SettingsPackage) => {
                acc[v.key] = v;
                return acc;
            }, {})
            : (prev?.packages ?? {});
        return { modelVersion: 1, packages };
    },
};

const maxKey = (registry: Record<number, FixerFn>): number => {
    const keys = Object.keys(registry).map(Number);
    return keys.length ? Math.max(...keys) : 0;
};

export const CURRENT_MODEL_VERSION = maxKey(fixers);

export type MigrateFailureReason = 'parse' | 'fixer-threw' | 'future-version';

export type MigrateResult =
    | { ok: true; model: EditorModel }
    | { ok: false; reason: MigrateFailureReason };

const detectStoredVersion = (parsed: unknown): number => {
    if (Array.isArray(parsed)) return 0;
    if (parsed == null || typeof parsed !== 'object') return 0;
    const v = (parsed as { modelVersion?: unknown }).modelVersion;
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return v;
    return 0;
};

const safeParse = (s: string): unknown => {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
};

// Core migration — takes an explicit registry so tests can inject fixers.
// Production callers go through `migrateModel`.
export const runMigration = (
    raw: string | object | null | undefined,
    registry: Record<number, FixerFn>
): MigrateResult => {
    const currentVersion = maxKey(registry);

    if (raw == null || raw === '') {
        return { ok: true, model: { modelVersion: currentVersion, packages: {} } };
    }

    let parsed: unknown;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { ok: false, reason: 'parse' };
        }
    } else {
        parsed = raw;
    }

    const stored = detectStoredVersion(parsed);
    if (stored > currentVersion) {
        return { ok: false, reason: 'future-version' };
    }

    let current: unknown = parsed;
    for (let target = stored + 1; target <= currentVersion; target++) {
        const fixer = registry[target];
        if (!fixer) {
            return { ok: false, reason: 'fixer-threw' };
        }
        try {
            current = fixer(current);
        } catch {
            return { ok: false, reason: 'fixer-threw' };
        }
    }

    return { ok: true, model: current as EditorModel };
};

export const migrateModel = (raw: string | object | null | undefined): MigrateResult =>
    runMigration(raw, fixers);

export const loadAndMigrateAppData = (): MigrateResult => {
    const raw = localStorage.getItem(localStorageKey);
    const result = migrateModel(raw);
    if (result.ok && raw != null && raw !== '') {
        const parsedStoredVersion = detectStoredVersion(safeParse(raw));
        if (parsedStoredVersion !== CURRENT_MODEL_VERSION) {
            localStorage.setItem(localStorageKey, JSON.stringify(result.model));
        }
    }
    return result;
};

export const resetAppData = (): void => {
    localStorage.removeItem(localStorageKey);
};
