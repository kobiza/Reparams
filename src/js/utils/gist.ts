// Gist fetch utility. Pipes Gist body through `migrateModel` and captures
// `history[0].version` as the revision SHA. Used by ImportDialog (Phase 1)
// and Sync (Phase 3) — both ingestion surfaces consume the same helper.

import { EditorModel } from "../types/types";
import { migrateModel, MigrateFailureReason } from "./dataFixer";

const GIST_ID_RE = /[a-f0-9]{20,}/i;

export const parseGistInput = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^[a-f0-9]{20,}$/i.test(trimmed)) return trimmed;

    try {
        const url = new URL(trimmed);
        if (url.hostname !== 'gist.github.com') return null;
        const segments = url.pathname.split('/').filter(Boolean);
        const idSegment = segments.find(s => GIST_ID_RE.test(s) && /^[a-f0-9]+$/i.test(s));
        return idSegment ?? null;
    } catch {
        return null;
    }
};

export type GistFetchFailureReason =
    | 'invalid-input'
    | 'fetch-failed'
    | 'no-json-file'
    | MigrateFailureReason;

export type GistFetchResult =
    | { ok: true; model: EditorModel; revision: string }
    | { ok: false; reason: GistFetchFailureReason; httpStatus?: number };

type GistApiFile = { filename?: string; content?: string; truncated?: boolean };
type GistApiResponse = {
    files?: Record<string, GistApiFile>;
    history?: Array<{ version?: string }>;
};

const findJsonFile = (files: Record<string, GistApiFile>): GistApiFile | null => {
    for (const [name, file] of Object.entries(files)) {
        if (name.toLowerCase().endsWith('.json')) return file;
    }
    return null;
};

export const fetchGist = async (input: string): Promise<GistFetchResult> => {
    const id = parseGistInput(input);
    if (!id) return { ok: false, reason: 'invalid-input' };

    let response: Response;
    try {
        response = await fetch(`https://api.github.com/gists/${id}`, {
            headers: { Accept: 'application/vnd.github+json' },
        });
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    if (!response.ok) {
        return { ok: false, reason: 'fetch-failed', httpStatus: response.status };
    }

    let body: GistApiResponse;
    try {
        body = await response.json();
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    const files = body.files ?? {};
    const jsonFile = findJsonFile(files);
    if (!jsonFile) return { ok: false, reason: 'no-json-file' };

    // Truncated files would require a follow-up fetch of raw_url — defer to a
    // later phase. For now, treat as a fetch failure (see findings.md).
    if (jsonFile.truncated || jsonFile.content == null) {
        return { ok: false, reason: 'fetch-failed' };
    }

    const revision = body.history?.[0]?.version;
    if (!revision) return { ok: false, reason: 'fetch-failed' };

    const migrated = migrateModel(jsonFile.content);
    if (!migrated.ok) return { ok: false, reason: migrated.reason };

    return { ok: true, model: migrated.model, revision };
};
