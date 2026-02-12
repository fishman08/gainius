import { DEFAULT_NOTIFICATION_PREFERENCES } from '@fitness-tracker/shared';
import type { NotificationPreferences, User } from '@fitness-tracker/shared';

const API_KEY_STORAGE_KEY = 'claude_api_key';
const CUSTOM_PROMPT_KEY = 'custom_system_prompt';
const NOTIFICATION_PREFS_KEY = 'notification_preferences';
const ENCRYPTED_PREFIX = 'enc:';
const CRYPTO_DB_NAME = 'fitness-tracker-crypto';
const CRYPTO_STORE_NAME = 'keys';
const CRYPTO_KEY_ID = 'api-key-encryption';

// --- IndexedDB helpers for CryptoKey storage ---

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CRYPTO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(CRYPTO_STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeCryptoKey(key: CryptoKey): Promise<void> {
  const idb = await openCryptoDb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(CRYPTO_STORE_NAME, 'readwrite');
    tx.objectStore(CRYPTO_STORE_NAME).put({ id: CRYPTO_KEY_ID, key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCryptoKey(): Promise<CryptoKey | null> {
  const idb = await openCryptoDb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(CRYPTO_STORE_NAME, 'readonly');
    const req = tx.objectStore(CRYPTO_STORE_NAME).get(CRYPTO_KEY_ID);
    req.onsuccess = () => resolve(req.result?.key ?? null);
    req.onerror = () => reject(req.error);
  });
}

// --- Key generation ---

async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = await loadCryptoKey();
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt'],
  );
  await storeCryptoKey(key);
  return key;
}

// --- Encrypt / Decrypt ---

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return ENCRYPTED_PREFIX + btoa(String.fromCharCode(...combined));
}

async function decrypt(stored: string): Promise<string> {
  const raw = stored.slice(ENCRYPTED_PREFIX.length);
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const key = await getOrCreateKey();
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

// --- Public API (async for API key, sync for others) ---

export async function getApiKey(user?: User | null): Promise<string | null> {
  if (user && user.role !== 'admin') return null;
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (!stored) return null;

  if (stored.startsWith(ENCRYPTED_PREFIX)) {
    try {
      return await decrypt(stored);
    } catch {
      // CryptoKey lost (IndexedDB cleared) — clear stale ciphertext
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      return null;
    }
  }

  // Auto-migrate plaintext key
  try {
    const encrypted = await encrypt(stored);
    localStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
  } catch {
    // Encryption failed — leave plaintext in place rather than losing the key
  }
  return stored;
}

export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    const encrypted = await encrypt(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
  } catch {
    // Fallback: store plaintext if crypto unavailable
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }
}

export async function deleteApiKey(): Promise<void> {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

// --- Non-secret helpers (remain synchronous) ---

export function getCustomPrompt(): string | null {
  return localStorage.getItem(CUSTOM_PROMPT_KEY);
}

export function saveCustomPrompt(prompt: string): void {
  localStorage.setItem(CUSTOM_PROMPT_KEY, prompt);
}

export function getNotificationPrefs(): NotificationPreferences {
  const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    return JSON.parse(raw) as NotificationPreferences;
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}
