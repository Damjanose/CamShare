# Account Deletion — Soft Delete

**Date:** 2026-05-20  
**Plan:** [superpowers/plans/2026-05-20-account-deletion.md](../superpowers/plans/2026-05-20-account-deletion.md)

## What changed
Added soft-delete account deletion via `DELETE /account`. Deleted accounts get a 30-day recovery window on login; after expiry a lazy hard-delete runs.

## Files modified
| File | Change |
|------|--------|
| `db/migrations/005_account_deletion.sql` | New — adds `deleted_at TIMESTAMPTZ` + index on `users` |
| `apps/api/src/lib/db.ts` | Added `deleted_at: Date \| null` to `UsersTable` |
| `apps/api/src/lib/auth.ts` | Added `deleteAccount()` fn; added `deleted_at` check in `login` |
| `apps/api/src/handlers/auth.ts` | Added `deleteAccount` handler; new error string in `handleError` |
| `apps/api/src/index.ts` | Registered `DELETE /account` route |

## Gotchas / non-obvious decisions
- Soft-delete only — no immediate data removal. Hard-delete is lazy (triggered at login after 30-day expiry)
- `login` must check `deleted_at` and return a specific error string — mobile LoginScreen reads it as a Snackbar message
- No mobile LoginScreen changes needed: existing error handler already shows API message strings
- Migration is `005_` — runs before `006_user_avatar`
