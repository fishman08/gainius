I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---

## Comment 1: Timer warning/complete notifications won’t fire for typical (<60s) rest durations on Android

Switch timer notifications to use absolute `DATE` triggers computed from the target end time, or use alarm-based scheduling on Android. Ensure both the 10-second warning and completion notifications are scheduled with compliant triggers so they always fire for short rest durations (e.g., 30–120 seconds).

### Referred Files

- /Users/alexsalman/Desktop/claude_projects/Workout App/apps/mobile/src/services/notificationService.ts

---

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/8eefb335-944b-4d51-b134-30171be73595.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
