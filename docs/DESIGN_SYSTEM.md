# ElectricVision Track — Design System

Every token and component class below is quoted directly from `src/styles/globals.css` (2047
lines, read in full) and cross-checked against actual usage in `src/app/**` and `src/components/**`
before being documented — anything that turned out to be defined-but-unused CSS is flagged
explicitly rather than presented as a live pattern. See `docs/UX.md` for how these compose into
pages and flows.

## Theme

Dark industrial theme. Signature gold primary (`#FFCA00`) against deep charcoal backgrounds, with
electric blue as a secondary accent. Glassmorphism (translucent, blurred cards) is the dominant
surface treatment, not solid panels.

## Colors

| Token | Value | Use |
|---|---|---|
| `--clr-primary` | `#FFCA00` | Primary brand gold — primary buttons, active nav, focus rings |
| `--clr-primary-light` | `#FFD740` | Hover states, gradient highlights |
| `--clr-primary-dark` | `#E0B200` | Gradient shading, pressed states |
| `--clr-primary-glow` | `rgba(255,202,0,0.25)` | Box-shadow glows |
| `--clr-primary-subtle` | `rgba(255,202,0,0.08)` | Subtle tinted backgrounds (active badge/nav bg) |
| `--clr-accent` | `#0693E3` | Electric blue — secondary accent, info badge |
| `--clr-accent-light` / `-dark` | `#4DA6FF` / `#0570B0` | Accent hover/shade |
| `--clr-success` | `#22C55E` | Success state, positive badges |
| `--clr-danger` | `#EF4444` | Destructive actions, error state |
| `--clr-warning` | `#F59E0B` | Warning badges (e.g. hours pending) |
| `--clr-info` | `#06B6D4` | Reserved informational tone (little used) |
| `--clr-bg-deep` | `#1F212C` | Page background (body) |
| `--clr-bg-base` | `#252731` | Base surface |
| `--clr-bg-surface` | `#2A2C38` | `.card`, `.modal`, `.mobile-card-list` items |
| `--clr-bg-elevated` | `#32343F` | Form inputs, table headers, elevated rows |
| `--clr-bg-hover` | `#3A3D48` | Hover backgrounds |
| `--clr-bg-active` | `#434652` | Pressed/active backgrounds, scrollbar thumb |
| `--clr-text` | `#F5F5F5` | Primary text |
| `--clr-text-secondary` | `#B5B5BA` | Secondary text (labels, nav links) |
| `--clr-text-muted` | `#768492` | Muted/meta text |
| `--clr-text-disabled` | `#4B5563` | Disabled text |
| `--clr-border` | `rgba(255,255,255,0.08)` | Default hairline border |
| `--clr-border-hover` | `rgba(255,255,255,0.14)` | Border on hover |
| `--clr-border-focus` | = `--clr-primary` | Focus ring color |

Every semantic color also has a `-light` variant and a soft `rgba(...)` glow variant for
box-shadows — the pattern is consistent across primary/accent/success/danger.

**Badges** use a fixed opacity formula, not the raw colors above: `rgba(<color>, 0.1)` background
+ `rgba(<color>, 0.15)` border + the `-light` text variant (or base color for warning/accent).
Six variants: `badge-primary`, `badge-success`, `badge-warning`, `badge-danger`, `badge-accent`,
`badge-neutral` (gray, `rgba(107,114,128,...)`).

## Typography

- **Body**: Inter (weights 300–800), loaded via Google Fonts `@import`.
- **Headings**: Poppins (weights 500–800), falls back to Inter.
- **Monospace**: JetBrains Mono / Fira Code (declared as a token; not visibly used in any scanned
  component — likely reserved for future numeric/code display).

| Token | Size | Px equivalent |
|---|---|---|
| `--fs-xs` | 0.6875rem | 11px |
| `--fs-sm` | 0.75rem | 12px |
| `--fs-base` | 0.875rem | 14px (body default) |
| `--fs-md` | 1rem | 16px |
| `--fs-lg` | 1.125rem | 18px |
| `--fs-xl` | 1.25rem | 20px |
| `--fs-2xl` | 1.5rem | 24px |
| `--fs-3xl` | 1.875rem | 30px |
| `--fs-4xl` | 2.25rem | 36px |
| `--fs-5xl` | 3rem | 48px (defined, not seen in use — likely reserved for marketing hero) |

