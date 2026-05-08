# Phase 3 — History Maintenance & Pruning

**Status:** Not Started
**Dependencies:** Phase 2
**Outcome:** Suggestions are ranked recency-first (history before presets), and users can clear a package's param history from the options page.

---

## Goal

Phase 1 already caps history at 500 entries (recent-first). Phase 2 dedupes across sources. The remaining "Could Have" items from `plan.md` are:

1. **Recency-first ranking** — currently `buildSuggestions` iterates each package's *presets first, then history*. Flip to *history first, then presets*. Within history, the array is already recent-first (Phase 1 prepends new entries).
2. **Clear-history affordance** — in the options page, per package, a "Clear param history" button under the package's Settings tab.

No new persistence shape, no new constants — purely behavior + UI on top of Phase 1's data.

---

## Acceptance Criteria

- `buildSuggestions` returns suggestions where, within each package, recent history items appear before preset entries; values for a given key list recent history values before preset values.
- Options page → expand package → Settings tab → shows "Clear param history" with a confirmation dialog. Clicking confirm sets that package's `paramHistory` to `[]`.
- Existing tests still pass; new tests cover the reordering and the clear action.

---

## Implementation Tasks

### 1. Re-order `buildSuggestions` (`src/js/utils/suggestionsCompositor.ts`)

- [ ] Iterate `pkg.paramHistory ?? []` BEFORE iterating preset entries inside each package's loop.
- [ ] No other logic changes — dedupe + first-seen ordering still apply.

### 2. Add `clearPackageParamHistory` to the editor store

- [ ] Add `clearPackageParamHistory: (packageKey: string) => void` to `EditorStore` type in `src/js/types/types.ts`.
- [ ] Implement it in `src/js/components/options/UseEditorStoreContext.tsx` — set `packages[packageKey].paramHistory = []`. Provide it through the context value and add a `noop` to the default context.

### 3. Add "Clear param history" button to `PackageSettingsEditor`

- [ ] Extend `ParamsEditorProps` in `src/js/components/options/PackageSettingsEditor.tsx` to accept `paramHistoryCount: number` and `clearPackageParamHistory: EditorStore['clearPackageParamHistory']`.
- [ ] Render a new section above the "Delete Package" block:
  - Title: "Param history"
  - Caption: `"<N> entries"` (or "No entries yet" when 0)
  - Button: "Clear param history" — disabled when count is 0 — opens a confirmation dialog.
  - Dialog body: `"Clear param history for \"<package label>\"?"` — Yes/No.
- [ ] Pass the new props from `PackagePanel.tsx` (which already destructures `packageData`); read `packageData.paramHistory?.length ?? 0`.

### 4. Tests

- [ ] `tests/suggestionsCompositor.test.ts`: add a test asserting that when both history and preset entries exist, history items appear first in `keys` and `valuesByKey`.
- [ ] `tests/components/UseEditorStoreContext.test.tsx`: add a test for `clearPackageParamHistory` — setting then clearing a package's `paramHistory` empties it without touching other packages or other fields.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/js/utils/suggestionsCompositor.ts` | Iterate history before presets |
| `src/js/types/types.ts` | Add `clearPackageParamHistory` to `EditorStore` |
| `src/js/components/options/UseEditorStoreContext.tsx` | Implement + provide `clearPackageParamHistory`; default `noop` |
| `src/js/components/options/PackageSettingsEditor.tsx` | New "Param history" section + clear button + confirm dialog |
| `src/js/components/options/PackagePanel.tsx` | Pass `paramHistoryCount` and `clearPackageParamHistory` down |
| `tests/suggestionsCompositor.test.ts` | Add ordering test |
| `tests/components/UseEditorStoreContext.test.tsx` | Add clear-history test |

---

## Verification

```bash
yarn test
yarn build
```

Manual:
1. Apply a few URLs from the popup so history accumulates.
2. Open options → package → Settings tab → "Param history" section shows the count.
3. Click "Clear param history" → confirm → count becomes 0.
4. Reopen popup → autocomplete options for that package now exclude history entries.
5. Re-apply a URL with new params → suggestions list new entries first (recency-first).

---

## Open Questions

None — scope is intentionally small; broader frequency-based ranking is left out per `plan.md` ("Skippable if Phase 2 caps prove sufficient").
