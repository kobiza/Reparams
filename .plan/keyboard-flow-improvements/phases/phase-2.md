# Phase 2 — Per-row ergonomics

## Goal

Two deliverables for keyboard-only param editing:

1. **Cmd/Ctrl+Backspace inside a row deletes that row** and moves focus sensibly: to the next row's key field, or to the previous row's key field if it was the last row, or to the Add-Param button if no rows remain.
2. **Mouse-click delete also moves focus** the same way (currently clicking the X just removes the row; focus is left on whatever DOM artifact survives — usually nothing useful).

The original phase note worried about the delete IconButton being "hover-only". Inspection of `SearchParams.scss:1-18` shows it is **always rendered** (no opacity / `:hover` tricks). Visibility is therefore not a gap; we'll only confirm the IconButton's focus ring is visible and skip CSS work otherwise.

## Acceptance Criteria

- Pressing Cmd (macOS) or Ctrl (Windows/Linux) + Backspace while focused inside a row's key input or value input removes that row.
- After any row deletion (keyboard or mouse), focus lands deterministically on the next row's key input, or on the previous row's key input if the deleted row was last, or on the "Add param" button if the list is now empty.
- Plain Backspace inside text continues to behave as ordinary text-edit (and inside chip-mode FreeSoloTags continues to remove the last chip when input is empty — Phase 1 lockdown still passes).
- New tests cover all four scenarios; `yarn test` and `yarn build` pass.

## Atomic Tasks

### 1. Confirm delete-button visual focus ring (no code unless gap)
- **Read:** `src/js/components/common/SearchParams.tsx:183-186` — the IconButton uses MUI's default focus styling. MUI's default `:focus-visible` outlines IconButton with a subtle ring.
- If, during the Phase 2 manual run-through (Task 9), the focus ring is absent or invisible against the popup background, add a minimal `sx` override (`'&:focus-visible': { outline: 'auto', outlineOffset: 2 }`). Otherwise, no change.
- Append a one-line verdict to `findings.md` under "## Phase 2 — Focus-ring check".

### 2. Add focus-management refs to `SearchParams`
- **Modify:** `src/js/components/common/SearchParams.tsx:24-40`
- Add two new refs alongside the existing `shouldFocusNewParam` and `itemsRef`:
  - `const indexToFocusAfterDelete = useRef<number | null>(null)` — index in the *new* (post-deletion) entries array that should receive focus.
  - `const addParamButtonRef = useRef<HTMLButtonElement | null>(null)` — assigned via `ref` on the existing "Add param" `<Button>` at line 201.
- Add a `useEffect` that runs when `entries.length` changes: if `indexToFocusAfterDelete.current !== null`, focus `itemsRef.current[indexToFocusAfterDelete.current]` (if in range) else `addParamButtonRef.current`, then reset the ref to `null`.
- Reuse the existing `prevEntriesLength` check pattern (line 32-40) so this only fires on a real deletion, not on every render.

### 3. Wire `removeSearchParam` to choose the next focus target
- **Modify:** `src/js/components/common/SearchParams.tsx:55-59`
- Before calling `setEntries(removeItem(entries, index))`, set `indexToFocusAfterDelete.current` based on:
  - If `index < entries.length - 1` (not the last row): target = `index` (the row that shifts up into this slot).
  - Else if `entries.length > 1` (was the last but not the only): target = `index - 1`.
  - Else (was the only row): target = `null` → effect falls back to `addParamButtonRef`.
- No external API change; both keyboard and mouse paths flow through the same `removeSearchParam` function.

### 4. Add row-level Cmd/Ctrl+Backspace handler
- **Modify:** `src/js/components/common/SearchParams.tsx:179-188` (the `<li className="query-param-input">` element)
- Define inside the `.map` callback:
  ```tsx
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
          e.preventDefault()
          e.stopPropagation()
          removeSearchParam()
      }
  }
  ```
- Attach: `<li className="query-param-input" key={index} onKeyDown={handleRowKeyDown}>`.
- Bubble-phase is fine here: MUI Autocomplete does not specifically handle `Cmd+Backspace`, and `preventDefault()` cancels the browser-default "clear text to line start" before it commits.

### 5. Wire `addParamButtonRef` on the Add-Param button
- **Modify:** `src/js/components/common/SearchParams.tsx:201`
- Change `<Button …>Add param</Button>` to also accept `ref={addParamButtonRef}`. (MUI `<Button>` forwards refs.)

### 6. Test — Cmd+Backspace on key input deletes the row
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- New describe block `'SearchParams row deletion ergonomics'`. Render with `entries=[['k1','v1'],['k2','v2']]` (no suggestions for simplicity, plain TextFields). Focus the first row's key input. Fire `keyDown` with `key: 'Backspace', metaKey: true`. Assert `setEntries` called with `[['k2','v2']]`.

### 7. Test — Cmd+Backspace on value input deletes the row
- **Modify:** same file
- Same setup; focus second row's value input; fire Cmd+Backspace; assert `setEntries` called with `[['k1','v1']]`.
- Also test `ctrlKey: true` (Windows/Linux) for at least one of the two cases.

### 8. Test — plain Backspace in text does NOT delete the row
- **Modify:** same file
- Render with `entries=[['key','val']]`. Focus the key input, fire `keyDown` `key: 'Backspace'` (no meta/ctrl). Assert `setEntries` is **not** called with a removal — i.e. either not called at all in this synthetic event flow, or called only with text edits, never with `[]`.

### 9. Test — clicking delete button moves focus to next row's key
- **Modify:** same file
- Render with two rows. Click the first row's delete IconButton (`screen.getAllByLabelText('delete')[0]`). After re-render, assert `document.activeElement` is the (now first) row's key input.
- Note: this test uses `setEntries` as a real state holder via a small wrapper component (because focus management depends on the post-deletion render). Use a tiny `function Harness()` that holds `entries` in `useState` and passes it down. This pattern is light enough to inline; no shared helpers needed.

### 10. Test — deleting last remaining row focuses the Add-Param button
- **Modify:** same file
- `Harness` with `entries=[['k1','v1']]`. Click delete. Assert `document.activeElement` is the "Add param" button (`screen.getByRole('button', { name: 'Add param' })`).

### 11. Run verification
- `yarn test` (full suite — Phase 1 lockdown must still pass).
- `yarn build` (production).
- Append a one-line verification note to `findings.md` under "## Phase 2 — Verification".

## Verification

```bash
yarn test
yarn build
# focused iteration
yarn test tests/components/keyboardFlow.test.tsx
```

## Notes for execute step

- Do NOT touch `MuiTags.tsx`, `FreeSoloTags.tsx`, `useCommandShortcuts.tsx`, or any popup-shell file. Phase 2 lives entirely in `SearchParams.tsx` plus the test file.
- `Cmd+Backspace` overrides macOS's native "clear field to line start" inside the row inputs. Document this as a known tradeoff in `findings.md`. If feedback later prefers a different binding (e.g. `Cmd+Shift+Backspace`), it's a one-line change.
- Per project convention: no `git commit` / `git push` without an explicit user ask.
