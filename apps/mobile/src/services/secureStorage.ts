import * as SecureStore from 'expo-secure-store';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@fitness-tracker/shared';
import type { NotificationPreferences } from '@fitness-tracker/shared';

const API_KEY_STORAGE_KEY = 'claude_api_key';
const CUSTOM_PROMPT_KEY = 'custom_system_prompt';
const NOTIFICATION_PREFS_KEY = 'notification_preferences';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
}

export async function getCustomPrompt(): Promise<string | null> {
  return SecureStore.getItemAsync(CUSTOM_PROMPT_KEY);
}

export async function saveCustomPrompt(prompt: string): Promise<void> {
  await SecureStore.setItemAsync(CUSTOM_PROMPT_KEY, prompt);
}

export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  const raw = await SecureStore.getItemAsync(NOTIFICATION_PREFS_KEY);
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    return JSON.parse(raw) as NotificationPreferences;
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export async function saveNotificationPrefs(prefs: NotificationPreferences): Promise<void> {
  await SecureStore.setItemAsync(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}
