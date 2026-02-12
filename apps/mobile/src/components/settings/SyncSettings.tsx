import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  onSyncNow: () => void;
}

export default function SyncSettings({ onSyncNow }: Props) {
  const { theme } = useAppTheme();
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
        <View style={[styles.row, { borderBottomColor: theme.colors.surfaceBorder }]}>
          <Text variant="bodyMedium">Status</Text>
          <Text
            variant="bodyMedium"
            style={{ color: status.isSyncing ? theme.colors.primary : theme.colors.success }}
          >
            {status.isSyncing ? 'Syncing...' : 'Ready'}
          </Text>
        </View>

        <View style={[styles.row, { borderBottomColor: theme.colors.surfaceBorder }]}>
          <Text variant="bodyMedium">Last sync</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {formatDate(status.lastSyncAt)}
          </Text>
        </View>

        <View style={[styles.row, { borderBottomColor: theme.colors.surfaceBorder }]}>
          <Text variant="bodyMedium">Pending changes</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {status.pendingCount}
          </Text>
        </View>

        {status.lastError && (
          <Text style={[styles.error, { color: theme.colors.error }]}>{status.lastError}</Text>
        )}

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
  },
  error: { fontSize: 14, marginTop: 8 },
  syncButton: { marginTop: 16 },
});
