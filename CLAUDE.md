# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Production build → /build
yarn build:dev      # Development build
yarn test           # Run all Jest tests
yarn start          # Watch mode + dev server
```

Run a single test file:
```bash
yarn test tests/searchParamsUtils.test.ts
```

## Architecture

ReParams is a Chrome Extension (Manifest V3) built with React + TypeScript + MUI. Webpack produces **4 independent bundles** — each runs in a completely separate browser context with no shared runtime state:

| Bundle | Entry | Purpose |
|--------|-------|---------|
| `popup` | `src/js/components/popup/` | UI shown when clicking the extension icon |
| `options` | `src/js/components/options/` | Full settings page |
| `content` | `src/js/components/content/index.ts` | Injected into every page; checks DOM selectors |
| `background` | `src/js/background.js` | Service worker; handles keyboard command to open popup |

### State & Persistence

There is no global state manager (no Redux/Zustand). State lives in two React context providers:

- **`UseViewerStoreContext`** (popup) — reads merged/active presets from `localStorage`
- **`UseEditorStoreContext`** (options) — full CRUD for packages, presets, and parameter rules; writes to `localStorage`

LocalStorage keys are defined in `src/js/utils/consts.ts`:
- `reparamsAppData` — packages, presets, delimiters
- `reparamsPreferences` — theme preference

### Core Data Model (`src/js/types/types.ts`)

The main hierarchy: **Package → Preset → SearchParam**. A Package can have multiple Presets; each Preset holds a list of SearchParams (key/value pairs). Packages also hold `quickActions` (shortcuts that apply a preset in one click) and `delimiters` (for params with multiple values).

### Model Evolution

The persisted model carries `modelVersion: number`. Migrations live in the fixer registry in `src/js/utils/dataFixer.ts`.

- **Breaking changes** to the persisted shape (rename, restructure, remove, re-semanticize a field) require adding a new fixer to the registry. `CURRENT_MODEL_VERSION` is **derived** from that registry — adding a fixer automatically bumps it. Never hardcode a version.
- **Additive changes** (new optional field, new top-level section, wider enum) don't touch the fixer registry. Readers must handle `undefined` gracefully.
- Every ingestion path (localStorage load, `ImportDialog`, future Gist fetch/sync) goes through `migrateModel`. No exceptions.
- Fixers must be **deterministic** — same input → same output. No `uuidv4()`, no `Date.now()` in a fixer. If a migration needs a new identifier, derive it stably.
- Fixers chain like a pipeline: a stored v1 model loaded into a v3 codebase runs `fixers[2]` then `fixers[3]` in sequence. Each fixer only knows how to go from its immediate previous version to its target.

### Cross-Context Communication

The popup sends a message to the content script to ask whether a CSS selector exists in the current page DOM. The content script responds synchronously. This is the only inter-context communication.

### URL Matching

`src/js/utils/urlMatchChecker.ts` — determines which packages/presets are applicable to the current tab URL using pattern matching.

### Parameter Merging

`src/js/utils/searchParamsUtils.ts` — core logic for merging preset parameters into a URL's existing query string. This is the most test-covered utility.
