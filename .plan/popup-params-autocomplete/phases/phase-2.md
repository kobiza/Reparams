# Phase 2 — Suggestion Engine + Popup Autocomplete UI

**Status:** Not Started
**Dependencies:** Phase 1
**Outcome:** Popup `SearchParams` rows show MUI `Autocomplete` (free-solo) for both key and value inputs, sourced from relevant packages' preset entries + per-package history (per-key for values). Options page is unaffected.

---

## Goal

Compose a suggestion source from preset entries + Phase 1 `paramHistory` and surface it in the popup's shared `SearchParams` component via a new optional prop. Free-solo: users can still type anything; the suggestions are non-binding hints.

---

## Acceptance Criteria

- New pure utility `buildSuggestions(packages)` returns `{ keys: string[]; valuesByKey: Record<string, string[]> }`. Sources: each package's preset entries ∪ `paramHistory`, deduped across packages.
- Popup's `SearchParams` row renders MUI `Autocomplete` free-solo on both key and value inputs. The value input filters its options to `valuesByKey[currentKey] ?? []`.
- Existing usages without the new prop (options page `PresetsEditor`) keep rendering plain `TextField` — visually and behaviorally unchanged. Existing paste handlers (encoding decode + quick-paste) keep working in both modes.

---

## Data Model & Types

```ts
// src/js/types/types.ts (additive)
export type ParamSuggestions = {
    keys: string[]
    valuesByKey: { [key: string]: string[] }
}

export type ViewerModel = {
    presets: PresetsEntriesMapViewModel
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    quickActions: QuickActionData
    suggestions: ParamSuggestions   // <-- NEW
}
```

The default `ViewerStoreContext` value gets `suggestions: { keys: [], valuesByKey: {} }`.

---

## Implementation Tasks

### 1. Extend types (`src/js/types/types.ts`)

- [ ] Add `ParamSuggestions` type
- [ ] Add `suggestions: ParamSuggestions` to `ViewerModel`

### 2. Create suggestions compositor (`src/js/utils/suggestionsCompositor.ts`) — NEW

Pure function:

```ts
export const buildSuggestions = (packages: SettingsPackage[]): ParamSuggestions
```

Iterates every package's presets (`Object.values(pkg.presets).flatMap(p => p.entries)`) and `pkg.paramHistory ?? []`, normalizes each `[key, value]` pair, skipping empty key/value. Deduplicates:
- `keys`: ordered, first-seen wins
- `valuesByKey[key]`: ordered, first-seen wins, scoped per key

### 3. Wire `toViewerModel` (`src/js/utils/utils.ts`)

- [ ] Build `suggestions` via `buildSuggestions(relevantPackages)` and include in returned `ViewerModel`.
- [ ] Update default values in `getEmptySettingsPackage`-related code if needed (no change to packages — only consumers).

### 4. Update viewer context default (`src/js/components/popup/UseViewerStoreContext.tsx`)

- [ ] Add `suggestions: { keys: [], valuesByKey: {} }` to the default `createContext` value.

### 5. Add optional `suggestions` prop to shared `SearchParams` (`src/js/components/common/SearchParams.tsx`)

- [ ] Add `suggestions?: ParamSuggestions` to `SearchParamsProps`.
- [ ] When `suggestions` is provided, render an MUI `Autocomplete` (`freeSolo`) wrapping the existing `TextField` via `renderInput`, for BOTH key and value inputs:
  - Key input: `options = suggestions.keys`
  - Value input: `options = suggestions.valuesByKey[currentKey] ?? []`
  - Use `inputValue` + `onInputChange` for free typing; `onChange` for clicks/Enter on a suggestion. Both should call the same setter.
  - Preserve `inputProps.onPaste` (decoded-paste + quick-paste) — pass through `renderInput`'s `params.inputProps` merged with the existing paste handler.
  - Preserve key-input `inputRef` for the existing focus-on-add behavior.
  - Preserve value-input `endAdornment` (zoom button for delimited params).
- [ ] When `suggestions` is `undefined`, keep current `TextField` behavior unchanged (options page path).

### 6. Wire popup (`src/js/components/popup/UrlEditor.tsx` + `Popup.tsx`)

- [ ] Read `suggestions` from `ViewerStoreContext` (in whichever component currently consumes the viewer store; thread it down to `UrlEditor` if needed).
- [ ] Pass `suggestions` prop to the `<SearchParams ...>` instance inside `UrlEditor`.

### 7. Tests

#### `tests/suggestionsCompositor.test.ts` — NEW
- [ ] empty input → empty `keys` and empty `valuesByKey`
- [ ] preset entries only → keys & valuesByKey populated, deduped
- [ ] history only → keys & valuesByKey populated
- [ ] preset + history → unioned, dedupe across both sources
- [ ] same key with different values → values stack under one key
- [ ] same `(key, value)` across multiple packages → deduped once
- [ ] empty key or value entries → skipped

#### `tests/components/SearchParams.test.tsx` — UPDATE
- [ ] Existing tests keep passing (no `suggestions` prop ⇒ TextField path).
- [ ] Add a test: when `suggestions` is provided with `keys: ['foo']`, the key input is rendered as a combobox (`role=combobox`) and `foo` appears in the dropdown when opened.
- [ ] Add a test: when row's key is `'foo'` and `valuesByKey: { foo: ['bar'] }`, opening the value combobox lists `bar`.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/js/types/types.ts` | Add `ParamSuggestions`; extend `ViewerModel` |
| `src/js/utils/suggestionsCompositor.ts` | **New** — `buildSuggestions` |
| `src/js/utils/utils.ts` | `toViewerModel` includes suggestions |
| `src/js/components/popup/UseViewerStoreContext.tsx` | Default ctx value adds `suggestions` |
| `src/js/components/common/SearchParams.tsx` | Optional `suggestions` prop → Autocomplete mode |
| `src/js/components/popup/UrlEditor.tsx` | Pass `suggestions` to `SearchParams` |
| `tests/suggestionsCompositor.test.ts` | **New** unit tests |
| `tests/components/SearchParams.test.tsx` | Add Autocomplete-mode tests |

---

## Verification

```bash
yarn test                       # full unit test suite green
yarn build                      # production build typechecks
```

Manual:
1. Build & load extension in Chrome (or `yarn start` for watch mode).
2. Open popup on a page that matches a package.
3. Apply some params (rocket button) — Phase 1 captures them to history.
4. Reopen popup, click into the key input → suggestions should include preset keys + history keys.
5. Pick or type a key, then click into value input → suggestions should be filtered to that key's prior values.
6. Open the options page preset editor — `SearchParams` rows should still be plain TextFields (no autocomplete, no regression).

---

## Edge Cases

- **No relevant packages:** suggestions are `{ keys: [], valuesByKey: {} }` → Autocomplete still renders, just shows no options.
- **Duplicate preset entries across packages:** deduped.
- **Free-solo typing:** typed values that aren't in the list still update entries via `onInputChange`.
- **Paste handlers:** must remain intact — verified by existing SearchParams paste tests.
- **Delimited param zoom button:** must still appear on the value input when applicable.

---

## Open Questions

None — scope is clear.
