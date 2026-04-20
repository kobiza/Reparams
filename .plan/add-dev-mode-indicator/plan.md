# Add Dev Mode Indicator

## Goal
Show a small, unobtrusive indicator in the bottom-left corner of the popup and options page when the extension is running as an unpacked (development) build, so it's immediately obvious whether you're interacting with the local build folder vs. the Chrome Web Store version.

## Acceptance Criteria
- When loaded via "Load unpacked", a small chip labeled `DEV` (or similar) is pinned to the bottom-left corner of both the popup UI and the options page.
- When loaded from the Chrome Web Store (normal install), the indicator does **not** appear.
- The indicator is visually small, low-contrast enough not to distract, and fixed-positioned so it stays anchored to the bottom-left regardless of scroll.

## Approach Notes
- Detection uses `chrome.management.getSelf()` — when `installType === 'development'` the extension was loaded unpacked. This API does **not** require the `management` permission when called on self (it's the one exception), so no manifest changes are needed.
- Detection is wrapped defensively: if `chrome?.management` is unavailable (e.g., webpack dev server standalone via `yarn start`), the component simply renders nothing rather than throwing.
- A single reusable component (`DevModeIndicator`) is mounted by both the popup and the options page.

## Atomic Tasks

### 1. Create the `DevModeIndicator` component
- **File to create:** `src/js/components/shared/DevModeIndicator.tsx`
- Render a fixed-position MUI `Chip` (or small `Box`) at `bottom: 4px; left: 4px; z-index: high`.
- On mount, call `chrome?.management?.getSelf(...)` and store a `isUnpacked` boolean in state; render `null` until the check resolves and only render the chip when `isUnpacked === true`.
- Use MUI's `sx` styling with low opacity (e.g. `0.6`) and small font (`0.65rem`) so it's visible but unobtrusive. Use a warning/info color from the theme.

### 2. Mount the indicator in the popup
- **File to modify:** `src/js/components/popup/Popup.tsx`
- Import `DevModeIndicator` and render it inside the `.popup` wrapper after `<UrlEditor />` so it overlays the bottom-left of the popup.

### 3. Mount the indicator in the options page
- **File to modify:** `src/js/components/options/Settings.tsx`
- Import `DevModeIndicator` and render it inside the `.settings-pages` wrapper.

## Verification
```bash
yarn build:dev                      # must compile without TypeScript errors
yarn test                           # no regressions (no tests target this UI directly, but sanity check)
```
Manual sanity (documented, not automated): after `yarn build:dev`, load `/build` via `chrome://extensions` → "Load unpacked", open the popup and options page, confirm the indicator shows. A normal-installed copy (if available) should not show it.

## Progress
Status: `done`

**Status: Done ✓**
