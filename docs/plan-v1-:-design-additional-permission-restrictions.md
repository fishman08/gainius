I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

## Observations

The codebase has successfully implemented basic role-based access control with API key visibility restricted to admins. After analyzing the settings components, storage services, and data operations, several additional sensitive features have been identified that currently lack role-based restrictions. The app includes data export/import functionality that allows full backup and restore of user data, custom AI instruction configuration that affects AI behavior, notification preferences, and manual sync triggers. The database schema uses Row Level Security (RLS) policies that currently only enforce user-level isolation without admin-specific privileges.

## Approach

Recommend a tiered approach to role-based restrictions focusing on features that could impact data integrity, system resources, or user privacy. Prioritize restrictions on bulk data operations and AI behavior customization while keeping user-facing features like notifications accessible to all users. Provide clear security rationale for each recommendation to help make informed decisions about which restrictions to implement. The approach balances security with usability, ensuring regular users retain access to essential features while protecting sensitive operations.

## Additional Role-Based Restrictions

### 1. **Data Export/Import Operations** (HIGH PRIORITY)

**Recommendation:** Restrict to admin users only

**Security Rationale:**

- **Data Integrity Risk:** Import operations can overwrite existing data, potentially causing data loss if users import corrupted or incompatible files
- **Privacy Concerns:** Export contains complete user data including all conversations, workout history, and personal information
- **Abuse Potential:** Unrestricted export/import could be exploited for data exfiltration or manipulation
- **Resource Impact:** Large exports/imports can consume significant storage and processing resources

**Implementation:**

- Update `file:apps/web/src/components/settings/DataExport.tsx` to wrap the entire component in admin check: `{currentUser?.role === 'admin' && <DataExport />}`
- Update `file:apps/mobile/src/components/settings/DataExport.tsx` similarly
- Add server-side validation in `file:packages/shared/src/sync/dataExport.ts` functions to verify admin role before executing operations
- Consider adding audit logging for all export/import operations

### 2. **Custom AI Instructions** (ALREADY RESTRICTED)

**Status:** Already being restricted per the previous implementation plan

**Security Rationale:**

- **Prompt Injection Risk:** Malicious custom prompts could manipulate AI behavior in unintended ways
- **Cost Control:** Custom prompts increase token usage and API costs
- **Quality Assurance:** Unrestricted prompt customization can lead to poor AI responses affecting user experience

### 3. **Notification Settings** (LOW PRIORITY)

**Recommendation:** Keep accessible to all users

**Security Rationale:**

- **User Autonomy:** Notification preferences are personal settings that don't affect other users or system integrity
- **No Security Risk:** Enabling/disabling notifications has no data integrity or privacy implications
- **User Experience:** Restricting this would frustrate regular users without meaningful security benefit

**Implementation:** No changes needed - maintain current open access

### 4. **Manual Sync Trigger** (LOW PRIORITY)

**Recommendation:** Keep accessible to all users

**Security Rationale:**

- **User Control:** Users should be able to manually sync their own data when needed
- **Limited Risk:** Sync operations are already protected by RLS policies and user authentication
- **Rate Limiting:** Consider implementing rate limiting rather than role-based restriction

**Implementation:** No changes needed, but consider adding:

- Rate limiting in `file:packages/shared/src/sync/syncEngine.ts` to prevent abuse (e.g., max 10 syncs per minute)
- Cooldown period between manual sync triggers

### 5. **Bulk Deletion Operations** (MEDIUM PRIORITY)

**Recommendation:** Add confirmation dialogs for regular users, optional admin-only restriction for `clearAllData`

**Security Rationale:**

- **Data Loss Prevention:** Accidental bulk deletions can cause irreversible data loss
- **User Protection:** Regular users may not understand the implications of clearing all data

**Implementation:**

- Keep `deleteWorkoutSession` accessible to all users (it's their own data)
- If `clearAllData` is exposed in UI, restrict to admins only or add multi-step confirmation
- Add "Are you sure?" confirmation dialogs with clear warnings

### 6. **Database Schema Modifications** (ADMIN-ONLY)

**Recommendation:** Ensure RLS policies prevent regular users from modifying schema or system tables

**Current Status:** RLS policies in `file:packages/shared/src/sync/schema.sql` already enforce user-level isolation

**Security Rationale:**

- **System Integrity:** Schema changes should only be performed by administrators
- **Data Consistency:** Prevents users from corrupting database structure

**Implementation:** No changes needed - current RLS policies are sufficient

### 7. **User Role Management** (FUTURE CONSIDERATION)

**Recommendation:** Add admin-only interface to manage user roles

**Security Rationale:**

- **Access Control:** Only admins should be able to promote/demote users
- **Audit Trail:** Role changes should be logged for security auditing

**Implementation (Future):**

- Create admin panel component to view all users and modify roles
- Add RLS policy to prevent non-admins from updating the `role` column
- Implement audit logging for role changes

## Summary Table

| Feature                | Restriction Level | Priority       | Rationale                   |
| ---------------------- | ----------------- | -------------- | --------------------------- |
| API Key Management     | Admin Only        | ✅ Implemented | Cost control, security      |
| Custom AI Instructions | Admin Only        | ✅ Implemented | Prompt injection, quality   |
| Data Export/Import     | **Admin Only**    | 🔴 HIGH        | Data integrity, privacy     |
| Notification Settings  | All Users         | ⚪ N/A         | User autonomy, no risk      |
| Manual Sync            | All Users         | ⚪ N/A         | User control, RLS protected |
| Delete Workout Session | All Users         | ⚪ N/A         | Own data management         |
| Clear All Data         | Admin Only        | 🟡 MEDIUM      | Data loss prevention        |
| Role Management        | Admin Only        | 🔵 FUTURE      | Access control              |

## Recommended Implementation Order

1. **Immediate:** Restrict data export/import to admins (HIGH priority)
2. **Short-term:** Add confirmation dialogs for deletion operations (MEDIUM priority)
3. **Long-term:** Build admin panel for user role management (FUTURE consideration)

## Additional Security Recommendations

### Rate Limiting

Add rate limiting to prevent abuse of resource-intensive operations:

- Sync operations: Max 10 per minute per user
- API calls: Max 50 per hour per user
- Export operations: Max 5 per day per user

### Audit Logging

Implement audit logging for sensitive operations:

- Role changes
- Data export/import operations
- Bulk deletion operations
- API key modifications

### RLS Policy Enhancement

Consider adding admin-specific RLS policies:

```sql
-- Allow admins to view all users (for user management)
CREATE POLICY admin_view_all_users ON users FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
```

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/ba15c639-e3cc-4dc2-941a-c141f74c4f05.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
