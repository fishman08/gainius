# Workout Selector & Cardio Logging — Design Spec

**Date:** 2026-05-13
**Status:** Approved

---

## Context

The exercise picker currently surfaces 322 entries, many of which are equipment-prefixed variants of the same movement (e.g. "Barbell Bench Press - Medium Grip" alongside "Bench Press"). This creates noise in search results and slows exercise selection. Separately, the app has no way to log cardio workouts (running, swimming, walking, biking) — a gap users encounter immediately after setting up a training plan.

This spec covers two features shipped together:

1. **Exercise catalog deduplication** — clean up the picker to show unique, canonical exercises
2. **Cardio workout logging** — first-class cardio sessions with duration + distance

HealthKit integration (auto-import from Apple Watch) is explicitly **out of scope** for this phase. It requires a custom dev build and will ship as Phase 2 via TestFlight.

---

## Feature 1: Exercise Catalog Deduplication

### Rules

**Strip and alias** when the equipment prefix names the default implement and doesn't change the fundamental movement:

- "Barbell X" → "X" (barbell is default for most compound lifts)
- Exact-name duplicates with different capitalisation/pluralisation → one canonical form

**Keep separate** when equipment meaningfully changes the movement:

- Dumbbell variants (Dumbbell Bench Press ≠ Bench Press)
- Cable variants (Cable Lateral Raise ≠ Lateral Raise)
- Smith Machine variants
- Machine variants

### User-reviewed ambiguous cases

| #   | Decision                                                                     |
| --- | ---------------------------------------------------------------------------- |
| 1   | Romanian Deadlift ≠ Stiff-Legged Barbell Deadlift — keep both                |
| 2   | Pec Deck = Butterfly → **Pec Deck**                                          |
| 3   | Cable Lateral Raise stays separate; Side Lateral Raise → **Lateral Raise**   |
| 4   | Barbell Hip Thrust → **Hip Thrust**; Barbell Glute Bridge stays separate     |
| 5   | Pendlay Row stays distinct from Barbell Row                                  |
| 6   | T-Bar Row with Handle → **T-Bar Row**                                        |
| 7   | Seated Barbell Military Press stays separate from Overhead Press             |
| 8   | Standing Dumbbell Press and Dumbbell Shoulder Press — keep both              |
| 9   | Chest Dip / Dips - Chest Version / Parallel Bar Dip → **Chest Dip**          |
| 10  | Upright Row / Upright Barbell Row / Upright Cable Row → all **Upright Row**  |
| 11  | Barbell Shrug + Dumbbell Shrug → **Shrug**; Cable Shrugs stays separate      |
| 12  | Bodyweight Walking Lunge stays separate; Barbell/Dumbbell Lunges → **Lunge** |
| 13  | Barbell Shrug Behind The Back — keep separate                                |
| 14  | Dumbbell Bicep Curl + Dumbbell Alternate Bicep Curl → **Dumbbell Curl**      |
| 15  | Bench Press - Powerlifting → **Bench Press**                                 |

### Clear consolidations (no user review needed)

- Pullups → alias of Pull-Up
- Hammer Curls → alias of Hammer Curl
- Concentration Curls → alias of Concentration Curl
- Rack Pulls → alias of Rack Pull
- Seated Cable Rows → alias of Seated Cable Row
- EZ-Bar Curl → alias of EZ Bar Curl
- Mountain Climbers → alias of Mountain Climber
- Dumbbell Fly / Dumbbell Flyes → canonical: **Dumbbell Fly**
- Dips - Chest Version → alias of Chest Dip
- Arnold Dumbbell Press → alias of Arnold Press
- Barbell Deadlift → alias of Deadlift
- Barbell Squat / Barbell Full Squat / Olympic Squat / Wide Stance Barbell Squat → aliases of **Squat**
- Front Barbell Squat → alias of Front Squat
- Bent Over Barbell Row → alias of Barbell Row
- Standing Military Press / Barbell Shoulder Press → aliases of **Overhead Press**
- Machine Shoulder (Military) Press → alias of Machine Shoulder Press
- Dumbbell Flyes → alias of Dumbbell Fly
- Decline Barbell Bench Press → alias of Decline Bench Press
- Barbell Bench Press - Medium Grip → alias of Bench Press
- Barbell Incline Bench Press - Medium Grip → alias of Incline Bench Press

### Expected outcome

~322 entries → ~230 unique canonical exercises. Redundant entries become aliases (preserved for search/normalization, not shown as distinct picker results).

### File changed

- `packages/shared/src/data/exerciseCatalog.ts` — remove redundant entries, add missing aliases

---

## Feature 2: Cardio Workout Logging

### Data model

New types in `packages/shared/src/types/workout.ts`:

