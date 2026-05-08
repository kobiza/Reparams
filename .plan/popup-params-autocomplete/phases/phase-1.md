# Phase 1 — History Storage & Capture on Apply

**Status:** Not Started  
**Dependencies:** None  
**Outcome:** When the user applies params (rocket button or ⌘+Enter), entries are persisted to `paramHistory` on all matching packages. Verifiable by inspecting `localStorage` after applying a URL.

---

## Goal

Add an additive per-package `paramHistory` field to the persisted model and capture param entries on Apply. No UI changes in this phase — the feature is backend-only and verifiable via localStorage.

---

## Data Model Changes

### New Type: `ParamHistoryEntry`

```typescript
// src/js/types/types.ts
export type ParamHistoryEntry = {
  key: string
  value: string
}
```

### Extend `SettingsPackage`

Add an optional `paramHistory` field:

```typescript
export type SettingsPackage = {
  key: string
  label: string
  conditions: { ... }
  presets: PresetsEntriesMap
  paramsWithDelimiter: ParamsWithDelimiter
  paramHistory?: ParamHistoryEntry[]  // <-- NEW (additive, no fixer needed)
}
```

### Constraints

- **Max history entries per package:** 500 (configurable constant in `consts.ts`)
- **Deduplication:** By `(key, value)` tuple — only unique pairs are stored
- No fixer needed per `CLAUDE.md` § Model Evolution — readers handle `undefined` gracefully

---

## Implementation Tasks

### 1. Define Types (`src/js/types/types.ts`)

- [ ] Add `ParamHistoryEntry` type
- [ ] Add optional `paramHistory?: ParamHistoryEntry[]` to `SettingsPackage`

### 2. Add Constants (`src/js/utils/consts.ts`)

- [ ] Add `PARAM_HISTORY_MAX_ENTRIES = 500`

### 3. Create History Utility (`src/js/utils/paramHistoryUtils.ts`)

New utility module with pure functions:

```typescript
/**
 * Merges new entries into existing history, dedupes by (key, value),
 * and caps at maxEntries. Returns a new array (immutable).
 */
export const mergeParamHistory = (
  existingHistory: ParamHistoryEntry[] | undefined,
  newEntries: SearchParamsEntries,
  maxEntries: number
): ParamHistoryEntry[]
```

Implementation notes:
- Filter out empty keys/values before adding
- Dedupe: if `(key, value)` already exists, don't duplicate
- Cap: keep most recent entries up to `maxEntries`
- Return new array (immutable)

### 4. Create History Capture Service (`src/js/utils/paramHistoryCaptureService.ts`)

New service module:

```typescript
/**
 * Captures param entries to history for all packages matching the applied URL.
 * Reads current EditorModel from localStorage, updates matching packages,
 * and writes back to localStorage.
 */
export const captureParamHistory = (
  appliedUrl: string,
  entries: SearchParamsEntries
): void
```

Implementation notes:
- Load `EditorModel` via `loadAndMigrateAppData()`
- Find all packages where `matchUrl(appliedUrl, urlPattern)` returns true (use `getRelevantPackages` logic, but URL-only — ignore DOM selectors since we don't have DOM context at Apply time)
- For each matching package, call `mergeParamHistory` to update its `paramHistory`
- Write updated model back to localStorage via `localStorage.setItem(localStorageKey, JSON.stringify(model))`
- Handle edge cases: no matching packages, empty entries

### 5. Hook into Apply Flow (`src/js/components/popup/UrlEditor.tsx`)

Call `captureParamHistory` at Apply time:

- [ ] In `applyUrl` (rocket button click), call `captureParamHistory(newUrl, searchParamsEntries)` before navigation
- [ ] In `addEntriesAndNavigate`, call `captureParamHistory(nextUrl, newSearchParamsEntries)` before navigation

The capture should happen **before** the tab navigates away, ensuring the popup context is still valid.

### 6. Add Unit Tests

#### `tests/paramHistoryUtils.test.ts`
- [ ] `mergeParamHistory` dedupes correctly
- [ ] `mergeParamHistory` caps at max entries
- [ ] `mergeParamHistory` handles undefined existing history
- [ ] `mergeParamHistory` filters empty keys/values
- [ ] `mergeParamHistory` preserves order (recent first)

#### `tests/paramHistoryCaptureService.test.ts`
- [ ] Captures to single matching package
- [ ] Captures to multiple matching packages
- [ ] No-op when no packages match
- [ ] No-op when entries are empty
- [ ] Integrates with localStorage correctly

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/js/types/types.ts` | Add `ParamHistoryEntry`, extend `SettingsPackage` |
| `src/js/utils/consts.ts` | Add `PARAM_HISTORY_MAX_ENTRIES` |
| `src/js/utils/paramHistoryUtils.ts` | **New** — `mergeParamHistory` |
| `src/js/utils/paramHistoryCaptureService.ts` | **New** — `captureParamHistory` |
| `src/js/components/popup/UrlEditor.tsx` | Hook `captureParamHistory` into Apply |
| `tests/paramHistoryUtils.test.ts` | **New** — unit tests |
| `tests/paramHistoryCaptureService.test.ts` | **New** — unit tests |

---

## Verification

After implementation, verify by:

1. Open the extension popup on a page that matches a package URL pattern
2. Edit or add some params (e.g., `foo=bar`, `debug=true`)
3. Click the rocket button or press ⌘+Enter
4. Open DevTools → Application → Local Storage → `reparamsAppData`
5. Confirm the matching package(s) now have a `paramHistory` array containing the applied entries

---

## Edge Cases

- **Empty entries:** Skip capture (nothing to store)
- **No matching packages:** Skip capture (history is package-scoped)
- **Duplicate Apply:** Should not create duplicate history entries
- **URL pattern wildcard:** Ensure wildcards like `*://*/*` match correctly
- **Multiple packages match:** All should receive the history update

---

## Open Questions

None — scope is well-defined.
