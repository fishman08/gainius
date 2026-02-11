I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

## Observations

The codebase implements a **local-first, queue-based sync architecture** with periodic polling (5-minute intervals). Currently, there are **no real-time Supabase subscriptions** implemented - sync is entirely polling-based. The system uses a `SyncEngine` that manages a queue of pending changes, with retry logic (max 3 attempts) and last-write-wins conflict resolution based on `updated_at` timestamps. Storage is platform-specific: SQLite for mobile (file:`apps/mobile/src/storage/SqliteStorageService.ts`) and Dexie (IndexedDB) for web (file:`apps/web/src/storage/DexieStorageService.ts`).

## Approach

Create comprehensive markdown documentation in file:`docs/sync-architecture.md` covering the complete sync system. The documentation will explain the current polling-based architecture, clarify the distinction between real-time and periodic sync (noting that real-time subscriptions are not currently implemented), document the Supabase schema and RLS policies, explain multi-device scenarios with conflict resolution, include Mermaid diagrams showing data flow, and detail practical implications including battery usage, data costs, and best practices. This will serve as both technical reference and onboarding material for developers.

## Implementation Steps

### 1. Create Main Sync Architecture Documentation

Create file:`docs/sync-architecture.md` with the following sections:

**Overview Section**

- Explain the local-first, offline-capable architecture
- Describe the queue-based sync pattern with periodic polling
- Clarify that the system uses 5-minute polling intervals, NOT real-time push notifications
- Reference key files: file:`packages/shared/src/sync/syncEngine.ts`, file:`packages/shared/src/sync/SyncedStorageService.ts`

**Architecture Components Section**

- Document `SyncEngine` class responsibilities: queue management, push/pull operations, conflict handling
- Document `SyncedStorageService` wrapper pattern that intercepts storage operations
- Document `SyncQueueStorage` implementations for mobile (file:`apps/mobile/src/storage/syncQueueStorage.ts`) and web (file:`apps/web/src/storage/syncQueueStorage.ts`)
- Document platform-specific storage services: `SqliteStorageService` and `DexieStorageService`

**Sync Flow Diagram**
Create a Mermaid sequence diagram showing:

- User action → Local storage write
- Local storage → Sync queue enqueue
- Periodic timer (5 min) → SyncEngine.fullSync()
- Push phase: Queue → Supabase upsert/delete
- Pull phase: Supabase → Local storage (filtered by `updated_at`)
- Conflict resolution via timestamp comparison

**Data Flow Architecture**
Create a Mermaid flowchart showing:

- Application layer (UI components)
- SyncedStorageService (proxy layer)
- Local storage (SQLite/Dexie)
- Sync queue (pending changes)
- SyncEngine (orchestrator)
- Supabase backend (PostgreSQL + RLS)

### 2. Document Periodic vs Real-time Sync

**Current Implementation Section**

- Explain the 5-minute polling interval defined in `SYNC_INTERVAL_MS` constant
- Reference file:`apps/mobile/src/providers/SyncProvider.tsx` and file:`apps/web/src/providers/SyncProvider.tsx`
- Explain that sync runs on: app startup, periodic timer, and manual trigger via `syncNow()`
- Note that there are NO Supabase real-time subscriptions currently implemented

**Polling Strategy Section**

- Document the `fullSync()` method flow: push local changes first, then pull remote changes
- Explain incremental pull using `lastSyncAt` timestamp to fetch only changed records
- Document the entity priority ordering: users → plans/sessions/conversations → messages
- Explain why this ordering matters (foreign key dependencies)

**Real-time Sync Considerations (Future Enhancement)**

- Explain what Supabase real-time subscriptions would provide (instant updates across devices)
- Document potential implementation using `supabase.channel()` and `.on('postgres_changes')`
- Note trade-offs: battery usage, WebSocket connections, complexity vs current polling approach
- Suggest hybrid approach: real-time for active sessions, polling for background sync

### 3. Document Supabase Schema and RLS

