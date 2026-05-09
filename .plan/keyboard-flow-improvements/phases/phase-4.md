# Phase 4 — Subtle keyboard hints

## Goal

Surface the existing keyboard shortcuts as tooltip hints on the two buttons that own them, so a keyboard-curious user discovers them by hovering or tabbing:

- **Apply FAB** → tooltip lists both `⌘↵ / Ctrl+Enter` (apply in current tab) and `⌘⇧↵ / Ctrl+Shift+Enter` (apply in new tab).
- **Delete-row IconButton** → tooltip lists `⌘⌫ / Ctrl+Backspace` (remove param).

Phase 3 was skipped, so there are no new global shortcuts to surface — only the two above. Quick Actions are not rendered, so no digit-key hints either. The phase stays small and decorative; no behavioral changes.

## Acceptance Criteria

- Hovering or keyboard-focusing the Apply FAB shows an MUI Tooltip with platform-correct symbols (Mac: `⌘↵`, `⌘⇧↵`; Windows/Linux: `Ctrl+Enter`, `Ctrl+Shift+Enter`).
- Hovering or keyboard-focusing the delete-row IconButton shows an MUI Tooltip with `⌘⌫` (Mac) or `Ctrl+Backspace` (Windows/Linux) and a short label like "Remove param".
- No layout shift, no new visible chrome — only `<Tooltip>` wrappers.
- A small unit test pins the platform formatter; integration tests assert the tooltip props (title content) on both buttons.
- `yarn test` + `yarn build` pass.

## Atomic Tasks

### 1. Create the platform-aware shortcut formatter
- **Create:** `src/js/utils/keyboardShortcutFormat.ts`
- Export:
  - `isMac: boolean` — derived from `navigator.platform`/`navigator.userAgent` with a safe fallback when `navigator` is undefined (treat as non-Mac).
  - `formatShortcut(keys: string[]): string` — accepts canonical tokens (`'Mod'`, `'Shift'`, `'Enter'`, `'Backspace'`, plus letters/digits passed through). On Mac returns concatenated unicode (`⌘`, `⇧`, `↵`, `⌫`). On non-Mac returns `+`-separated text (`Ctrl`, `Shift`, `Enter`, `Backspace`).
  - Pure module — no side effects beyond reading `navigator` once.

### 2. Unit-test the formatter for both platforms
- **Create:** `tests/keyboardShortcutFormat.test.ts`
- Two describe blocks. Use `jest.isolateModules(() => …)` + `Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })` (and `'Win32'`) to re-import the module under each platform.
- Assert: `formatShortcut(['Mod', 'Enter'])` → `'⌘↵'` on Mac, `'Ctrl+Enter'` on Windows; `formatShortcut(['Mod', 'Shift', 'Enter'])` → `'⌘⇧↵'` / `'Ctrl+Shift+Enter'`; `formatShortcut(['Mod', 'Backspace'])` → `'⌘⌫'` / `'Ctrl+Backspace'`.

### 3. Add the Apply-FAB tooltip
- **Modify:** `src/js/components/popup/UrlEditor.tsx:6-7, 210-216`
- Add `import Tooltip from '@mui/material/Tooltip'` and `import { formatShortcut } from '../../utils/keyboardShortcutFormat'` near the existing imports.
- Wrap the existing `<Fab …>` with `<Tooltip>`:
  ```tsx
  <Tooltip
      title={
          <>
              Apply &nbsp; <kbd>{formatShortcut(['Mod', 'Enter'])}</kbd>
              <br />
              New tab &nbsp; <kbd>{formatShortcut(['Mod', 'Shift', 'Enter'])}</kbd>
          </>
      }
      placement="left"
  >
      <Fab ref={fabRef} color="primary" onClick={applyUrl} sx={{ … }}>
          <RocketLaunchIcon />
      </Fab>
  </Tooltip>
  ```
- Note: keep the existing `fabRef` from any prior phase. If `fabRef` was never added (Phase 3 skipped), no ref is needed here — drop it from the example. Phase 3 was skipped, so no fabRef. Render the Fab without a ref.

### 4. Add the delete-IconButton tooltip
- **Modify:** `src/js/components/common/SearchParams.tsx:6-9, 183-186`
- Add `import Tooltip from '@mui/material/Tooltip'` and `import { formatShortcut } from '../../utils/keyboardShortcutFormat'`.
- Wrap the existing `<IconButton aria-label="delete" …>` with `<Tooltip title={…}>`:
  ```tsx
  <Tooltip
      title={<>Remove param &nbsp; <kbd>{formatShortcut(['Mod', 'Backspace'])}</kbd></>}
      placement="top"
  >
      <IconButton aria-label="delete" color="primary" size="small"
          sx={{ padding: '0', marginLeft: '10px' }} onClick={removeSearchParam}>
          <ClearIcon fontSize="inherit" />
      </IconButton>
  </Tooltip>
  ```

### 5. Integration test — Apply FAB tooltip exists with platform-correct text
- **Modify:** `tests/components/keyboardFlow.test.tsx`
- New describe `'Tooltips for keyboard shortcuts'`. Render `<UrlEditor>` with the same minimal-props pattern from Phase 3 plan task 9 (mock presets / suggestions / etc.).
- Don't try to make the Tooltip render its content via hover (jsdom is unreliable). Instead, assert the trigger element's `aria-label` includes the apply shortcut OR the rendered `<kbd>` content via `userEvent.hover` + `findByRole('tooltip')`.
- Simplest reliable assertion: query the FAB by its rocket icon (`getByTestId` or by the SVG class) and check that its parent or an `aria-describedby`-referenced node carries the tooltip-id. If too brittle, fall back to: assert the JSX includes the `Tooltip` component by spying on rendered DOM for `[role="tooltip"]` after hover. If neither works in jsdom, document the limitation and move the assertion to a snapshot of the title prop.

### 6. Integration test — Delete IconButton tooltip exists
- **Modify:** same file
- Render `<SearchParams>` with one row. Hover the delete button (`screen.getAllByLabelText('delete')[0]`) via `await userEvent.hover(...)` and `await screen.findByRole('tooltip')`. Assert the tooltip text includes "Remove param" (the platform-specific symbol presence is already covered by Task 2's unit test).

### 7. Verification
- `yarn test` — full suite must stay green.
- `yarn build` — production passes.
- Append a one-line verification note to `findings.md` under "## Phase 4 — Verification".

## Verification

```bash
yarn test
yarn build
yarn test tests/keyboardShortcutFormat.test.ts
```

## Notes for execute step

- `<kbd>` is a built-in HTML element. No special styling is required for the "subtle" decision the user picked; the browser's default monospace styling already works inside MUI tooltips.
- If MUI Tooltip's default styling makes the `<kbd>` look poor against the dark popup background, an `componentsProps={{ tooltip: { sx: { …} } }}` tweak is fine — keep it minimal.
- `userEvent.hover` requires `userEvent.setup()` from v14. Tests already import `@testing-library/user-event` patterns elsewhere — reuse the convention.
- Per project convention: no `git commit` / `git push` without an explicit user ask.
