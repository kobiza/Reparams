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

- [ ] **Phase 1 — Parse utility + tests** *(Must Have)*
  - Add `parseQuickPaste(text: string): Array<[string, string]> | null` to `src/js/utils/searchParamsUtils.ts`
  - Returns `null` if text doesn't contain `=` (fall through to normal paste)
  - Splits on `&`, then each token on first `=` only (values may contain `=`)
  - Filters out tokens with empty keys
  - Runs `decodeIfEncoded` on each extracted key and value
  - Unit tests in `tests/searchParamsUtils.test.ts`

- [ ] **Phase 2 — SearchParams UI integration** *(Must Have, depends on Phase 1)*
  - Add `onPaste` handler to the key `TextField`'s `inputProps` in `SearchParams.tsx`
  - Guard: only activate when `key === ''` and `value === ''`
  - On match: `e.preventDefault()`, compute new entries (replace current row + append extras), call `setEntries`
  - No changes needed to value field paste handler or ParamWithDelimiterValueInput

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Parse utility + tests | `backlog` |
| Phase 2 — SearchParams UI integration | `backlog` |
