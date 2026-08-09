# ElectricVision Track — Product Requirements

Reverse-documented from the codebase (no prior PRD existed). Reflects what is actually built as
of this writing, not aspirational scope. See `docs/SPEC.md` for the technical/architecture view.

## Overview

ElectricVision Track is a multi-tenant SaaS construction-management ERP built for Romanian
electrical contractor businesses. Each contractor business signs up as its own isolated tenant
(their own sites, workers, financial data) and the same Firestore database serves every tenant.
The product is bilingual: every UI string exists in both English and Romanian.

A single Next.js deployment serves two different experiences depending on the hostname the
request arrives on: the public marketing site (`dimensionvisiontrack.com`) and the authenticated
app (`app.dimensionvisiontrack.com`). There is no separate marketing deployment.

## Roles

Four roles exist, checked at both the UI (navigation visibility) and data (Firestore rules)
layers — though not always consistently between the two (see `docs/SPEC.md` § Known security
gaps).

- **Owner** — full access to everything in their tenant, including Business Units (companies),
  financial-record deletion, and tenant settings. There is exactly one owner per tenant (the
  account that registered).
- **Manager** — day-to-day operational control: can manage sites, workers, the financial pipeline
  (quotes/contracts/invoices/orders/purchases), approve worker hours, and most tenant data. Cannot
  manage Business Units or delete top-level financial records.
- **Supervisor** — field-level oversight without financial visibility. Sees sites, workers, tasks,
  timesheets; the financial pipeline and Business Units are hidden from navigation. (Note: this
  distinction is enforced only by hiding nav items, not by the database security rules — a
  supervisor is otherwise a plain tenant member.)
