export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  weightUnit: 'lbs' | 'kg';
  restTimerDefault: number;
  voiceInputEnabled: boolean;
  cloudSyncEnabled: boolean;
}
