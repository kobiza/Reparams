// Per-package and bulk Gist-sync orchestration. Builds on `gist.ts` (raw
// fetch) and the editor store's `addPackages` (overwrite path) — this module
// holds the per-package compare/apply logic and the bulk-check API-call
// dedupe (one fetch per unique gistId, regardless of how many packages
// reference it).

import { SettingsPackage } from "../types/types";
import { fetchGist, GistFetchFailureReason, GistFetchResult } from "./gist";

export type SyncFailureReason = GistFetchFailureReason | 'package-missing-in-gist';

export type SyncOutcome =
    | { kind: 'up-to-date' }
    | { kind: 'synced'; newRevision: string }
    | { kind: 'error'; reason: SyncFailureReason };

export type SyncPackageResult = {
    outcome: SyncOutcome;
    replacement?: SettingsPackage;
};

const buildReplacement = (pkg: SettingsPackage, fetched: GistFetchResult & { ok: true }): SettingsPackage | null => {
    const remote = fetched.model.packages[pkg.key];
    if (!remote) return null;
    return {
        ...remote,
        key: pkg.key,
        gistId: pkg.gistId,
        gistRevision: fetched.revision,
    };
};

export const syncPackage = async (pkg: SettingsPackage): Promise<SyncPackageResult> => {
    if (!pkg.gistId || !pkg.gistRevision) {
        return { outcome: { kind: 'error', reason: 'invalid-input' } };
    }

    const result = await fetchGist(pkg.gistId);
    if (!result.ok) {
        return { outcome: { kind: 'error', reason: result.reason } };
    }

    if (result.revision === pkg.gistRevision) {
        return { outcome: { kind: 'up-to-date' } };
    }

    const replacement = buildReplacement(pkg, result);
    if (!replacement) {
        return { outcome: { kind: 'error', reason: 'package-missing-in-gist' } };
    }

    return {
        outcome: { kind: 'synced', newRevision: result.revision },
        replacement,
    };
};

export type BulkCheckResult = {
    checked: number;
    outOfDate: Array<{ pkg: SettingsPackage; replacement: SettingsPackage }>;
    errors: Array<{ packageKey: string; reason: SyncFailureReason }>;
};

export const checkForUpdates = async (
    packages: { [key: string]: SettingsPackage }
): Promise<BulkCheckResult> => {
    const linkedPackages = Object.values(packages).filter(p => !!p.gistId && !!p.gistRevision);
    const uniqueGistIds = Array.from(new Set(linkedPackages.map(p => p.gistId!)));

    const fetchedEntries = await Promise.all(
        uniqueGistIds.map(async (id) => [id, await fetchGist(id)] as const)
    );
    const fetchedByGistId = new Map<string, GistFetchResult>(fetchedEntries);

    const outOfDate: BulkCheckResult['outOfDate'] = [];
    const errors: BulkCheckResult['errors'] = [];

    for (const pkg of linkedPackages) {
        const fetched = fetchedByGistId.get(pkg.gistId!);
        if (!fetched || !fetched.ok) {
            errors.push({
                packageKey: pkg.key,
                reason: fetched && !fetched.ok ? fetched.reason : 'fetch-failed',
            });
            continue;
        }
        if (fetched.revision === pkg.gistRevision) {
            continue; // up to date — skip
        }
        const replacement = buildReplacement(pkg, fetched);
        if (!replacement) {
            errors.push({ packageKey: pkg.key, reason: 'package-missing-in-gist' });
            continue;
        }
        outOfDate.push({ pkg, replacement });
    }

    return {
        checked: linkedPackages.length,
        outOfDate,
        errors,
    };
};
