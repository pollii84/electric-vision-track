# ElectricVision Track — UX: Flows, Sitemap, Information Architecture

Reverse-documented from the actual routing, nav-filtering, and page code (`src/components/
Layout.js`, `src/app/**/page.js`). See `docs/PRD.md` for feature status and `docs/SPEC.md` for
the technical model.

## Sitemap

```
/                          Dashboard (app host) — or Marketing landing page (marketing host)
├── /calendar               Scaffold, no live data
├── /sites                  → /sites/[id]
├── /workers                → /workers/[id]
├── /tasks                  Kanban + Pending Approval tab
├── /plan-viewer             Scaffold, no live data
├── /timesheets
├── /quotes                 → /quotes/[id]
├── /offers
├── /orders                  Scaffold, no live data
├── /contracts               → /contracts/[id]
├── /invoices                → /invoices/[id]
├── /purchases                Scaffold, save path broken
├── /stocks
├── /inventory                Scaffold, no live data ("Equipment" in nav)
├── /contacts
├── /files
├── /collaborations
├── /settings
├── /companies                Owner-only
├── /admin, /admin/tenants, /admin/users     Superadmin-only, cross-tenant
├── /login, /register
└── /marketing, /privacy, /terms             Public, unauthenticated
```

## Information architecture (sidebar navigation)

