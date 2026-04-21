# Findings — data-fixer

_Scratchpad for errors, surprises, and learnings during implementation._

## Phase 1

- **Only 2 call sites read localStorage for `reparamsAppData`, not 3.** The plan predicted "popup viewer, options editor, content script" but `src/js/components/content/index.ts` only listens for DOM-selector messages — it never touches `reparamsAppData`. So the replacement is just `UseViewerStoreContext.tsx` (popup) and `UseEditorStoreContext.tsx` (options).
- **`runFixer1` is already dead code.** `src/js/components/options/index.tsx` has `// runFixer1()` commented out (line 12). The import remains but the call never runs. Safe to port the logic into the new runner and delete the old file without any behavioral regression.
- **`EditorModel.modelVersion: string` → `number` is a type change.** Legacy fixtures that use `'1.0'` / `'1.0.0'` (tests, `dummyData.ts`, `ExportDialog.tsx`) need updating to `1` (numeric). The runner treats any legacy string value as "pre-v1" and lets fixer-1 normalize it to `1` on load, so real users' stored data self-heals; only hard-coded fixtures need touching.
