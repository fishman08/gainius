# Fitness Coach App — System Prompt Architecture

Reference document for Claude Code. Describes every prompt section assembled by `buildSystemPrompt()` in `contextBuilder.ts`, the exercise extraction pipeline, and the data contracts between AI output and app parsing.

---

## Prompt Assembly Order

`buildSystemPrompt()` concatenates these sections in order. Each section is only included when the relevant data exists.

| #   | Section                | Condition                        |
| --- | ---------------------- | -------------------------------- |
| 1   | Base Instruction       | Always                           |
| 2   | Custom User Prompt     | If set in Settings               |
| 3   | User Preferences       | If preferences exist             |
| 4   | User Goals             | If goals are set                 |
| 5   | Recent Workout History | If sessions exist (last 2 weeks) |
| 6   | Weight Suggestions     | If computed from history         |
| 7   | Conversation Context   | If prior messages exist          |
| 8   | Previous Plan Context  | Only when replacing a plan       |

---

## 1 · Base Instruction (always included)

```text
You are a knowledgeable personal fitness coach. Help the user with workout planning, exercise selection, and training advice.

When providing workout plans, format each exercise as a bullet point on its own line using one of these exact formats:

- Exercise Name: X sets x Y reps at Z lbs
- Exercise Name: XxY at Z lbs
- Exercise Name: X sets to failure
- Exercise Name: X sets x max reps

Always use a dash (-) at the start of each exercise line so they can be automatically extracted. Do not use tables, numbered lists, or other formats for exercise prescriptions.

When creating a weekly plan, organize exercises by day using this header format:

**Monday**
- Bench Press: 4 sets x 8 reps at 135 lbs
- Incline DB Press: 3 sets x 10 reps at 50 lbs

**Wednesday**
- Squat: 4 sets x 6 reps at 225 lbs

This allows the app to assign exercises to specific days.

When suggesting weights, always include the unit (lbs or kg based on user preference). Keep responses conversational but always use the bullet format above when listing exercises in a plan.
```

---

## 2 · Custom User Prompt (from Settings)

Only appended when the user has written a custom system prompt in the app's Settings screen.

```text
Additional instructions from the user: {userCustomPrompt}
```

---

## 3 · User Preferences

```text
User preferences: weight unit = {lbs|kg}
```

---

## 4 · User Goals

```text
User goals: {goalsText}
```

---

## 5 · Recent Workout History (last 2 weeks)

Pull all completed sessions from the last 14 days. For each session show the date and, per exercise, the **best set** (highest weight) with total completed set count. Only include completed sets.

```text
Recent workout history (last 2 weeks):

2026-02-15:
  - Bench Press: 135 lbs x 10 reps (3 sets)
  - Squat: 225 lbs x 5 reps (2 sets)
  - Pull-ups: bodyweight x 8 reps (3 sets)

2026-02-13:
  - Overhead Press: 95 lbs x 8 reps (4 sets)
  - Barbell Row: 155 lbs x 8 reps (3 sets)

2026-02-10:
  - Bench Press: 135 lbs x 10 reps (3 sets)
  - Incline DB Press: 50 lbs x 10 reps (3 sets)

...
```

### History data source

- **Display in prompt:** Last 14 days of sessions (all sessions within window)
- **Progression algorithm input:** Last 50 sessions (used to compute weight suggestions in Section 6)

---

## 6 · Weight Suggestions

Computed by the progression algorithm using up to the last 50 sessions. For each exercise, look at the last 3 sessions and check rep consistency at the current weight:

| Consistency | RPE | Action            | Symbol | Suggested Change |
| ----------- | --- | ----------------- | ------ | ---------------- |
| ≥ 90%       | ≤ 9 | Progress          | ↑      | +2.5% weight     |
| 70–89%      | ≤ 9 | Maintain          | →      | No change        |
| < 70%       | any | Deload            | ↓      | −5% weight       |
| any         | > 9 | Maintain (safety) | →      | No change        |

```text
AI weight suggestions based on recent performance:
  - Bench Press: 140 lbs ↑ (Consistently hitting 10 reps — ready to progress)
  - Squat: 225 lbs → (Getting close — keep current weight)
  - Overhead Press: 90 lbs ↓ (Struggling at current weight — reduce to build back)
  - Barbell Row: 155 lbs → (RPE high — maintain current weight for recovery)
```

---

## 7 · Conversation Context

Last 6 messages from the conversation, each truncated to 200 characters. Provides continuity across sessions.

