import type { SyncQueueItem } from '@fitness-tracker/shared';
import type { SyncQueueStorage } from '@fitness-tracker/shared';
import { db } from './db';

export class DexieSyncQueueStorage implements SyncQueueStorage {
  async getAll(): Promise<SyncQueueItem[]> {
    return db.syncQueue.orderBy('createdAt').toArray() as Promise<SyncQueueItem[]>;
  }

  async add(item: SyncQueueItem): Promise<void> {
    await db.syncQueue.put(item);
  }

  async remove(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  }

  async incrementRetry(id: string): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (item) {
      await db.syncQueue.update(id, { retryCount: item.retryCount + 1 });
    }
  }

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  }
}
