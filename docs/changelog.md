# Changelog - AI Fitness Tracker

All notable changes to this project will be documented in this file.

## [Unreleased]

### Milestone 1: Foundation & Infrastructure (2026-02-06)

#### Added

- Monorepo scaffold with Turborepo + npm workspaces at project root
- Root configuration: `turbo.json`, `tsconfig.base.json`, `.eslintrc.js`, `.prettierrc`
- Husky pre-commit hook running lint-staged
- `@fitness-tracker/shared` package with:
  - TypeScript interfaces: User, UserPreferences, WorkoutPlan, PlannedExercise, WorkoutSession, LoggedExercise, ExerciseSet, ChatMessage, Conversation
  - `StorageService` interface (shared contract for platform-specific implementations)
  - `generateId()` utility (uuid v4)
- `@fitness-tracker/ui-components` package shell (placeholder for Milestone 2+)
- Mobile app (`apps/mobile`): Expo managed workflow (SDK 54)
  - `SqliteStorageService` implementing `StorageService` via expo-sqlite
  - SQLite migrations with 5 tables and indexes
  - `StorageProvider` React Context
  - Redux Toolkit store shell
  - React Navigation stack navigator with HomeScreen placeholder
- Web app (`apps/web`): Vite + React 19
  - `DexieStorageService` implementing `StorageService` via Dexie.js/IndexedDB
  - Dexie database schema (v1) with 5 object stores
  - `StorageProvider` React Context
  - Redux Toolkit store shell
  - React Router with HomePage placeholder
- Updated `.gitignore` with Node/Expo/Turbo patterns

#### Architecture Decisions

- **Turborepo** over Nx (simpler, aligns with anti-patterns guidance)
- **Expo managed workflow** (sufficient for all M1 needs, can eject later)
- **Root-level monorepo** (flat structure, code alongside docs)
- **JSON columns** for nested data (exercises, sets stored as JSON text)
- **ISO 8601 strings** for all date fields (avoids serialization issues)
- **One interface, two implementations** for storage (no over-abstraction)

---

### Milestone 2: Claude Integration & Chat (2026-02-07)

#### Added

- **Claude API Client** (`packages/shared/src/api/`):
  - `claudeClient.ts` — `sendMessage()` with retry logic and exponential backoff
  - `contextBuilder.ts` — `buildSystemPrompt()` from workout history and goals
  - `types.ts` — Request/response types for Anthropic Messages API
  - `validateApiKey()` for key verification
- **Exercise Parser** (`packages/shared/src/parsers/`):
  - `exerciseParser.ts` — `extractExercises()` with 5 regex patterns
  - Supports: "4 sets x 8 reps", "3x10 at 185", "5x5 @ 225", "to failure", "max reps"
  - Returns confidence scores per extraction
- **Mobile Chat (Ticket 3)**:
  - `ChatScreen` with message list, input, extracted exercises card
  - `MessageBubble` with markdown rendering (react-native-markdown-display)
  - `ChatInput` with send button
  - `ExtractedExercisesCard` — shows parsed exercises with "Add to Plan" / "Dismiss"
  - Chat Redux slice with `sendChatMessage` async thunk
  - Workout Redux slice for plan state
  - API key secure storage via `expo-secure-store`
  - `SettingsScreen` for API key management with validation
  - Bottom tab navigation (Chat, Workout, Settings) with Ionicons
  - React Native Paper UI library integrated
- **Web Chat (Ticket 3)**:
  - `ChatPage` mirroring mobile functionality
  - `MessageBubble` with react-markdown rendering
  - `ChatInput`, `ExtractedExercisesCard`, `NavBar`
  - Chat and workout Redux slices
  - `SettingsPage` for API key (localStorage)
  - React Router routes: `/` (Chat), `/workout`, `/settings`
- **Workout Plan Creation (Ticket 4)**:
  - "Add to Plan" creates WorkoutPlan from extracted exercises
  - Saves to local storage (SQLite/IndexedDB)
  - Plan displayed on Workout tab/page

#### Architecture Decisions

- **No streaming** — fetch-based non-streaming API calls (Expo Go streaming unreliable)
- **Async thunks over RTK Query** — simpler for single API endpoint
- **Redux slices per app** (not shared) — each imports platform-specific storage
- **expo-secure-store** (mobile) / localStorage (web) for API keys
- **Regex-only** exercise parsing (no NLP libraries per anti-patterns)
- **All components under 150 lines** per constraints

---

### Milestone 3: Workout Logging (2026-02-07)

