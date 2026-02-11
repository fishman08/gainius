import React, { useState, useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Card, Button, Text } from 'react-native-paper';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportAllData, importData } from '@fitness-tracker/shared';
import type { ExportedData } from '@fitness-tracker/shared';
import { useStorage } from '../../providers/StorageProvider';
import { useAuth } from '../../providers/AuthProvider';

export default function DataExport() {
  const storage = useStorage();
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData(storage, userId);
      const json = JSON.stringify(data, null, 2);
      const file = new File(Paths.cache, `workout-export-${Date.now()}.json`);
      file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    } catch (e) {
      Alert.alert('Export Failed', e instanceof Error ? e.message : String(e));
    } finally {
      setIsExporting(false);
    }
  }, [storage, userId]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) {
        setIsImporting(false);
        return;
      }
      const picked = result.assets[0];
      const importedFile = new File(picked.uri);
      const content = await importedFile.text();
      const data: ExportedData = JSON.parse(content);

      if (data.version !== 1) {
        Alert.alert('Invalid File', 'Unrecognized export format.');
        setIsImporting(false);
        return;
      }

      const { imported, errors } = await importData(storage, data, userId);
      const summary = `Imported: ${imported.sessions} sessions, ${imported.plans} plans, ${imported.conversations} conversations`;
      if (errors.length > 0) {
        Alert.alert('Import Complete (with errors)', `${summary}\n\nErrors: ${errors.length}`);
      } else {
        Alert.alert('Import Complete', summary);
      }
    } catch (e) {
      Alert.alert('Import Failed', e instanceof Error ? e.message : String(e));
    } finally {
      setIsImporting(false);
    }
  }, [storage, userId]);

  return (
    <Card style={styles.card}>
      <Card.Title title="Data Management" />
      <Card.Content>
        <Text variant="bodyMedium" style={styles.hint}>
          Export your data as JSON for backup or transfer to another device.
        </Text>
        <Button
          mode="contained"
          onPress={handleExport}
          loading={isExporting}
          disabled={isExporting}
          style={styles.button}
        >
          Export Data
        </Button>
        <Button
          mode="outlined"
          onPress={handleImport}
          loading={isImporting}
          disabled={isImporting}
          style={styles.button}
        >
          Import Data
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  hint: { marginBottom: 12, color: '#666' },
  button: { marginBottom: 12 },
});
