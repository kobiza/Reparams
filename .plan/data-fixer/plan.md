# Data fixer (model migration runner)

## Goal

Build a single, registry-based migration runner that every path converting persisted or remote JSON into an `EditorModel` funnels through — local storage on load, the existing `ImportDialog`, and (once it ships) the `gist-import` flow's fetch and sync. Future model changes ship as a one-way fixer keyed on `modelVersion` instead of dual-supporting old and new shapes in runtime code. Unify the existing `runFixer1` and the pending `paramsMultiValue` fixer under the same runner, and give users a clear, friendly fallback (with an export escape hatch) when migration of the local blob can't complete.

## Scope

### In Scope

- **Fixer runner** in a shared location (move from `src/js/components/options/dataFixer.ts` to `src/js/utils/dataFixer.ts` so popup/options/content can all call it).
  - Monotonic integer `CURRENT_MODEL_VERSION` (start at `1`; existing `'1.0.0'` / `'1.0'` strings coerced to `1` by the first fixer).
  - Registry of fixers keyed by **target** version: `{ 1: v0→v1, 2: v1→v2, ... }`.
  - **Two surfaces:**
    - `migrateModel(raw: string | object)` — pure function, no I/O. Returns `{ ok: true, model }` or `{ ok: false, reason: 'parse' | 'fixer-threw' | 'future-version' }`. **This is the helper every ingestion path consumes** (import from clipboard/file/URL, future Gist fetch, future Gist sync).
    - `loadAndMigrateAppData()` — localStorage wrapper around `migrateModel`. Reads the key, delegates, writes back on success, leaves storage untouched on failure. Only used on app load.
  - Idempotent — calling twice on already-migrated data is a no-op.
- **Call sites:** replace the current `localStorage.getItem(localStorageKey)` + `JSON.parse` in:
  - `src/js/components/popup/UseViewerStoreContext.tsx`
  - `src/js/components/options/UseEditorStoreContext.tsx`
  - content script read paths (if any — verify during implementation).
