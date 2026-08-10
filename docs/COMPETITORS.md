# Competitor Research — ElectricVision Track (app.dimensionvisiontrack.com)

Corrected from a first draft that mistakenly researched local Cluj electrical *contractor
businesses* — wrong subject. The actual product is a construction-management **SaaS platform**
for electrical contractors; its competitors are other software products, not electricians.

## iPlan.expert — build-vs-buy threat, not a packaged competitor

Named directly as the closest fit for managing electrical installation teams and worksites.
Scraped their homepage and their `/software` page specifically to verify what it actually is:

- **iPlan is a custom software development agency**, not an off-the-shelf SaaS product. Their own
  pitch: *"Nu te obligăm să te mulezi pe un produs generic"* ("We don't force you into a generic
  product") — they build bespoke apps, client portals, dashboards, and operational modules to a
  business's exact workflow. Alongside "iPlan Software" they also sell website builds, digital
  marketing, and AI automation/agents as separate service lines — construction is one of several
  industries they mention serving, not their sole focus.
- **No public feature list or pricing** exists for whatever electrical-team/worksite tooling they
  may have built for a specific client — that's inherent to a custom-build model, not a gap in this
  research. "Contact for pricing" is the only signal on the page.
- **Why this still matters competitively**: iPlan isn't a rival product to compare feature-by-feature
  against — it's a different purchase decision entirely. A contractor business deciding between
  "subscribe to ElectricVision Track" and "pay an agency to build us something custom" is a real
  fork in the buying process, just a slower and more expensive path to the same destination.

## Productized SaaS competitors (public features + pricing)

### Knowify — closest feature match found
- **What it is**: Project/team/finance management built specifically for small-to-medium trade
  contractors, electrical included.
- **Features**: estimating & proposals, change orders, RFI/submittal tracking, scheduling, time
  tracking, subcontractor management, inventory, client portal, invoicing & payments, budgeting,
  job costing, reporting.
- **Pricing**: starts at **$99/month**.
- Nearly a direct mirror of ElectricVision Track's own quotes→contracts→invoices pipeline +
  timesheets + inventory + subcontractor/collaboration model.

### Fieldwire (by Hilti) — plan-viewer overlap
- **What it is**: Field management/collaboration software for construction teams, with a
  dedicated electrical-contractor landing page.
- **Features**: task management, scheduling, punch lists, inspections, RFIs, submittals, change
  orders, budget tracking, document management, **plan viewing, as-built drawings, BIM viewer**.
- **Pricing**: tiered (Business, Business Plus, Pro) — exact numbers not surfaced on this page.
- The plan-viewing/BIM angle is the one area where Fieldwire goes further than ElectricVision
  Track's current Plan Viewer (which itself is still a UI scaffold with no live data, per
  `docs/PRD.md`).

### Deltek ComputerEase — accounting-first angle
- **What it is**: Electrical-contractor-specific software leaning heavily into back-office
  operations.
- **Features**: job cost accounting, billing/invoicing, estimating, project management, work
  order management, time tracking, fleet management, CRM.
- **Pricing**: not published.
- Positions itself more as accounting/ERP-first than field-operations-first — a different angle
  than ElectricVision Track's task/timesheet-approval-centric design.

### BuildOps — field service dispatch angle
- **What it is**: Field service management for commercial contractors across HVAC, electrical,
  plumbing, fire safety, refrigeration.
- **Features**: real-time dispatch board, AI-powered mobile app, customer/asset management, job
  costing, time tracking, invoicing/payments, reporting.
- **Pricing**: per-user/month, custom quote via demo.
- Multi-trade rather than electrical-specific; dispatch-board framing suggests a reactive
  service-call business model more than planned project/site work.

### Podium — adjacent, not a direct competitor
- **What it is**: Lead response, customer communication, and review management, with some
  scheduling/dispatch and invoicing bolted on.
- Closer to a CRM/communications tool that happens to serve electrical contractors than a
  project/worksite management platform. Listed for completeness, not a strong direct competitor.

## Feature comparison

| Capability | ElectricVision Track | Knowify | Fieldwire | Deltek ComputerEase | BuildOps |
|---|---|---|---|---|---|
| Quotes → Contracts → Invoices | ✅ (live) | ✅ | — | ✅ (accounting-led) | ✅ (invoicing only) |
| Task + timesheet approval workflow | ✅ (live, built this session) | ✅ (time tracking) | ✅ (task mgmt) | ✅ (time tracking) | ✅ (job costing/time) |
| Site/plan viewer | Scaffold, no data yet | — | ✅ (BIM viewer, ahead) | — | — |
| Inventory/materials | Partial (no create action) | ✅ | — | — | — |
| Cross-tenant contractor collaboration | ✅ (live, built this session) | — | — | — | — |
| Published starting price | Not public yet | $99/mo | Tiered, undisclosed | Not public | Per-user, custom |

## Method

Firecrawl `search()` for `"software management electrical contractors worksites"`,
`"construction management software field service electrical teams"`, `"field service management
software Romania"`, `"workforce management app construction electrical installation"`, plus a
direct scrape of `iplan.expert` (homepage and `/software` subpage specifically, at the user's
correction). Structured `json` extraction per candidate (product name, description, core
features, target customer, pricing signals) via `client.scrape(url, { formats: [{ type: 'json',
schema: {...} }] })`. One Reddit thread returned unsupported-site and was dropped; one directory/
comparison-site result (getapp.com) was excluded as not itself a product.

**Correction note**: the first version of this document researched local Cluj-Napoca electrical
*contracting* businesses (confusing the app's own demo/placeholder tenant persona with the actual
subject) — wrong research entirely, replaced here.
