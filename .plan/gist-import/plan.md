# Gist Import

## Goal

Add a GitHub Gist import flow that fetches packages from a Gist, links each imported package to both the source Gist ID and the Gist's revision SHA at fetch time, enforces read-only editing for linked packages, and provides Sync (SHA-based change detection + re-fetch + overwrite) and Unlink (restore editability) actions.

## Scope

### In Scope
- New "GitHub Gist" tab in `ImportDialog` — accepts a Gist URL/ID, fetches via the GitHub API, and imports selected packages
- Store `gistId` **and** `gistRevision` on each imported `SettingsPackage` (both `?: string`). `gistRevision` is the SHA of the Gist at the moment that package was pulled — not at the moment of any later sync.
- Gist fetch utility routes the fetched body through `migrateModel` from `data-fixer` before packages are handed to `addPackages`. A Gist authored at an older `modelVersion` is silently upgraded to the current shape on import.
- Lock indicator (icon) on Gist-linked packages in the editor
- Read-only mode: disable editing of presets, URL patterns, DOM selectors, delimiters, and package label for linked packages
- **Sync** button on linked packages — compares the package's stored `gistRevision` against the Gist's current revision SHA. If equal, reports "already up to date" and does nothing. If different, shows a confirmation prompt, re-fetches, runs `migrateModel`, overwrites local package data, and updates `gistRevision` to the new SHA.
- **Unlink** button on linked packages — clears `gistId` **and** `gistRevision`, restores full editability.

### Out of Scope
- GitHub authentication / private Gist support (public Gists only)
- Two-way sync (push local changes back to a Gist)
- Auto-sync / polling for Gist changes
- Export to Gist
- **Content-level diffing between local and remote.** Sync uses SHA equality only — no three-way merge, no "here's what changed" preview. Rationale: local can't drift from remote (Phase 2 makes linked packages fully read-only), so the only question is "has the remote changed since we pulled?" — which a SHA comparison answers definitively without depending on fixer determinism or shape equality.
- **Handling Gists that have been deleted or had their structure change** (e.g. a package key that used to exist is no longer in the Gist). First version surfaces the raw GitHub error; graceful handling is a later pass.

### Design notes worth carrying into implementation

- **`gistRevision` is per-package, not per-Gist-link.** Gist import is partial by design — users select a subset of packages. If a user imports A/B/C from Gist-X at SHA1 and later imports D from the same Gist at SHA2, A/B/C stay stamped with SHA1 while D is stamped with SHA2. Each package's `gistRevision` reflects the Gist's state *at the moment that package was pulled*, and Sync is always a per-package comparison.
- **SHA comes from the Gist API response.** `GET /gists/{id}` returns a `history` array; the latest entry's `version` field is the revision SHA we persist.
- **Sync fetches, migrates, overwrites atomically per-package.** When multiple linked packages from the same Gist are out of sync, each one is its own confirm-and-overwrite interaction (at least for the first version — no "sync all").
- **`migrateModel` is consumed at two points:** (1) the initial Gist import in `ImportDialog`, and (2) the Sync re-fetch. Both paths treat a raw Gist blob identically to any other externally-sourced blob.

## Phases

- [ ] **Phase 1 — Gist Import Tab & Data Model** *(Must Have, depends on `data-fixer` Phase 1)*
  Add `gistId?: string` and `gistRevision?: string` to `SettingsPackage`. Create a Gist fetch utility that resolves a Gist URL/ID to an `EditorModel` via the GitHub REST API (`GET /gists/{id}`). The utility pipes the fetched JSON through `migrateModel` from `data-fixer` and captures the Gist's current revision SHA from the response's `history[0].version`. Add a fourth "GitHub Gist" tab to `ImportDialog` that uses this utility, stamps each selected (partial-import-aware) package with the source `gistId` and the captured `gistRevision`, and feeds them through the existing `addPackages` flow.

- [ ] **Phase 2 — Read-Only Mode & Lock Indicator** *(Must Have)*
  In the options editor, detect when a package has a `gistId`. Show a lock icon in the `PackagePanel` header. Disable all editing controls (presets, settings, label, delete) for that package so the user cannot modify Gist-sourced data.

- [ ] **Phase 3 — Sync & Unlink Actions** *(Must Have)*
  Add a **Sync** button to each Gist-linked package that fetches the current Gist revision SHA, compares against the package's stored `gistRevision`, and either reports "already up to date" or shows a confirmation dialog → on accept, re-fetch, run `migrateModel`, overwrite the local package, and update `gistRevision` to the new SHA. Add an **Unlink** button that clears `gistId` **and** `gistRevision` and restores full editability, also with a confirmation prompt.

## Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Gist Import Tab & Data Model | `backlog` |
| Phase 2 — Read-Only Mode & Lock Indicator | `backlog` |
| Phase 3 — Sync & Unlink Actions | `backlog` |

## Cross-plan dependencies

- **`data-fixer`** — Phase 1 of this plan consumes `migrateModel` (from `src/js/utils/dataFixer.ts`) on the Gist fetch path, and Phase 3 consumes it again on the Sync re-fetch path. `data-fixer` Phase 1 must land before this plan's Phase 1 starts. The SHA-based Sync design is specifically what lets us avoid content-diff comparisons, which would false-positive every time a `data-fixer` migration ships.
