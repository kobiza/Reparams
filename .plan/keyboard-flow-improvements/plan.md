# Keyboard Flow Improvements

## Goal

Tighten the popup's keyboard-only experience so a power user can pick a preset, edit params, and apply the URL without ever touching the mouse. Builds on the existing autofocus-on-open + Cmd+Enter foundation by closing the remaining gaps (no Escape, hidden delete buttons, undocumented Autocomplete behavior, no shortcut for Quick Actions) and surfacing the shortcuts subtly so users discover them.

## Scope

**In Scope**
- Popup bundle only (`src/js/components/popup/**` and `src/js/components/common/**` components used by it).
- Global popup-level shortcuts: Escape to close, digit-key (1-9) shortcuts for Quick Actions, jump-to-apply.
- Per-row ergonomics: delete-param button reachable & visible on keyboard focus (not just hover), keyboard shortcut to delete the focused row.
- Autocomplete keyboard-behavior audit: explicit, consistent Enter / Tab handling across `MuiTags`, `FreeSoloTags`, `ParamWithDelimiterValueInput`, and the key/value Autocompletes inside `SearchParams`.
- Subtle visible affordances: tooltip kbd badges on the Apply FAB, Quick Action buttons, and the menu/options trigger so the keyboard model is discoverable.

**Out of Scope**
- Options/editor page keyboard flow (`PackagePanel`, `PackageSettingsEditor`, `ImportDialog`, `ExportDialog`, etc.) — separate plan.
- Reordering params via keyboard (Alt+Arrow style) — explicitly excluded.
- Visual redesign of buttons or layout. Affordances stay subtle (kbd badges in tooltips / inline kbd hints), no layout shifts.
- Changes to background service worker keyboard command (the OS-level shortcut that opens the popup).
- New persisted model fields (no migration / fixer needed).

## Phases

- **Phase 1 — Autocomplete keyboard-behavior audit** (Must Have, no deps)
  Walk through `MuiTags`, `FreeSoloTags`, `ParamWithDelimiterValueInput`, and the key/value Autocompletes in `SearchParams`. Confirm Enter selects the highlighted option, Tab moves to the next field without losing the typed value, and free-solo entries are committed correctly. Where behavior currently relies on MUI defaults, lock it down with explicit handlers and/or tests so future MUI upgrades can't silently regress it. No user-visible change unless a regression is found.

- **Phase 2 — Per-row ergonomics** (Must Have, depends on Phase 1)
  Make the delete-param button reachable and clearly visible whenever any control in a row has keyboard focus (today it may be hover-only). Add a row-scoped shortcut (Cmd/Ctrl+Backspace while focused inside a row) to remove the row and move focus sensibly (next row's key field, or the Add-Param button if it was the last row).

- **Phase 3 — Global popup shortcuts** (Should Have, depends on Phase 1)
  Add three popup-level shortcuts wired through the existing `useCommandShortcuts` hook so they don't fight Autocomplete: Escape closes the popup; digit keys 1-9 trigger the matching Quick Action (only when focus is not in a text input); a jump-to-apply shortcut (e.g. Cmd/Ctrl+.) moves focus to the Apply FAB. Define and document the focus-context rules.

- **Phase 4 — Subtle keyboard hints** (Could Have, depends on Phases 2 & 3)
  Add small kbd-style affordances in tooltips next to the Apply FAB (Cmd+Enter / Cmd+Shift+Enter), Quick Action buttons (digit), and the delete-row icon. Optional: a "?" Help button or hover legend listing the popup shortcuts. No layout change, only tooltips and small badges.
