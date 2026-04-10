# Gist Import

## Goal

Add a GitHub Gist import flow that fetches packages from a Gist, links them to the source Gist ID, enforces read-only editing for linked packages, and provides Sync (re-fetch + overwrite) and Unlink (restore editability) actions.

## Scope

### In Scope
- New "GitHub Gist" tab in `ImportDialog` — accepts a Gist URL/ID, fetches via the GitHub API, and imports selected packages
- Store `gistId` on each imported `SettingsPackage`
- Lock indicator (icon) on Gist-linked packages in the editor
- Read-only mode: disable editing of presets, URL patterns, DOM selectors, delimiters, and package label for linked packages
- **Sync** button on linked packages — re-fetches the Gist, shows a confirmation prompt, then overwrites local data
- **Unlink** button on linked packages — clears the `gistId` and restores full editability

### Out of Scope
- GitHub authentication / private Gist support (public Gists only)
- Two-way sync (push local changes back to a Gist)
- Auto-sync / polling for Gist changes
- Export to Gist

## Phases

- [ ] **Phase 1 — Gist Import Tab & Data Model** *(Must Have)*
  Add `gistId?: string` to `SettingsPackage`. Create a Gist fetch utility that resolves a Gist URL/ID to an `EditorModel` via the GitHub REST API (`GET /gists/{id}`). Add a fourth "GitHub Gist" tab to `ImportDialog` that uses this utility, stamps each imported package with the source `gistId`, and feeds them through the existing `addPackages` flow.

- [ ] **Phase 2 — Read-Only Mode & Lock Indicator** *(Must Have)*
  In the options editor, detect when a package has a `gistId`. Show a lock icon in the `PackagePanel` header. Disable all editing controls (presets, settings, label, delete) for that package so the user cannot modify Gist-sourced data.

- [ ] **Phase 3 — Sync & Unlink Actions** *(Must Have)*
  Add a **Sync** button to Gist-linked packages that re-fetches the Gist, diffs against local state, and shows a confirmation dialog before overwriting. Add an **Unlink** button that clears `gistId` and restores full editability, also with a confirmation prompt.

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Gist Import Tab & Data Model | `backlog` |
| Phase 2 — Read-Only Mode & Lock Indicator | `backlog` |
| Phase 3 — Sync & Unlink Actions | `backlog` |
