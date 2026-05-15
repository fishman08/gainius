import { useState, useCallback, useEffect } from 'react';
import { validateApiKey } from '@fitness-tracker/shared';
import type { User } from '@fitness-tracker/shared';
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
import { OnboardingWizard } from '../components/settings/OnboardingWizard';
import { useSync } from '../providers/SyncProvider';
import { useAuth } from '../providers/AuthProvider';
import { useStorage } from '../providers/StorageProvider';
import { useTheme } from '../providers/ThemeProvider';
import type { ThemeMode } from '@fitness-tracker/shared';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptMessage, setPromptMessage] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const { user: authUser } = useAuth();
  const storage = useStorage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (authUser?.id) {
      storage.getUser(authUser.id).then(setCurrentUser);
    }
  }, [authUser, storage]);

  useEffect(() => {
    getApiKey(currentUser).then((key) => {
      if (key) {
        setApiKey(key);
        setHasKey(true);
      }
    });
    const prompt = getCustomPrompt();
    if (prompt) setCustomPrompt(prompt);
  }, [currentUser]);

  const handleSave = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
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
  }, [apiKey, currentUser]);

  const handleRemove = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
    await deleteApiKey();
    setApiKey('');
    setHasKey(false);
    setMessage('API key removed.');
  }, [currentUser]);

  const handleSavePrompt = useCallback(() => {
    saveCustomPrompt(customPrompt);
    setPromptMessage('Instructions saved!');
    setTimeout(() => setPromptMessage(''), 2000);
  }, [customPrompt]);

  const { syncNow } = useSync();
  const handleSyncNow = useCallback(() => {
    syncNow();
  }, [syncNow]);

  const { theme, themeMode, setThemeMode } = useTheme();
  const themeModes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      {currentUser?.role === 'admin' && (
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: 24,
            boxShadow: theme.shadows.sm,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
            }}
          >
            Claude API Key
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
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
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 16,
              boxSizing: 'border-box' as const,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
            }}
          />
          {message && (
            <p
              style={{
                fontSize: 14,
                color:
                  message.includes('Invalid') || message.includes('Please')
                    ? theme.colors.error
                    : theme.colors.success,
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
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryText,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
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
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.surfaceBorder}`,
                  borderRadius: theme.borderRadius.sm,
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
      )}

      <div
        style={{
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: 24,
          boxShadow: theme.shadows.sm,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
          }}
        >
          Appearance
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
          Choose your preferred color theme.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {themeModes.map((m) => (
            <button
              key={m.value}
              onClick={() => setThemeMode(m.value)}
              style={{
                flex: 1,
                padding: 10,
                border:
                  themeMode === m.value
                    ? `2px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.surfaceBorder}`,
                borderRadius: 8,
                backgroundColor: themeMode === m.value ? theme.colors.primaryMuted : 'transparent',
                color: themeMode === m.value ? theme.colors.primary : theme.colors.textSecondary,
                fontWeight: themeMode === m.value ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {currentUser && (
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: 24,
            boxShadow: theme.shadows.sm,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
            }}
          >
            Training Phase
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
            Set your current training phase to get tailored AI advice.
          </p>
          <select
            value={currentUser.preferences?.trainingPhase ?? ''}
            onChange={async (e) => {
              const phase = e.target.value || undefined;
              const updated = {
                ...currentUser,
                preferences: {
                  ...currentUser.preferences,
                  trainingPhase: phase as 'bulk' | 'cut' | 'maintain' | 'recomp' | undefined,
                },
              };
              await storage.saveUser(updated);
              setCurrentUser(updated);
            }}
            style={{
              width: '100%',
              padding: 12,
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 8,
              fontSize: 16,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
            }}
          >
            <option value="">None</option>
            <option value="bulk">Bulk</option>
            <option value="cut">Cut</option>
            <option value="maintain">Maintain</option>
            <option value="recomp">Recomp</option>
          </select>
        </div>
      )}

      {authUser && (
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: 24,
            boxShadow: theme.shadows.sm,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
            }}
          >
            Fitness profile
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
            Answer a few questions so your AI coach can give you personalised recommendations.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            style={{
              width: '100%',
              padding: 12,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: 'transparent',
              color: theme.colors.text,
              fontFamily: theme.typography.label.fontFamily,
              fontSize: theme.typography.label.fontSize,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Update fitness profile
          </button>
        </div>
      )}

      <AuthSection />

      <SyncSettings onSyncNow={handleSyncNow} />

      <NotificationSettings />

      {currentUser?.role === 'admin' && (
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: 24,
            boxShadow: theme.shadows.sm,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
            }}
          >
            Custom AI Instructions
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
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
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box' as const,
              resize: 'vertical' as const,
              fontFamily: 'inherit',
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
            }}
          />
          {promptMessage && (
            <p style={{ fontSize: 14, color: theme.colors.success, marginBottom: 12 }}>
              {promptMessage}
            </p>
          )}
          <button
            onClick={handleSavePrompt}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryText,
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Save Instructions
          </button>
        </div>
      )}

      {currentUser?.role === 'admin' && <DataExport />}

      <OnboardingWizard visible={showWizard} onDismiss={() => setShowWizard(false)} />
    </div>
  );
}
