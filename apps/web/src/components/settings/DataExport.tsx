import { useState, useCallback } from 'react';
import { exportAllData, importData } from '@fitness-tracker/shared';
import type { ExportedData } from '@fitness-tracker/shared';
import { useStorage } from '../../providers/StorageProvider';
import { useUserId } from '../../hooks/useUserId';

export function DataExport() {
  const storage = useStorage();
  const userId = useUserId();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setMessage('');
    try {
      const data = await exportAllData(storage, userId);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Export downloaded.');
    } catch (e) {
      setMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsExporting(false);
    }
  }, [storage]);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setMessage('');
      try {
        const text = await file.text();
        const data: ExportedData = JSON.parse(text);
        if (data.version !== 1) {
          setMessage('Unrecognized export format.');
          setIsImporting(false);
          return;
        }
        const { imported, errors } = await importData(storage, data, userId);
        const summary = `Imported: ${imported.sessions} sessions, ${imported.plans} plans, ${imported.conversations} conversations`;
        if (errors.length > 0) {
          setMessage(`${summary} (${errors.length} errors)`);
        } else {
          setMessage(summary);
        }
      } catch (e) {
        setMessage(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  }, [storage]);

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
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Data Management</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
        Export your data as JSON for backup or transfer to another device.
      </p>
      {message && (
        <p
          style={{
            fontSize: 14,
            color: message.includes('failed') ? '#dc3545' : '#198754',
            marginBottom: 12,
          }}
        >
          {message}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleExport}
          disabled={isExporting}
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
            opacity: isExporting ? 0.5 : 1,
          }}
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting}
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
            opacity: isImporting ? 0.5 : 1,
          }}
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </button>
      </div>
    </div>
  );
}
