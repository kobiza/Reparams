# Phase 1 — Gist Import Tab & Data Model

## Acceptance Criteria

- `SettingsPackage` carries optional `gistId?: string` and `gistRevision?: string`. Existing packages and existing fixtures pass through unchanged (additive change — no fixer needed).
- A new `src/js/utils/gist.ts` utility exports a function that resolves a Gist URL or raw ID to `{ model: EditorModel, revision: string }`. The model is produced by piping the Gist's body file content through `migrateModel`. The revision is `history[0].version` from the API response. Errors map to a small discriminated union (`'invalid-input' | 'fetch-failed' | 'no-json-file' | 'parse' | 'fixer-threw' | 'future-version'`).
- `ImportDialog` has a fourth "GitHub Gist" tab (icon: `GitHubIcon` from `@mui/icons-material`). Entering a Gist URL/ID and clicking Fetch loads the package list using the existing checkbox UI; importing selected packages stamps each with the source `gistId` and the captured `gistRevision` before calling `addPackages`. Fetch errors surface in the existing `Alert` affordance with reason-specific copy.
- `yarn test` passes, including new unit tests for `gist.ts` URL/ID parsing and an integration test for `ImportDialog`'s Gist tab covering happy path + at least one error path. `yarn build:dev` succeeds.

## Atomic Tasks

1. **Add Gist link fields to `SettingsPackage`** — `Modify: src/js/types/types.ts:40-50`.
   - Add two optional fields after `paramHistory?`:
     ```
     gistId?: string
     gistRevision?: string
     ```
   - Additive change: no fixer, no `CURRENT_MODEL_VERSION` bump. Existing readers handle `undefined` naturally.

2. **Create Gist URL/ID parser** — `Create: src/js/utils/gist.ts`.
   - File header comment: *"Gist fetch utility. Pipes Gist body through `migrateModel` and captures `history[0].version` as the revision SHA. Used by ImportDialog (Phase 1) and Sync (Phase 3) — both ingestion surfaces consume the same helper."*
   - Export `parseGistInput(input: string): string | null` — accepts:
     - Raw 32-char hex IDs (`/^[a-f0-9]{20,}$/i`).
     - Full URLs of shape `https://gist.github.com/{user?}/{id}` (extract the path segment that matches the hex pattern).
     - Trims whitespace. Returns `null` if neither pattern matches.

3. **Implement `fetchGist`** — `Modify: src/js/utils/gist.ts`.
   - Define the result union:
     ```
     export type GistFetchResult =
       | { ok: true; model: EditorModel; revision: string }
       | { ok: false; reason: 'invalid-input' | 'fetch-failed' | 'no-json-file' | 'parse' | 'fixer-threw' | 'future-version'; httpStatus?: number };
     ```
   - `export async function fetchGist(input: string): Promise<GistFetchResult>`.
   - Step 1: `const id = parseGistInput(input)`; if `null` → return `{ ok: false, reason: 'invalid-input' }`.
   - Step 2: `fetch(\`https://api.github.com/gists/${id}\`, { headers: { Accept: 'application/vnd.github+json' } })`. Non-OK response → `{ ok: false, reason: 'fetch-failed', httpStatus: response.status }`.
   - Step 3: Parse the JSON body. Locate the **first file whose name ends in `.json`** (case-insensitive); if none → `{ ok: false, reason: 'no-json-file' }`. Use that file's `content` field as the raw model string. Note: Gist API returns `truncated: true` for very large files — for v1 surface this as `'fetch-failed'` (we'd need a follow-up fetch of the file's `raw_url`); document the cutoff in `findings.md` as a known limitation.
   - Step 4: Run `migrateModel(content)`. Map its failure reasons through verbatim (`'parse' | 'fixer-threw' | 'future-version'`).
   - Step 5: Read `revision = body.history?.[0]?.version`; if missing → treat as `'fetch-failed'` (anomalous API response).
   - Return `{ ok: true, model, revision }`.

4. **Add Gist tab UI to ImportDialog** — `Modify: src/js/components/options/ImportDialog.tsx`.
   - Add import: `import GitHubIcon from '@mui/icons-material/GitHub';` and the gist helper: `import { fetchGist, GistFetchResult } from "../../utils/gist";`.
   - Add two new pieces of state alongside `importUrl`/`loading`:
     ```
     const [gistInput, setGistInput] = useState('');
     const [pendingGistRevision, setPendingGistRevision] = useState<string | null>(null);
     const [pendingGistId, setPendingGistId] = useState<string | null>(null);
     ```
   - Add a fourth `<Tab icon={<GitHubIcon />} label="GitHub Gist" {...a11yProps(3)} />` after the URL tab.
   - Add a fourth `<TabPanel value={tabValue} index={3}>` mirroring the URL-tab layout: a `TextField` bound to `gistInput` (placeholder `https://gist.github.com/... or gist ID`) and a `Button` "Fetch from Gist".
   - Wire `importFromGist`:
     ```
     const importFromGist = async () => {
       if (!gistInput.trim()) { setError('Please enter a Gist URL or ID'); return; }
       setLoading(true); setError(null);
       const result = await fetchGist(gistInput.trim());
       if (!result.ok) {
         const errorByReason: Record<GistFetchResult extends { ok: false } ? GistFetchResult['reason'] : never, string> = { ... };
         setError(errorByReason[result.reason]);
       } else {
         setPendingGistId(parseGistInput(gistInput.trim()));
         setPendingGistRevision(result.revision);
         setPackagesToImport(result.model.packages);
       }
       setLoading(false);
     };
     ```
     Concrete reason → message mapping:
     - `'invalid-input'`: "Couldn't recognize that as a Gist URL or ID."
     - `'fetch-failed'`: "Couldn't reach the Gist (network or 4xx/5xx)."
     - `'no-json-file'`: "That Gist doesn't contain a `.json` file."
     - `'parse'`: "The Gist's JSON file couldn't be parsed."
     - `'fixer-threw'`: "Couldn't upgrade the Gist's data to the current model version."
     - `'future-version'`: "Gist is from a newer extension version — please update first."
   - Reset `pendingGistId`/`pendingGistRevision` to `null` in `handleTabChange` and `resetState` so leftover SHAs don't leak into a non-Gist import.

