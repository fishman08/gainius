import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  WorkoutPlan,
  WorkoutSession,
  LoggedExercise,
  ExerciseSet,
  ExtractedExercise,
  StorageService,
  PlanComparison,
} from '@fitness-tracker/shared';
import { generateId, normalizeExerciseName } from '@fitness-tracker/shared';

export interface WorkoutState {
  currentPlan: WorkoutPlan | null;
  previousPlan: WorkoutPlan | null;
  planComparison: PlanComparison | null;
  activeSession: WorkoutSession | null;
  editingSession: WorkoutSession | null;
  history: WorkoutSession[];
  pendingExtractions: ExtractedExercise[];
}

const initialState: WorkoutState = {
  currentPlan: null,
  previousPlan: null,
  planComparison: null,
  activeSession: null,
  editingSession: null,
  history: [],
  pendingExtractions: [],
};

interface StartWorkoutArgs {
  storage: StorageService;
  userId: string;
}

export const startWorkout = createAsyncThunk(
  'workout/startWorkout',
  async ({ storage, userId }: StartWorkoutArgs, { getState }) => {
    const { workout } = getState() as { workout: WorkoutState };
    const plan = workout.currentPlan;
    if (!plan) throw new Error('No workout plan loaded');

    const now = new Date().toISOString();
    const loggedExercises: LoggedExercise[] = plan.exercises.map((ex) => {
      const sets: ExerciseSet[] = [];
      const targetSets = typeof ex.targetSets === 'number' ? ex.targetSets : 1;
      for (let i = 1; i <= targetSets; i++) {
        sets.push({
          setNumber: i,
          reps: 0,
          weight: ex.suggestedWeight ?? 0,
          completed: false,
          timestamp: '',
        });
      }
      return {
        id: generateId(),
        sessionId: '',
        plannedExerciseId: ex.id,
        exerciseName: ex.exerciseName,
        sets,
      };
    });

    const session: WorkoutSession = {
      id: generateId(),
      userId,
      planId: plan.id,
      date: now.split('T')[0],
      startTime: now,
      completed: false,
      loggedExercises,
    };
    session.loggedExercises.forEach((le) => {
      le.sessionId = session.id;
    });

    await storage.saveWorkoutSession(session);
    return session;
  },
);

interface SaveSessionArgs {
  storage: StorageService;
}

export const saveSession = createAsyncThunk(
  'workout/saveSession',
  async ({ storage }: SaveSessionArgs, { getState }) => {
    const { workout } = getState() as { workout: WorkoutState };
    if (!workout.activeSession) throw new Error('No active session');
    await storage.saveWorkoutSession(workout.activeSession);
    return workout.activeSession;
  },
);

interface LoadHistoryArgs {
  storage: StorageService;
  userId: string;
  limit?: number;
}

export const loadHistory = createAsyncThunk(
  'workout/loadHistory',
  async ({ storage, userId, limit = 50 }: LoadHistoryArgs) => {
    return storage.getWorkoutHistory(userId, limit);
  },
);

interface LoadCurrentPlanArgs {
  storage: StorageService;
  userId: string;
}

export const loadCurrentPlan = createAsyncThunk(
  'workout/loadCurrentPlan',
  async ({ storage, userId }: LoadCurrentPlanArgs) => {
    return storage.getCurrentPlan(userId);
  },
);

interface SaveEditedSessionArgs {
  storage: StorageService;
}

export const saveEditedSession = createAsyncThunk(
  'workout/saveEditedSession',
  async ({ storage }: SaveEditedSessionArgs, { getState }) => {
    const { workout } = getState() as { workout: WorkoutState };
    if (!workout.editingSession) throw new Error('No session being edited');
    await storage.saveWorkoutSession(workout.editingSession);
    return workout.editingSession;
  },
);

interface DeleteWorkoutSessionArgs {
  storage: StorageService;
  sessionId: string;
}

export const deleteWorkoutSession = createAsyncThunk(
  'workout/deleteWorkoutSession',
  async ({ storage, sessionId }: DeleteWorkoutSessionArgs) => {
    await storage.deleteWorkoutSession(sessionId);
    return sessionId;
  },
);

