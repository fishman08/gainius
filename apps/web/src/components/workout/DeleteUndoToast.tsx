import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import {
  deleteWorkoutSession,
  restoreSession,
  clearPendingDelete,
} from '../../store/slices/workoutSlice';

const UNDO_DURATION_MS = 10000;

export function DeleteUndoToast() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useTheme();
  const pendingDelete = useSelector((state: RootState) => state.workout.pendingDelete);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hold a ref to the pending session so the effect cleanup can dispatch the hard delete
  const pendingRef = useRef(pendingDelete);
  pendingRef.current = pendingDelete;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!pendingDelete) return;

    timerRef.current = setTimeout(() => {
      dispatch(deleteWorkoutSession({ storage, sessionId: pendingDelete.sessionId }));
      dispatch(clearPendingDelete());
    }, UNDO_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // If a different session replaces this one, commit the current pending delete
      // (handled by the next effect invocation checking pendingDelete)
    };
  }, [pendingDelete?.sessionId]); // eslint-disable-line

  if (!pendingDelete) return null;

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch(restoreSession(pendingDelete.session));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: theme.borderRadius.md,
        padding: '12px 20px',
        maxWidth: 400,
        width: '90%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        boxShadow: theme.shadows.md,
      }}
    >
      <span style={{ color: theme.colors.text, fontSize: 14 }}>Workout deleted</span>
      <button
        onClick={handleUndo}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: theme.colors.primary,
          fontWeight: 600,
          fontSize: 14,
          padding: 0,
          flexShrink: 0,
        }}
      >
        Undo
      </button>
    </div>
  );
}
