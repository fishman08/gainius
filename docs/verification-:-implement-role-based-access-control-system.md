I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---

## Comment 1: API key storage still returns keys for non-admin users and callers don’t pass role context

In `apps/web/src/services/apiKeyStorage.ts` and `apps/mobile/src/services/secureStorage.ts`, change `getApiKey` to accept an optional `user` (`User | null`) and return null when `!user` or `user.role !== 'admin'`. Update `SettingsPage.tsx` and `SettingsScreen.tsx` to pass `currentUser` into `getApiKey` and guard the load effect so it skips setting API key state when the user is not admin. Adjust any other `getApiKey` callers to supply the user or handle null results. This ensures non-admins cannot retrieve stored API keys.

### Referred Files

- /Users/alexsalman/Desktop/claude_projects/Workout App/apps/web/src/services/apiKeyStorage.ts
- /Users/alexsalman/Desktop/claude_projects/Workout App/apps/mobile/src/services/secureStorage.ts
- /Users/alexsalman/Desktop/claude_projects/Workout App/apps/web/src/pages/SettingsPage.tsx
- /Users/alexsalman/Desktop/claude_projects/Workout App/apps/mobile/src/screens/SettingsScreen.tsx

---

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/e01f5f32-7ca9-4f64-a504-1b268b6aecde.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
