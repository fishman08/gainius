import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from './AuthProvider';
import { useStorage, useSyncEngine } from './StorageProvider';
import { setSyncStatus, setAuthState } from '../store/slices/syncSlice';
import { loadCurrentPlan, loadHistory } from '../store/slices/workoutSlice';
import { setConversations } from '../store/slices/chatSlice';
import type { AppDispatch } from '../store';

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const DEBOUNCE_MS = 500;

interface SyncContextValue {
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({ syncNow: async () => {} });

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth();
  const storage = useStorage();
  const engine = useSyncEngine();
  const dispatch = useDispatch<AppDispatch>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncAtRef = useRef<string | null>(null);

  const refreshRedux = useCallback(
    async (userId: string) => {
      dispatch(loadCurrentPlan({ storage, userId }));
      dispatch(loadHistory({ storage, userId }));
      const convos = await storage.getConversations(userId);
      dispatch(setConversations(convos));
    },
    [dispatch, storage],
  );

  const runSync = useCallback(async () => {
    if (!engine || !supabase || !user) return;
    const status = await engine.fullSync(supabase, storage, lastSyncAtRef.current, user.id);
    dispatch(setSyncStatus(status));
    lastSyncAtRef.current = status.lastSyncAt;
    await refreshRedux(user.id);
  }, [engine, supabase, user, storage, dispatch, refreshRedux]);

  const debouncedPush = useCallback(() => {
    if (!engine || !supabase || !user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await engine.pushChanges(supabase);
        const remaining = await engine.getPendingCount();
        const now = new Date().toISOString();
        dispatch(
          setSyncStatus({
            isSyncing: false,
            lastSyncAt: now,
            pendingCount: remaining,
            lastError: result.errors > 0 ? result.firstError : null,
          }),
        );
        lastSyncAtRef.current = now;
      } catch {
        // Push failed — periodic sync will retry
      }
    }, DEBOUNCE_MS);
  }, [engine, supabase, user, dispatch]);

  useEffect(() => {
    dispatch(
      setAuthState({
        isAuthenticated: !!user,
        email: user?.email ?? null,
      }),
    );

    if (!user || !supabase || !engine) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Register debounced push on every enqueue
    engine.setOnEnqueue(debouncedPush);

    // One-time user ID remap + ensure Supabase users row exists
    const doSetup = async () => {
      try {
        const existing = await storage.getUser(user.id);
        if (!existing) {
          await engine.remapLocalUser('local-user', user.id, storage);
        }
      } catch {
        // Remap not critical — continue
      }

      // Ensure users row exists in Supabase before pushing queue (FK target)
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] ?? 'User',
          preferences: {},
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-fatal — pushChanges will surface the FK error if this fails
      }

      // Initial sync (full pull — lastSyncAtRef starts as null)
      const status = await engine.fullSync(supabase, storage, null, user.id);
      dispatch(setSyncStatus(status));
      lastSyncAtRef.current = status.lastSyncAt;
      await refreshRedux(user.id);
    };
    doSetup();

    // Periodic full sync (pull remote changes)
    intervalRef.current = setInterval(runSync, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [user, supabase, engine, storage, dispatch, runSync, debouncedPush]);

  return <SyncContext.Provider value={{ syncNow: runSync }}>{children}</SyncContext.Provider>;
}
