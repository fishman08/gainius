import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { validateApiKey } from '@fitness-tracker/shared';
import {
  getApiKey,
  saveApiKey,
  deleteApiKey,
  getCustomPrompt,
  saveCustomPrompt,
} from '../services/secureStorage';
import NotificationSettings from '../components/settings/NotificationSettings';
import AuthSection from '../components/settings/AuthSection';
import SyncSettings from '../components/settings/SyncSettings';
import DataExport from '../components/settings/DataExport';
import { useSync } from '../providers/SyncProvider';

export default function SettingsScreen() {
  const { syncNow } = useSync();
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptSaved, setPromptSaved] = useState(false);

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) {
        setApiKey(key);
        setHasKey(true);
      }
    });
    getCustomPrompt().then((prompt) => {
      if (prompt) setCustomPrompt(prompt);
    });
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    setIsValidating(true);
    try {
      const valid = await validateApiKey(trimmed);
      if (!valid) {
        Alert.alert('Invalid Key', 'The API key is not valid. Please check and try again.');
        return;
      }
      await saveApiKey(trimmed);
      setHasKey(true);
      Alert.alert('Success', 'API key saved securely.');
    } catch {
      await saveApiKey(trimmed);
      setHasKey(true);
      Alert.alert(
        'Saved',
        'API key saved. Could not validate online — it will be checked when you send a message.',
      );
    } finally {
      setIsValidating(false);
    }
  }, [apiKey]);

  const handleRemove = useCallback(async () => {
    await deleteApiKey();
    setApiKey('');
    setHasKey(false);
  }, []);

  const handleSavePrompt = useCallback(async () => {
    await saveCustomPrompt(customPrompt);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  }, [customPrompt]);

  const handleSyncNow = useCallback(() => {
    syncNow();
  }, [syncNow]);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Claude API Key" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.hint}>
            Enter your Anthropic API key to enable AI chat. Your key is stored securely on this
            device.
          </Text>
          <TextInput
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={hasKey}
            placeholder="sk-ant-..."
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isValidating}
              disabled={isValidating || !apiKey.trim()}
              style={styles.button}
            >
              {hasKey ? 'Update Key' : 'Save Key'}
            </Button>
            {hasKey && (
              <Button mode="outlined" onPress={handleRemove} style={styles.button}>
                Remove Key
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      <AuthSection />

      <SyncSettings onSyncNow={handleSyncNow} />

      <NotificationSettings />

      <Card style={styles.card}>
        <Card.Title title="Custom AI Instructions" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.hint}>
            Add custom instructions for the AI coach. These will be included in every conversation.
          </Text>
          <TextInput
            label="System Instructions"
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="e.g., I prefer powerlifting-style programming with RPE-based intensity..."
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <Button mode="contained" onPress={handleSavePrompt} style={styles.button}>
            {promptSaved ? 'Saved!' : 'Save Instructions'}
          </Button>
        </Card.Content>
      </Card>

      <DataExport />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  card: { marginBottom: 16 },
  hint: { marginBottom: 12, color: '#666' },
  input: { marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1 },
});
