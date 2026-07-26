# SPEC-006 Implementation Plan

Status: Implemented; commit-scoped evidence pending
Updated: 2026-07-26

## Architecture

Upgrade the existing `zenid-local-assets` IndexedDB database in place from
version 1 to version 2. Keep the `assets` object store and add:

- `workspace` — singleton canonical project record;
- `private-data` — ZenPDF signature and initials records.

The legacy database name remains stable so existing media is upgraded rather
than copied across databases.

`browserDatabase.js` owns database opening and transaction primitives.
`workspaceStore.js` owns project hydration, legacy migration, autosave, atomic
bundle import, and atomic project/media mutations. `assetStore.js` owns media
validation and read/export helpers. `privateDataStore.js` owns ZenPDF private
image migration and persistence.

The React `WorkspaceProvider` hydrates once above the routes, holds the shared
in-memory project, serializes autosaves, and exposes explicit atomic commands
for import and media changes.

Before hydration, the provider acquires one origin-scoped exclusive Web Lock
for the complete private workspace. A second tab waits without rendering any
editable route. When the owner closes, the queued lock request is granted and
the waiting tab hydrates from IndexedDB. This keeps ownership above Resume,
Portfolio, and ZenPDF without implementing cross-tab state synchronization.

## Migration ordering

1. Open/upgrade IndexedDB without deleting existing stores.
2. Prefer a valid canonical IndexedDB workspace.
3. Otherwise parse the current project key, then the legacy résumé draft.
4. Commit the migrated or new workspace record.
5. Only after transaction completion, remove the successfully migrated legacy
   project keys.
6. Migrate ZenPDF private images independently with the same commit-then-remove
   ordering.

## Failure behavior

- An IndexedDB transaction failure leaves all stores at their pre-transaction
  state.
- A legacy cleanup failure leaves a duplicate legacy value but IndexedDB remains
  canonical; cleanup is retried later.
- Hydration failure shows an explicit local-workspace recovery state and does
  not render an editable empty project or silently claim autosave.
- Portable `.zenid` save remains the user-controlled backup boundary.
