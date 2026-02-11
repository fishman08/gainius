import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SyncStatus } from '@fitness-tracker/shared';
import { INITIAL_SYNC_STATUS } from '@fitness-tracker/shared';

interface SyncState {
  status: SyncStatus;
  isAuthenticated: boolean;
  userEmail: string | null;
}

const initialState: SyncState = {
  status: INITIAL_SYNC_STATUS,
  isAuthenticated: false,
  userEmail: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.status = action.payload;
    },
    setAuthState(state, action: PayloadAction<{ isAuthenticated: boolean; email: string | null }>) {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.userEmail = action.payload.email;
    },
  },
});

export const { setSyncStatus, setAuthState } = syncSlice.actions;
export default syncSlice.reducer;
