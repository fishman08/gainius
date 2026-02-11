import * as SQLite from 'expo-sqlite';
import type { SyncQueueItem } from '@fitness-tracker/shared';
import type { SyncQueueStorage } from '@fitness-tracker/shared';

export class SqliteSyncQueueStorage implements SyncQueueStorage {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async getAll(): Promise<SyncQueueItem[]> {
    const rows = await this.db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM sync_queue ORDER BY created_at ASC',
    );
    return rows.map((row) => ({
      id: row.id as string,
      entityType: row.entity_type as SyncQueueItem['entityType'],
      entityId: row.entity_id as string,
      operation: row.operation as SyncQueueItem['operation'],
      payload: row.payload as string,
      createdAt: row.created_at as string,
      retryCount: row.retry_count as number,
    }));
  }

  async add(item: SyncQueueItem): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        item.id,
        item.entityType,
        item.entityId,
        item.operation,
        item.payload,
        item.createdAt,
        item.retryCount,
      ],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async incrementRetry(id: string): Promise<void> {
    await this.db.runAsync('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [
      id,
    ]);
  }

  async clear(): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_queue');
  }
}
