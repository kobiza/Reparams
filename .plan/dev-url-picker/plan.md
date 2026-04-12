# Dev URL Picker

## Goal
Give developers a way to test the popup against any URL during local development, without editing source code. A `dev.html` launcher page lets you type a URL and open the popup with it; the popup reads the URL from its own query string.

## Acceptance Criteria
- Visiting `http://localhost:9000/dev.html` shows a URL input pre-filled with a sample URL and an "Open Popup" button
- Clicking the button opens `popup.html?devUrl=<encoded-url>` with the popup rendering as if the active tab is the given URL
- The `dev.html` file is only produced in development builds (`NODE_ENV=development`); production builds are unaffected

## Atomic Tasks

1. **Read `devUrl` query param in popup bootstrap**
   - Modify: `src/js/components/popup/index.tsx`
   - In the `else` branch (no `chrome.tabs`), check `new URLSearchParams(location.search).get('devUrl')` before falling back to `playgroundUrl`
   - Example: `const devUrl = new URLSearchParams(location.search).get('devUrl')`; use `devUrl || playgroundUrl` as the URL

2. **Create `src/dev.html`**
   - Create: `src/dev.html`
   - Static HTML page with inline JS (no separate JS bundle needed)
   - Contains: a labelled `<input type="url">` pre-filled with `playgroundUrl` value, an "Open Popup" button
   - On click: `window.location.href = 'popup.html?devUrl=' + encodeURIComponent(input.value)`
   - Minimal inline styling for usability

3. **Register `dev.html` in webpack (dev-only)**
   - Modify: `webpack.config.js`
   - Add a `HtmlWebpackPlugin` instance with `template: 'src/dev.html'`, `filename: 'dev.html'`, `chunks: []`, `inject: false`
   - Wrap it in a conditional: only included when `process.env.NODE_ENV === 'development'`

## Verification
```bash
# Build in dev mode and check dev.html is produced
NODE_ENV=development yarn build:dev
ls build/dev.html

# Also confirm dev.html is NOT in a production build
yarn build
ls build/dev.html   # should fail / not exist
```

## Progress
Status: `done`

**Status: Done ✓**
