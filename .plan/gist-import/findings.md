# Gist Import — Findings & Learnings

_Scratchpad for errors, discoveries, and decisions made during implementation._

## Phase 1 — known limitations

- **Public Gists only.** `fetchGist` doesn't send an `Authorization` header. Private Gists return 404 anonymously and surface as `fetch-failed`. Auth is explicitly out of scope.
- **Truncated files are surfaced as `fetch-failed`.** The Gist API returns `truncated: true` (and a partial `content`) for files over ~1 MB. Auto-following `raw_url` would require an extra request and content-type negotiation — deferred. If users hit this in practice, revisit by following `raw_url` when `truncated: true`.
- **First-`.json`-file selection is insertion-order.** If a Gist contains multiple `.json` files, only the first one (by `Object.entries` order) is read. Multi-JSON Gists aren't a documented use case yet — flag if users report missing packages.
- **Anonymous GitHub rate limit is 60/hr/IP.** Per-package Sync in Phase 3 may hit this for users with many linked packages from different Gists; bulk Sync's API-call dedupe by `gistId` is partly designed to keep us under the cap.
