import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar } from 'react-native-paper';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import {
  deleteWorkoutSession,
  restoreSession,
  clearPendingDelete,
} from '../../store/slices/workoutSlice';

const UNDO_DURATION_MS = 10000;

export default function DeleteUndoSnackbar() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const pendingDelete = useSelector((state: RootState) => state.workout.pendingDelete);
  const didUndoRef = useRef(false);

  const handleUndo = () => {
    didUndoRef.current = true;
    if (pendingDelete) dispatch(restoreSession(pendingDelete.session));
  };

  const handleDismiss = () => {
    if (!didUndoRef.current && pendingDelete) {
      dispatch(deleteWorkoutSession({ storage, sessionId: pendingDelete.sessionId }));
      dispatch(clearPendingDelete());
    }
    didUndoRef.current = false;
  };

  return (
    <Snackbar
      visible={pendingDelete !== null}
      duration={UNDO_DURATION_MS}
      onDismiss={handleDismiss}
      action={{ label: 'Undo', onPress: handleUndo }}
    >
      Workout deleted
    </Snackbar>
  );
}
