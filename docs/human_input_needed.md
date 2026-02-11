# Human Input Needed - AI Fitness Tracker

This file tracks pause points where human review, testing, or decisions are required.

---

## Current Milestone: Milestone 8 — Polish & Launch

### Status: NOT STARTED — M7 complete, M6 deferred, ready for M8 after human approval

---

## Completed Reviews

### Milestone 1: Foundation & Infrastructure (2026-02-06) — APPROVED

- Monorepo structure confirmed
- Storage layer working on both platforms
- TypeScript compilation clean
- Mobile Expo Go blank screen fixed (newArchEnabled: false)

### Milestone 2: Claude Integration & Chat (2026-02-07) — APPROVED

- Claude API integration working on both platforms
- Exercise extraction and plan creation functional
- Chat UI with markdown rendering complete
- API key management secure on both platforms

### Milestone 3: Workout Logging + Bug Fixes (2026-02-07) — APPROVED

- Workout logging flow complete on both platforms
- Rest timer bug fixes applied (resume, custom duration, placement)
- Web data persistence fixed (loadCurrentPlan thunk, userId mismatch)
- Custom AI instructions working
- User approved M3, bugs fixed this session

### Milestone 4: Voice Input — Web Only (2026-02-07) — APPROVED

- Voice input working on web (workout + chat screens)
- M3 bug fixes all passed (rest timer, persistence, mobile)
- Bug fixes applied post-review:
  - Voice parser: "reps" now optional in PATTERN_SETS_OF_REPS (e.g., "3 sets of 10 at 135" works)
  - Added new PATTERN_REPS_AT_WEIGHT for "10 at 135" phrases
  - Chat voice: VoiceInputModal now accepts `mode="chat"` — shows Send button for any transcript
  - Workout voice: low-confidence transcripts get "Send as Text" fallback button
  - UX: "Start Listening" replaced with "Listen Again", "Listening..." changed to "Speak now..."
  - Per-set voice targeting: mic icon on each SetRow for precise set targeting (2026-02-09)
  - Bug fix: exercise.name → exercise.exerciseName in voice target label

### Milestone 5: Progress & Analytics (2026-02-09) — APPROVED

- Progress dashboard on both web (Recharts) and mobile (react-native-chart-kit)
- Stat cards, period selector (week/month/all), weekly volume chart, exercise progress chart
- Exercise drill-down with detailed analytics and recent sets
- Personal records detection and display
- AI weight suggestion chips in PlanOverview (green=increase, gray=same, orange=decrease)
- Weight suggestion algorithm: last 3 sessions, rep consistency, RPE check
- Weight suggestions integrated into Claude system prompt context
- loadHistory thunk now supports configurable limit (Progress uses 200)
- TypeScript clean, web build passing

### Milestone 7: Notifications & Weekly Updates (2026-02-09) — NEEDS REVIEW

#### Testing Checklist

- [ ] **Shared tests**: Run `cd packages/shared && npm test` — 15 tests should pass (weekDetection + planComparison)
- [ ] **Web build**: Run `cd apps/web && npx vite build` — should succeed
- [ ] **Mobile typecheck**: Run `cd apps/mobile && npx tsc --noEmit` — should be clean
- [ ] **Notification Settings (Mobile)**: Open Settings tab → verify Notification toggles appear, save/load correctly
- [ ] **Notification Settings (Web)**: Open /settings → verify notification checkboxes and time picker work
- [ ] **Plan Update Banner (Mobile)**: With an expired plan, verify banner shows at top of PlanOverview with "Go to Chat" button
- [ ] **Plan Update Banner (Web)**: Same as mobile, verify banner navigates to Chat page
- [ ] **Plan Comparison Modal (Mobile)**: Create a new plan when existing plan is loaded → verify comparison modal appears with color-coded changes
- [ ] **Plan Comparison View (Web)**: Same flow → verify two-column table shows with Accept button
- [ ] **Week Number Auto-Increment**: Create plan 1, then create plan 2 → verify week number increments from 1 to 2
- [ ] **Browser Notifications (Web)**: Grant permission in browser → verify notification fires on page load with expired plan
- [ ] **In-App Banner (Web)**: Verify banner auto-dismisses after 8 seconds
- [ ] **expo-notifications (Mobile)**: Start Expo Go → verify notification permission request works

#### What Was Built

- Shared: notification types, 4 pure function modules (weekDetection, planComparison, scheduleBuilder, planUpdateContext), 15 unit tests
- Storage: notification preferences save/load on both platforms
- Redux: previousPlan + planComparison state, 3 new reducers, plan creation flow stashes old plan
- Context: previousPlanContext added to buildSystemPrompt() for weekly plan updates
- Mobile: expo-notifications service, NotificationSettings, PlanUpdateBanner, PlanComparisonModal
- Web: browser Notification API, NotificationBannerProvider + InAppBanner, NotificationSettings, PlanUpdateBanner, PlanComparisonView, useNotificationCheck hook

#### New Files (19)

- `packages/shared/src/types/notification.ts`
- `packages/shared/src/notifications/{weekDetection,planComparison,scheduleBuilder,planUpdateContext,index}.ts`
- `packages/shared/src/notifications/__tests__/{weekDetection,planComparison}.test.ts`
- `packages/shared/vitest.config.ts`
- `apps/mobile/src/services/notificationService.ts`
- `apps/mobile/src/components/settings/NotificationSettings.tsx`
- `apps/mobile/src/components/workout/{PlanUpdateBanner,PlanComparisonModal}.tsx`
- `apps/web/src/services/notificationService.ts`
- `apps/web/src/providers/NotificationBannerProvider.tsx`
- `apps/web/src/components/notifications/InAppBanner.tsx`
- `apps/web/src/components/settings/NotificationSettings.tsx`
- `apps/web/src/components/workout/{PlanUpdateBanner,PlanComparisonView}.tsx`
- `apps/web/src/hooks/useNotificationCheck.ts`

#### Questions/Decisions

- M6 (Cloud Sync) was deferred — proceed to M8 (Polish & Launch) next?
- Achievement notifications (PR detection → immediate notification) — framework is in place but not yet wired to workout completion flow. Wire it up in M8?
