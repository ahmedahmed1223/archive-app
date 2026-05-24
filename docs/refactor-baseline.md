# Refactor Baseline

## Status

The application is now treated as a fully native Vite/React codebase. The old runtime layer has been removed from the active source tree, page wrappers are not allowed, and the refactor gate must stay green before feature work starts.

Required `npm run refactor:status` values:

```json
{
  "runtimeRemoved": true,
  "runtimeLines": 0,
  "wrappedPages": 0,
  "legacyImportFiles": 0,
  "pages": {
    "wrapped": 0
  },
  "components": {
    "wrapped": 0
  }
}
```

## Stable Interfaces

These interfaces are considered stable during the next development phase:

- `mountVideoArchive(rootElement)`
- `startVideoArchive(rootId)`
- `useAppStore`
- `useAuthStore`
- `useSessionStore`
- `parseAppRoute`, `writeAppRoute`, `buildAppRoute`
- Existing JSON, Excel, and transfer package formats

`src/stores/appStore.js` is the public store aggregator. Store implementation belongs in the internal slices for archive data, settings, auth/session, data transfer, and UI state.

## Storage Baseline

IndexedDB is the current source of truth for local data. SQLite is not enabled in this version and must not be described in the UI as the active storage engine.

Future SQLite work should be planned as a separate storage-service implementation with explicit migration, verification, and rollback behavior.

## Verification Gate

Run these commands before starting or merging feature work:

```bash
npm run verify
npm run build
npm run check
npm run refactor:status
```

Additional acceptance checks:

- No imports from `src/runtime`.
- No page or component wrappers.
- `dist/index.html` remains single-file and does not reference `/assets`.
- Data portability keeps the existing JSON, Excel, and transfer shapes, including the hidden Excel payload sheet `__archive_payload`.

## Next Development Rule

New v1 features should be planned on top of this baseline. Do not mix schema changes, SQLite activation, or large UX feature work into refactor-cleanup commits.
