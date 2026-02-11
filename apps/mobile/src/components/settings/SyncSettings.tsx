import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface Props {
  onSyncNow: () => void;
}

export default function SyncSettings({ onSyncNow }: Props) {
  const { status, isAuthenticated } = useSelector((state: RootState) => state.sync);

  if (!isAuthenticated) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="Cloud Sync" />
      <Card.Content>
        <View style={styles.row}>
          <Text variant="bodyMedium">Status</Text>
          <Text variant="bodyMedium" style={{ color: status.isSyncing ? '#4A90E2' : '#198754' }}>
            {status.isSyncing ? 'Syncing...' : 'Ready'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium">Last sync</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {formatDate(status.lastSyncAt)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium">Pending changes</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {status.pendingCount}
          </Text>
        </View>

        {status.lastError && <Text style={styles.error}>{status.lastError}</Text>}

        <Button
          mode="contained"
          onPress={onSyncNow}
          loading={status.isSyncing}
          disabled={status.isSyncing}
          style={styles.syncButton}
        >
          Sync Now
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  muted: { color: '#666' },
  error: { color: '#dc3545', fontSize: 14, marginTop: 8 },
  syncButton: { marginTop: 16 },
});
