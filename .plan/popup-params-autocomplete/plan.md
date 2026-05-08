# Popup Params Autocomplete

## Goal
Add autocomplete to the popup's param key/value editor (the shared `SearchParams` component, popup-only), so users typing keys or values get suggestions sourced from the current package's preset entries plus a user-typed history captured on Apply. Works for both new and existing param rows.

## Scope

### In Scope
- Popup-only autocomplete on the param **key** and **value** inputs in `SearchParams`, for both new (empty) and existing rows.
- Per-key value scoping: when typing a value, suggestions are filtered to values previously seen for that exact key.
- Per-package user history: entries the user types and applies (rocket button or ⌘+Enter) are saved under every package whose URL pattern matches the applied URL.
- Suggestion source = preset values (across the current applicable package's presets) ∪ user history, deduped.
- Free-solo behavior: users can type anything; suggestions are non-binding.
- Storage as an additive change to the persisted model (no fixer required per `CLAUDE.md`).

### Out of Scope
- Autocomplete in the **options-page** preset editor (same shared `SearchParams` component, gated by a prop).
- Per-domain or per-URL history (history is package-scoped only).
- User-defined value dictionaries (declarative `key=[allowedValues]` lists).
- Reading the active tab's URL params as a suggestion source (only what's already in the popup's edited entries is in play).
- Cross-package suggestion merging when multiple packages apply *for read* (history capture writes to all matching packages, but suggestion read uses the current package context already established by the popup).
- Sync/cloud history.

## Phases

- **Phase 1 — History storage + capture on Apply** (Must Have, no deps)
  Add an additive per-package `paramHistory` field to the persisted model and capture entries on Apply. Define the shape, write to all packages whose URL pattern matches the applied URL, dedupe, and cap to a sane bound. No UI changes — verifiable by inspecting `localStorage` after applying a URL.

- **Phase 2 — Suggestion engine + popup autocomplete UI** (Must Have, depends on Phase 1)
  Build a suggestion compositor that merges preset values + package history (per-key for values, deduped). Replace the popup's `TextField` rows in `SearchParams` with MUI `Autocomplete` (free-solo), gated by a new prop so the options page is unaffected. Wire the popup to provide suggestions for the currently applicable package(s). Verifiable end-to-end in the popup.

- **Phase 3 — History maintenance & pruning** (Could Have, depends on Phase 2)
  Add an LRU/frequency cap to keep history bounded, surface a "Clear history" affordance in the options page per package, and rank suggestions by recency/frequency. Skippable if Phase 2 caps prove sufficient.