**Database Schema Section**

- Reference the complete schema in file:`packages/shared/src/sync/schema.sql`
- Document all tables: `users`, `workout_plans`, `workout_sessions`, `conversations`, `chat_messages`
- Explain the `updated_at` trigger function that auto-updates timestamps on every modification
- Document foreign key relationships and cascade delete behavior

**Row Level Security Policies Section**

- Explain RLS is enabled on all tables for multi-tenant data isolation
- Document the `auth.uid()` function used in policies to match authenticated user
- List all policies for each table (SELECT, INSERT, UPDATE, DELETE)
- Explain the chat_messages policy that uses a subquery to verify conversation ownership
- Note security implication: users can ONLY access their own data

**Data Mappers Section**

- Document the mapper functions in file:`packages/shared/src/sync/mappers.ts`
- Explain bidirectional transformation: app types ↔ database rows
- Note the snake_case (DB) vs camelCase (app) conversion
- Document JSONB serialization for complex fields (exercises, preferences)

### 4. Document Multi-device and Offline Scenarios

**Offline-first Behavior Section**

- Explain that ALL operations work offline by default (writes go to local storage)
- Document the sync queue that accumulates changes while offline
- Explain automatic sync when connection is restored
- Note that users can view and modify data without any internet connection

**Multi-device Sync Scenarios Section**
Create a table showing common scenarios:

