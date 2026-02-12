import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useTheme } from '../../providers/ThemeProvider';

interface Props {
  onSyncNow: () => void;
}

export function SyncSettings({ onSyncNow }: Props) {
  const { status, isAuthenticated } = useSelector((state: RootState) => state.sync);
  const { theme } = useTheme();

  if (!isAuthenticated) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 16, color: theme.colors.text }}>Cloud Sync</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
        }}
      >
        <span style={{ color: theme.colors.text }}>Status</span>
        <span style={{ color: status.isSyncing ? theme.colors.primary : theme.colors.success }}>
          {status.isSyncing ? 'Syncing...' : 'Ready'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
        }}
      >
        <span style={{ color: theme.colors.text }}>Last sync</span>
        <span style={{ color: theme.colors.textSecondary }}>{formatDate(status.lastSyncAt)}</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
        }}
      >
        <span style={{ color: theme.colors.text }}>Pending changes</span>
        <span style={{ color: theme.colors.textSecondary }}>{status.pendingCount}</span>
      </div>

      {status.lastError && (
        <p style={{ color: theme.colors.error, fontSize: 14, marginTop: 8 }}>{status.lastError}</p>
      )}

      <button
        onClick={onSyncNow}
        disabled={status.isSyncing}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 12,
          backgroundColor: theme.colors.primary,
          color: theme.colors.primaryText,
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          opacity: status.isSyncing ? 0.5 : 1,
        }}
      >
        {status.isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
