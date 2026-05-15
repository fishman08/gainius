import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { useUserId } from '../../hooks/useUserId';
import type { CardioActivityType } from '@fitness-tracker/shared';
import { logCardioSession } from '../../store/slices/workoutSlice';

interface Props {
  onClose: () => void;
}

const ACTIVITIES: { type: CardioActivityType; label: string }[] = [
  { type: 'run', label: 'Run' },
  { type: 'swim', label: 'Swim' },
  { type: 'walk', label: 'Walk' },
  { type: 'bike', label: 'Bike' },
];

export function LogCardioModal({ onClose }: Props) {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();

  const [activity, setActivity] = useState<CardioActivityType>('run');
  const [minutes, setMinutes] = useState('');
  const [miles, setMiles] = useState('');

  const durationSeconds = parseFloat(minutes) * 60 || 0;
  const distanceMeters = parseFloat(miles) > 0 ? parseFloat(miles) * 1609.344 : undefined;

  const pace = useMemo(() => {
    const mins = parseFloat(minutes);
    const mi = parseFloat(miles);
    if (!mins || !mi || mi <= 0) return null;
    const secsPerMile = (mins * 60) / mi;
    const paceMin = Math.floor(secsPerMile / 60);
    const paceSec = Math.round(secsPerMile % 60);
    return `${paceMin}:${String(paceSec).padStart(2, '0')} / mi`;
  }, [minutes, miles]);

  const canLog = durationSeconds > 0;
  const activityLabel = ACTIVITIES.find((a) => a.type === activity)?.label ?? 'Cardio';

  const handleLog = async () => {
    if (!canLog) return;
    await dispatch(
      logCardioSession({
        storage,
        userId,
        activityType: activity,
        durationSeconds,
        distanceMeters,
      }),
    );
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 24,
          width: 360,
          maxWidth: '90%',
          boxShadow: theme.shadows.md,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, color: theme.colors.text, marginBottom: 16 }}>
          Log cardio
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {ACTIVITIES.map((a) => (
            <button
              key={a.type}
              onClick={() => setActivity(a.type)}
              style={{
                padding: '6px 16px',
                borderRadius: theme.borderRadius.sm,
                border: `2px solid ${activity === a.type ? theme.colors.primary : theme.colors.surfaceBorder}`,
                background: activity === a.type ? theme.colors.primaryMuted : 'transparent',
                color: activity === a.type ? theme.colors.primary : theme.colors.text,
                fontWeight: activity === a.type ? 600 : 400,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Duration (min)
          </label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="e.g. 28"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: theme.borderRadius.sm,
              fontSize: 16,
              background: theme.colors.surface,
              color: theme.colors.text,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Distance (mi) — optional
          </label>
          <input
            type="number"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="e.g. 5.0"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: theme.borderRadius.sm,
              fontSize: 16,
              background: theme.colors.surface,
              color: theme.colors.text,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {pace && (
          <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 }}>
            Pace: {pace}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              background: 'transparent',
              color: theme.colors.text,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLog}
            disabled={!canLog}
            style={{
              padding: '8px 20px',
              borderRadius: theme.borderRadius.sm,
              border: 'none',
              background: canLog ? theme.colors.primary : theme.colors.surfaceBorder,
              color: '#fff',
              cursor: canLog ? 'pointer' : 'default',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Log {activityLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
