# Plan: Encode/Decode Paste Handling

## Goal
Detect and decode URL-encoded values when users paste them into popup parameter inputs, preventing double-encoding bugs. Ensure all encode/decode scenarios are covered by tests.

## Background
Currently, the extension relies entirely on `URLSearchParams` / `URL` APIs for encoding/decoding. When a URL is loaded from a tab, `searchParams.entries()` returns decoded values automatically. However, if a user copies a raw encoded string (e.g. `John%20Doe`) from the browser address bar and pastes it into a value field, it is stored as a literal string and then re-encoded to `John%2520Doe` on apply — a silent double-encoding bug.

## Scope

**In Scope**
- Detect URL-encoded content on paste in parameter value and key inputs (`SearchParams.tsx`)
- Decode pasted content via `decodeURIComponent` before storing in state
- Apply the same decode-on-paste logic to the zoom dialog for long values
- Apply to `ParamWithDelimiterValueInput.tsx` (multi-value params)
- Add a shared `decodeIfEncoded(value: string): string` utility in `src/js/utils/`
- Tests: decode utility unit tests, searchParamsUtils tests with encoded values, integration-level paste tests

**Out of Scope**
- Encoding values when typing (only paste events are handled)
- Encoding indicator / user-facing warning UI
- Options page / editor inputs (only popup)
- Handling double-encoded values (`%2520`) beyond one `decodeURIComponent` pass

## Phases

- [x] **Phase 1 — Decode-on-paste utility & input wiring** *(Must Have)*
  - Create `src/js/utils/encodingUtils.ts` with `decodeIfEncoded(value: string): string`
  - Wire `onPaste` handlers in `SearchParams.tsx` (key + value fields) and the zoom dialog
  - Wire `onPaste` in `ParamWithDelimiterValueInput.tsx`
  - Manually verify: paste `John%20Doe` → shows `John Doe`; paste `hello` → shows `hello`

- [x] **Phase 2 — Comprehensive encode/decode tests** *(Must Have, depends on Phase 1)*
  - Unit tests for `decodeIfEncoded` (plain, encoded, partially encoded, already decoded, special chars, double-encoded)
  - Tests in `searchParamsUtils.test.ts` covering encoded keys/values in merge/update/remove operations
  - Paste simulation tests for the input components (if testing framework supports it)

## Progress
| Phase | Status |
|-------|--------|
| Phase 1 — Decode-on-paste utility & input wiring | `done` |
| Phase 2 — Comprehensive encode/decode tests | `done` |

---

## Phase 1 — Implementation Guide

### Acceptance Criteria
- Pasting `John%20Doe` into a key or value TextField displays `John Doe` immediately.
- Pasting `hello` (plain string) into any input remains `hello` (no change).
- Adding a chip with encoded text (e.g. `tag%3Done`) in a delimiter-param zoom dialog stores it as `tag=one`.

### Atomic Tasks

**Task 1 — Create `src/js/utils/encodingUtils.ts`**
- Create: `src/js/utils/encodingUtils.ts`
- Export one function:
  ```ts
  export function decodeIfEncoded(value: string): string {
    try {
      const decoded = decodeURIComponent(value)
      return decoded !== value ? decoded : value
    } catch {
      return value // malformed percent sequence — leave as-is
    }
  }
  ```

**Task 2 — Wire `onPaste` on key TextField in `SearchParams.tsx`**
- Modify: `src/js/components/common/SearchParams.tsx`
- Import `decodeIfEncoded` from `../../utils/encodingUtils`
- On the key TextField (line 105–113), add `inputProps` with an `onPaste` handler:
  ```tsx
  inputProps={{
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      updateCurrentEntryKey(decodeIfEncoded(e.clipboardData.getData('text')))
    }
  }}
  ```

**Task 3 — Wire `onPaste` on value TextField in `SearchParams.tsx`**
- Modify: `src/js/components/common/SearchParams.tsx`
- On the value TextField (line 114–136), add `onPaste` inside the existing `InputProps` spread. The value TextField conditionally sets `InputProps` for the zoom icon — add `onPaste` to both branches (delimiter and non-delimiter) by hoisting a shared `inputProps`:
  ```tsx
  inputProps={{
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      updateCurrentEntryValue(decodeIfEncoded(e.clipboardData.getData('text')))
    }
  }}
  ```
  Note: `inputProps` (lowercase, inner input element props) vs `InputProps` (MUI wrapper) are separate — both can coexist.

