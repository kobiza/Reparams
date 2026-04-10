# Preset from URL

## Goal

Add a button to the popup that captures the current tab's query parameters, lets the user select which params to keep, name the preset, and assign it to an existing or new package — all without leaving the popup.

## Scope

### In Scope
- "Create Preset" button in the popup (e.g., in the drawer or as a secondary FAB)
- Dialog/panel showing all current URL query params as a checklist (key = value, all selected by default)
- Text field for preset name (pre-filled from hostname or path)
- Package picker: choose an existing package or create a new one (checklist style similar to ImportDialog)
- Write the new preset directly to `localStorage` from the popup using the same `reparamsAppData` key
- Handle edge case: URL has no query params → disable/hide the button or show a message

### Out of Scope
- Editing the param values before saving (just capture as-is)
- Auto-deselecting tracking params
- Modifying existing presets from the popup
- Any changes to the options page editor

## Phases

- [ ] **Phase 1 — Create Preset from URL** *(Must Have)*
  Add a "Create Preset" button to the popup. When clicked, open a dialog that: (1) parses the current URL's query params into a checklist with key=value display, all selected by default; (2) provides a text field for the preset name, pre-filled from the hostname; (3) shows a package picker (existing packages as a selectable list + "New Package" option, similar to the ImportDialog checklist pattern); (4) on confirm, writes the new preset into the selected/new package in localStorage. The popup reads all packages from localStorage (not just URL-matched ones) to populate the package picker.

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Create Preset from URL | `backlog` |
