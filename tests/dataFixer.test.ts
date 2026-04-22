/**
 * @jest-environment jsdom
 */
import {
    CURRENT_MODEL_VERSION,
    loadAndMigrateAppData,
    migrateModel,
    resetAppData,
    runMigration,
} from '../src/js/utils/dataFixer';
import { EditorModel, SettingsPackage } from '../src/js/types/types';
import { localStorageKey } from '../src/js/utils/consts';

const makePackage = (key: string, label = 'Pkg'): SettingsPackage => ({
    key,
    label,
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
});

beforeEach(() => {
    localStorage.clear();
});

describe('CURRENT_MODEL_VERSION', () => {
    test('is derived from the registry (currently 1)', () => {
        expect(CURRENT_MODEL_VERSION).toBe(1);
    });
});

describe('migrateModel — no-op cases', () => {
    test('null input returns empty current-version model', () => {
        const result = migrateModel(null);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model.modelVersion).toBe(CURRENT_MODEL_VERSION);
            expect(result.model.packages).toEqual({});
        }
    });

    test('empty string returns empty current-version model', () => {
        const result = migrateModel('');
        expect(result.ok).toBe(true);
    });

    test('model already at current version passes through unchanged', () => {
        const model: EditorModel = {
            modelVersion: 1,
            packages: { 'p1': makePackage('p1') },
        };
        const result = migrateModel(JSON.stringify(model));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model).toEqual(model);
        }
    });
});

describe('migrateModel — error cases', () => {
    test('invalid JSON → parse reason', () => {
        expect(migrateModel('not-json-at-all')).toEqual({ ok: false, reason: 'parse' });
    });

    test('modelVersion higher than current → future-version reason', () => {
        const blob = JSON.stringify({ modelVersion: 999, packages: {} });
        expect(migrateModel(blob)).toEqual({ ok: false, reason: 'future-version' });
    });
});

describe('migrateModel — fixer-1 behavior', () => {
    test("legacy string modelVersion '1.0' normalizes to integer 1", () => {
        const legacy = { modelVersion: '1.0', packages: { p: makePackage('p') } };
        const result = migrateModel(JSON.stringify(legacy));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model.modelVersion).toBe(1);
            expect(result.model.packages.p.key).toBe('p');
        }
    });

    test("legacy string modelVersion '1.0.0' normalizes to integer 1", () => {
        const legacy = { modelVersion: '1.0.0', packages: { p: makePackage('p') } };
        const result = migrateModel(JSON.stringify(legacy));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model.modelVersion).toBe(1);
        }
    });

    test('object missing modelVersion entirely → treated as pre-v1, normalized', () => {
        const legacy = { packages: { p: makePackage('p') } };
        const result = migrateModel(JSON.stringify(legacy));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.model.modelVersion).toBe(1);
        }
    });
});

describe('migrateModel — idempotence', () => {
    test('running twice produces the same result', () => {
        const legacy = { modelVersion: '1.0', packages: { p: makePackage('p') } };
        const once = migrateModel(JSON.stringify(legacy));
        expect(once.ok).toBe(true);
        if (!once.ok) return;
        const twice = migrateModel(JSON.stringify(once.model));
        expect(twice).toEqual(once);
    });
});

describe('runMigration — pipeline chain', () => {
    test('v0 input through v2 registry runs fixer-1 then fixer-2 in order', () => {
        let order: number[] = [];
        // Fixers return the new shape only — runner stamps modelVersion.
        const registry = {
            1: (prev: any) => {
                order.push(1);
                return { packages: prev?.packages ?? {} };
            },
            2: (prev: any) => {
                order.push(2);
                return { ...prev, flag: 'v2' };
            },
        };
        const preV1 = { packages: { x: makePackage('x') } };
        const result = runMigration(JSON.stringify(preV1), registry);
        expect(result.ok).toBe(true);
        expect(order).toEqual([1, 2]);
        if (result.ok) {
            expect((result.model as any).modelVersion).toBe(2);
            expect((result.model as any).flag).toBe('v2');
            expect(result.model.packages.x.key).toBe('x');
        }
    });

    test('runner overrides any modelVersion the fixer mistakenly sets', () => {
        const registry = {
            1: (prev: any) => ({ ...prev, modelVersion: 99 }),
        };
        const result = runMigration('{}', registry);
        expect(result.ok).toBe(true);
        if (result.ok) {
            // Registry key (1) wins, not the fixer's wrong value (99).
            expect(result.model.modelVersion).toBe(1);
        }
    });
});

describe('runMigration — registry gap', () => {
    test('missing intermediate fixer → fixer-threw reason', () => {
        const registry = {
            1: (prev: any) => ({ modelVersion: 1, packages: prev?.packages ?? {} }),
            // gap at 2
            3: (prev: any) => ({ ...prev, modelVersion: 3 }),
        };
        const legacy = { packages: {} };
        const result = runMigration(JSON.stringify(legacy), registry);
        expect(result).toEqual({ ok: false, reason: 'fixer-threw' });
    });

    test('throwing fixer → fixer-threw reason', () => {
        const registry = {
            1: () => {
                throw new Error('boom');
            },
        };
        const result = runMigration('{}', registry);
        expect(result).toEqual({ ok: false, reason: 'fixer-threw' });
    });
});

describe('loadAndMigrateAppData', () => {
    test('seeds localStorage with legacy shape → writes back migrated shape', () => {
        const legacy = { modelVersion: '1.0', packages: { p: makePackage('p') } };
        localStorage.setItem(localStorageKey, JSON.stringify(legacy));

        const result = loadAndMigrateAppData();

        expect(result.ok).toBe(true);
        const stored = JSON.parse(localStorage.getItem(localStorageKey)!);
        expect(stored.modelVersion).toBe(1);
        expect(stored.packages.p.key).toBe('p');
    });

    test('invalid JSON → leaves localStorage untouched, returns error', () => {
        localStorage.setItem(localStorageKey, 'not-json');

        const result = loadAndMigrateAppData();

        expect(result).toEqual({ ok: false, reason: 'parse' });
        expect(localStorage.getItem(localStorageKey)).toBe('not-json');
    });

    test('empty localStorage → returns empty current-version model, no write', () => {
        const result = loadAndMigrateAppData();
        expect(result.ok).toBe(true);
        // Should not write back on the "nothing there" path
        expect(localStorage.getItem(localStorageKey)).toBe(null);
    });

    test('already at current version → no rewrite to localStorage', () => {
        const model: EditorModel = { modelVersion: 1, packages: {} };
        const raw = JSON.stringify(model);
        localStorage.setItem(localStorageKey, raw);

        loadAndMigrateAppData();

        // Unchanged (exact byte identity)
        expect(localStorage.getItem(localStorageKey)).toBe(raw);
    });
});

describe('resetAppData', () => {
    test('removes the appData key from localStorage', () => {
        localStorage.setItem(localStorageKey, 'something');
        resetAppData();
        expect(localStorage.getItem(localStorageKey)).toBe(null);
    });
});