**Task 4 — Decode chip values in `ParamWithDelimiterValueInput.tsx`**
- Modify: `src/js/components/common/ParamWithDelimiterValueInput.tsx`
- Import `decodeIfEncoded` from `../../utils/encodingUtils`
- Update `onChangeHandler` to decode each value:
  ```ts
  const onChangeHandler = (newValues: Array<string>) => {
    onChange(newValues.map(v => decodeIfEncoded(v.trim())).join(delimiter))
  }
  ```

**Task 5 — Build verification**
- Run: `yarn build:dev` — must compile with zero TypeScript errors.

### Verification
```bash
yarn build:dev
```
Zero errors expected. Manual smoke test: load extension in Chrome, open popup on any URL with params, paste `test%20value` into a value field → should show `test value`.

---

## Phase 2 — Implementation Guide

### Acceptance Criteria
- `tests/encodingUtils.test.ts` covers all decode scenarios: plain, encoded, partial, special chars, double-encoded, malformed, empty.
- `tests/searchParamsUtils.test.ts` has cases that document encoded strings are treated as opaque (the utils contract).
- `tests/components/SearchParams.test.tsx` verifies that paste events on key/value fields decode encoded content before updating state.

### Atomic Tasks

**Task 1 — Add SCSS mock to jest config**
- Modify: `jest.config.js` — add `moduleNameMapper` entry to handle `.scss` imports in jest (required for component tests):
  ```js
  moduleNameMapper: {
    '\\.(scss|css)$': '<rootDir>/tests/__mocks__/styleMock.js',
  }
  ```
- Create: `tests/__mocks__/styleMock.js` — single line: `module.exports = {}`

**Task 2 — Create `tests/encodingUtils.test.ts`**
- Create: `tests/encodingUtils.test.ts`
- Test cases to cover:
  - Plain string → unchanged (`'hello'` → `'hello'`)
  - Space-encoded → decoded (`'John%20Doe'` → `'John Doe'`)
  - Multiple encoded chars (`'hello%20world%21'` → `'hello world!'`)
  - `=` encoded (`'key%3Dvalue'` → `'key=value'`)
  - `&` encoded (`'a%26b'` → `'a&b'`)
  - `+` encoded (`'foo%2Bbar'` → `'foo+bar'`)
  - `/` encoded (`'path%2Fto'` → `'path/to'`)
  - Double-encoded → one decode pass only (`'John%2520Doe'` → `'John%20Doe'`, not `'John Doe'`)
  - Malformed percent sequence → unchanged, no throw (`'bad%ZZcode'` → `'bad%ZZcode'`)
  - Empty string → empty string (`''` → `''`)

**Task 3 — Add encoded-value cases to `tests/searchParamsUtils.test.ts`**
- Modify: `tests/searchParamsUtils.test.ts`
- Add a `describe('encoded string handling')` block that documents the contract: these utils receive pre-decoded strings from the UI layer, so encoded strings are treated as opaque literals:
  - `updateEntryValue` with `'John%20Doe'` stores it as-is (no auto-decode at utils layer)
  - `updateEntryKey` with `'key%3Done'` stores it as-is
  - `mergeEntries` with an encoded value treats the whole string as the value

**Task 4 — Create `tests/components/SearchParams.test.tsx`**
- Create: `tests/components/SearchParams.test.tsx`
- Uses `@jest-environment jsdom` directive at top of file
- Uses `fireEvent` from `@testing-library/react` — paste events are simulated by creating a native `Event` and attaching a `clipboardData` property via `Object.defineProperty`:
  ```ts
  function firePaste(element: Element, text: string) {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: jest.fn(() => text) },
    })
    fireEvent(element, event)
  }
  ```
- Test cases:
  - Paste encoded value into value field → `setEntries` called with decoded value
  - Paste encoded value into key field → `setEntries` called with decoded key
  - Paste plain string into value field → `setEntries` called with same plain string
  - Paste malformed percent into value field → `setEntries` called with original string unchanged

**Task 5 — Run all tests**
- Run: `yarn test` — all tests must pass with zero failures.

### Verification
```bash
yarn test
```
All test suites pass. No TypeScript compile errors in test files.
