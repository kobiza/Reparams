# Findings — Keyboard Flow Improvements

## Current state (snapshot)

- `MuiTags.tsx:80` — `autoFocus` on the preset picker; popup opens with focus already on the dropdown.
- `useCommandShortcuts.tsx:27-115` — Cmd+Enter / Cmd+Shift+Enter intercepted at document level (capture phase), so Autocomplete defaults don't swallow them.
- `SearchParams.tsx:34-40` — newly added param row auto-focuses its key field via `itemsRef`.
- `UrlEditor.tsx:210-216` — Apply action is a fixed-position FAB; reachable via Tab but visually detached.
- Quick actions (`QuickActions.tsx:25-59`) sit after the param list in tab order — keyboard users currently tab through every row to reach them.
- No popup-level Escape handler.
- Delete-row IconButton (`SearchParams.tsx:183-186`) is keyboard-reachable but may be visually hover-only depending on CSS — verify.
- Enter / Tab inside Autocompletes relies on MUI defaults; not asserted by tests.

## Open questions / things to verify in phase planning

- Does Quick Action numbering need to be visible (1-9 badges) before users will discover the shortcut?
- Is Cmd/Ctrl+. a safe jump-to-apply binding on macOS / Windows / Linux Chrome, or does it collide with browser shortcuts?
- For `Escape closes popup`: is `window.close()` from extension popup reliable, or do we need `chrome.runtime.sendMessage` / a different teardown?
- Should digit-key shortcuts only fire when focus is outside text inputs, or always (with input fields opt-out)?

## Phase 1 — Autocomplete inventory (popup-reachable)

| # | Component (usage)               | File:line                                | `multiple` | `freeSolo` | `disableCloseOnSelect` | Enter expected                                                                                  | Tab expected                                                                                                              | Backspace expected                                                                            |
|---|---------------------------------|------------------------------------------|------------|------------|------------------------|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| 1 | `MuiTags` — Preset picker       | `src/js/components/common/MuiTags.tsx:45-89` | yes        | no         | yes                    | Selects highlighted option via `onChange` → `onAdd`. Dropdown stays open (`disableCloseOnSelect`). | Moves focus to the next focusable element. Should NOT commit a typed-but-not-matching string (no `freeSolo`).             | When input is empty, removes the last selected chip via `onChange` → `onDelete`.              |
| 2 | `FreeSoloTags` — delimited values | `src/js/components/common/FreeSoloTags.tsx:24-44` | yes        | yes        | yes                    | If a suggestion is highlighted → commits that suggestion; else commits the typed text as a chip via `onChange`. | Moves focus to the next focusable element. **MUI default does NOT commit typed text on Tab** — only Enter commits. Verify. | When input is empty, removes the last chip via `onChange`.                                    |
| 3 | `SearchParams` key Autocomplete | `src/js/components/common/SearchParams.tsx:94-116` | no         | yes        | n/a (single select)    | If suggestion highlighted → `onChange` fires with that option → `setEntries` with new key. Otherwise text is already committed via `onInputChange` on each keystroke; Enter is a no-op for state. | Moves focus to the value Autocomplete. Typed text is already in state thanks to `onInputChange`, so Tab is non-destructive. | Standard text-edit backspace inside the input. No chip semantics (single-select).             |
| 4 | `SearchParams` value Autocomplete | `src/js/components/common/SearchParams.tsx:144-164` | no         | yes        | n/a (single select)    | Same as key Autocomplete: highlighted option → `onChange` → `setEntries`; otherwise no-op (already in state). | Moves focus to the row's delete button (or next row), with typed text already committed.                                  | Standard text-edit backspace inside the input.                                                |

**Notes:**
- The chip-mode value control (`ParamWithDelimiterValueInput`, used when `paramsWithDelimiter[key]` is truthy and `suggestions` is provided) renders a `FreeSoloTags`, so its keyboard behavior is row #2 above.
- Plain `TextField` paths (no `suggestions` prop) are the options-page fallback and out of scope here.
- `useCommandShortcuts` registers a capture-phase listener that swallows `Cmd+Enter` and `Cmd+Shift+Enter` before any Autocomplete sees them, so those navigations are safe regardless of MUI default.

## Phase 1 — Manual run-through (deferred to user QA)

Programmatic keyboard verification lives in `tests/components/keyboardFlow.test.tsx`. A real-browser pass through the popup is not driveable from this environment (extension popup ≠ regular page; the existing e2e fixture in `tests/e2e/fixtures/extensionFixture.ts` would let us add one, but that's outside Phase 1's scope).

Sanity checked: `yarn build:dev` compiles cleanly with the current code.

## Phase 1 — Gap triage

All 7 lockdown tests in `tests/components/keyboardFlow.test.tsx` pass on first run against the current source. No behavioral gaps were found between the user's described intent and what the MUI Autocomplete defaults deliver:

