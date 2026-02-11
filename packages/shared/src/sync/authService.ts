import type { SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export async function signUp(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signOut(client: SupabaseClient): Promise<{ error: string | null }> {
  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}

export async function getSession(
  client: SupabaseClient,
): Promise<{ session: Session | null; error: string | null }> {
  const { data, error } = await client.auth.getSession();
  if (error) return { session: null, error: error.message };
  return { session: data.session, error: null };
}

export function onAuthStateChange(
  client: SupabaseClient,
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data } = client.auth.onAuthStateChange(callback);
  return { unsubscribe: data.subscription.unsubscribe };
}