- **Worker** — the narrowest role. Sees their assigned sites, their own tasks, timesheets, and
  files. Can self-create tasks (only on sites they're assigned to), estimate and submit their own
  hours for approval, but cannot approve hours, manage other workers, or touch financial records.

Workers and managers without an account are "roster-only" — a manager can add someone to the crew
roster before they've accepted an email invite; they don't get self-service access (task
creation, hour submission) until they accept the invite and their account is linked.

## Feature inventory

Status tags: **Live** (real Firestore persistence, working end to end), **Partial** (real
persistence but a meaningful piece is missing or hardcoded), **Scaffold** (built UI, no database
connection at all — refresh loses everything).

### Sites & Workers — Live
Site records (address, client, status, budget, progress, time logs, materials, tools). Worker
roster with hourly rate, experience level, and an email-invite flow that links a worker's account
to their roster entry once accepted. Workers are formally assigned to sites via an explicit
assignment list (a manager picks which workers belong to which site); this list is what gates
which sites a worker can self-create tasks on.

### Tasks & Timesheets — Live
A kanban board (To Do → In Progress → Quality Review → Completed) for site work, layered with a
separate hours-approval workflow: a worker estimates hours on a task, logs the actual hours worked
(with a work date) when done, and submits for manager approval. A manager reviews pending
submissions in a dedicated queue and approves or rejects (with an optional note explaining what to
fix). Approval automatically generates a timesheet entry, splitting hours into standard/overtime/
weekend buckets. Managers can still log timesheet entries directly for cases outside the task flow
(retroactive corrections, non-task work); workers can no longer self-log timesheet hours directly
— the task-approval pipeline is their only path.

### Financial pipeline: Quotes → Contracts → Invoices — Live
Quotes convert into contracts (with e-signature capture); contracts convert into invoices. Invoice
detail pages support a client search/autocomplete (backed by the Contacts directory, can create a
new contact inline), line items that can be imported from a site's logged labor and materials,
automatic VAT calculation, and file attachments (PDF/DOC/DOCX) with inline PDF preview and a
lightweight text-overlay PDF annotation tool. Creating an invoice — whether blank or from a
"Use a Template" picker over past invoices — always lands on the same full invoice detail page for
editing; there's no separate stripped-down creation form.

### Orders — Scaffold
"Site Orders" UI (supplier cost, target markup, auto-calculated client price, status workflow) is
fully built but reads/writes an in-memory demo array only. Nothing persists; a page refresh loses
all data. The page does read the real `sites` collection (to populate its site dropdown), but
never reads or writes an `orders` collection — order records themselves have no Firestore path at
all.

### Purchases — Scaffold, and the save path is broken even as a demo
A "scan receipt" flow (simulated camera + simulated OCR) for logging supplier invoices against a
site. No Firestore import exists in the file at all, and the site dropdown it depends on reads
from an array that's never populated — so the save action always silently no-ops, even for
in-memory demo data. This page cannot record anything, full stop.

### Equipment / Inventory — Scaffold
Asset register with depreciation calculator and maintenance log, navigated to via "Equipment" in
the sidebar (route is `/inventory`). No Firestore connection, no `tenantId` even referenced, and
critically no "Add Equipment" action exists — so even the in-memory demo list can never be
populated through the UI.

### Stocks — Partial
Warehouse material inventory (quantity vs. safety threshold, low-stock alerts, restock flow,
per-item preferred-supplier assignment) is real and persists to Firestore. However there is no
"add new stock item" action anywhere in the UI — items can only be adjusted, never created.

### Contacts — Partial
CRM directory of clients/suppliers/employees/subcontractors. Create and read are real and persist.
There is no edit and no delete action anywhere on this page.

### Companies ("Business Units") — Partial
Lets an owner define multiple divisions/branches under one tenant with an "Active Workspace"
switcher. Create/edit/delete are real and persist. But the per-company stat counters (sites,
workers, managers) are never computed — they show zero forever — and switching the active
workspace has no effect anywhere else in the app. This is not yet real multi-company data
partitioning; every site/worker/task in the tenant is visible regardless of which "workspace" is
selected.

### Calendar — Scaffold
A styled week/month planner (milestones, worker allocations, maintenance events) with working view
switching and filters, but zero live data — the day grid is hardcoded to a fixed month and the
event list is a hardcoded empty array.

### Plan Viewer — Scaffold
Blueprint/drawing viewer with pin-drop task linking, a change-order log, and a simulated
camera-capture flow. Fully interactive, but every data source (drawings, documents, pins, tasks
shown on the canvas) is a hardcoded empty placeholder — the code's own comments say "populated
from Firestore in production."

### Collaborations (cross-tenant contractor linking) — Live
Lets a tenant ("Company A") formally link another tenant ("Company B") as a contractor on one of
A's sites. B's owner discovers which sites they're contracted on via a dedicated page and gets
notified when added. All cross-tenant writes go through server-side API routes (never direct
client writes) to keep tenant data strictly isolated. This is Stage 1 of the collaboration
feature — no data mirroring or merge-request workflow yet.

### Notifications — Live
An in-app notification bell with a real-time unread badge. Producers exist for invite acceptance
and for the task hours-approval workflow (submission, approval, rejection).

### Admin panel (superadmin only) — Live
A cross-tenant control surface for a small allowlisted set of superadmin accounts: tenant list and
plan-tier management, and a global user directory with role/tenant reassignment.

### Dashboard — Partial
The home page for an authenticated user. Active Sites count and Total Workers count are live,
real-time Firestore counts. Hours This Week, Monthly Revenue, and the Recent Activity feed are all
hardcoded placeholders (always 0 / always empty) — not yet computed from real data.

## Known gaps

A consolidated view of everything marked Partial or Scaffold above, for anyone deciding what to
build next:

- **No persistence at all**: Orders, Equipment/Inventory, Calendar, Plan Viewer.
- **No persistence, and structurally broken even as a demo**: Purchases (save action always
  no-ops).
- **Persists, but can't create new records**: Stocks (no add-item action), Equipment would need
  one too if wired up.
- **Persists, but can't edit or delete**: Contacts.
- **Persists, but a core piece is decorative**: Companies (stats always zero; workspace switcher
  has no real effect).
- **Partially computed**: Dashboard (two of four stat cards, and the activity feed, are
  placeholders).
