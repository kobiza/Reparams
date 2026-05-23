// Bulk and per-package "pull from source URL". Connected packages carry
// `sourceUrl`; the bulk check dedupes by URL (one HTTP call per unique URL),
// per local package looks up the matching key in the fetched model, and
// preserves the local key/sourceUrl/isOverride. No revision compare — every
// successfully matched connected package is treated as out-of-date.

import { SettingsPackage } from "../types/types";
import { fetchModelFromUrl, FetchModelFailureReason, FetchModelResult } from "./urlImport";

export type UpdateCheckFailureReason = FetchModelFailureReason | 'package-missing-in-source';

export type UpdateCheckError = {
    packageKey: string
    reason: UpdateCheckFailureReason
};

export type ConnectedUpdate = {
    pkg: SettingsPackage
    replacement: SettingsPackage
};

export type ConnectedCheckResult = {
    checked: number
    autoApplied: ConnectedUpdate[]
    overrideConflicts: ConnectedUpdate[]
    errors: UpdateCheckError[]
};

// Pulling means "accept the source version", so we strip any local override
// flag (and any sourceUrl/isOverride that may have leaked into the exported
// remote payload). The local sourceUrl is the canonical connection identity.
const buildReplacement = (pkg: SettingsPackage, fetched: FetchModelResult & { ok: true }): SettingsPackage | null => {
    const remote = fetched.model.packages[pkg.key];
    if (!remote) return null;
    const { isOverride: _ignoredOverride, sourceUrl: _ignoredSourceUrl, ...remoteCore } = remote;
    return {
        ...remoteCore,
        key: pkg.key,
        sourceUrl: pkg.sourceUrl,
    };
};

export const checkConnectedPackagesForUpdates = async (
    packages: { [key: string]: SettingsPackage }
): Promise<ConnectedCheckResult> => {
    const connected = Object.values(packages).filter(p => !!p.sourceUrl);
    const uniqueUrls = Array.from(new Set(connected.map(p => p.sourceUrl!)));

    const fetched = new Map<string, FetchModelResult>();
    await Promise.all(uniqueUrls.map(async (url) => {
        fetched.set(url, await fetchModelFromUrl(url));
    }));

    const autoApplied: ConnectedUpdate[] = [];
    const overrideConflicts: ConnectedUpdate[] = [];
    const errors: UpdateCheckError[] = [];

    for (const pkg of connected) {
        const result = fetched.get(pkg.sourceUrl!);
        if (!result || !result.ok) {
            errors.push({
                packageKey: pkg.key,
                reason: result && !result.ok ? result.reason : 'fetch-failed',
            });
            continue;
        }
        const replacement = buildReplacement(pkg, result);
        if (!replacement) {
            errors.push({ packageKey: pkg.key, reason: 'package-missing-in-source' });
            continue;
        }
        if (pkg.isOverride) {
            overrideConflicts.push({ pkg, replacement });
        } else {
            autoApplied.push({ pkg, replacement });
        }
    }

    return {
        checked: connected.length,
        autoApplied,
        overrideConflicts,
        errors,
    };
};

export type PullPackageResult =
    | { ok: true; replacement: SettingsPackage }
    | { ok: false; reason: UpdateCheckFailureReason };

export const pullPackageFromSource = async (pkg: SettingsPackage): Promise<PullPackageResult> => {
    if (!pkg.sourceUrl) return { ok: false, reason: 'fetch-failed' };
    const result = await fetchModelFromUrl(pkg.sourceUrl);
    if (!result.ok) return { ok: false, reason: result.reason };
    const replacement = buildReplacement(pkg, result);
    if (!replacement) return { ok: false, reason: 'package-missing-in-source' };
    return { ok: true, replacement };
};
