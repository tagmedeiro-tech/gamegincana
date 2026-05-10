# Security Specification - Gincana da Tribo

## 1. Data Invariants

1.  **User Profiles**:
    *   `uid` must match the document ID.
    *   `email` must match the authenticated user's email.
    *   `role` can only be set to 'participant' or 'leader' by a user during initial creation (if allowed) or must be managed by an admin.
    *   `totalPoints` is system-incremented; users cannot directly edit their own points.
    *   `achievements` can only be added by the system logic (admin or automated triggers).

2.  **Groups**:
    *   Only admins can create or modify groups.
    *   `totalPoints` and `memberCount` are managed by the system.

3.  **Activities**:
    *   Only admins can create or modify activities.
    *   Users can only read active activities.

4.  **Participations**:
    *   A participation record cannot exist without a valid user ID, group ID, and activity ID.
    *   `userId` must match the authenticated user.
    *   `groupId` must match the user's current group.
    *   Initially created with status 'pending'.
    *   Only leaders or admins can update status to 'approved' or 'rejected'.
    *   Once 'approved', it becomes immutable (or terminal).

## 2. The "Dirty Dozen" Payloads (Attacks)

| ID | Target Path | Action | Description | Payload | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | `/users/victim-123` | update | Change someone else's points | `{"totalPoints": 9999}` | PERMISSION_DENIED |
| A2 | `/users/my-uid` | update | Escalate own role to admin | `{"role": "admin"}` | PERMISSION_DENIED |
| A3 | `/groups/group-1` | create | Create unauthorized group | `{"name": "Team Chaos", "leaderId": "my-uid"}` | PERMISSION_DENIED |
| A4 | `/activities/act-1` | update | Modify points of a challenge | `{"points": 1000}` | PERMISSION_DENIED |
| A5 | `/participations/p1` | create | Spoof userId in participation | `{"userId": "other-user", "activityId": "a1", "status": "pending"}` | PERMISSION_DENIED |
| A6 | `/participations/p1` | update | Self-approve own participation | `{"status": "approved"}` | PERMISSION_DENIED |
| A7 | `/users/my-uid` | update | Inject huge string into name | `{"name": "A".repeat(1000000)}` | PERMISSION_DENIED |
| A8 | `/participations/p2` | create | Create record for non-existent activity | `{"activityId": "fake-act", "status": "pending"}` | PERMISSION_DENIED |
| A9 | `/users/my-uid` | create | Spoof email in profile | `{"email": "admin@church.com", "uid": "my-uid", "name": "Me", "role": "participant"}` | PERMISSION_DENIED |
| A10 | `/activities/act-1` | delete | Delete an activity as participant | `null` | PERMISSION_DENIED |
| A11 | `/groups/group-1` | update | Change leader of a group | `{"leaderId": "my-uid"}` | PERMISSION_DENIED |
| A12 | `/participations/p1` | update | Change activityId after creation | `{"activityId": "different-act"}` | PERMISSION_DENIED |

## 3. Test Runner Definition

The tests will be implemented in `firestore.rules.test.ts` using the Firebase Rules Emulator.
