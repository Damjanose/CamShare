# Account Deletion Flow — Mobile

**Date:** 2026-05-20  
**Plan:** [superpowers/plans/2026-05-20-account-deletion.md](../superpowers/plans/2026-05-20-account-deletion.md)

## What changed
Added "Delete Account" row to ProfileScreen with a two-step confirmation flow (confirm dialog → loading state → logout on success).

## Files modified
| File | Change |
|------|--------|
| `apps/mobile/src/services/auth.ts` | Added `deleteAccount()` API call (`DELETE /account`) |
| `apps/mobile/src/context/AuthContext.tsx` | Added `deleteAccount` type, implementation, and Provider value |
| `apps/mobile/src/screens/ProfileScreen.tsx` | Added Delete Account row with confirmation dialog + loading state |

## Gotchas / non-obvious decisions
- No LoginScreen changes needed — existing error handler already shows API error strings in a Snackbar
- After deletion, user is soft-deleted for 30 days; if they log in within that window they get a recovery prompt (handled API-side)
- Confirmation is two-step: tap row → alert dialog → confirm → DELETE call