#### Added

- **Workout Session Management** (both platforms):
  - Expanded `workoutSlice` with `activeSession`, `history` state
  - New reducers: `updateSet`, `endSession`, `clearActiveSession`, `setHistory`
  - Async thunks: `startWorkout`, `saveSession`, `loadHistory`
  - Start a workout session from any saved plan with pre-populated empty sets
- **Mobile Workout Components** (`apps/mobile/src/components/workout/`):
  - `PlanOverview` — plan display + "Start Workout" button + history list
  - `ActiveWorkout` — exercise cards with logging inputs + rest timer + "Finish Workout"
  - `ExerciseCard` — single exercise with target info and set rows
  - `SetRow` — reps/weight inputs with completion checkmark
  - `RestTimer` — mm:ss countdown with start/stop/reset controls
  - `WorkoutSummary` — post-workout stats with plan-vs-actual comparison
  - `EmptyPlanView` — placeholder when no plan exists
  - `WorkoutHistoryList` — list of past sessions (date, exercise count, volume)
- **Web Workout Components** (`apps/web/src/components/workout/`):
  - Mirrors all 8 mobile components with HTML/CSS instead of React Native Paper
- **Rest Timer Hook** (`packages/shared/src/hooks/useRestTimer.ts`):
  - `useRestTimer(defaultSeconds)` returns `{ secondsLeft, isRunning, start, stop, reset }`
  - Uses `useRef` + `setInterval` for accurate countdown
- **Custom AI Instructions** (Settings):
  - Mobile: TextInput field in SettingsScreen, stored via expo-secure-store
  - Web: Textarea in SettingsPage, stored via localStorage
  - Custom prompt wired into `sendChatMessage` thunk on both platforms
  - Passed to `buildSystemPrompt()` and appended to system context
- **Enriched Claude Context**:
  - `buildSystemPrompt()` now accepts `customSystemPrompt` option
  - Session formatting filters for completed sets only

#### Changed

- `HomeScreen.tsx` (mobile) rewritten as thin orchestrator with conditional rendering:
  No plan → EmptyPlanView, Has plan → PlanOverview, Active session → ActiveWorkout, Complete → WorkoutSummary
- `HomePage.tsx` (web) rewritten with same orchestrator pattern
- `SettingsScreen.tsx` (mobile) wrapped in ScrollView, added Custom AI Instructions card
- `SettingsPage.tsx` (web) added Custom AI Instructions section

#### Fixed

- Exercise parser regex expanded to accept numbered lists (`1.`, `2)`) in addition to bullets
- `dismissExercises` reducer wired into chat UI on both platforms (was a no-op)

#### Architecture Decisions

- **Expand existing workoutSlice** (not a new sessionSlice) — simpler for single-user app
- **Conditional rendering** for workout screen flow (not stack navigator) — avoids navigation complexity
- **Rest timer as local hook** (not Redux) — purely UI state, no persistence needed
- **Plan-vs-actual via existing `LoggedExercise.plannedExerciseId`** — no new types required
- **All components under 150 lines** per constraints

---

### M3 Bug Fixes (2026-02-07)

#### Fixed

- Rest timer resume: `start()` no longer resets paused timer; new `resume()` continues from current `secondsLeft`
- Rest timer now shows Pause/Resume/Start states correctly
- Added customizable duration input (1-600s) to RestTimer on both platforms
- Moved RestTimer to top of ActiveWorkout (above exercise cards) on both platforms
- Web data persistence: added `loadCurrentPlan` async thunk to web `workoutSlice`
- `HomePage.tsx` now loads plan + history from IndexedDB on mount
- Fixed userId mismatch: HomePage now uses `'local-user'` to match ChatPage

#### Changed

- `useRestTimer` hook now returns `{ isPaused, duration, resume, setDuration }` in addition to existing fields
- RestTimer component props expanded on both platforms (isPaused, duration, onResume, onSetDuration)

---

### Milestone 4: Voice Input — Web Only (2026-02-07)

#### Added

- Voice parser (`packages/shared/src/parsers/voiceParser.ts`): 5 regex patterns for natural language workout phrases, returns `ParsedVoiceInput` with confidence score
- `useVoiceInput` hook (`apps/web/src/hooks/useVoiceInput.ts`): Web Speech API wrapper with start/stop/transcript/error/isSupported
- `VoiceInputModal` (`apps/web/src/components/voice/VoiceInputModal.tsx`): Modal with pulsing mic, transcript display, parsed result chips, confirm/retry/cancel
- Mic button in web ActiveWorkout header — on confirm, applies parsed reps/weight to first incomplete set
- Mic button in web ChatInput — on confirm, sends raw transcript as chat message
- Exported `parseVoiceInput` and `ParsedVoiceInput` from shared package

