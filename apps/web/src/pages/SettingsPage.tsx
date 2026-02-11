import { useState, useCallback, useEffect } from 'react';
import { validateApiKey } from '@fitness-tracker/shared';
import {
  getApiKey,
  saveApiKey,
  deleteApiKey,
  getCustomPrompt,
  saveCustomPrompt,
} from '../services/apiKeyStorage';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { AuthSection } from '../components/settings/AuthSection';
import { SyncSettings } from '../components/settings/SyncSettings';
import { DataExport } from '../components/settings/DataExport';
import { useSync } from '../providers/SyncProvider';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptMessage, setPromptMessage] = useState('');

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) {
        setApiKey(key);
        setHasKey(true);
      }
    });
    const prompt = getCustomPrompt();
    if (prompt) setCustomPrompt(prompt);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage('Please enter an API key.');
      return;
    }
    setIsValidating(true);
    setMessage('');
    try {
      const valid = await validateApiKey(trimmed);
      if (!valid) {
        setMessage('Invalid API key. Please check and try again.');
        return;
      }
      await saveApiKey(trimmed);
      setHasKey(true);
      setMessage('API key saved successfully.');
    } catch {
      await saveApiKey(trimmed);
      setHasKey(true);
      setMessage('Saved. Could not validate online — will be checked when you send a message.');
    } finally {
      setIsValidating(false);
    }
  }, [apiKey]);

  const handleRemove = useCallback(async () => {
    await deleteApiKey();
    setApiKey('');
    setHasKey(false);
    setMessage('API key removed.');
  }, []);

  const handleSavePrompt = useCallback(() => {
    saveCustomPrompt(customPrompt);
    setPromptMessage('Instructions saved!');
    setTimeout(() => setPromptMessage(''), 2000);
  }, [customPrompt]);

  const { syncNow } = useSync();
  const handleSyncNow = useCallback(() => {
    syncNow();
  }, [syncNow]);

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #ddd',
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Claude API Key</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          Enter your Anthropic API key to enable AI chat. Your key is stored in this browser.
        </p>
        <input
          type={hasKey ? 'password' : 'text'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16,
            marginBottom: 16,
            boxSizing: 'border-box' as const,
          }}
        />
        {message && (
          <p
            style={{
              fontSize: 14,
              color:
                message.includes('Invalid') || message.includes('Please') ? '#dc3545' : '#198754',
              marginBottom: 12,
            }}
          >
            {message}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={isValidating || !apiKey.trim()}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: '#4A90E2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              opacity: isValidating || !apiKey.trim() ? 0.5 : 1,
            }}
          >
            {isValidating ? 'Validating...' : hasKey ? 'Update Key' : 'Save Key'}
          </button>
          {hasKey && (
            <button
              onClick={handleRemove}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Remove Key
            </button>
          )}
        </div>
      </div>

      <AuthSection />

      <SyncSettings onSyncNow={handleSyncNow} />

      <NotificationSettings />

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #ddd',
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Custom AI Instructions</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          Add custom instructions for the AI coach. These will be included in every conversation.
        </p>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g., I prefer powerlifting-style programming with RPE-based intensity..."
          rows={4}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 16,
            boxSizing: 'border-box' as const,
            resize: 'vertical' as const,
            fontFamily: 'inherit',
          }}
        />
        {promptMessage && (
          <p style={{ fontSize: 14, color: '#198754', marginBottom: 12 }}>{promptMessage}</p>
        )}
        <button
          onClick={handleSavePrompt}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#4A90E2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Save Instructions
        </button>
      </div>

      <DataExport />
    </div>
  );
}
