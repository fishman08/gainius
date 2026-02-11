import * as SecureStore from 'expo-secure-store';
import type { AuthTokenStorage } from '@fitness-tracker/shared';

export const secureTokenStorage: AuthTokenStorage = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