#### Architecture Decisions

- Web-only voice (mobile deferred — react-native-voice incompatible with Expo Go)
- Single-utterance mode (continuous=false) for simplicity
- Local component state only in VoiceInputModal (not Redux)
- Voice modal auto-starts listening on open

---

### M4 Voice Bug Fixes (2026-02-07)

#### Fixed

- Voice parser: made "reps" optional in PATTERN_SETS_OF_REPS — "3 sets of 10 at 135" now parses correctly (was requiring "reps" after rep count)
- Added new PATTERN_REPS_AT_WEIGHT for simple "10 at 135" phrases
- Chat voice: VoiceInputModal now accepts `mode` prop (`'workout'` | `'chat'`); chat mode shows "Send" button for any transcript regardless of parsed confidence
- Workout voice: added "Send as Text" fallback when parser can't extract workout data but transcript exists
- UX: replaced confusing "Start Listening" with "Listen Again" (listening auto-starts on modal open)
- UX: changed "Listening..." to "Speak now..." to clarify mic is active immediately

---

### M4 Voice Enhancement: Per-Set Targeting (2026-02-09)

#### Added

- Per-set mic button in web SetRow — small (28x28) transparent icon between weight input and completion checkbox
- `VoiceTarget` interface in ActiveWorkout for precise `{exerciseIndex, setIndex}` targeting
- `findFirstIncompleteSet()` helper extracted from nested loop logic
- Header mic now disabled (opacity 0.4) when all sets are complete
- Per-set mics dim to 0.3 opacity on completed sets but remain clickable for corrections

#### Fixed

- `exercise.name` → `exercise.exerciseName` in `computeTargetInfo()` — "Will update:" label was showing "undefined – Set N"

#### Changed

- `showVoice: boolean` state replaced with `voiceTarget: VoiceTarget | null` for targeted voice input
- `handleVoiceConfirm()` now uses voiceTarget directly instead of searching for first incomplete set
- Voice modal opens pre-targeted to the specific set (per-set mic) or first incomplete set (header mic)

---

### Milestone 5: Progress & Analytics (2026-02-09)

#### Added

- Shared analytics utilities (`packages/shared/src/analytics/`):
  - `filterByPeriod()`, `computeStats()`, `getUniqueExercises()`, `computeExerciseAnalytics()`, `detectPersonalRecords()`, `getRecentPRs()`, `computeWeeklyVolume()`
  - Types: `TimePeriod`, `WorkoutStats`, `PersonalRecord`, `ExerciseAnalytics`, `ExerciseDataPoint`, `WeeklyVolume`, `WeightSuggestion`
- Weight suggestion algorithm (`weightSuggestion.ts`): `suggestWeight()`, `suggestWeightsForPlan()` — analyzes last 3 sessions, rep consistency, RPE
- Web Progress page (`/progress`) with 7 components:
  - `StatCard`, `PeriodSelector`, `VolumeChart` (Recharts BarChart), `ExerciseProgressChart` (Recharts LineChart), `RecentPRsList`, `ExerciseListSection`, `ExerciseDetailView`
- Mobile Progress tab with 3 components:
  - `StatCard`, `VolumeChart`, `ExerciseProgressChart` (react-native-chart-kit)
  - `ProgressScreen` with SegmentedButtons period selector, PR list, exercise drill-down
- AI weight suggestion chips in PlanOverview on both platforms (green=increase, gray=same, orange=decrease)
- Weight suggestions injected into Claude system prompt via `buildSystemPrompt()`
- Progress nav: 4th tab (mobile) and `/progress` route (web) between Workout and Settings
- Installed: recharts (web), react-native-chart-kit + react-native-svg (mobile)

#### Changed

- `loadHistory` thunk accepts optional `limit` param (default 50, Progress uses 200) on both platforms
- `buildSystemPrompt()` accepts new `weightSuggestions` option in `ContextOptions`
- `sendChatMessage` thunks (both platforms) now compute and pass weight suggestions to Claude context

#### Architecture Decisions

- Pure analytics functions in shared package (no new Redux slice, no new StorageService methods)
- `useMemo` over existing `workout.history` for all computations
- `decimalPlaces` (not `decimalCount`) for react-native-chart-kit config

