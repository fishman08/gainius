import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface Props {
  onSyncNow: () => void;
}

export function SyncSettings({ onSyncNow }: Props) {
  const { status, isAuthenticated } = useSelector((state: RootState) => state.sync);

  if (!isAuthenticated) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #ddd',
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Cloud Sync</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #eee',
        }}
      >
        <span>Status</span>
        <span style={{ color: status.isSyncing ? '#4A90E2' : '#198754' }}>
          {status.isSyncing ? 'Syncing...' : 'Ready'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #eee',
        }}
      >
        <span>Last sync</span>
        <span style={{ color: '#666' }}>{formatDate(status.lastSyncAt)}</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #eee',
        }}
      >
        <span>Pending changes</span>
        <span style={{ color: '#666' }}>{status.pendingCount}</span>
      </div>

      {status.lastError && (
        <p style={{ color: '#dc3545', fontSize: 14, marginTop: 8 }}>{status.lastError}</p>
      )}

      <button
        onClick={onSyncNow}
        disabled={status.isSyncing}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 12,
          backgroundColor: '#4A90E2',
          color: '#fff',
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
