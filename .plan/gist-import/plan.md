# Gist Import

## Goal

Add a GitHub Gist import flow that fetches packages from a Gist, links each imported package to both the source Gist ID and the Gist's revision SHA at fetch time, enforces read-only editing for linked packages, and provides Sync (SHA-based change detection + re-fetch + overwrite) and Unlink (restore editability) actions. Sync exposes both a per-package action and a "check & sync all" affordance so users with many linked packages aren't forced into one click per package.

## Scope

### In Scope

- New "GitHub Gist" tab in `ImportDialog` — accepts a Gist URL/ID, fetches via the GitHub REST API (`GET /gists/{id}`), and imports selected packages.
- Two new fields on `SettingsPackage` (both `?: string`):
  - `gistId` — the source Gist's ID.
  - `gistRevision` — the SHA of the Gist *at the moment that package was pulled* (not the moment of any later sync). Captured from the API response's `history[0].version`.
- Gist fetch utility routes the fetched body through `migrateModel` from `src/js/utils/dataFixer.ts` before packages reach `addPackages`. A Gist authored at an older `modelVersion` is silently upgraded to the current shape on import.
- Lock indicator on Gist-linked packages in the options editor (icon in the `PackagePanel` header).
- **Read-only mode** for linked packages: presets, URL patterns, DOM selectors, delimiters, package label, and direct delete are all disabled. The package can still be unlinked or synced.
- **Per-package Sync action** — fetches the Gist's current revision SHA, compares against the package's stored `gistRevision`. If equal, reports "already up to date". If different, re-fetches, runs `migrateModel`, overwrites the local package data, and updates `gistRevision` to the new SHA. No content-diff confirmation — the package is read-only, so there's nothing local to lose.
- **"Check for updates" / "Sync all out-of-date"** affordance — top-level action in the options editor that loops the linked packages, fetches each Gist's current SHA (deduped per Gist), shows a summary ("3 of 5 linked packages have updates"), and offers a single bulk-sync action. Bulk sync runs the same per-package overwrite logic as the per-package action, just batched.
- **Unlink action** on linked packages — clears `gistId` **and** `gistRevision`, restores full editability. Confirmation prompt because this *is* destructive in the sense that the link is gone.

### Out of Scope

- GitHub authentication / private Gist support (public Gists only).
- Two-way sync (push local changes back to a Gist).
- Auto-sync / background polling for Gist changes.
- Export to Gist.
- **Content-level diffing between local and remote.** Sync uses SHA equality only — no three-way merge, no "here's what changed" preview. Rationale: linked packages are fully read-only (Phase 2), so local can't drift from remote. The only question is "has the remote changed since we pulled?" — a SHA comparison answers definitively, and is indifferent to schema changes shipped via `data-fixer`.
- **Handling Gists that have been deleted or had their structure change** (e.g. a package key that used to exist is no longer in the Gist). First version surfaces the raw GitHub error; graceful handling is a later pass.

### Design notes worth carrying into implementation

- **`gistRevision` is per-package, not per-Gist-link.** Gist import is partial by design — users select a subset of packages. If a user imports A/B/C from Gist-X at SHA1 and later imports D from the same Gist at SHA2, A/B/C stay stamped with SHA1 while D is stamped with SHA2. Each package's `gistRevision` reflects the Gist's state *at the moment that package was pulled*, and Sync is always a per-package comparison.
- **SHA comes from the Gist API response.** `GET /gists/{id}` returns a `history` array; the latest entry's `version` field is the revision SHA we persist.
- **Bulk sync dedupes API calls per Gist.** When N linked packages all share one `gistId`, the "check for updates" pass fetches the Gist once, then walks the linked packages locally to decide which ones need overwriting. Avoids hammering the GitHub anonymous rate limit (60/hr/IP).
- **`migrateModel` is consumed at three points:** (1) the initial Gist import in `ImportDialog`, (2) per-package Sync re-fetch, (3) bulk Sync re-fetch. All three paths treat a raw Gist blob identically to any other externally-sourced blob. `data-fixer` Phase 1 is already shipped, so the helper is available today.

## Phases

- **Phase 1 — Gist Import Tab & Data Model** *(Must Have, no remaining cross-plan deps)*
  Add `gistId?: string` and `gistRevision?: string` to `SettingsPackage`. Create a Gist fetch utility (`src/js/utils/gist.ts` or similar) that resolves a Gist URL/ID to a `{ model: EditorModel, revision: string }` via the GitHub REST API. The utility pipes the fetched JSON through `migrateModel` and captures the Gist's current revision SHA from `history[0].version`. Add a fourth "GitHub Gist" tab to `ImportDialog` that uses this utility, lets the user select a subset of packages (mirroring the existing partial-import affordance), stamps each selected package with `gistId` + `gistRevision`, and feeds them through `addPackages`. Surface fetch errors (network failure, 404, malformed JSON, future-version migration) inline in the dialog using the existing error affordance.

- **Phase 2 — Read-Only Mode & Lock Indicator** *(Must Have, depends on Phase 1)*
  In the options editor, detect when a package has a `gistId`. Show a lock icon in the `PackagePanel` header with a tooltip explaining the link. Disable all editing controls (presets, URL patterns, DOM selectors, delimiters, label, direct delete) for that package. Editing intent should be guarded at the store layer too, not just hidden in the UI, so future code paths can't accidentally mutate a linked package's body.

- **Phase 3 — Sync, Bulk Sync, and Unlink Actions** *(Must Have, depends on Phases 1 & 2)*
  Per-package: add a **Sync** button to each linked package that fetches the current Gist SHA, compares against the stored `gistRevision`, and either reports "already up to date" or re-fetches → migrates → overwrites the local package and updates `gistRevision` to the new SHA. No confirmation prompt (the package is read-only, so no local edits to lose). Bulk: add a **Check for updates** action at the editor top level that fetches each linked Gist's current SHA (deduped by `gistId`), tallies how many linked packages are out of date, and offers a single **Sync all out-of-date** action. Unlink: add an **Unlink** button on each linked package that clears `gistId` + `gistRevision` and restores full editability, with a confirmation prompt.

## Cross-plan dependencies

- **`data-fixer`** — already complete (all phases done as of 2026-05-11). This plan consumes `migrateModel` from `src/js/utils/dataFixer.ts` at three points: initial Gist import, per-package Sync, and bulk Sync. No remaining wait.