| Scenario         | Device A                 | Device B                       | Resolution                   |
| ---------------- | ------------------------ | ------------------------------ | ---------------------------- |
| No conflict      | Logs workout at 10:00 AM | Syncs at 10:05 AM              | B receives A's data          |
| Concurrent edits | Edits plan at 10:00 AM   | Edits same plan at 10:01 AM    | Last write wins (B's change) |
| Offline conflict | Offline, logs workout    | Online, logs different workout | Both synced, no data loss    |
| Delete conflict  | Deletes plan             | Edits same plan                | Delete wins (plan removed)   |

**Conflict Resolution Strategy Section**

- Document the last-write-wins approach based on `updated_at` timestamps
- Explain that Supabase triggers automatically set `updated_at` on every change
- Note that this is a simple strategy suitable for single-user fitness tracking
- Discuss limitations: concurrent edits to same record will lose one version
- Suggest future enhancement: operational transformation or CRDTs for true multi-device collaboration

**Sync Queue Management Section**

- Document the retry mechanism: max 3 attempts per queue item
- Explain retry counter increment in file:`apps/mobile/src/storage/syncQueueStorage.ts`
- Document queue cleanup: successful items removed, failed items (3+ retries) discarded
- Explain error handling: first error message surfaced to UI via Redux state

### 5. Document Sync Preferences and Selective Sync

**Sync Preferences Section**

- Document the `SyncPreferences` interface in file:`packages/shared/src/sync/types.ts`
- Explain the three toggles: `syncWorkouts`, `syncPlans`, `syncChats`
- Note that user profile sync is ALWAYS enabled (cannot be disabled)
- Reference `DEFAULT_SYNC_PREFERENCES` constant (all enabled by default)
- Explain how preferences are checked in `shouldSync()` method before enqueueing

**Selective Sync Benefits Section**

- Reduced data transfer for users with limited bandwidth
- Privacy control (e.g., keep chats local-only)
- Faster sync for users who only want workout data backed up

### 6. Document Practical Implications

**Battery Usage Section**

- Explain that 5-minute polling has minimal battery impact (periodic wake-up)
- Note that real-time subscriptions would maintain persistent WebSocket connection
- Suggest best practices: increase interval to 15-30 minutes for battery-sensitive users
- Document that sync only runs when app is in foreground (no background sync currently)

**Data Usage Section**

- Estimate typical sync payload sizes:
  - User profile: ~1 KB
  - Workout plan: ~5-10 KB (depends on exercise count)
  - Workout session: ~2-5 KB per session
  - Chat message: ~1-2 KB per message
- Note that incremental sync (using `lastSyncAt`) minimizes data transfer
- Explain that JSONB fields are compressed by PostgreSQL

**Conflict Scenarios and Best Practices Section**
Create a best practices list:

- **Single active device**: Use one device at a time to avoid conflicts
- **Wait for sync**: Check sync status before switching devices
- **Manual sync**: Use "Sync Now" button before critical operations
- **Offline awareness**: UI should indicate offline status and pending changes count
- **Conflict notification**: Consider showing warning when `lastSyncAt` is old (>1 hour)

**Error Handling Section**

- Document common sync errors: network timeout, authentication failure, foreign key violation
- Explain the `lastError` field in sync status (file:`packages/shared/src/sync/types.ts`)
- Suggest UI patterns: toast notifications, sync status indicator, retry button
- Document the `pendingCount` field showing queued changes

### 7. Add Troubleshooting Guide

**Common Issues Section**
Create a troubleshooting table:

| Issue                      | Cause                      | Solution                         |
| -------------------------- | -------------------------- | -------------------------------- |
| Changes not syncing        | Offline or auth expired    | Check network, re-authenticate   |
| Sync stuck with errors     | Foreign key violation      | Clear queue, re-sync from server |
| Data missing on new device | First sync not complete    | Wait for initial pull to finish  |
| Duplicate workouts         | Clock skew between devices | Ensure device time is accurate   |

**Debugging Sync Issues Section**

- Document Redux DevTools inspection of `sync` slice state
- Explain how to check sync queue contents via storage inspection
- Suggest enabling verbose logging in `SyncEngine` for development
- Document manual sync trigger via `useSync().syncNow()` hook

### 8. Add Migration and Data Export Notes

**User ID Remapping Section**

- Document the `remapLocalUser()` method in file:`packages/shared/src/sync/syncEngine.ts`
- Explain the one-time migration from `'local-user'` to authenticated user ID
- Reference the implementation in file:`apps/mobile/src/providers/SyncProvider.tsx` (lines 49-59)
- Note that this handles the transition from offline-only to cloud-synced usage

**Data Export Section**

- Reference file:`packages/shared/src/sync/dataExport.ts` for export functionality
- Note that users can export all data as JSON for backup/portability
- Explain GDPR compliance: users own their data and can delete it

### 9. Create Visual Diagrams

**Sync State Machine Diagram**
Create a Mermaid state diagram showing:

- Idle state (waiting for next sync interval)
- Syncing state (push + pull in progress)
- Error state (sync failed, will retry)
- Offline state (no network, queue accumulating)

**Component Architecture Diagram**
Create a Mermaid graph showing:

- UI Components → SyncedStorageService
- SyncedStorageService → Local Storage + SyncEngine
- SyncEngine → SyncQueueStorage
- SyncProvider → Periodic Timer → SyncEngine
- SyncEngine → Supabase Client

### 10. Add Code Examples

**Basic Sync Usage Example**
Show how components use the synced storage:

```typescript
// Automatic sync - just use storage normally
await storage.saveWorkoutSession(session);
// Change is automatically queued and will sync in next cycle
```

**Manual Sync Trigger Example**
Show how to trigger immediate sync:

```typescript
const { syncNow } = useSync();
await syncNow(); // Force sync now instead of waiting
```

**Sync Status Monitoring Example**
Show how to display sync status in UI:

```typescript
const syncStatus = useSelector((state) => state.sync);
// Display: lastSyncAt, pendingCount, isSyncing, lastError
```

### 11. Document Future Enhancements

**Potential Improvements Section**

- Real-time subscriptions for instant multi-device updates
- Background sync on mobile (using background tasks)
- Optimistic UI updates with rollback on sync failure
- Differential sync (only changed fields, not entire records)
- Compression for large payloads
- Batch operations to reduce round trips
- Conflict resolution UI (let user choose which version to keep)
- Sync analytics (track sync performance, failure rates)

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/e20a850f-8a13-4b11-a33c-d47ccc76b24b.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
