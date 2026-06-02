# Synchronization Engine (Offline-First)

This project implements a robust, offline-first synchronization engine using **Dexie (IndexedDB)** for local storage and a **Fastify/Prisma** backend. It ensures data consistency across devices while allowing the app to function fully without an internet connection.

## Architecture Overview

The sync process follows a **Push-then-Pull** strategy with **Incremental Sync** and **Soft Deletes**.

### 1. Local State Management
Every synchronized table (`sections`, `students`, `exams`, `scanResults`) includes three metadata fields:
- `updatedAt`: Unix timestamp of the last local or remote modification.
- `isSynced`: Boolean flag. `false` indicates local changes that haven't reached the server.
- `isDeleted`: Boolean flag for soft deletes. Records are never immediately removed locally; they are marked for deletion to sync the state to the server.

**Automated Tracking**: Dexie hooks in `src/services/db.ts` automatically intercept `creating` and `updating` operations to set `updatedAt` and reset `isSynced: false`.

### 2. Synchronization Phases

#### Phase 1: Push (Local → Server)
1. Collect all records where `isSynced == false`.
2. Group them into a `SyncBatch` (Sections, Students, Exams, ScanResults).
3. Send to `POST /api/sync`.
4. On success (200 OK), mark these records as `isSynced: true` locally.

#### Phase 2: Pull (Server → Local)
1. Retrieve `lastSyncTimestamp` from LocalStorage.
2. Request updates from `GET /api/sync?since={timestamp}`.
3. Merge incoming records into the local database.

#### Phase 3: Merge & Conflict Resolution
We use a **"Server Wins"** strategy with a protection layer for unsynced local changes:
- If a server record arrives and the local version is already synced (`isSynced: true`), the local record is overwritten.
- If the local record has unsynced changes (`isSynced: false`), the local version is **preserved** to avoid overwriting user work that hasn't reached the server yet.

## Usage

### SyncProvider & useSync Hook
The `SyncProvider` (in `src/contexts/SyncContext.tsx`) manages the sync lifecycle.

```tsx
import { useSync } from './contexts/SyncContext';

const MyComponent = () => {
  const { status, triggerSync, lastSyncTimestamp, error } = useSync();

  return (
    <div>
      <p>Status: {status}</p> {/* idle | syncing | error | offline */}
      <button onClick={triggerSync} disabled={status === 'syncing'}>
        Sync Now
      </button>
      {status === 'error' && <p className="text-red-500">{error}</p>}
    </div>
  );
};
```

### Automatic Syncing
The engine automatically triggers a sync:
1. **On Login**: When the Firebase Auth state changes to a logged-in user.
2. **Periodic**: Every 5 minutes while the app is active and online.
3. **Recovery**: When the browser detects the network has come back online.

## Technical Details

- **Transport**: Axios with Firebase Auth Bearer Tokens.
- **IDs**: All records use client-generated **UUIDs** to prevent primary key collisions during sync.
- **Database**: Dexie.js with versioned schemas.

## API Requirements
The backend must expose:
- `POST /api/sync`: Accepts `SyncBatch` and performs upserts (or soft-deletes if `isDeleted: true`).
- `GET /api/sync?since={timestamp}`: Returns records updated or deleted since that timestamp, plus the current `serverTimestamp`.