---

### Milestone 7: Notifications & Weekly Updates (2026-02-09)

#### Added

- **Shared notification types** (`packages/shared/src/types/notification.ts`):
  - `NotificationType`, `NotificationPreferences`, `DEFAULT_NOTIFICATION_PREFERENCES`
  - `ScheduledNotification`, `PlanComparison`, `PlanChange`, `PlanComparisonSummary`
- **Shared notification functions** (`packages/shared/src/notifications/`):
  - `weekDetection.ts` — `isPlanExpired()`, `isPlanExpiringSoon()`, `getDaysRemainingInPlan()`, `getWorkoutDaysFromPlan()`, `isWorkoutDay()`, `isRestDay()`
  - `planComparison.ts` — `comparePlans()` with add/remove/modify/unchanged detection (case-insensitive matching)
  - `scheduleBuilder.ts` — `buildNotificationSchedule()` from plan + preferences
  - `planUpdateContext.ts` — `buildPlanUpdateContext()` for Claude weekly update context
- **Unit tests** (15 tests, all passing):
  - `weekDetection.test.ts` — 8 tests covering plan expiry, expiring-soon, days remaining, workout/rest day detection
  - `planComparison.test.ts` — 7 tests covering added/removed/modified/unchanged exercises, case-insensitive matching
- **Notification preferences storage**:
  - Mobile: `getNotificationPrefs()` / `saveNotificationPrefs()` via expo-secure-store
  - Web: `getNotificationPrefs()` / `saveNotificationPrefs()` via localStorage
- **Redux workoutSlice extensions** (both platforms):
  - New state: `previousPlan`, `planComparison`
  - New reducers: `setPreviousPlan()`, `setPlanComparison()`, `clearPlanComparison()`
- **Mobile notification features**:
  - `expo-notifications` installed and configured with local scheduled notifications
  - `notificationService.ts` — permission request, cancel, schedule weekly/one-time, show immediate
  - `NotificationSettings.tsx` — React Native Paper Card with Switch toggles for all notification types + time picker
  - `PlanUpdateBanner.tsx` — Banner component showing when plan is expired or expiring soon, with "Go to Chat" navigation
  - `PlanComparisonModal.tsx` — Portal Modal with color-coded exercise rows (green=added, red=removed, amber=modified), Claude reasoning, "Accept New Plan" button
- **Web notification features**:
  - `notificationService.ts` — Browser Notification API wrapper (`isNotificationSupported()`, `requestNotificationPermission()`, `showBrowserNotification()`)
  - `NotificationBannerProvider.tsx` — React context for in-app banner system
  - `InAppBanner.tsx` — Auto-dismiss (8s) banner with close button, color-coded by type (info/success/warning)
  - `NotificationSettings.tsx` — HTML checkbox + time input settings panel
  - `PlanUpdateBanner.tsx` — Plan expiry banner with "Go to Chat" react-router navigation
  - `PlanComparisonView.tsx` — Two-column HTML table with color-coded rows, Claude reasoning section, "Accept" button
  - `useNotificationCheck.ts` — Hook that checks plan expiry on mount and fires in-app + browser notifications
- **Vitest** installed in shared package with `globals: true` config for unit testing

#### Changed

- `contextBuilder.ts` — Added `previousPlanContext` option to `ContextOptions` for weekly plan update flow
- Plan creation flow (ChatScreen + ChatPage) — Now stashes `previousPlan`, auto-increments `weekNumber`, and triggers `comparePlans()` when replacing existing plan
- `PlanOverview` (both platforms) — `PlanUpdateBanner` rendered at top
- `HomeScreen` (mobile) — `PlanComparisonModal` shown when `planComparison !== null`
- `HomePage` (web) — `PlanComparisonView` shown above workout content, `useNotificationCheck()` called on mount
- `SettingsScreen` (mobile) — `NotificationSettings` card added
- `SettingsPage` (web) — `NotificationSettings` section added
- `App.tsx` (web) — Routes wrapped with `NotificationBannerProvider`

#### Architecture Decisions

- Pure notification functions in shared package (same pattern as analytics)
- Notification prefs stored same as API key pattern (expo-secure-store mobile, localStorage web)
- Plan comparison triggered on plan creation (not a separate user action)
- Week number auto-increments when replacing existing plan
- Date handling uses local date strings (not ISO/UTC) for timezone-safe day comparisons
- Vitest with globals for test runner (tsconfig excludes `__tests__/` from typecheck)

---

## Format

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
