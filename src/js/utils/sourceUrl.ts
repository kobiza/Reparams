// Source-URL helpers. The import flow accepts any JSON URL; gist.github.com
// page URLs are resolved once to the *unpinned* raw URL so future fetches see
// new content as the gist is updated. Plain raw URLs (and any other JSON URL)
// pass through unchanged.

const GIST_ID_RE = /^[a-f0-9]+$/i;

export const isGistUrl = (input: string): boolean => {
    try {
        const url = new URL(input.trim());
        return url.hostname === 'gist.github.com';
    } catch {
        return false;
    }
};

const extractGistId = (input: string): string | null => {
    try {
        const url = new URL(input.trim());
        if (url.hostname !== 'gist.github.com') return null;
        const segments = url.pathname.split('/').filter(Boolean);
        const idSegment = segments.find(s => s.length >= 20 && GIST_ID_RE.test(s));
        return idSegment ?? null;
    } catch {
        return null;
    }
};

export type GistResolveFailureReason = 'invalid-input' | 'fetch-failed' | 'no-json-file';

export type GistResolveResult =
    | { ok: true; rawUrl: string }
    | { ok: false; reason: GistResolveFailureReason };

type GistApiFile = { filename?: string; raw_url?: string };
type GistApiResponse = { files?: Record<string, GistApiFile> };

const findJsonFile = (files: Record<string, GistApiFile>): GistApiFile | null => {
    for (const [name, file] of Object.entries(files)) {
        if (name.toLowerCase().endsWith('.json')) return file;
    }
    return null;
};

// Strip the embedded revision SHA so the URL points at the latest content.
// GitHub raw URLs look like:
//   https://gist.githubusercontent.com/{user}/{id}/raw/{sha}/{file}
// Removing the {sha} segment yields the unpinned form that auto-updates.
const stripRevisionFromRawUrl = (rawUrl: string): string => {
    try {
        const url = new URL(rawUrl);
        const segments = url.pathname.split('/');
        const rawIndex = segments.indexOf('raw');
        if (rawIndex === -1) return rawUrl;
        const afterRaw = segments[rawIndex + 1];
        if (afterRaw && /^[a-f0-9]{40}$/i.test(afterRaw)) {
            segments.splice(rawIndex + 1, 1);
            url.pathname = segments.join('/');
            return url.toString();
        }
        return rawUrl;
    } catch {
        return rawUrl;
    }
};

export const resolveGistUrl = async (input: string): Promise<GistResolveResult> => {
    const id = extractGistId(input);
    if (!id) return { ok: false, reason: 'invalid-input' };

    let response: Response;
    try {
        response = await fetch(`https://api.github.com/gists/${id}`, {
            headers: { Accept: 'application/vnd.github+json' },
        });
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    if (!response.ok) return { ok: false, reason: 'fetch-failed' };

    let body: GistApiResponse;
    try {
        body = await response.json();
    } catch {
        return { ok: false, reason: 'fetch-failed' };
    }

    const jsonFile = findJsonFile(body.files ?? {});
    if (!jsonFile || !jsonFile.raw_url) return { ok: false, reason: 'no-json-file' };

    return { ok: true, rawUrl: stripRevisionFromRawUrl(jsonFile.raw_url) };
};
