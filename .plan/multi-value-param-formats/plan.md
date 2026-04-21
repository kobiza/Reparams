# Multi-value param formats

## Goal

Extend ReParams to support three multi-value query-string formats when merging presets into URLs: the existing delimiter-joined form (`?cars=Saab,Audi`), the bracketed-array form (`?cars[]=Saab&cars[]=Audi`), and the repeated-key form (`?cars=Saab&cars=Audi`). The model rename from `paramsWithDelimiter` to `paramsMultiValue` + a `format` field captures the new capability cleanly; a one-time migration keeps existing users' stored data intact.

## Scope

### In Scope

- Rename `paramsWithDelimiter` → `paramsMultiValue` on `SettingsPackage`, `MergedAppData`, `ViewerModel` and related view-model types. Each entry gains a `format: 'delimiter' | 'bracketed' | 'repeated'` field; `separator` becomes required only when `format === 'delimiter'`.
- One-time migration in `src/js/components/options/dataFixer.ts` (new `runFixer2`) that rewrites existing stored packages: `paramsWithDelimiter: [{id, label, separator}]` → `paramsMultiValue: [{id, label, format: 'delimiter', separator}]`. Bump `modelVersion` accordingly.
- Update the merging/serialization pipeline in `src/js/utils/searchParamsUtils.ts` so that:
  - Parsing a URL into `SearchParamsEntries` groups `cars[]=X&cars[]=Y` and `cars=X&cars=Y` into a single entry `['cars', <delimiter-joined>]` when the param is configured as `bracketed` or `repeated`.
  - Merging presets into existing entries works identically for all three formats (dedupe, preserve order — same semantics as today's delimiter logic).
  - Serializing entries back to a query string emits the correct wire format per param: `delimiter` → `key=v1{sep}v2`, `bracketed` → `key[]=v1&key[]=v2`, `repeated` → `key=v1&key=v2`.
- Internal representation stays as `SearchParamsEntries = Array<[string, string]>` with delimiter-joined values. Format only affects the URL boundary (parse in, serialize out). Rationale: minimizes blast radius across editor/viewer UI and storage.
- Unit tests covering all three formats in `tests/searchParamsUtils.test.ts`: parse, merge (add/replace/dedupe), remove, and serialize. Migration unit test in a new or existing fixer test.
- Update dummy data (`src/js/utils/dummyData.ts`) and any test fixtures that reference `paramsWithDelimiter` so the existing suite keeps passing under the new name.

### Out of Scope

- Options page UI for choosing a format per param (user will configure via existing data-shape edits / imports for now).
- Popup UI changes beyond what's needed for parsing/serialization correctness (no new affordances in the popup).
- Per-preset override of the format (format is configured per-param at the package level, same granularity as today's `separator`).
- Handling mixed formats for the same param on the same URL (e.g. `cars=A&cars[]=B`) — treat as user misconfiguration; spec'd behavior is to honor the configured format only.

## Phases

- [ ] **Phase 1 — Model rename + migration (Must Have)** — Rename `paramsWithDelimiter` to `paramsMultiValue` across types, store/context code, dummy data, and all tests. Add the optional `format` field (defaulting to `'delimiter'` in the migration). Add `runFixer2` to migrate existing stored data. Existing behavior is byte-identical; entire existing test suite remains green.
- [ ] **Phase 2 — Parse/merge/serialize for new formats (Must Have, depends on Phase 1)** — Extend `searchParamsUtils.ts` with parse/serialize helpers keyed on `format`. Update merging/removal to use the configured format. Add unit tests covering the two new formats (parse, merge, dedupe, remove, serialize) alongside the existing delimiter tests.

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Model rename + migration | `backlog` |
| Phase 2 — Parse/merge/serialize for new formats | `backlog` |
