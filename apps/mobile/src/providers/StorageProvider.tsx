import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { StorageService } from '@fitness-tracker/shared';
import {
  SyncedStorageService,
  SyncEngine,
  DEFAULT_SYNC_PREFERENCES,
} from '@fitness-tracker/shared';
import type { SyncEngine as SyncEngineType } from '@fitness-tracker/shared';
import { SqliteStorageService } from '../storage';
import { SqliteSyncQueueStorage } from '../storage/syncQueueStorage';
import { useAuth } from './AuthProvider';
import { useAppTheme } from './ThemeProvider';

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

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [storage, setStorage] = useState<StorageService | null>(null);
  const [syncEngine, setSyncEngine] = useState<SyncEngineType | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevUserRef = useRef(user);

  useEffect(() => {
    const init = async () => {
      try {
        const service = new SqliteStorageService();
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Storage initialization timed out after 5s')), 5000),
        );
        await Promise.race([service.initialize(), timeout]);

        // Clear data on sign-out transition
        if (prevUserRef.current && !user) {
          await service.clearAllData();
        }
        prevUserRef.current = user;

        if (user) {
          const db = SQLite.openDatabaseSync('fitness-tracker.db');
          const queueStorage = new SqliteSyncQueueStorage(db);
          const engine = new SyncEngine(queueStorage, DEFAULT_SYNC_PREFERENCES);
          const synced = new SyncedStorageService(service, engine);
          setStorage(synced);
          setSyncEngine(engine);
        } else {
          setStorage(service);
          setSyncEngine(null);
        }
        setIsReady(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('StorageProvider initialization failed:', message);
        setError(message);
      }
    };
    init();
  }, [user]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text
          style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.error, marginBottom: 8 }}
        >
          Storage Error
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <StorageContext.Provider value={storage}>
      <SyncEngineContext.Provider value={syncEngine}>{children}</SyncEngineContext.Provider>
    </StorageContext.Provider>
  );
}
