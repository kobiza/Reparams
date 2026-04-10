# Findings & Learnings

## Key observations from codebase scan

- `UrlEditor.tsx` reads from `new URL(tabUrl).searchParams.entries()` — always decoded. Safe.
- `SearchParams.tsx` renders key/value TextFields. `onChange` passes raw string to state. No paste logic.
- `ParamWithDelimiterValueInput.tsx` splits on delimiter, no decode.
- Zoom dialog in `SearchParams.tsx` also uses a plain TextField.
- No existing `encodingUtils` or decode helpers anywhere.
- Tests in `tests/searchParamsUtils.test.ts` use only plain ASCII values — no encoded test cases.

## Double-encoding repro path
1. User visits `https://example.com?name=John%20Doe`
2. Copies `John%20Doe` from address bar
3. Pastes into value TextField → stored as `"John%20Doe"` (literal percent)
4. On apply: `new URLSearchParams([["name", "John%20Doe"]]).toString()` → `name=John%2520Doe`
5. Browser navigates to URL with double-encoded value — bug confirmed

## decodeIfEncoded design
```typescript
export function decodeIfEncoded(value: string): string {
  try {
    const decoded = decodeURIComponent(value)
    return decoded !== value ? decoded : value
  } catch {
    return value  // malformed percent sequence — leave as-is
  }
}
```
- If `decodeURIComponent` returns the same string → value was not encoded → no-op
- If it throws (e.g. `%ZZ`) → leave value unchanged
- Does NOT handle double-encoding (`%2520`) — one pass only, as scoped
