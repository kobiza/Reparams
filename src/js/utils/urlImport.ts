// Plain JSON-URL fetch + migrate. Both ImportDialog (initial import) and
// connectedSync (check-for-updates / pull-latest) go through here.

import { EditorModel } from "../types/types";
import { migrateModel, MigrateFailureReason } from "./dataFixer";

export type FetchModelFailureReason = 'fetch-failed' | MigrateFailureReason;

export type FetchModelResult =
    | { ok: true; model: EditorModel }
    | { ok: false; reason: FetchModelFailureReason; httpStatus?: number };

// Bust through the browser and CDN cache. Gist raw URLs go through Fastly
// with a 5-min TTL and Fastly intentionally ignores client `Cache-Control:
// no-cache`, so a unique query parameter is the only reliable way to force
// origin fetch when the user has just pushed a change.
const appendCacheBuster = (url: string): string => {
    try {
        const u = new URL(url);
        u.searchParams.set('_t', String(Date.now()));
        return u.toString();
    } catch {
        return url;
    }
};

export const fetchModelFromUrl = async (url: string): Promise<FetchModelResult> => {
    let response: Response;
    try {
        response = await fetch(appendCacheBuster(url), { cache: 'no-store' });
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    if (!response.ok) {
        return { ok: false, reason: 'fetch-failed', httpStatus: response.status };
    }

    let text: string;
    try {
        text = await response.text();
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    const migrated = migrateModel(text);
    if (!migrated.ok) return { ok: false, reason: migrated.reason };

    return { ok: true, model: migrated.model };
};
