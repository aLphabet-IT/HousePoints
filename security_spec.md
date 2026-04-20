# Security Specification - MyHouse

## Data Invariants
1. Students cannot award points to themselves or others.
2. Teachers can award points but cannot delete or edit logs.
3. Admins have full CRUD on everything.
4. House points must be updated via a batch or transaction along with the log entry (enforced by existsAfter if possible, but basic rules will protect the individual docs).
5. No user can change their own role once created (unless Admin).

## The Dirty Dozen (Attacker Payloads)
1. **The Role Escalation**: A student tries to update their own role to 'admin'.
2. **The Unauthorized Log**: A student tries to create a point log entry.
3. **The Ghost Field**: A teacher tries to add an `isAdmin: true` field to their profile.
4. **The Huge ID**: An attacker tries to create a house with a 1MB string as the ID.
5. **The Negative Drain**: A malicious teacher tries to deduct 1,000,000 points from a house.
6. **The Identity Spoof**: A teacher tries to award points and set `awardedBy` to "Super Admin".
7. **The Terminal Lock Break**: Trying to edit a historical point log after it's been submitted.
8. **The Orphaned Point**: Creating a point log for a non-existent house.
9. **The Blanket Read**: Authenticated user trying to crawl the entire `users` collection without a specific UID.
10. **The PII Leak**: A student trying to read another student's specific profile details.
11. **The Timestamp Cheat**: Sending a `timestamp` from 2 weeks ago in a new log entry.
12. **The Rank Hack**: Manually updating a house's `rank` without recalculating.

## Test Runner Logic
The rules will prevent:
- Any write to `users` where `role` is being set by a non-admin.
- Any write to `pointsLog` by a user whose role in `users/uid` is not 'teacher' or 'admin'.
- Any update to `pointsLog` entries once created (immutable logs).
- Updates to `houses` totaling points that don't match the user's role permissions.