5. **Stamp selected packages on import** — `Modify: src/js/components/options/ImportDialog.tsx` (in `forceImportPackages` and the no-replace branch of `importPackages`).
   - Where the code builds `packagesObj`, layer in the Gist link if the user came from the Gist tab:
     ```
     const stamp = (pkg: SettingsPackage): SettingsPackage =>
       pendingGistId && pendingGistRevision
         ? { ...pkg, gistId: pendingGistId, gistRevision: pendingGistRevision }
         : pkg;
     const packagesObj = Object.fromEntries(selectedPackagesToImport.map(pkg => [pkg.key, stamp(pkg)]));
     ```
   - Apply identically in both `importPackages` (no-replace branch) and `forceImportPackages` (replace branch).

6. **Unit tests for `gist.ts`** — `Create: tests/gist.test.ts`.
   - `parseGistInput`:
     - Valid raw 32-hex ID → returns ID unchanged.
     - Full `https://gist.github.com/user/<hex>` URL → returns the hex.
     - Full `https://gist.github.com/<hex>` (no user) → returns the hex.
     - Whitespace-padded input → trimmed.
     - Garbage string / non-Gist URL → `null`.
   - `fetchGist` (mock `global.fetch`):
     - **Happy path**: mock returns `{ files: { 'data.json': { content: '{"modelVersion":1,"packages":{"a":{"key":"a","label":"A","conditions":{"urlPatterns":[],"domSelectors":[]},"presets":{},"paramsWithDelimiter":[]}}}' } }, history: [{ version: 'sha1' }] }` → `{ ok: true, model.packages.a.key === 'a', revision === 'sha1' }`.
     - **invalid-input**: pass `'not-a-gist'` → `{ ok: false, reason: 'invalid-input' }`. `fetch` is never called.
     - **fetch-failed (4xx)**: mock fetch returns `{ ok: false, status: 404 }` → `{ ok: false, reason: 'fetch-failed', httpStatus: 404 }`.
     - **no-json-file**: mock returns `{ files: { 'README.md': { content: '...' } }, history: [...] }` → `{ ok: false, reason: 'no-json-file' }`.
     - **parse**: file content is `'not-json'` → `{ ok: false, reason: 'parse' }`.
     - **future-version**: file content has `modelVersion: 999` → `{ ok: false, reason: 'future-version' }`.

7. **Integration test for ImportDialog Gist tab** — `Modify: tests/components/ImportDialog.test.tsx`.
   - Add a new `describe('ImportDialog — Gist tab', ...)` block.
   - **Happy path**: stub `global.fetch` to return a Gist response with one JSON file containing a single legacy-shape package; click the "GitHub Gist" tab, type a valid Gist ID, click "Fetch from Gist", check the package, click "Import Selected". Assert `addPackages` was called once and the imported package has `gistId === '<the-id>'` and `gistRevision === 'sha1'`.
   - **Error path**: stub `fetch` to return `{ ok: false, status: 404 }`; click Fetch; assert the alert shows "Couldn't reach the Gist (network or 4xx/5xx)." and `addPackages` was never called.

8. **Record limitations in findings** — `Modify: .plan/gist-import/findings.md`.
   - Add a "Phase 1 — known limitations" section noting:
     - Public Gists only (no auth header in `fetchGist`).
     - Truncated files (`truncated: true` in API response) are surfaced as `fetch-failed` rather than auto-following the `raw_url`. Defer to a later phase if users hit it.
     - The `.json` file resolution picks the **first** matching file by insertion order. Multi-JSON Gists aren't a documented use case yet — flag if it comes up.

## Verification

```bash
yarn test
yarn build:dev
```

Both must succeed. Manual spot-check after build: load the unpacked extension, open the options page, click Import → "GitHub Gist" tab. Paste a public Gist URL whose first JSON file contains a valid `EditorModel` blob (e.g. an exported `reparamsAppData` snapshot pasted into a fresh Gist). Confirm: package list renders, importing one of them creates a package whose `gistId` and `gistRevision` are populated when you inspect `localStorage.getItem('reparamsAppData')`.
