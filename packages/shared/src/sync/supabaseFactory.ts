import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncConfig, AuthTokenStorage } from './types';

export function createSupabaseClient(
  config: SyncConfig,
  tokenStorage: AuthTokenStorage,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: tokenStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