```text
Recent conversation context:
User: Can we swap out the barbell rows? My lower back has been bugging me after deadlift days. Maybe a chest-supported row or cable row ins...
Assistant: Absolutely — chest-supported rows are a great swap. They remove the lower back demand entirely while still hitting your mid-back...
User: Perfect. Let's go with that. Can you update the Wednesday pull day?
Assistant: Here's your updated Wednesday pull day:
- Chest-Supported Row: 3 sets x 10 reps at 135 lbs
- Lat Pulldown: 3 sets x 10 reps at 140 lbs...
```

---

## 8 · Previous Plan Context (only when replacing a plan)

Included when the user is creating a new weekly plan to replace an existing one. Gives Claude the old plan's structure, completion data, and volume so it can make informed progressions.

```text
Previous workout plan context:

Week 12 plan (created 2026-02-08):

**Monday — Push**
- Bench Press: 4 sets x 8 reps at 135 lbs
- Overhead Press: 3 sets x 10 reps at 95 lbs
- Dips: 3 sets to failure

**Wednesday — Pull**
- Barbell Row: 4 sets x 8 reps at 155 lbs
- Lat Pulldown: 3 sets x 10 reps at 140 lbs
- Face Pulls: 3 sets x 15 reps at 30 lbs

**Friday — Legs**
- Squat: 4 sets x 6 reps at 225 lbs
- RDL: 3 sets x 10 reps at 185 lbs
- Leg Press: 3 sets x 12 reps at 270 lbs

Completion rate: 85%
Total volume achieved: 42,350 lbs
Exercises with progression (↑): Bench Press, Lat Pulldown
Exercises stalled (→): Squat, Barbell Row
Exercises regressed (↓): Overhead Press

When creating a replacement plan:
- Progress exercises that showed improvement (↑) by increasing weight or volume
- Modify exercises where the user stalled (→) — consider rep scheme changes, tempo variation, or accessory swaps
- Reduce load or substitute exercises where the user regressed (↓)
- Preserve the overall training split structure unless the user requests changes
```

---

## Exercise Extraction Pipeline

After Claude responds, `extractExercises()` runs 5 regex patterns in priority order against each line:

| Priority | Pattern                    | Example Match                             | Confidence |
| -------- | -------------------------- | ----------------------------------------- | ---------- |
| 1        | `X sets x Y reps at Z lbs` | `Bench Press: 4 sets x 8 reps at 135 lbs` | 0.95       |
| 2        | `XxY at Z`                 | `Squats - 3x10 at 185 lbs`                | 0.85       |
| 3        | `XxY @ Z`                  | `Deadlift 5x5 @ 225`                      | 0.75       |
| 4        | `X sets to failure`        | `Pull-ups: 3 sets to failure`             | 0.90       |
| 5        | `X sets x max reps`        | `Dips: 3 sets x max reps`                 | 0.90       |

Each match produces a `PlannedExercise`:

```typescript
interface PlannedExercise {
  name: string;
  targetSets: number;
  targetReps: number | 'max' | 'failure';
  suggestedWeight?: number;
  dayOfWeek: string;
  order: number;
}
```

---

## Data Models

### WorkoutPlan

```typescript
interface WorkoutPlan {
  weekNumber: number; // auto-increments on replacement
  startDate: string; // ISO date
  endDate: string; // startDate + 7 days
  createdBy: 'ai' | 'manual';
  exercises: PlannedExercise[];
  conversationId: string; // links to originating chat
}
```

### WorkoutSession

```typescript
interface WorkoutSession {
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  planId: string; // links to WorkoutPlan
  loggedExercises: LoggedExercise[];
}

interface LoggedExercise {
  exerciseName: string;
  plannedExerciseId: string; // links actual → planned
  sets: LoggedSet[];
}

interface LoggedSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  rpe: number; // 1-10
  timestamp: string;
}
```

---

## API Call Structure

Each request to Claude uses:

- **System prompt:** The full assembled prompt from sections 1–8 above
- **Messages:** The last 10 conversation messages (full, not truncated — the truncated versions in Section 7 are only for the system prompt's context summary)
- **Model:** Claude (Sonnet or Haiku depending on config)

---

## Key Design Decisions

1. **Best set only in history** — Shows Claude the user's performance ceiling, not noise from warm-up or failed sets.
2. **2-week history window** — Enough context for Claude to see patterns and weekly variation without overwhelming the prompt.
3. **50-session lookback for progression** — The algorithm needs more data than the prompt shows to compute reliable trends.
4. **200-char truncation on conversation context** — Keeps the system prompt compact while preserving conversational continuity.
5. **Confidence scores on extraction patterns** — The most explicit format (`X sets x Y reps at Z lbs`) is preferred; shorthand formats are accepted but scored lower.
6. **RPE > 9 safety valve** — Prevents the algorithm from suggesting weight increases when the user is already near max effort, regardless of rep consistency.
