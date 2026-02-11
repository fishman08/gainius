import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { StorageService } from '@fitness-tracker/shared';
import {
  SyncedStorageService,
  SyncEngine,
  DEFAULT_SYNC_PREFERENCES,
} from '@fitness-tracker/shared';
import type { SyncEngine as SyncEngineType } from '@fitness-tracker/shared';
import { DexieStorageService } from '../storage';
import { DexieSyncQueueStorage } from '../storage/syncQueueStorage';
import { useAuth } from './AuthProvider';

const StorageContext = createContext<StorageService | null>(null);
const SyncEngineContext = createContext<SyncEngineType | null>(null);

export function useStorage(): StorageService {
  const storage = useContext(StorageContext);
  if (!storage) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return storage;
}

export function useSyncEngine(): SyncEngineType | null {
  return useContext(SyncEngineContext);
}

export function StorageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageService | null>(null);
  const [syncEngine, setSyncEngine] = useState<SyncEngineType | null>(null);
  const [isReady, setIsReady] = useState(false);
  const prevUserRef = useRef(user);

  useEffect(() => {
    const init = async () => {
      const service = new DexieStorageService();
      await service.initialize();

      // Clear data on sign-out transition
      if (prevUserRef.current && !user) {
        await service.clearAllData();
      }
      prevUserRef.current = user;

      if (user) {
        const queueStorage = new DexieSyncQueueStorage();
        const engine = new SyncEngine(queueStorage, DEFAULT_SYNC_PREFERENCES);
        const synced = new SyncedStorageService(service, engine);
        setStorage(synced);
        setSyncEngine(engine);
      } else {
        setStorage(service);
        setSyncEngine(null);
      }
      setIsReady(true);
    };
    init();
  }, [user]);

  if (!isReady) return null;

  return (
    <StorageContext.Provider value={storage}>
      <SyncEngineContext.Provider value={syncEngine}>{children}</SyncEngineContext.Provider>
    </StorageContext.Provider>
  );
}
