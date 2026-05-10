# Phase 1 — Autocomplete keyboard-behavior audit

## Goal

Verify and pin down — with tests — the Enter / Tab / Backspace / Escape behavior of every Autocomplete-driven control reachable in the popup, so that:
1. The user-described flow (Enter selects in dropdown, Tab moves to next field, Enter commits free-solo chips) is *asserted* rather than implicitly relying on MUI defaults.
2. Any gap found between expected and actual behavior is either fixed minimally or recorded in `findings.md` for a later phase.

This phase is foundation for Phases 2-4 — it doesn't add features; it locks current behavior so the next phases can't silently break it.

## Acceptance Criteria

- A short inventory table inside `findings.md` lists every Autocomplete-style input reachable from the popup, with its expected Enter / Tab / Backspace behavior.
- Jest tests assert the key keyboard behaviors for each of the four control types: `MuiTags` (preset picker), `FreeSoloTags`, the key Autocomplete in `SearchParams` (suggestions mode), and the value Autocomplete in `SearchParams` (suggestions mode, non-delimited). Tests pass with `yarn test`.
- Any behavior that *does not* match the user's stated intent is captured in `findings.md` with file:line and a one-sentence proposed fix — to be acted on later in this phase or deferred.
- `yarn build` succeeds (no type errors introduced).

## Atomic Tasks

### 1. Inventory & expected-behavior table
- **Modify:** `/Users/kobiz/my_projects/reparams/.plan/keyboard-flow-improvements/findings.md`
- Add a section "## Autocomplete inventory (popup-reachable)" with a table:
  | Component | File:line | `multiple` | `freeSolo` | `disableCloseOnSelect` | Enter expected | Tab expected | Backspace expected |
  Fill rows for: `MuiTags` (PresetsPicker), `FreeSoloTags` (used by `ParamWithDelimiterValueInput`), key Autocomplete in `SearchParams`, value Autocomplete in `SearchParams`.

### 2. Manual run-through (dev build)
- **No file change.** Run `yarn start` in a separate terminal, load the unpacked extension, open the popup.
- Walk through the user's flow with keyboard only: focus on preset picker → type → Enter to select → Tab into params → type key, Tab, type value, Tab, etc.
- Note any deviation from the table (e.g. Tab loses typed text, Enter triggers form submit, Escape unexpectedly closes dropdown).
- Append findings (good or bad) to `findings.md` under "## Manual run-through results".

### 3. Add Jest test file for keyboard behavior
- **Create:** `/Users/kobiz/my_projects/reparams/tests/components/keyboardFlow.test.tsx`
- Use `@jest-environment jsdom` and `@testing-library/react` (existing convention — see `tests/components/SearchParams.test.tsx:1-7`).
- Add four describe blocks, one per control type. Use `userEvent.keyboard('{Enter}')` / `userEvent.tab()` from `@testing-library/user-event` if available; otherwise fall back to `fireEvent.keyDown(el, { key: 'Enter' })`. Verify which testing-library version is installed by checking `package.json` first, and only import what's available.

### 4. Test — `MuiTags` (PresetsPicker) Enter selects highlighted suggestion
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<Tags>` from `src/js/components/common/MuiTags.tsx` with two suggestions and no selection. Open the dropdown (`mouseDown` on the input or simulate ArrowDown). Press Enter. Assert `onAdd` was called with the first suggestion.
- Also assert that after Enter, the input keeps focus (because `disableCloseOnSelect` is set).

### 5. Test — `MuiTags` Backspace removes last selected chip
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<Tags>` with two pre-selected chips and an empty input. Press Backspace on the input. Assert `onDelete` is called with the last chip.

### 6. Test — `FreeSoloTags` Enter commits typed value as new chip
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<FreeSoloTags>` with `values=[]`, `options=['alpha', 'beta']`. Type "gamma" into the input, press Enter. Assert `onChange` called with `['gamma']`.
- Edge case: type a value that exists in `options` and hit Enter on the highlighted suggestion. Assert `onChange` called with that suggestion (not the typed text plus extras).

### 7. Test — `SearchParams` key Autocomplete Enter on highlighted suggestion commits
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<SearchParams>` with `entries=[['', '']]` and `suggestions={ keys: ['foo', 'bar'], valuesByKey: {} }`. Focus the key combobox, type 'fo', press ArrowDown to highlight 'foo', press Enter. Assert `setEntries` called with `[['foo', '']]`.

### 8. Test — `SearchParams` key Autocomplete Tab does not lose typed text
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<SearchParams>` with `entries=[['', '']]` and `suggestions={ keys: ['foo'], valuesByKey: {} }`. Focus the key combobox, type 'newkey' (not in options), press Tab. Assert the latest `setEntries` call carries `[['newkey', '']]` (because `onInputChange` runs on every keystroke). Confirms the user's claim that Tab is a safe move-to-next.

### 9. Test — `SearchParams` value Autocomplete Enter on highlighted suggestion commits
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- Render `<SearchParams>` with `entries=[['lang', '']]` and `suggestions={ keys: ['lang'], valuesByKey: { lang: ['en', 'fr'] } }` and `paramsWithDelimiter={}`. Focus the value combobox, ArrowDown to highlight 'en', Enter. Assert `setEntries` called with `[['lang', 'en']]`.

### 10. Triage discovered gaps
- **Modify:** `findings.md` — for any gap surfaced in tasks 2-9 (test fails, behavior surprises, MUI quirks):
  - If the fix is a one-line explicit handler that locks down behavior without changing UX → apply it now (e.g. add an explicit `onKeyDown` that calls `event.preventDefault()` only when needed). Affected files would be among `MuiTags.tsx`, `FreeSoloTags.tsx`, `SearchParams.tsx`.
  - If the fix is bigger or adds visible behavior → leave the test in a `test.skip` with a comment, log it in `findings.md`, and defer to a later phase. Do NOT silently broaden scope here.

### 11. Verify
- Run `yarn test` — all tests green (existing + new).
- Run `yarn build` — no type errors.
- Append a one-line verification note to `findings.md` summarizing pass/fail and any deferred gaps.

## Verification

```bash
# All tests including new keyboard flow tests
yarn test

# Production build (catches type/import regressions)
yarn build

# Optional: focused test run while iterating
yarn test tests/components/keyboardFlow.test.tsx
```

## Notes for execute step

- Do NOT modify `src/js/components/popup/Popup.tsx` or `UrlEditor.tsx` here — those are scope for Phase 3.
- Do NOT add any new keyboard shortcut, only assert what already exists.
- If `@testing-library/user-event` is not installed, use `fireEvent` consistently — adding a new dep belongs in a separate task.
- Per project convention (CLAUDE.md / memory): no `git commit` and no `git push` without an explicit user ask.