- **Migrate existing fixers into the new runner:**
  - `runFixer1` (array → map + `modelVersion: 1`) becomes fixer targeting v1. One-off call site removed.
  - The `paramsMultiValue` fixer from `.plan/multi-value-param-formats/` lands in the new runner as fixer targeting v2 (that plan's Phase 1 depends on this one shipping first).
- **User-facing error state** (single UI, reused by popup and options):
  - Friendly message: *"We ran into an issue loading your saved settings."*
  - **Export raw data** button: dumps the untouched `localStorage` string verbatim to clipboard/file. Does **not** attempt to parse or format — preserves whatever is there for a future re-import once a fix ships.
  - **Reset** button: clears `reparamsAppData` after a confirmation step.
  - **Dismiss** button: closes the dialog; storage remains untouched so a future release with a fix can self-heal on next load.
- **Import flow migration:** `ImportDialog` runs `migrateModel` on imported data (clipboard, file, URL paths) before merging, so users who exported during an error state can re-import after the fix lands and get auto-migrated data.
- **Contract for future ingestion surfaces:** the `gist-import` plan's Gist fetch (Phase 1) and Gist sync (Phase 3) consume `migrateModel` the same way `ImportDialog` does. That plan becomes dependent on this one landing first.
- **Unit tests** for the runner: chain correctness (v0 → v2 runs both fixers), no-op on current version, parse error, fixer throw, future version, idempotence. Also test that `ImportDialog` applies migration.

### Out of Scope

- **Per-package quarantine / partial recovery** — decided against for this project phase; whole-blob migration with a user-facing reset is simpler and sufficient.
- **Backwards migration** (stored version > current) beyond surfacing the error state — we don't write down-migrators.
- **Automatic backup of the blob before every migration** — the export button in the error state serves this role; don't pay the storage cost on every successful load.
- **A "restore from backup" UI** — users restore by re-importing their exported file through the existing ImportDialog.
- **Migrating `reparamsPreferences`** (theme, etc.) — separate key with trivial shape; out of scope here. Runner is scoped to `reparamsAppData`.
- **Gist-specific UI** (error surfacing inside the Sync dialog, lock indicators, etc.) — those live in the `gist-import` plan. This plan only provides the `migrateModel` helper they consume.

### Design notes worth carrying into implementation

- **Version is an integer going forward.** The two legacy string values (`'1.0.0'` and `'1.0'`) are both treated as "pre-v1" by the runner — fixer 1 normalizes them. Any blob missing `modelVersion` entirely is also treated as pre-v1.
- **`migrateModel` is pure:** takes raw JSON (string or parsed object) in, returns `{ ok, model | reason }`. Persistence is the caller's responsibility (localStorage wrapper writes back on ok; `ImportDialog` merges via `addPackages`; Gist flows do their own thing).
- **Rule: any code that converts persisted or remote JSON into an `EditorModel` goes through `migrateModel`. No exceptions.** Includes future Gist fetch/sync, future cloud-sync backends, anything.
- **Fixers must be deterministic.** Same input → same output, every time. No `uuidv4()`, no `Date.now()`, no reading from mutable state. If a migration genuinely needs a new identifier, derive it stably (e.g. hash of existing fields). Reason: cheap hygiene that keeps tests stable and avoids surprises when future code ever does want to equality-check migrated output.
- **"Has remote changed?" is not a content question.** When `gist-import` (or any future cloud-sync surface) needs to decide whether local is in sync with remote, compare the remote's *revision identifier* (for Gists: the SHA GitHub returns in the Gist history), not the content. Content comparison would false-positive every time a fixer lands — SHA comparison is indifferent to schema changes.
- **On localStorage-load fixer failure the raw blob stays in localStorage verbatim.** This is what makes the "ship a fixer bug fix → users self-heal" flow work. Import / Gist failure paths don't touch localStorage at all, so nothing to preserve.
- **Fixers chain like a pipeline.** A stored v1 model loaded into a v3 codebase runs fixer-2 (v1→v2) then fixer-3 (v2→v3) in sequence. Each fixer's job is to transform the immediately previous version into its target — not to know about versions beyond its own. Missing any intermediate fixer (e.g. registering `1:` and `3:` but not `2:`) is a coding error that the runner surfaces as `fixer-threw`.
- **`CURRENT_MODEL_VERSION` is derived from the registry, not hard-coded.** Defined as `Math.max(...Object.keys(fixers).map(Number))`. Adding a new fixer entry automatically bumps the current version — impossible to have a drift between "latest fixer" and "version the code thinks it's at."

## Phases

- [x] **Phase 1 — Runner + integer versioning + call-site unification (Must Have)** — Build `src/js/utils/dataFixer.ts` exposing both `migrateModel` (pure) and `loadAndMigrateAppData` (localStorage wrapper). Port `runFixer1` into the registry as fixer-1. Replace the three read call sites (popup viewer, options editor, content script). Runner returns a discriminated result; callers currently treat `not-ok` as "start with empty state" (UI comes in Phase 2). Existing test suite remains green; add unit tests for the runner itself.

- [x] **Phase 2 — User-facing data-issue state (Must Have, depends on Phase 1)** — Build a shared `DataIssueDialog` component with Export / Reset / Dismiss. Wire it into popup and options so the `{ ok: false }` result from Phase 1 surfaces the dialog instead of silently falling back to empty state. Export button writes the raw `localStorage` string (not the parsed model) so corrupted data round-trips faithfully. Scope here is **localStorage-load errors only** — import-path and Gist-path error surfacing are handled by their respective plans.

- [x] **Phase 3 — Run fixer in ImportDialog (Should Have, depends on Phase 1)** — `ImportDialog`'s clipboard, file, and URL paths all consume `migrateModel` before handing data to `addPackages`. Malformed imports surface inline in the dialog (existing error affordance). Closes the loop for users who exported during an error state and re-import after a fixer release. Add an integration test covering: raw v1 blob → import → packages appear at current-version shape. The same `migrateModel` helper is what future Gist ingestion (gist-import plan) will consume — no additional work here for that.

## Phase 1 — Implementation Guide

### Acceptance Criteria

- `src/js/utils/dataFixer.ts` exists with derived `CURRENT_MODEL_VERSION`, `migrateModel(raw)`, `loadAndMigrateAppData()`, and `resetAppData()` exports. Registry has one fixer (targeting v1) that absorbs `runFixer1`'s logic for both legacy array and already-map shapes. File header comment points to CLAUDE.md § Model Evolution.
- Popup viewer (`UseViewerStoreContext`) and options editor (`UseEditorStoreContext`) load state via `loadAndMigrateAppData()`; on `{ ok: false }` they fall back to an empty v1 model (UI dialog is Phase 2).
- `EditorModel.modelVersion` type is `number`; all fixtures that hard-coded `'1.0'` / `'1.0.0'` are updated to `1`. `yarn test` and `yarn build:dev` both pass.
- CLAUDE.md has a `### Model Evolution` subsection covering the breaking-vs-additive rule, derived-version convention, and the `migrateModel` contract. Team memory at `deployed-extension-model-changes.md` reinforces the same convention with a pointer to CLAUDE.md.

### Atomic Tasks

1. **Create runner skeleton** — `Create: src/js/utils/dataFixer.ts`.
   - Start the file with a short header comment: *"Model migration runner. Add a fixer here ONLY for breaking shape changes. `CURRENT_MODEL_VERSION` auto-derives from the registry — do not hardcode. See CLAUDE.md § Model Evolution for the full rule."*
   - Fixer registry `const fixers: Record<number, (prev: any) => any>` with `1:` entry that accepts either a legacy array (reduce by `v.key` into a map) or an object with `packages`, and returns `{ modelVersion: 1, packages }`.
   - Export `CURRENT_MODEL_VERSION` **derived** from the registry: `Math.max(...Object.keys(fixers).map(Number))`. Future phases/plans add registry entries and the constant tracks automatically.
   - Define `type MigrateResult = { ok: true; model: EditorModel } | { ok: false; reason: 'parse' | 'fixer-threw' | 'future-version' }`.
   - Define internal `detectStoredVersion(parsed: unknown): number` — `Array.isArray` → 0; object with integer `modelVersion ≥ 0` → that integer; anything else (missing, string, invalid) → 0.

2. **Implement `migrateModel` (pipeline)** — `Modify: src/js/utils/dataFixer.ts`.
   - Accepts `raw: string | object | null | undefined`.
   - Null/empty string → `{ ok: true, model: { modelVersion: CURRENT_MODEL_VERSION, packages: {} } }`.
   - String → `JSON.parse`; catch → `{ ok: false, reason: 'parse' }`.
   - Detect stored version; if `> CURRENT_MODEL_VERSION` → `{ ok: false, reason: 'future-version' }`.
   - **Pipeline:** iterate target versions `stored+1 .. CURRENT_MODEL_VERSION` in order, applying each fixer's output as the next fixer's input. Missing fixer at any step (gap in registry) or any fixer throwing → `{ ok: false, reason: 'fixer-threw' }`. A v1 model in a v3 codebase runs `fixers[2]` then `fixers[3]`, returning the chained result.
   - Return `{ ok: true, model }`.

3. **Implement `loadAndMigrateAppData` + `resetAppData`** — `Modify: src/js/utils/dataFixer.ts`.
   - `loadAndMigrateAppData`: reads `localStorage.getItem(localStorageKey)`, calls `migrateModel`, and on `ok` writes the migrated blob back only if the stored version differed (avoids write churn on hot path). Returns the `MigrateResult` unchanged.
   - `resetAppData`: `localStorage.removeItem(localStorageKey)`. Replaces the old `reset()` helper.

4. **Flip `EditorModel.modelVersion` to `number`** — `Modify: src/js/types/types.ts:48`.
   - Change `modelVersion: string` → `modelVersion: number`.

5. **Wire popup viewer** — `Modify: src/js/components/popup/UseViewerStoreContext.tsx:17-21` and the context default at line 9-15.
   - Replace `getSettings()` body with `loadAndMigrateAppData()`; on `ok: false` return `{ modelVersion: CURRENT_MODEL_VERSION, packages: {} }`.
   - Update the `createContext` default `modelVersion: ''` → `modelVersion: 1` (or import `CURRENT_MODEL_VERSION`).
   - Remove the direct `localStorage.getItem(localStorageKey)` import path if no longer needed.

6. **Wire options editor** — `Modify: src/js/components/options/UseEditorStoreContext.tsx:21-24` and the context default at line 9-19.
   - Replace `getInitialState()` body with `loadAndMigrateAppData()`; on `ok: false` return `{ modelVersion: CURRENT_MODEL_VERSION, packages: {} }`.
   - Update the `createContext` default `modelVersion: ''` → `modelVersion: 1`.

7. **Delete legacy fixer file** — `Delete: src/js/components/options/dataFixer.ts`.

8. **Clean up options bootstrap** — `Modify: src/js/components/options/index.tsx:8, 12-13`.
   - Remove `import { runFixer1 } from './dataFixer';`.
   - Remove the two commented-out lines `// runFixer1()` and `// reset()`.

9. **Update `dummyData`** — `Modify: src/js/utils/dummyData.ts:90`.
   - `modelVersion: '1.0.0'` → `modelVersion: 1`.

10. **Update `ExportDialog`** — `Modify: src/js/components/options/ExportDialog.tsx:129`.
    - `modelVersion: '1.0.0'` → `modelVersion: CURRENT_MODEL_VERSION` (add import from `../../utils/dataFixer`).

11. **Update unit test fixtures** — `Modify` the following with `'1.0'` / `'1.0.0'` → `1`:
    - `tests/utils.test.ts:72, 86, 99`
    - `tests/components/UseViewerStoreContext.test.tsx:88, 97, 108`
    - `tests/components/UseEditorStoreContext.test.tsx:23`

12. **Update E2E test fixtures** — `Modify`:
    - `tests/e2e/contentScript.test.ts:7`
    - `tests/e2e/options.test.ts:6`
    - `tests/e2e/popup.test.ts:7, 55`

13. **Update `CLAUDE.md` with Model Evolution section** — `Modify: CLAUDE.md`.
    - Add a new `### Model Evolution` subsection right after `### Core Data Model`, with this content:
      - Breaking changes to the persisted model shape (rename, restructure, remove, re-semanticize a field) require adding a new fixer to the registry in `src/js/utils/dataFixer.ts`.
      - `CURRENT_MODEL_VERSION` is **derived** from that registry, so adding a fixer automatically bumps it — never hardcode a version.
      - Additive changes (new optional field, new top-level section, wider enum) don't touch the fixer registry. Just ensure readers handle `undefined` gracefully.
      - Any ingestion path (local load, import, future Gist fetch/sync) goes through `migrateModel`. Fixers must be deterministic.

14. **Update team memory** — `Modify: /Users/kobiz/.claude/projects/-Users-kobiz-my-projects-reparams/memory/team/deployed-extension-model-changes.md`.
    - Append a new "Runner convention" block reinforcing: fixer registry = single source of truth for current version, derived not hardcoded, breaking vs additive distinction. Short — the detailed rule lives in CLAUDE.md, memory just points there so future agents who miss CLAUDE.md still get the hint.

15. **Add runner tests** — `Create: tests/dataFixer.test.ts`. Cover:
    - Null / empty-string input → ok with empty v1 model.
    - Invalid JSON → `{ ok: false, reason: 'parse' }`.
    - Legacy array shape → migrates to v1 map keyed by `.key`.
    - Object with legacy string `modelVersion: '1.0'` or `'1.0.0'` → migrates to integer `1`, packages preserved.
    - Object already at `modelVersion: 1` → passes through unchanged (idempotence: run twice, same result).
    - `modelVersion: 999` → `{ ok: false, reason: 'future-version' }`.
    - **Pipeline chain test:** register a temporary fake-v2 fixer in test scope (via exported-for-testing registry or by constructing a fresh runner), seed a v0/v1 input, assert both fixers run in order and the output reflects both transforms. Ensures future additions compose correctly.
    - **Registry gap test:** register fixers `{ 1, 3 }` but not `2`, seed v0 input targeting v3 → expect `{ ok: false, reason: 'fixer-threw' }`. Protects against silent gaps.
    - `loadAndMigrateAppData`: seeds localStorage with legacy shape → after call, localStorage holds migrated shape; returns `{ ok: true, model }`.
    - `loadAndMigrateAppData`: seeds localStorage with invalid JSON → localStorage untouched; returns `{ ok: false, reason: 'parse' }`.

### Verification

```bash
yarn test
yarn build:dev
```

Both must succeed. Spot-check: seed localStorage with a legacy `{ modelVersion: '1.0', packages: {...} }` blob in the browser, reload the options page, then inspect localStorage — `modelVersion` should now be the integer `1` and packages should be unchanged.

## Phase 2 — Implementation Guide

### Acceptance Criteria

- A shared `DataIssueDialog` component renders a friendly message with three actions: Export raw data (download file), Reset, Dismiss. The reason (`parse` / `fixer-threw` / `future-version`) is reflected in the dialog subtitle.
- Both app entries (popup and options) detect migration failure at bootstrap via a new `useDataIssue` hook and render the dialog as an overlay. When the user dismisses, localStorage is untouched and the app continues with an empty v1 fallback. When the user resets, `resetAppData()` is called and the page reloads.
- Manual verification: corrupting `reparamsAppData` in DevTools (e.g. `localStorage.setItem('reparamsAppData', 'not-json')`) and reopening the popup / options surfaces the dialog; the exported file byte-matches the corrupted string verbatim.

### Atomic Tasks

1. **Build `useDataIssue` hook** — `Create: src/js/utils/useDataIssue.ts`.
   - Returns `{ issue: MigrateResult | null, dismiss: () => void, reset: () => void }`.
   - On mount, reads `localStorage.getItem(localStorageKey)` and runs `migrateModel`; if `!ok`, stores the error result in state.
   - `dismiss` clears the in-memory issue (does not touch storage).
   - `reset` calls `resetAppData()` and then `window.location.reload()`.
   - Export types/helpers from `dataFixer.ts` as needed.

2. **Build `DataIssueDialog` skeleton** — `Create: src/js/components/common/DataIssueDialog.tsx`.
   - Props: `isOpen: boolean`, `reason: 'parse' | 'fixer-threw' | 'future-version'`, `onDismiss: () => void`, `onReset: () => void`, `onExport: () => void`.
   - MUI `Dialog` + `DialogTitle` "We ran into an issue loading your saved settings" + `DialogContent` with a reason-specific `Typography` line:
     - `parse`: "The saved data appears to be corrupted and couldn't be read."
     - `fixer-threw`: "We couldn't upgrade your saved data to the current version. A future release may be able to recover it."
     - `future-version`: "Your saved data is from a newer version of the extension. Downgrade isn't supported."
   - `DialogActions` with three buttons in order: Export raw data (primary-outlined), Reset (color="warning"), Dismiss (default).

3. **Wire export action** — `Modify: src/js/components/common/DataIssueDialog.tsx`.
   - `onExport` handler implemented inline in the dialog: read `localStorage.getItem(localStorageKey)` (falsy → use empty string), create a `Blob` with MIME `application/json` from the raw string, trigger download with filename `reparams-backup-{timestamp}.json` via an anchor + `URL.createObjectURL` pattern (mirror `ExportDialog.exportToFile`). Do **not** parse or re-serialize the content.

4. **Add reset confirmation** — `Modify: src/js/components/common/DataIssueDialog.tsx`.
   - Local state `confirmingReset: boolean`. Clicking Reset first flips confirm state; dialog then shows "This will delete all your saved packages. Continue?" with Confirm / Cancel buttons. Confirm → `onReset()`.

5. **Wire popup entry** — `Modify: src/js/components/popup/index.tsx`.
   - Inside `<App>`, add `const { issue, dismiss, reset } = useDataIssue()`.
   - Render `<DataIssueDialog isOpen={!!issue} reason={issue?.reason ?? 'parse'} onDismiss={dismiss} onReset={reset} />` alongside (not replacing) the existing tree.
   - `useDataIssue` is called inside the `<ThemeProvider>` so the dialog inherits the theme.

6. **Wire options entry** — `Modify: src/js/components/options/index.tsx`.
   - Same pattern as popup. Place the hook call inside `<App>` within the theme provider.

7. **Component test: `DataIssueDialog`** — `Create: tests/components/DataIssueDialog.test.tsx`.
   - Renders all three reason variants and asserts the subtitle text.
   - Clicking Export triggers a download (mock `URL.createObjectURL` and assert it was called with a Blob whose text equals the seeded raw string).
   - Clicking Reset requires confirmation before `onReset` fires.
   - Dismiss fires immediately without confirmation.

8. **Hook test: `useDataIssue`** — `Create: tests/utils/useDataIssue.test.tsx`.
   - `beforeEach` clears localStorage.
   - Seeding with valid v1 data → hook returns `issue: null`.
   - Seeding with invalid JSON → hook returns `issue.reason: 'parse'`.
   - Seeding with `modelVersion: 999` → hook returns `issue.reason: 'future-version'`.
   - Calling `dismiss` clears the issue in state; localStorage untouched (assert key still has the bad string).

### Verification

```bash
yarn test
yarn build:dev
```

Manual check in a real browser: build with `yarn build:dev`, load the unpacked extension, run `localStorage.setItem('reparamsAppData', 'not-json')` in the extension's DevTools for popup/options, reopen — dialog appears. Click Export → file downloads with the corrupt string. Click Reset → confirm → localStorage cleared and page reloads to empty state.

## Phase 3 — Implementation Guide

### Acceptance Criteria

- `ImportDialog.parseImportData` routes incoming JSON through `migrateModel`. Clipboard, file, and URL paths all produce packages at `CURRENT_MODEL_VERSION` shape before `addPackages` is called.
- Failure reasons (`parse`, `fixer-threw`, `future-version`) map to distinct user-visible error strings in the dialog's existing `Alert` affordance.
- Integration test: a raw legacy-shaped import string (pre-v1 or `modelVersion: '1.0'`) produces current-version packages in the editor store.

### Atomic Tasks

1. **Replace `parseImportData`** — `Modify: src/js/components/options/ImportDialog.tsx:171-183`.
   - Replace the inline `JSON.parse` / `data.packages` branch with a call to `migrateModel(jsonString)`.
   - On `ok`, return `result.model` (the full `EditorModel`). Current callers already read `.packages`, so no downstream change.
   - On `ok: false`, set error via reason-specific strings:
     - `parse`: "Invalid JSON format"
     - `fixer-threw`: "Import couldn't be upgraded to the current model version"
     - `future-version`: "Import is from a newer extension version — please update first"
   - Guard the migrated model's `packages` field: if missing or empty, still show a friendly "nothing to import" message.

2. **Integration test: legacy-shape import** — `Create: tests/components/ImportDialog.test.tsx` (or extend an existing test file if one exists for ImportDialog; check first).
   - Render `<ImportDialog isOpen ... />` within `<UseEditorStoreContext>`.
   - Stub `navigator.clipboard.readText` to return a v0/legacy string like `JSON.stringify({ modelVersion: '1.0', packages: { 'pkg-1': {...} } })`.
   - Click "Import from clipboard", then click the final import button.
   - Assert localStorage's `packages` contains `pkg-1` and the outer `modelVersion` is `1` (integer).

3. **Integration test: malformed import surfaces error** — `Modify: tests/components/ImportDialog.test.tsx`.
   - Stub clipboard to return `"not-json"`.
   - Click import-from-clipboard.
   - Assert the alert shows "Invalid JSON format"; `addPackages` is never called.

### Verification

```bash
yarn test
yarn build:dev
```

Manual check: in the options page, paste an old-shape JSON (e.g. `{"modelVersion":"1.0.0","packages":{...}}`) via the clipboard tab. Import succeeds; stored blob has `modelVersion: 1` after completion.

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Runner + call-site unification | `done` |
| Phase 2 — User-facing data-issue state | `done` |
| Phase 3 — Run fixer in ImportDialog | `done` |

## Cross-plan dependencies

- **`multi-value-param-formats`** — that plan's Phase 1 fixer (`runFixer2`) registers into this plan's runner. `data-fixer` Phase 1 must land first.
- **`gist-import`** — that plan's Phase 1 (Gist fetch) and Phase 3 (Sync) consume `migrateModel` from this plan. `data-fixer` Phase 1 must land first. **Sync design note for that plan:** compare the Gist's revision SHA (GitHub returns it in the fetch response's `history[0].version`), not the content. This sidesteps the "local has been fixer-migrated, remote hasn't" pitfall entirely — a content diff would false-positive after every schema change, a SHA check is indifferent to schema.
  - **`gistRevision` is per-package, not per-Gist.** Gist import is partial by design — users select a subset of packages. If user imports A/B/C at SHA1 and later imports D from the same Gist at SHA2, A/B/C must stay stamped with SHA1 while D is stamped with SHA2. Each package's `gistRevision` reflects the Gist's state *at the moment that package was pulled*, and Sync is always a per-package comparison (that package's stored SHA vs the Gist's current SHA). Store `gistRevision?: string` on `SettingsPackage` alongside `gistId?: string`.
