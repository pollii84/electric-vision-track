# Handoff Document — Electric Vision Track
_Last updated: 2026-06-12_

## App
- **URL**: app.dimensionvisiontrack.com
- **Repo**: github.com/pollii84/electric-vision-track
- **Stack**: Next.js 16.2.6 App Router + Firebase Auth + Firestore + Firebase App Hosting
- **Auto-deploy**: `git push origin main` → Firebase App Hosting deploys automatically

## Architecture
- Multi-tenant: `tenantId = owner's UID`
- Role hierarchy: owner > manager > worker (6 experience levels)
- Non-owner accounts created via invite flow only
- All tenant data under `tenants/{tenantId}/` in Firestore

## Invite Flow — COMPLETED (this session)

### Files added/modified:
| File | Status | Purpose |
|------|--------|---------|
| `src/lib/invites.js` | NEW | `createInvite`, `getInvite`, `acceptInvite` |
| `src/app/invite/[token]/page.js` | NEW | Public accept-invite page (creates Firebase Auth account) |
| `src/app/workers/page.js` | MODIFIED | Invite button + status badges + invite modal (link + QR) |
| `src/lib/i18n/en.json` | MODIFIED | Added `workers.invite.*` keys |
| `src/lib/i18n/ro.json` | MODIFIED | Added `workers.invite.*` keys (Romanian) |

### How it works:
1. Owner opens Workers page, clicks "Send Invite" on a worker card
2. `createInvite()` writes `invites/{token}` (global collection, 7-day TTL)
3. Modal shows link + QR code for owner to share
4. Worker opens `app.../invite/{token}` in browser
5. Form: email (readonly), name (editable), password
6. On submit: `createUserWithEmailAndPassword` → writes `users/{uid}` + `tenants/{tenantId}/members/{uid}` → `acceptInvite()` marks token used + writes `authUid` to worker record

### Firestore collections used:
- `invites/{token}` — global, no auth needed to read
- `tenants/{tenantId}/workers/{workerId}` — updated with `authUid` + `inviteStatus`
- `tenants/{tenantId}/members/{uid}` — created on accept
- `users/{uid}` — created on accept

## Known Issues / Pending Work

### Security (not fixed yet)
- `src/contexts/AuthContext.js` L87,94: `polimoga@gmail.com` hardcoded as owner check — must be replaced with Firestore UID-based check
- `src/app/login/page.js` ~L395: test credentials visible in UI — must be removed before production
- `isDemo` not exported from AuthContext but used in Layout.js and Settings.js — always `undefined`

### Missing features
- Role-based access control: all authenticated users see all pages regardless of role
- Workers page: "Send Invite" button shows for workers without email — should be hidden (already handled: `!worker.authUid && worker.email`)
- Re-invite flow: if invite expires, owner can click "Send Invite" again — `createInvite` will generate a new token but old one stays in Firestore (not a bug, just FYI)

## Design System
- `PRODUCT.md` — strategic context (register: product, North Star: "The Switchboard")
- `DESIGN.md` — visual spec (Conductor Gold #FFCA00, dark industrial)
- `.impeccable/design.json` — design tokens sidecar (7 components + tonal ramps)
- `.impeccable/live/config.json` — live iteration config

## Git Branches
- `main` — production (auto-deploys)
- `backup/pre-commit-2026-06-03` — snapshot before design system commit

## i18n
- `src/lib/i18n/en.json` — English
- `src/lib/i18n/ro.json` — Romanian
- Hook: `useI18n()` → `t('key.path')`

## Key Files
- `src/contexts/AuthContext.js` — auth state, role, tenantId
- `src/contexts/BusinessContext.js` — company switcher
- `src/lib/firebase.js` — Firebase init
- `src/lib/invites.js` — invite CRUD
- `src/app/workers/page.js` — workers list + invite flow
- `src/app/invite/[token]/page.js` — accept invite (public)
- `src/components/Layout.js` — nav + sidebar

## Next Steps (suggested)
1. Fix security issues in AuthContext.js and login/page.js
2. Fix `isDemo` export in AuthContext
3. Add Firestore Security Rules for `invites` collection (allow read if `status == 'pending'`, write only for authenticated owners)
4. Test invite flow end-to-end
5. Add role-based route guards