Heading elements map directly: `h1`→`--fs-4xl`, `h2`→`--fs-2xl`, `h3`→`--fs-xl`, `h4`→`--fs-lg`,
`h5`→`--fs-md`, all Poppins/700 weight, `-0.01em` letter-spacing. Line-heights: tight `1.2`
(headings), normal `1.5` (body default), relaxed `1.7` (long-form paragraph text). Below 768px,
`h1`/`h2` step down one size (`--fs-2xl`/`--fs-xl`) to avoid overflow on mobile.

## Spacing

4px base unit, doubling-ish scale: `--sp-xs 4px` · `--sp-sm 8px` · `--sp-md 16px` · `--sp-lg 24px`
· `--sp-xl 32px` · `--sp-2xl 48px` · `--sp-3xl 64px`. `--sp-md`/`--sp-lg` are the two workhorses —
most card padding, form-group gaps, and page-level margins use one of these two.

## Radius, shadow, motion

- **Radius**: `--radius-xs 4px` · `sm 8px` · `md 12px` · `lg 16px` (glass-cards, modals) ·
  `xl 20px` (modal container itself) · `full 9999px` (badges, avatars, chips, pill buttons).
- **Shadow**: `sm`/`md`/`lg` (increasing black-alpha depth) plus four glow variants
  (`shadow-glow-primary/accent/success/danger`) used for hover emphasis on buttons and featured
  cards, not general elevation.
- **Motion**: two easing curves — `--ease-out` (`cubic-bezier(0.16,1,0.3,1)`, most transitions)
  and `--ease-in-out` (`cubic-bezier(0.65,0,0.35,1)`, background/theme shifts). Three durations:
  fast `150ms` (hover/focus), normal `250ms` (cards, modals), slow `400ms` (page-level).

## Iconography — emoji, not an icon library

No icon package is installed (no Heroicons, Lucide, react-icons, etc. in `package.json`). Every
icon in the product — nav items, page headers, stat cards, buttons, empty states — is a Unicode
emoji rendered as plain text, styled via `font-size` and occasionally wrapped in a colored circular
container (`.stat-icon`, `.empty-state-icon`, `.feature-card-icon`, `.sidebar-logo-icon`). This is
consistent across every page scanned this session, not an isolated shortcut — treat it as the
established icon system, not a placeholder to eventually replace. Representative examples:
🏗️ sites · 👷 workers · 📋 tasks · ⏱️ timesheets · 📝 quotes · 📑 contracts · 🧾 invoices ·
📦 orders/purchases · 📊 stocks · 🔧 equipment · 👥 contacts · 📁 files · 🤝 collaborations ·
⚙️ settings · 🏢 companies/admin.

## Buttons

Base `.btn`: inline-flex, `10px 20px` padding, `--fs-base`, 600 weight, `--radius-sm`, a subtle
white-gradient sheen on hover (`::after` overlay), `scale(0.97)` on `:active`.

| Variant | Style |
|---|---|
| `.btn-primary` | Gold gradient (`primary`→`primary-dark`), dark text (`#1F212C`), glow shadow — the one high-emphasis action per view |
| `.btn-secondary` | `--clr-bg-elevated` fill, bordered — default for everything not primary |
| `.btn-accent` | Blue gradient — rare, seen far less than primary/secondary |
| `.btn-danger` | Red gradient, white text — delete/reject/destructive only |
| `.btn-ghost` | Transparent, muted text, fills on hover — icon-only or low-emphasis actions (logout, close) |
| `.btn-google` | White pill, dark text — Google OAuth sign-in specifically, not a general pattern |

Sizes: `.btn-sm` (`6px 12px`), `.btn-xs` (`4px 10px`, 32px min-height for tap targets),
`.btn-lg` (`14px 28px`). `.btn-icon` forces a 40×40px (or 32×32 with `.btn-sm`) square for
icon-only buttons. On mobile (≤768px), `.btn-sm`/`.btn-xs` grow their min-height to 44px/38px to
keep tap targets accessible.

**Usage rule observed in practice**: exactly one `.btn-primary` per header/toolbar; every
secondary action is `.btn-secondary` or `.btn-ghost`. Multi-button footers (modal footers)
consistently order Cancel (`.btn-secondary`) before the primary confirm action.

