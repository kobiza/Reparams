# Quick Paste Feature

## Goal
When a user pastes text into the **key field of an empty param row** (both key and value are blank), automatically detect `key=value` or `key1=v1&key2=v2` format and smart-fill one or multiple rows — saving manual typing.

## Scope

### In Scope
- Smart-paste triggered **only** on the key field of a row where key="" and value=""
- **Case 1 (single):** paste `key1=someValue` → fill current row's key with `key1` and value with `someValue`
- **Case 2 (multi):** paste `key1=v1&key2=v2` → fill current row with first pair, append new rows for the rest
- Pasted keys/values run through `decodeIfEncoded` (consistent with existing paste behavior)
- Active in **both** popup and options (SearchParams is a shared component)
- Duplicate keys → always add new rows (duplicates are valid in this app)
- Unit tests for the parse utility

### Out of Scope
- Smart-paste on the **value** field
- Smart-paste on **non-empty** rows (existing key or value present)
- Conflict/deduplication logic — always append

## Phases

- [x] **Phase 1 — Parse utility + tests** *(Must Have)*
  - Add `parseQuickPaste(text: string): Array<[string, string]> | null` to `src/js/utils/searchParamsUtils.ts`
  - Returns `null` if text doesn't contain `=` (fall through to normal paste)
  - Splits on `&`, then each token on first `=` only (values may contain `=`)
  - Filters out tokens with empty keys
  - Runs `decodeIfEncoded` on each extracted key and value
  - Unit tests in `tests/searchParamsUtils.test.ts`

- [x] **Phase 2 — SearchParams UI integration** *(Must Have, depends on Phase 1)*
  - Add `onPaste` handler to the key `TextField`'s `inputProps` in `SearchParams.tsx`
  - Guard: only activate when `key === ''` and `value === ''`
  - On match: `e.preventDefault()`, compute new entries (replace current row + append extras), call `setEntries`
  - No changes needed to value field paste handler or ParamWithDelimiterValueInput

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Parse utility + tests | `done` |
| Phase 2 — SearchParams UI integration | `done` |

---

## Phase 1 Detail — Parse utility + tests

### Acceptance Criteria
- `parseQuickPaste('key=value')` returns `[['key', 'value']]`
- `parseQuickPaste('key1=v1&key2=v2')` returns `[['key1', 'v1'], ['key2', 'v2']]`
- `parseQuickPaste('plaintext')` returns `null` (no `=` present)

### Atomic Tasks

1. **Add import to searchParamsUtils.ts**
   - Modify: `src/js/utils/searchParamsUtils.ts` (top of file)
   - Add: `import { decodeIfEncoded } from './encodingUtils'`

2. **Implement and export `parseQuickPaste`**
   - Modify: `src/js/utils/searchParamsUtils.ts` (append after existing exports)
   - Logic:
     - If `text` has no `=` → return `null`
     - Split on `&`, filter out empty tokens
     - For each token, split on the **first** `=` only: `const eqIdx = token.indexOf('='); key = token.slice(0, eqIdx); val = token.slice(eqIdx + 1)`
     - Filter tokens where key is empty after trimming
     - Apply `decodeIfEncoded` to each key and value
     - If resulting array is empty → return `null`
     - Otherwise return the array

3. **Import `parseQuickPaste` in the test file**
   - Modify: `tests/searchParamsUtils.test.ts` (line 1 import statement)
   - Add `parseQuickPaste` to the named import

4. **Add test describe block for `parseQuickPaste`**
   - Modify: `tests/searchParamsUtils.test.ts` (append at end of file)
   - Test cases:
     - plain text (no `=`) → `null`
     - `'key=value'` → `[['key', 'value']]`
     - `'key1=v1&key2=v2'` → `[['key1', 'v1'], ['key2', 'v2']]`
     - value contains `=` sign: `'key=v1=v2'` → `[['key', 'v1=v2']]`
     - empty key filtered: `'=value'` → `null`
     - URL-encoded value decoded: `'name=John%20Doe'` → `[['name', 'John Doe']]`
     - trailing `&` ignored: `'key1=v1&'` → `[['key1', 'v1']]`
     - mixed with empty key: `'key1=v1&=skip&key2=v2'` → `[['key1', 'v1'], ['key2', 'v2']]`

### Verification
```bash
yarn test tests/searchParamsUtils.test.ts
```

---

## Phase 2 Detail — SearchParams UI integration

### Acceptance Criteria
- Pasting `key=value` into the key field of an empty row fills that row and calls `setEntries` with the correct pair
- Pasting `key1=v1&key2=v2` into the key field of an empty row replaces that row with all pairs (extras appended after)
- Pasting `key=value` into the key field of a **non-empty** row (existing key or value) does NOT trigger quick-paste — falls through to the existing decode handler

### Atomic Tasks

1. **Import `parseQuickPaste` in SearchParams.tsx**
   - Modify: `src/js/components/common/SearchParams.tsx` (import section)
   - Add `parseQuickPaste` to the existing import from `../../utils/searchParamsUtils`

2. **Update the key field `onPaste` handler**
   - Modify: `src/js/components/common/SearchParams.tsx` (inside the `items` map, key `TextField` `inputProps.onPaste`)
   - Replace the existing handler body with:
     1. Get `pasted` from clipboard
     2. Guard: if `key === ''` and `value === ''`, call `parseQuickPaste(pasted)`
     3. If result is non-null: `e.preventDefault()`, build `newEntries` as `[...entries.slice(0, index), ...parsed, ...entries.slice(index + 1)]`, call `setEntries(newEntries)`, `return`
     4. Fall through: existing `decodeIfEncoded` decode-and-insert logic (unchanged)

3. **Add quick-paste tests to SearchParams.test.tsx**
   - Modify: `tests/components/SearchParams.test.tsx`
   - Add new `describe('quick-paste', ...)` block with:
     - Single pair on empty row → `setEntries([[key1, v1]])`
     - Multi pair on empty row → `setEntries([[key1, v1], [key2, v2]])`
     - Paste on row where key is non-empty → `setEntries` NOT called
     - Paste on row where value is non-empty → `setEntries` NOT called

### Verification
```bash
yarn test tests/components/SearchParams.test.tsx
```
