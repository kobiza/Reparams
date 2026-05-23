# Phase 3 — Sync, Bulk Sync, and Unlink Actions

## Acceptance Criteria

- Each Gist-linked package shows two new actions in its settings tab: **Sync** (re-fetch the Gist, compare its current revision SHA to the package's stored `gistRevision`, and either report "up to date" or overwrite the package + update `gistRevision`) and **Unlink** (clears `gistId` + `gistRevision`, restoring editability; requires confirmation). Sync has no confirmation prompt — the package is read-only, so there's nothing local to lose.
- A top-level **Check for updates** action lives above the package list in `PackagesPage`. Clicking it fetches each unique linked `gistId` once (deduped), tallies how many linked packages are out of date, and opens a dialog showing the count + a per-package list + a **Sync all out-of-date** button. Bulk sync overwrites each stale package using the per-Gist fetch already done — no duplicate API calls.
- The store grows a new `unlinkPackage(packageKey)` mutator that bypasses the lock guard (the lock is *driven by* `gistId`, so the unlink path must legitimately clear it). All other guarded mutators remain unchanged. Sync uses `addPackages({ [key]: replacedPkg }, true)` which is already unguarded.
- `yarn test` passes (new tests cover Sync no-op, Sync overwrite, Unlink, and the bulk-check tally with API-call dedupe). `yarn build:dev` succeeds.

## Atomic Tasks

1. **Extend `EditorStore` with `unlinkPackage`** — `Modify: src/js/types/types.ts` (around the existing `EditorStore` mutator list).
   - Add `unlinkPackage: (packageKey: string) => void` to the `EditorStore` type.

2. **Implement `unlinkPackage` in the store** — `Modify: src/js/components/options/UseEditorStoreContext.tsx`.
   - Add the function alongside `clearPackageParamHistory`:
     ```
     const unlinkPackage = (packageKey: string) => {
       const prev = appState.packages[packageKey];
       if (!prev) return;
       const { gistId, gistRevision, ...rest } = prev;
       _updatePackage(packageKey, rest as SettingsPackage);
     };
     ```
   - Register it in the `<EditorStoreContext.Provider value={...}>` object and in the `createContext` default (`unlinkPackage: noop`).

3. **Create a `gistSync` helper module** — `Create: src/js/utils/gistSync.ts`.
   - Header comment: *"Per-package and bulk Gist-sync orchestration. Builds on `gist.ts` (raw fetch) and the editor store's `addPackages` (overwrite path)."*
   - Export `type SyncOutcome = { kind: 'up-to-date' } | { kind: 'synced'; newRevision: string } | { kind: 'error'; reason: GistFetchFailureReason | 'package-missing-in-gist' }`.
   - Export `async function syncPackage(pkg: SettingsPackage): Promise<{ outcome: SyncOutcome; replacement?: SettingsPackage }>`.
     - If `!pkg.gistId || !pkg.gistRevision`, return `{ outcome: { kind: 'error', reason: 'invalid-input' } }`.
     - Call `fetchGist(pkg.gistId)`. Map failures to `{ outcome: { kind: 'error', reason: result.reason } }`.
     - If `result.revision === pkg.gistRevision`, return `{ outcome: { kind: 'up-to-date' } }`.
     - Look up `result.model.packages[pkg.key]`. If absent, return `{ outcome: { kind: 'error', reason: 'package-missing-in-gist' } }` (the Gist still exists but the user's package key was removed).
     - Build the replacement: `const replacement = { ...result.model.packages[pkg.key], gistId: pkg.gistId, gistRevision: result.revision };` (stamp the new revision; preserve the Gist link).
     - Return `{ outcome: { kind: 'synced', newRevision: result.revision }, replacement }`.
   - Export `async function checkForUpdates(packages: { [key: string]: SettingsPackage }): Promise<BulkCheckResult>` where `BulkCheckResult` is:
     ```
     export type BulkCheckResult = {
       checked: number;            // total linked packages
       outOfDate: Array<{ pkg: SettingsPackage; replacement: SettingsPackage }>;
       errors: Array<{ packageKey: string; reason: GistFetchFailureReason | 'package-missing-in-gist' }>;
     };
     ```
     - Walk `packages`, collect those with `gistId` set.
     - Build a `Map<gistId, GistFetchResult>` by calling `fetchGist` **once per unique gistId** (use `Promise.all` over `Array.from(new Set(...))`). This is the dedupe.
     - For each linked package, look up its Gist's result. Apply the same per-package logic as `syncPackage` to decide outcome, but pull from the cached map instead of re-fetching.
     - Return the tallied `BulkCheckResult`.

4. **Add Sync + Unlink buttons to PackageSettingsEditor** — `Modify: src/js/components/options/PackageSettingsEditor.tsx`.
   - Add a new prop `gistLinkActions?: React.ReactNode` (rendered inside the editor when present) — keeps the editor decoupled from Sync/Unlink wiring. Render it in a new `<Divider /> <Typography fontWeight="bold">Gist link</Typography> {gistLinkActions}` block, placed just above the "Delete Package" block. Render only when `isLocked` is true (gist link only meaningful for linked packages).
   - In `PackagePanel.tsx`, when `isLocked`, construct and pass a `<PackageGistLinkActions>` element to `PackageSettingsEditor` via the new prop. (Component lives in the next task.)

5. **Build `PackageGistLinkActions` component** — `Create: src/js/components/options/PackageGistLinkActions.tsx`.
   - Props: `{ packageData: SettingsPackage; addPackages: EditorStore['addPackages']; unlinkPackage: EditorStore['unlinkPackage'] }`.
   - Two buttons: Sync (default variant) and Unlink (`color="warning"`).
   - Sync handler:
     - Set local `syncing` state.
     - Call `syncPackage(packageData)`.
     - On `up-to-date`, set a status message: "Already up to date."
     - On `synced`, call `addPackages({ [packageData.key]: replacement }, true)` and set status: `Synced to ${newRevision.slice(0, 7)}.`.
     - On `error`, set status to a reason-specific string (mirror the import-dialog error map for shared reasons; add `package-missing-in-gist`: "This package isn't in the Gist anymore.").
     - Show the status as a small `Typography` line under the buttons. Clear after the next user action.
   - Unlink handler:
     - Open a confirmation `Dialog` ("Unlink this package from its Gist? It will become editable again.").
     - On confirm, call `unlinkPackage(packageData.key)` and close.

6. **Wire `unlinkPackage` and `addPackages` into PackagePanel** — `Modify: src/js/components/options/PackagePanel.tsx`.
   - Pull `addPackages` and `unlinkPackage` from `editorStore`.
   - When `isLocked`, build `<PackageGistLinkActions packageData={packageData} addPackages={addPackages} unlinkPackage={unlinkPackage} />` and pass it as `gistLinkActions` to `<PackageSettingsEditor>`.

7. **Build `BulkSyncDialog` component** — `Create: src/js/components/options/BulkSyncDialog.tsx`.
   - Props: `{ isOpen: boolean; onClose: () => void; packages: { [key: string]: SettingsPackage }; addPackages: EditorStore['addPackages'] }`.
   - On open, run `checkForUpdates(packages)` and store result in local state. While loading, show a `CircularProgress`.
   - Once loaded, render:
     - Headline: `"${result.outOfDate.length} of ${result.checked} linked packages have updates."`
     - A list (`<List>`) of the out-of-date packages by label, plus an italicized errors section if `result.errors.length > 0`.
     - **Sync all out-of-date** button (disabled when `outOfDate.length === 0`): on click, builds a single `addPackages({...replacementsByKey}, true)` call using the already-fetched replacements (no new network requests).
     - **Close** button.

8. **Add Check-for-updates button to PackagesPage** — `Modify: src/js/components/options/PackagesPage.tsx`.
   - Render a `<Button>` "Check Gist updates" above the package list, **but only when** `Object.values(state.packages).some(p => p.gistId)` is true.
   - Wire it to open the `BulkSyncDialog` (manage `isOpen` state in `PackagesPage`).
   - Pass `state.packages` and `addPackages` to the dialog.

9. **Unit tests for `gistSync`** — `Create: tests/gistSync.test.ts`.
   - Mock `fetch` and exercise:
     - `syncPackage`: returns `up-to-date` when fetched SHA matches stored `gistRevision`.
     - `syncPackage`: returns `synced` with `replacement` carrying the new SHA when SHAs differ; replacement keeps `gistId` and the new `gistRevision`.
     - `syncPackage`: returns `error` with `package-missing-in-gist` when the Gist no longer contains the package key.
     - `syncPackage`: returns `error` with `fetch-failed` on HTTP 404.
     - `checkForUpdates`: 3 packages pointing at 2 distinct Gists → `fetch` is called exactly **2 times** (assert `fetchMock.mock.calls.length === 2`). One Gist has updates → tally reflects it.
     - `checkForUpdates`: skips packages without `gistId`. Errors are reported but don't abort the rest.

10. **Component test: PackageGistLinkActions Unlink flow** — `Create: tests/components/PackageGistLinkActions.test.tsx`.
    - Render with a linked package; click Unlink → confirmation dialog appears; click confirm → `unlinkPackage` mock called with the package key. (Sync flow is harder to test without heavy fetch mocking; covered by gistSync unit tests + a happy-path smoke test if time permits.)

11. **Component test: BulkSyncDialog tally** — `Create: tests/components/BulkSyncDialog.test.tsx`.
    - Stub `global.fetch` to return Gist responses with deterministic SHAs.
    - Render with 3 linked packages → 2 unique gistIds → 2 fetch calls expected.
    - Assert the headline shows the correct out-of-date count.
    - Click "Sync all out-of-date" → assert `addPackages` is called once with a `replace: true` map containing the stale packages, **without** any additional fetch calls.

## Verification

```bash
yarn test
yarn build:dev
```

Both must succeed. Manual spot-check: seed two linked packages pointing at the same Gist with stale `gistRevision`, reload the options page. Click **Check Gist updates** → dialog shows "2 of 2 linked packages have updates" and the network tab shows exactly one Gist API call. Click **Sync all out-of-date** → both packages overwrite with the current Gist content and `gistRevision` updates. Open one of them, click **Sync** individually → "Already up to date." Click **Unlink** → confirmation, then the package becomes editable (rename pencil returns).