## Text inputs

`.form-input` / `.form-textarea`: full-width, `10px 14px` padding, `--clr-bg-elevated` fill,
1px `--clr-border`, `--radius-sm`. Focus state: border turns `--clr-primary` + a 3px gold glow
ring (`box-shadow: 0 0 0 3px var(--clr-primary-glow)`) — no browser default outline. Placeholder
text uses `--clr-text-muted`. `.form-textarea` has a 100px min-height and vertical-only resize.
On mobile, form inputs are forced to 16px font-size specifically to prevent iOS Safari's
auto-zoom-on-focus behavior.

Every input is wrapped in `.form-group` (label + input + 6px gap, `--sp-md` bottom margin) with a
`.form-label` styled as a small uppercase, letter-spaced, secondary-color caption above the field
— never inline/placeholder-only labeling. `.form-row` lays two `.form-group`s side by side on
desktop, stacking to one column below 640px.

## Selection controls

- **Checkboxes**: native `<input type="checkbox">`, 18×18px, `accent-color: var(--clr-primary)` —
  no custom-built checkbox component, relies on the browser's native rendering tinted gold.
- **Radio buttons and toggle/switch controls**: none exist anywhere in the codebase. Every binary
  setting found (active/inactive worker status, notification read state, etc.) is modeled as a
  checkbox, a button pair, or a status field — not a switch component. If a toggle UI is needed
  going forward, there's no existing pattern to match; it would be a genuinely new addition.

## Dropdowns / selects

`.form-select` shares the same base styling as text inputs, plus a custom SVG chevron
(background-image, not the native arrow) and `appearance: none` to suppress the browser default.
No searchable/combobox select component exists in CSS — the one place that needs typeahead
(client search on invoices) is a hand-built component (`ClientAutocomplete.js`) with its own
absolutely-positioned dropdown panel, not a `.form-select` variant.

## Cards

Two distinct card treatments, used for different purposes — don't conflate them:

- **`.glass-card`** — translucent (`rgba(42,44,56,0.65)`) with a 16px backdrop-blur, `--radius-lg`,
  hover lifts the border color + adds shadow; add `.clickable` for a `translateY(-2px)` hover lift
  on card-as-link patterns (e.g. site list cards, dashboard stat cards). This is the dominant
  surface across the whole app — nearly every panel, form container, table wrapper, and stat tile
  is a `.glass-card`.
- **`.card`** (plain) — solid `--clr-bg-surface` fill, no blur, otherwise same radius/padding.
  Used far less often than `.glass-card`; reserve for contexts that shouldn't visually recede
  (rare in current usage — most containers should default to `.glass-card`).

`.stat-card` is a `.glass-card` modifier: adds a colored icon chip, a large bold value, a muted
label, and a soft decorative color-glow blob in the corner (`::after`, tinted by `.primary`/
`.accent`/`.success`/`.danger` modifier class).

## Modals / dialogs

`.modal-backdrop` (fixed, full-screen, `rgba(0,0,0,0.6)` + blur, fade-in) centers `.modal`
(solid `--clr-bg-surface`, `--radius-xl`, slide-up-and-scale entrance animation). Default max-width
560px; `.modal-lg` → 720px, `.modal-xl` → 960px — chosen per form complexity (simple confirm vs.
multi-field creation vs. rich editors like PDF annotation). Fixed three-part anatomy: `.modal-header`
(title + `.modal-close` ✕ button) / `.modal-body` / `.modal-footer` (right-aligned button row,
Cancel before Confirm). On mobile, `.modal-close` grows to a 44px tap target.

One deliberate departure from this pattern: the mobile "full menu" overlay
(`Layout.js`) reuses `.modal-backdrop`/`.modal` but pins itself to the bottom of the screen with
squared-off top corners (`border-radius: 20px 20px 0 0`) — a bottom-sheet variant of the same
component, not a separate one.

## Navigation

- **Desktop sidebar** (`.sidebar`): fixed-left, 260px wide (`--sidebar-width`), glassmorphic,
  full-height. Sections are label-grouped (`.sidebar-section-title`, uppercase caption), each item
  a `.sidebar-link` with an emoji icon; the active route gets a tinted background, gold text, and
  a 3px gold left-edge bar. A `--sidebar-collapsed` (72px) token exists in `:root` but **no
  collapse toggle is implemented anywhere** — the sidebar is always full-width on desktop; treat
  the token as unused/aspirational, not a real feature.