The sidebar groups pages into six sections (`Layout.js`'s `NAV_SECTIONS`); which sections and
items a given user sees depends on their tenant role:

| Section | Pages | Visible to |
|---|---|---|
| General | Dashboard, Calendar | Everyone |
| Operations | Sites, Workers, Tasks, Blueprint Viewer, Timesheets | Everyone |
| Financial | Quotes, Offers, Orders, Contracts, Invoices, Purchases | Owner, manager (hidden from supervisor, worker) |
| Inventory | Stocks, Equipment | Everyone except worker |
| Other | Contacts, Files, Collaborations, Settings, Business Units | Business Units: owner only. Rest: everyone except worker sees a narrower set (Files, Settings only — no Contacts/Collaborations) |
| Admin | Admin Dashboard, Tenants, Global Users | Superadmin only (separate from tenant role entirely) |

**Worker role** sees the narrowest set regardless of section boundaries: Dashboard, Calendar,
Sites, Workers, Tasks, Blueprint Viewer, Timesheets, Files, Settings — explicitly filtered in
`Layout.js`, not derived from the section table above.

Mobile bottom nav (separate, smaller set — 4 items + "More"): Dashboard, Sites, Workers,
Timesheets, then a "More" button opening the full nav as a bottom-sheet overlay.

**Route guard note**: nav visibility and actual page access are enforced separately and don't
always agree — `Layout.js`'s redirect-on-unauthorized logic only actively blocks two groups
(`/companies` for non-owners, the financial route group for non-manager+). Stocks, Inventory, and
Contacts are hidden from a worker's nav but not route-guarded — a worker who navigates there
directly sees the page (writes still fail at the Firestore-rules layer). See `docs/SPEC.md` §
Known security gaps.

## Page structure (shared layout anatomy)

Nearly every list/detail page in the app follows the same skeleton:

1. **Page header** — `<h1>` with an emoji icon + title, primary action button(s) top-right
   (e.g. "+ Create Task"). On pages with a template/secondary path (Invoices), a `btn-secondary`
   sits to the left of the `btn-primary`.
2. **Filter/search row** (list pages only) — a `.search-bar` (icon + text input) and/or
   `.filter-chips` (pill-shaped status filters, one marked `.active`).
3. **Content area** — either a `.data-table-wrapper` (desktop) paired with a `.mobile-card-list`
   (mobile, same data re-rendered as stacked cards below 768px — see `docs/DESIGN_SYSTEM.md`), or
   a `.content-grid` of `.glass-card` tiles for card-based listings (Sites, Companies).
4. **Modals** — creation/edit forms, confirmation dialogs, and detail drill-ins are modal-based
   (`.modal-backdrop` + `.modal`), not separate routes, except where a page genuinely has its own
   detail route (`/sites/[id]`, `/workers/[id]`, `/tasks` has no detail route — task detail is a
   modal — `/quotes/[id]`, `/contracts/[id]`, `/invoices/[id]`).
5. **Empty state** — `.empty-state` (centered icon + title + description + primary action) when a
   list has zero items, consistently across every list page.

Detail pages (`/sites/[id]`, `/workers/[id]`, `/invoices/[id]`, `/quotes/[id]`, `/contracts/[id]`)
share a second pattern: a profile/summary `.glass-card` up top, then either tabs (`.tabs`/`.tab`)
or stacked sections for sub-data (Site: Overview/Time Logs/Materials/Tools/Contractors tabs;
Worker: profile + stat cards + Assigned Sites + Recent Time Logs; Invoice: Details, Client, Line
Items, Attachments, Payment Summary as stacked sections, not tabs).

## Key user flows

### Registration → first login (owner)
Marketing site CTA → `/register` (2-step form: company + CUI/EUID lookup + plan tier, then owner
name/email/phone/password) → `AuthContext.createAccount()` writes `tenants/{uid}`, `users/{uid}`,
and `tenants/{uid}/members/{uid}` (role `owner`) in one pass → redirected to `/` (Dashboard).

### Invite → accept → self-service worker
Manager adds a worker to the roster (`/workers`, roster-only, no `authUid` yet) → worker receives
an invite → accepts via `/login?invited=1` (banner shown) → `/api/invite/accept` links the
worker's `authUid` to their roster entry and flips `inviteStatus` to active → worker can now log
in and see their own assigned sites/tasks.

### Site setup → worker assignment → task creation
Manager creates a site (`/sites`, required: name/client/address) → opens the site detail page's
Overview tab → uses the "Assign Worker" control to add specific workers to `site.workerIds` → a
manager can now create a task on that site for *any* worker in the tenant (not limited to workers
formally assigned to that specific site — assignment only gates a *worker's own* self-service task
creation, which is restricted to sites they're assigned to).

### Task lifecycle: estimate → actual hours → approval → timesheet
Worker (or manager, on a worker's behalf) creates a task with an hours estimate → task moves
through kanban columns (To Do → In Progress → Quality Review → Completed) as work progresses,
independently of the hours flow → when done, the assigned worker opens "Log Hours," enters actual
hours + the work date, submits → task enters "Pending Approval," every tenant manager gets
notified → a manager reviews in the Pending Approval tab, approves (auto-creates a timesheet entry
with standard/overtime/weekend hours split, worker notified) or rejects with a note (worker
notified, corrects, resubmits).

### Quotes → Contracts → Invoices
Quote built with materials/labor line items and a target margin → converted to a contract (adds
e-signature capture, advance/penalty terms) → contract can be converted onward to an invoice, or
an invoice can be created independently.

### Invoice creation (blank or templated)
"Create Invoice" and "Use a Template" both do the same thing at the data level: create a bare
invoice doc (blank, or pre-filled from a picked past invoice via a picker modal) and land
immediately on the invoice detail page — there's no separate stripped-down creation form. On the
detail page: client search/autocomplete (or inline "create new contact"), site selection, line
items (manual entry or "Import Labor"/"Import Materials" pulled from the site's logged
timesheets/materials), automatic VAT calculation, and file attachments.

### Invoice attachments: upload → view → annotate
Upload a PDF/DOC/DOCX (25MB limit) → PDF gets an inline expandable preview + a lightweight
text-overlay annotation tool (add text at page/x/y coordinates, saves as a new version linked back
to the original); DOCX/DOC gets download-only, no inline preview.

### Cross-tenant collaboration
Company A's manager, from a site's Contractors tab, resolves Company B by its owner's email
(returns only the company name — minimal disclosure) → confirms → link created server-side (Admin
SDK, never a direct client write) → B's owner is notified and sees the site listed on their own
`/collaborations` page, labeled "Working for {A's company name}." Stage 1 only — no data mirroring
or merge-request workflow between the two tenants yet.

## In-app notifications vs. toasts (two different mechanisms — don't conflate)

- **Notification bell** (persistent, cross-session): a Firestore-backed feed
  (`tenants/{tenantId}/notifications`) surfaced via a sidebar bell icon with an unread-count badge
  and a dropdown panel. Producers today: invite acceptance, and the task hours-approval workflow
  (submitted/approved/rejected). Persists until the recipient marks it read.
- **Toast** (ephemeral, session-only, no persistence): a corner pop-up for immediate action
  feedback ("Task created successfully," "Invoice saved"). Auto-dismisses after ~4 seconds, never
  written to Firestore, gone on page refresh. See `docs/DESIGN_SYSTEM.md` for the toast component
  detail (including a real inconsistency: unused legacy CSS in `globals.css` vs. the actual
  component-scoped implementation).