- ✅ MuiTags Enter selects the highlighted preset and calls `onAdd`.
- ✅ MuiTags Backspace on empty input removes the last selected chip and calls `onDelete`.
- ✅ FreeSoloTags Enter commits typed text as a chip; Enter on a highlighted suggestion commits that suggestion.
- ✅ SearchParams key Autocomplete Enter on highlighted suggestion commits the key.
- ✅ SearchParams key Autocomplete keystroke flow is non-destructive — `onInputChange` already syncs every keystroke to state, so Tab/click loses nothing.
- ✅ SearchParams value Autocomplete Enter on highlighted suggestion commits the value.

No source files in `src/` needed changes in Phase 1 — the audit hardens the existing behavior with tests rather than reshaping it.

**Suggested QA checklist for the user, after Phase 1 lands:**
- Open popup → focus is on the preset picker input (autoFocus wired at `MuiTags.tsx:80`).
- Type a fragment → list filters; ArrowDown highlights; Enter selects, dropdown stays open.
- Tab out of the picker → focus lands on first param's key field (or the "Add param" button if no params yet).
- In a key field with suggestions, type "fo" → ArrowDown → Enter selects the option; Tab moves to value field with the typed text already in state.
- In a delimited value (e.g. `experiments=`), type a token + Enter → token becomes a chip; Backspace on empty input removes the last chip.
- Cmd+Enter applies in current tab; Cmd+Shift+Enter opens a new tab.
- No browser-shortcut collisions observed.

## Phase 1 — Verification

- `yarn test` → 16 suites / 177 tests passing (7 new in `tests/components/keyboardFlow.test.tsx`).
- `yarn build` → production build succeeds with no type errors.
- No source files in `src/` were modified; phase landed as a pure test/documentation lockdown.

## Phase 2 — Focus-ring check

`SearchParams.scss:1-18` has no opacity / `:hover` styling on the delete IconButton — it is always rendered. MUI's default `:focus-visible` outlines the IconButton when reached via Tab, so no CSS override was needed. QA can sanity-check in a browser pass; if the ring is too subtle against the popup background, an `sx={{ '&:focus-visible': { outline: 'auto', outlineOffset: 2 } }}` is the one-line fix.

## Phase 2 — Tradeoff: Cmd+Backspace overrides macOS native shortcut

`Cmd+Backspace` inside any row's key/value input now deletes the row instead of clearing the field text to the start-of-line. This is intentional and matches the chip-removal mental model already used by `MuiTags`/`FreeSoloTags` (Backspace on empty input removes the last chip). If feedback prefers preserving the native shortcut, swapping to `Cmd+Shift+Backspace` is a one-liner in `SearchParams.tsx`'s `handleRowKeyDown`.

## Phase 3 — Skipped

User opted out of Phase 3 after we surfaced two findings during planning:

1. **`QuickActions` is not currently rendered anywhere in the popup.** Wiring digit-key shortcuts (1-9 → quick actions) would fire against an invisible UI. Deferred until QuickActions is brought back into `UrlEditor` (separate feature).
2. **`Cmd+Enter` already covers apply.** It is the cross-app standard for submit/send/apply (Slack, Gmail, GitHub, VS Code, Discord). The originally-proposed `Cmd+.` jump-to-apply binding was rejected because `Cmd+.` is the macOS *cancel/stop* idiom — semantically opposite of "apply". With the existing `Cmd+Enter` shortcut already in place, a separate "focus the FAB without pressing it" shortcut is too niche to justify.
3. **Escape-closes-popup** was deemed not important enough by the user to motivate the work in this phase.

`phases/phase-3.md` was deleted to keep the plan tree clean. The original analysis (generalize `useCommandShortcuts`, `usePopupCloseOnEscape`, `event.defaultPrevented` contract) is preserved here in case any of it is revisited.

## Phase 2 — Verification

- `yarn test` → 16 suites / 184 tests passing (7 new tests in the row-deletion ergonomics describe block of `tests/components/keyboardFlow.test.tsx`).
- `yarn build` → production build succeeds with no type errors.
- Source changes confined to `src/js/components/common/SearchParams.tsx`: added `indexToFocusAfterDelete` + `addParamButtonRef` refs, extended the post-render `useEffect` with deletion-focus handling, updated `removeSearchParam` to compute the next focus target, attached `handleRowKeyDown` to the row `<li>`, and wired `addParamButtonRef` to the Add-Param button.

## Phase 4 — Verification

- New file `src/js/utils/keyboardShortcutFormat.ts` provides `isMac` and `formatShortcut(keys)` (Mac → unicode symbols `⌘⇧↵⌫`, others → `Ctrl+...` text).
- `src/js/components/popup/UrlEditor.tsx`: Apply Fab now wrapped in `<Tooltip>` with both apply shortcuts (current tab + new tab); also given `aria-label="apply url"` so RTL queries can find it.
- `src/js/components/common/SearchParams.tsx`: delete IconButton now wrapped in `<Tooltip title="Remove param ⌘⌫">`.
- Tests: 10 new unit tests in `tests/keyboardShortcutFormat.test.ts` (Mac and Windows variants), 2 new integration tests in `tests/components/keyboardFlow.test.tsx` (Apply FAB tooltip and delete-IconButton tooltip).
- `yarn test` → 17 suites / 196 tests passing. `yarn build` → production build clean.
