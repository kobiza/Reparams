# Phase 2 — Read-Only Mode & Lock Indicator

## Acceptance Criteria

- A package with `gistId` defined renders a lock icon in its `PackagePanel` header with a tooltip ("Linked to a GitHub Gist — read-only. Use Sync or Unlink to manage.") and the rename pencil is hidden.
- All editing controls inside the package are disabled when locked: preset name fields, preset entries (SearchParams), Add/Delete preset, URL pattern inputs + Add/Delete, DOM selector inputs + Add/Delete, params-with-delimiter inputs + Add/Delete, "Add package with same settings", "Delete Package", and "Clear param history". The accordion still opens and the Presets/Settings tabs are still navigable.
- All mutator methods on the editor store that target an existing package by key (`updatePackagePreset`, `updatePackageParamsWithDelimiter`, `updatePackageLabel`, `updatePackageUrlPatterns`, `updatePackageDomSelectors`, `deletePackage`, `clearPackageParamHistory`) silently no-op if the target package has `gistId`. `addPackages` is NOT guarded — Phase 3's Sync will use it to replace a linked package wholesale.
- `yarn test` and `yarn build:dev` pass; new tests cover the store-layer guard and the lock-icon render path.

## Atomic Tasks

1. **Add `isPackageLocked` helper** — `Modify: src/js/utils/utils.ts`.
   - Add at file bottom:
     ```
     export const isPackageLocked = (pkg: SettingsPackage | undefined | null): boolean =>
       !!pkg?.gistId;
     ```
   - Ensure `SettingsPackage` is imported at the top of the file (check existing imports first).

2. **Guard editor store mutators** — `Modify: src/js/components/options/UseEditorStoreContext.tsx`.
   - At the top of each of these handlers, early-return if `appState.packages[packageKey]?.gistId` is truthy:
     - `updatePackagePreset` (line 45)
     - `updatePackageParamsWithDelimiter` (line 53)
     - `updatePackageLabel` (line 63)
     - `updatePackageUrlPatterns` (line 71)
     - `updatePackageDomSelectors` (line 153)
     - `deletePackage` (line 143)
     - `clearPackageParamHistory` (line 161)
   - Factor the check into a tiny local helper to avoid duplication:
     ```
     const isLocked = (packageKey: string) => !!appState.packages[packageKey]?.gistId;
     ```
     and use `if (isLocked(packageKey)) return;` at the top of each handler.
   - **Do NOT guard `addPackages`** — Sync will use the `replace: true` path to overwrite a linked package.

3. **Render lock icon in PackagePanel header** — `Modify: src/js/components/options/PackagePanel.tsx`.
   - Add imports: `import LockIcon from '@mui/icons-material/Lock';`, `import Tooltip from '@mui/material/Tooltip';`, and `import { isPackageLocked } from '../../utils/utils';`.
   - Inside the component body, compute `const isLocked = isPackageLocked(packageData);`.
   - In the `.package-name-view` div, insert a `<Tooltip>` wrapping a `<LockIcon>` (small, primary color, marginLeft) **before** the rename pencil. Render the lock + tooltip only when `isLocked` is true.
   - Hide the rename `<IconButton>` (EditIcon) when `isLocked` — wrap in `{!isLocked && (...)}`. (Rename is locked at the store layer too, but hiding the affordance matches the read-only intent.)

4. **Pass `isLocked` to PresetsEditor and disable its controls** — `Modify: src/js/components/options/PresetsEditor.tsx` and `PackagePanel.tsx`.
   - In `PackagePanel.tsx`, pass `isLocked={isLocked}` to `<PresetsEditor>`.
   - In `PresetsEditor.tsx`:
     - Add `isLocked?: boolean` to `PresetsEditorProps`.
     - In the preset name `TextField`, add `disabled={isLocked}`.
     - In the delete preset `IconButton`, add `disabled={isLocked}`.
     - In the "Add Preset" `Button`, add `disabled={isLocked}`.
     - Pass `readOnly={isLocked}` to `<SearchParams>`.

5. **Add `readOnly` prop to SearchParams** — `Modify: src/js/components/common/SearchParams.tsx`.
   - Add `readOnly?: boolean` to `SearchParamsProps`.
   - When `readOnly`, every `Autocomplete` (key and value) and `IconButton` (delete row, add row) in the rendered rows receives `disabled={true}`. Use a single `const readOnly = !!props.readOnly` at the top and thread `disabled={readOnly}` into the rendered row controls. The empty trailing "ghost" row should also be disabled when readOnly so users can't add new entries.

6. **Disable PackageSettingsEditor controls when locked** — `Modify: src/js/components/options/PackageSettingsEditor.tsx` and `PackagePanel.tsx`.
   - In `PackagePanel.tsx`, pass `isLocked={isLocked}` to `<PackageSettingsEditor>`.
   - In `PackageSettingsEditor.tsx`:
     - Add `isLocked?: boolean` to `ParamsEditorProps`.
     - Thread `disabled={isLocked}` into every `TextField` (url pattern, dom selector, param label, param separator) and every `IconButton` (the three `removePattern`/`removeDomSelector`/`removeParam` icons) and every `Button` ("Add" for url patterns, dom selectors, params with delimiter; "Add package with same settings"; "Clear param history"; "Delete Package").

7. **Unit tests for store-layer guard** — `Modify: tests/components/UseEditorStoreContext.test.tsx`.
   - Add a `describe('locked packages')` block covering:
     - `updatePackageLabel` does NOT change the label on a package with `gistId` set.
     - `deletePackage` does NOT remove a package with `gistId` set.
     - `updatePackagePreset` does NOT change presets on a locked package.
     - A package WITHOUT `gistId` is mutated normally (sanity check the guard isn't over-zealous).
   - Use the existing test scaffolding pattern in that file; if the existing tests use a render-the-context + act() approach, mirror it.

8. **Component test: lock icon renders + rename hidden** — `Create: tests/components/PackagePanel.test.tsx` (or extend if one exists; check first).
   - Render `<PackagePanel>` for a package with `gistId: 'some-id'` and assert the lock icon (`role="img"` or aria-label) is present, the rename pencil (aria-label "delete") is absent. Then render for a package without `gistId` and assert the inverse.

## Verification

```bash
yarn test
yarn build:dev
```

Both must succeed. Manual spot-check: seed `localStorage.reparamsAppData` with a package containing `gistId: 'test123'` and `gistRevision: 'sha-abc'`, reload the options page. Confirm: lock icon shows on the package, rename pencil is gone, every preset/setting control is disabled, but the Presets/Settings tabs still work.