interface UpdateSetPayload {
  exerciseIndex: number;
  setIndex: number;
  reps?: number;
  weight?: number;
  completed?: boolean;
}

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setCurrentPlan(state, action: PayloadAction<WorkoutPlan | null>) {
      state.currentPlan = action.payload;
    },
    setPendingExtractions(state, action: PayloadAction<ExtractedExercise[]>) {
      state.pendingExtractions = action.payload;
    },
    clearPendingExtractions(state) {
      state.pendingExtractions = [];
    },
    updateSet(state, action: PayloadAction<UpdateSetPayload>) {
      if (!state.activeSession) return;
      const { exerciseIndex, setIndex, reps, weight, completed } = action.payload;
      const exercise = state.activeSession.loggedExercises[exerciseIndex];
      if (!exercise) return;
      const set = exercise.sets[setIndex];
      if (!set) return;
      if (reps !== undefined) set.reps = reps;
      if (weight !== undefined) set.weight = weight;
      if (completed !== undefined) {
        set.completed = completed;
        if (completed) set.timestamp = new Date().toISOString();
      }
    },
    endSession(state) {
      if (!state.activeSession) return;
      state.activeSession.completed = true;
      state.activeSession.endTime = new Date().toISOString();
      state.history.unshift(state.activeSession);
    },
    clearActiveSession(state) {
      state.activeSession = null;
    },
    setHistory(state, action: PayloadAction<WorkoutSession[]>) {
      state.history = action.payload;
    },
    setPreviousPlan(state, action: PayloadAction<WorkoutPlan | null>) {
      state.previousPlan = action.payload;
    },
    setPlanComparison(state, action: PayloadAction<PlanComparison | null>) {
      state.planComparison = action.payload;
    },
    clearPlanComparison(state) {
      state.planComparison = null;
    },
    startEditSession(state, action: PayloadAction<string>) {
      const session = state.history.find((s) => s.id === action.payload);
      if (session) {
        state.editingSession = JSON.parse(JSON.stringify(session));
      }
    },
    updateEditSet(state, action: PayloadAction<UpdateSetPayload>) {
      if (!state.editingSession) return;
      const { exerciseIndex, setIndex, reps, weight, completed } = action.payload;
      const exercise = state.editingSession.loggedExercises[exerciseIndex];
      if (!exercise) return;
      const set = exercise.sets[setIndex];
      if (!set) return;
      if (reps !== undefined) set.reps = reps;
      if (weight !== undefined) set.weight = weight;
      if (completed !== undefined) {
        set.completed = completed;
        if (completed) set.timestamp = new Date().toISOString();
      }
    },
    cancelEdit(state) {
      state.editingSession = null;
    },
    updateEditSessionDate(state, action: PayloadAction<string>) {
      if (!state.editingSession) return;
      state.editingSession.date = action.payload;
    },
    addExerciseToActiveSession(
      state,
      action: PayloadAction<{ exerciseName: string; notes?: string }>,
    ) {
      if (!state.activeSession) return;
      const newExercise: LoggedExercise = {
        id: generateId(),
        sessionId: state.activeSession.id,
        exerciseName: normalizeExerciseName(action.payload.exerciseName),
        sets: [{ setNumber: 1, reps: 0, weight: 0, completed: false, timestamp: '' }],
        notes: action.payload.notes,
      };
      state.activeSession.loggedExercises.push(newExercise);
    },
    addExerciseToEditSession(
      state,
      action: PayloadAction<{ exerciseName: string; notes?: string }>,
    ) {
      if (!state.editingSession) return;
      const newExercise: LoggedExercise = {
        id: generateId(),
        sessionId: state.editingSession.id,
        exerciseName: normalizeExerciseName(action.payload.exerciseName),
        sets: [{ setNumber: 1, reps: 0, weight: 0, completed: false, timestamp: '' }],
        notes: action.payload.notes,
      };
      state.editingSession.loggedExercises.push(newExercise);
    },
    addSetToExercise(state, action: PayloadAction<{ exerciseIndex: number }>) {
      if (!state.activeSession) return;
      const exercise = state.activeSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise) return;
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({
        setNumber: exercise.sets.length + 1,
        reps: 0,
        weight: lastSet?.weight ?? 0,
        completed: false,
        timestamp: '',
      });
    },
    addSetToEditExercise(state, action: PayloadAction<{ exerciseIndex: number }>) {
      if (!state.editingSession) return;
      const exercise = state.editingSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise) return;
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({
        setNumber: exercise.sets.length + 1,
        reps: 0,
        weight: lastSet?.weight ?? 0,
        completed: false,
        timestamp: '',
      });
    },
    deleteSetFromExercise(
      state,
      action: PayloadAction<{ exerciseIndex: number; setIndex: number }>,
    ) {
      if (!state.activeSession) return;
      const exercise = state.activeSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise || exercise.sets.length <= 1) return;
      exercise.sets.splice(action.payload.setIndex, 1);
      exercise.sets.forEach((s, i) => {
        s.setNumber = i + 1;
      });
    },
    deleteSetFromEditExercise(
      state,
      action: PayloadAction<{ exerciseIndex: number; setIndex: number }>,
    ) {
      if (!state.editingSession) return;
      const exercise = state.editingSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise || exercise.sets.length <= 1) return;
      exercise.sets.splice(action.payload.setIndex, 1);
      exercise.sets.forEach((s, i) => {
        s.setNumber = i + 1;
      });
    },
    deleteExerciseFromActiveSession(state, action: PayloadAction<{ exerciseIndex: number }>) {
      if (!state.activeSession) return;
      state.activeSession.loggedExercises.splice(action.payload.exerciseIndex, 1);
    },
    deleteExerciseFromEditSession(state, action: PayloadAction<{ exerciseIndex: number }>) {
      if (!state.editingSession) return;
      state.editingSession.loggedExercises.splice(action.payload.exerciseIndex, 1);
    },
    updateExerciseInActiveSession(
      state,
      action: PayloadAction<{ exerciseIndex: number; name: string; notes?: string }>,
    ) {
      if (!state.activeSession) return;
      const exercise = state.activeSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise) return;
      exercise.exerciseName = normalizeExerciseName(action.payload.name);
      exercise.notes = action.payload.notes;
    },
    updateExerciseInEditSession(
      state,
      action: PayloadAction<{ exerciseIndex: number; name: string; notes?: string }>,
    ) {
      if (!state.editingSession) return;
      const exercise = state.editingSession.loggedExercises[action.payload.exerciseIndex];
      if (!exercise) return;
      exercise.exerciseName = normalizeExerciseName(action.payload.name);
      exercise.notes = action.payload.notes;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startWorkout.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(loadCurrentPlan.fulfilled, (state, action) => {
        state.currentPlan = action.payload;
      })
      .addCase(saveEditedSession.fulfilled, (state, action) => {
        const idx = state.history.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.history[idx] = action.payload;
        state.editingSession = null;
      })
      .addCase(deleteWorkoutSession.fulfilled, (state, action) => {
        state.history = state.history.filter((s) => s.id !== action.payload);
        state.editingSession = null;
      });
  },
});

export const {
  setCurrentPlan,
  setPendingExtractions,
  clearPendingExtractions,
  updateSet,
  endSession,
  clearActiveSession,
  setHistory,
  setPreviousPlan,
  setPlanComparison,
  clearPlanComparison,
  startEditSession,
  updateEditSet,
  cancelEdit,
  updateEditSessionDate,
  addExerciseToActiveSession,
  addExerciseToEditSession,
  addSetToExercise,
  addSetToEditExercise,
  deleteSetFromExercise,
  deleteSetFromEditExercise,
  deleteExerciseFromActiveSession,
  deleteExerciseFromEditSession,
  updateExerciseInActiveSession,
  updateExerciseInEditSession,
} = workoutSlice.actions;
export default workoutSlice.reducer;