```ts
type CardioActivityType = 'run' | 'swim' | 'walk' | 'bike';

interface CardioLog {
  id: string;
  sessionId: string;
  activityType: CardioActivityType;
  durationSeconds: number;
  distanceMeters?: number; // always stored in metres (SI); display converts to miles or km per user's units_preference
  notes?: string;
}
```

`WorkoutSession` gains two new optional fields:

```ts
interface WorkoutSession {
  // ...existing fields unchanged...
  sessionType: 'strength' | 'cardio'; // defaults to 'strength'
  cardioLog?: CardioLog; // present when sessionType === 'cardio'
}
```

### Storage

**Mobile (SQLite)**

- `workout_sessions` table: add `session_type TEXT NOT NULL DEFAULT 'strength'`
- New `cardio_logs` table: `id`, `session_id`, `activity_type`, `duration_seconds`, `distance_meters`, `notes`
- Existing rows unaffected (default covers them)

**Web (Dexie)**

- Schema version bumps to v3
- Add `cardioLogs` object store with index on `sessionId`

**StorageService interface** — no new methods; `saveWorkoutSession` handles both session types.

### Redux

Both platform `workoutSlice` files gain:

```ts
logCardioSession(activityType, durationSeconds, distanceMeters?)
```

Thunk creates a `WorkoutSession` with `sessionType: 'cardio'` + populated `cardioLog`, saves via storage, and appends to `history`.

### UI — new components

**`LogCardioModal`** (mobile + web)

- Bottom sheet / modal triggered from Home screen
- Activity picker: Run / Swim / Walk / Bike chips
- Duration input (minutes) + distance input (miles or km — reads `user.preferences.weightUnit` pattern; default miles per imperial-first convention)
- Pace auto-calculates and displays as `min:sec / mi` or `min:sec / km` (hidden when distance is blank)
- "Log [activity]" confirm button dispatches `logCardioSession`

### UI — modified components

**`HomeScreen` / `HomePage`**

- "Log cardio" card appears below the workout plan card
- Tapping opens `LogCardioModal`

**`WorkoutHistoryList`**

- Detect `session.sessionType`
- Cardio sessions render: activity icon + distance (km) + duration + pace
- Strength sessions render unchanged

**`contextBuilder.ts`** (`packages/shared/src/api/`)

- Include recent cardio sessions in the AI system prompt so the coach has full activity context

---

## Phase 2: HealthKit Integration (out of scope)

On-demand import from Apple Health — user taps "Import from Apple Health" and selects recent workouts. Requires:

- Custom Expo dev build (expo-dev-client)
- `react-native-health` or `expo-health` package
- Apple HealthKit entitlements in `app.json`
- Distribution via TestFlight (already available)

Activities to import: run, swim, walk, bike (same `CardioActivityType` enum — Phase 2 data maps directly into Phase 1 types).

---

## Files changed

| File                                                        | Change                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/shared/src/types/workout.ts`                      | Add `CardioActivityType`, `CardioLog`; update `WorkoutSession` |
| `packages/shared/src/index.ts`                              | Export new types                                               |
| `packages/shared/src/data/exerciseCatalog.ts`               | Deduplication pass                                             |
| `packages/shared/src/api/contextBuilder.ts`                 | Include cardio sessions                                        |
| `apps/mobile/src/storage/SqliteStorageService.ts`           | `session_type` column + `cardio_logs` table                    |
| `apps/web/src/storage/DexieStorageService.ts`               | Schema v3 + `cardioLogs` store                                 |
| `apps/mobile/src/store/workoutSlice.ts`                     | `logCardioSession` thunk                                       |
| `apps/web/src/store/workoutSlice.ts`                        | `logCardioSession` thunk                                       |
| `apps/mobile/src/components/workout/LogCardioModal.tsx`     | New component                                                  |
| `apps/web/src/components/workout/LogCardioModal.tsx`        | New component                                                  |
| `apps/mobile/src/screens/HomeScreen.tsx`                    | "Log cardio" entry point                                       |
| `apps/web/src/pages/HomePage.tsx`                           | "Log cardio" entry point                                       |
| `apps/mobile/src/components/workout/WorkoutHistoryList.tsx` | Cardio session rendering                                       |
| `apps/web/src/components/workout/WorkoutHistoryList.tsx`    | Cardio session rendering                                       |

---

## Verification

1. **Exercise picker** — search "bench": should return Bench Press, Dumbbell Bench Press, Incline Bench Press, Decline Bench Press, Close-Grip Bench Press, Smith Machine Bench Press (no barbell-prefixed duplicates)
2. **Cardio logging** — tap "Log cardio" → select Run → enter 28 min / 5.0 km → pace shows 5:36/km → confirm → session appears in history with correct stats
3. **History rendering** — cardio sessions show km/time/pace; strength sessions unchanged
4. **AI context** — after logging a run, chatting with the coach should produce a response that references the run
5. **Existing strength sessions** — no regressions; all existing sessions load with `sessionType: 'strength'` default
