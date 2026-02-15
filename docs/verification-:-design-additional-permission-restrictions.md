I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---

## Comment 1: RLS allows any user to self-promote to admin by updating their own `role`

In `packages/shared/src/sync/schema.sql`, modify the `users_update` policy (or add a dedicated one) so regular users cannot change `role`. For example, add a `WITH CHECK` that enforces `role` remains unchanged for non-admins, or a trigger that raises an error if `NEW.role != OLD.role` unless `request.jwt.claims.role = 'admin'`. Ensure only admins/service roles can elevate roles.

### Referred Files

- /Users/alexsalman/Desktop/claude_projects/Workout App/packages/shared/src/sync/schema.sql

---

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/4bd0ff0c-383d-445d-915a-b0f36faf06cc.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