- **Mobile**: the sidebar hides entirely (`translateX(-100%)`) below 768px, replaced by a fixed
  `.bottom-nav` (4 items + "More") and a bottom-sheet `.modal` overlay for the full nav list —
  documented in `docs/UX.md` § Information architecture.
- **Tabs** (`.tabs`/`.tab`): underline-style, used within detail pages (Site tabs, Tasks
  board/approvals switch) — not a top-level navigation pattern, always scoped to one page's
  sub-views.

## Data tables

`.data-table-wrapper` (bordered, rounded, horizontally scrollable) wraps `.data-table`
(collapsed borders, elevated `<thead>`, uppercase muted column headers, row-hover background).
A `.sortable` header-cell class exists in CSS (cursor + hover-brightens) but **no page actually
implements click-to-sort** — every table in the product renders in a fixed order (usually
creation/date order or the order Firestore returns). Treat `.sortable` as unused CSS, not a
pattern to copy without also building the sort handler.

**Mobile**: below 768px, every data table has a parallel `.mobile-card-list` /
`.mobile-card-item` rendering of the *same* rows as stacked cards (`.mobile-card-row` label/value
pairs), toggled via the `.desktop-only`/`.mobile-only` utility classes — this dual-rendering is
written by hand per page (there's no single responsive-table component), so any new table needs
both versions built together, not just the desktop one.

## Alerts / in-app notifications

The sidebar bell (built this session, `NotificationContext` + `Layout.js`) is hand-styled with
inline styles, not `globals.css` classes — a fixed-position dropdown panel, unread items marked
with a small gold dot + bold weight, a red count badge on the bell icon itself. See `docs/UX.md`
for the notification-vs-toast distinction; this is the *persistent* half of that pair.

## Toasts / banners

**A real inconsistency worth knowing before styling anything toast-related**: `globals.css`
defines a full `.toast-container`/`.toast`/`.toast-success` etc. component (lines ~1057–1096) —
but grep across the entire `src/app` and `src/components` tree finds **zero usages of those
class names anywhere**. The toast system actually rendered in the product is a completely separate,
component-scoped implementation in `src/contexts/ToastContext.js` (`<style jsx>`), using its own
`ev-toast`/`ev-toast--success` naming, top-right stacked, auto-dismiss ~4s, max 5 visible at once.

**Use the `ToastContext.js` implementation as the source of truth.** The `globals.css` toast
classes are dead code — don't reach for them, and consider removing them in a future cleanup pass
to avoid the next person (human or AI) styling against the wrong system.

Marketing-page-specific "banner" styling (`.savings-highlight`, pricing badges) is scoped to that
page only and isn't a general alert/banner pattern for the app.

## Usage guidelines (consolidated)

- **Prefer `.glass-card` over `.card`** for any new panel/container — it's the established
  default; reach for `.card` only with a specific reason to look flatter.
- **One `.btn-primary` per view.** Every other action is `.btn-secondary` or `.btn-ghost`;
  `.btn-danger` only for destructive/reject actions.
- **Icons are emoji, not SVGs.** Stay consistent — don't introduce an icon library for one new
  feature; pick a fitting emoji instead, matching the existing per-domain vocabulary above.
- **Every data table needs a mobile card twin.** There's no shared responsive-table component;
  building only the desktop `<table>` will silently break the mobile experience.
- **Toasts: use `useToast()`/`ToastContext`, never the `globals.css` `.toast` classes** — they're
  unused legacy CSS, not a valid alternative implementation.
- **`.sortable` and `--sidebar-collapsed` are unimplemented.** Don't assume clicking a `.sortable`
  header does anything, and don't build UI expecting the sidebar can collapse — neither currently
  works.
- **Selection controls are checkbox-only.** No radio or switch/toggle component exists; don't
  invent one ad hoc for a single feature without deciding this is now the pattern going forward.
- **Role/permission gating in new UI**: use `useTenantRole()`, not `user.role` from `AuthContext`
  — see `docs/SPEC.md` § Conventions for why these can disagree.
