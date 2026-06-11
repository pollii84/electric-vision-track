---
name: ElectricVision Track
description: Operations management platform for electrical installation companies.
colors:
  conductor-gold: "#FFCA00"
  conductor-gold-light: "#FFD740"
  conductor-gold-dark: "#E0B200"
  electric-blue: "#0693E3"
  electric-blue-light: "#4DA6FF"
  bg-deep: "#1F212C"
  bg-base: "#252731"
  bg-surface: "#2A2C38"
  bg-elevated: "#32343F"
  bg-hover: "#3A3D48"
  bg-active: "#434652"
  text-primary: "#F5F5F5"
  text-secondary: "#B5B5BA"
  text-muted: "#768492"
  success: "#22C55E"
  danger: "#EF4444"
  warning: "#F59E0B"
  border-default: "rgba(255,255,255,0.08)"
  border-hover: "rgba(255,255,255,0.14)"
typography:
  display:
    fontFamily: "Poppins, Inter, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Poppins, Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Poppins, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.conductor-gold}"
    textColor: "{colors.bg-deep}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.conductor-gold-light}"
    textColor: "{colors.bg-deep}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  form-input:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  badge-primary:
    backgroundColor: "rgba(255,202,0,0.08)"
    textColor: "{colors.conductor-gold-light}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
---

# Design System: ElectricVision Track

## 1. Overview

**Creative North Star: "The Switchboard"**

ElectricVision Track is a dense, purposeful tool — every element routed to its function, nothing decorative. The Switchboard metaphor governs decisions at every scale: a switchboard handles complexity by organizing it, not hiding it. Information is present and legible; hierarchy communicates urgency, not visual style. The gold signal (Conductor Gold) moves through a deep industrial dark in the same way live current moves through a panel: intentional, directed, unmistakable.

The palette is structured, not expressive. Five tonal dark surface levels build depth without shadows at rest. Conductor Gold appears only where it earns its place: primary actions, active states, key indicators. The Electric Blue accent handles information-state color (links, data callouts) without competing. Everything else is neutral.

This system rejects the enterprise ERP aesthetic (dense gray tables, no hierarchy, built for no one) and the consumer dark-mode aesthetic (entertainment-coded, wrong register). It also refuses the over-decorated dashboard: no glassmorphism by default, no gradient text, no hero-metric templates. The interface should feel like a well-made tool a field electrician and an operations manager would both trust on day one.

**Key Characteristics:**
- Five-layer dark surface stack for depth without shadows at rest
- Conductor Gold reserved for primary actions and active states only
- Inter for all body/label copy; Poppins for all headings
- 8px base radius throughout; 16px on containers
- Tonal elevation: every surface step is a distinct dark layer, not a shadow
- Compact, dense information hierarchy — built for operators, not tourists

## 2. Colors: The Conductor Palette

High-contrast dark industrial palette. One signal color; everything else is structure.

### Primary
- **Conductor Gold** (`#FFCA00`): The live signal in the system. Primary action buttons, active nav states, focus rings, key status indicators, and interactive affordances. Appears sparingly; its rarity makes it legible.
- **Conductor Gold Light** (`#FFD740`): Hover state for primary elements. Link color, hover glow amplification.
- **Conductor Gold Dark** (`#E0B200`): Pressed state. Also used in gradient fills on primary buttons.

### Secondary
- **Electric Blue** (`#0693E3`): Complementary accent for informational content — links, info badges, data callouts, and secondary interactive highlights. Never used for primary actions (that is Gold's role).
- **Electric Blue Light** (`#4DA6FF`): Hover state and glow for blue-accented elements.

### Neutral
- **Panel Deep** (`#1F212C`): App background. The darkest surface; also the text color on gold buttons.
- **Panel Base** (`#252731`): Secondary background layer. Used in content sections behind the main surface.
- **Panel Surface** (`#2A2C38`): Card and container background. The primary content surface.
- **Panel Elevated** (`#32343F`): Input backgrounds, raised elements within cards.
- **Panel Hover** (`#3A3D48`): Interactive hover state for rows, list items, nav links.
- **Panel Active** (`#434652`): Pressed/active state.
- **Text Primary** (`#F5F5F5`): All body copy and headings.
- **Text Secondary** (`#B5B5BA`): Supporting text, metadata, placeholder labels.
- **Text Muted** (`#768492`): Disabled-adjacent labels, sidebar section titles.

### Semantic
- **Success** (`#22C55E`): Completed, active, confirmed states.
- **Danger** (`#EF4444`): Errors, deletions, alerts.
- **Warning** (`#F59E0B`): Attention-needed states, pending items.

### Named Rules
**The Conductor Rule.** Conductor Gold appears on primary actions and active states only. Never use it as a decorative fill, gradient background, or typographic accent. On any given screen, gold should cover no more than 10% of the surface area. Its scarcity is the signal.

**The Surface Stack Rule.** Depth is expressed through the five panel layers (Deep → Base → Surface → Elevated → Hover), not shadows. Shadows appear only as feedback on hover and focus states. A surface at rest is flat.

## 3. Typography

**Display Font:** Poppins (500, 600, 700, 800 weights; fallback Inter, sans-serif)
**Body Font:** Inter (300, 400, 500, 600, 700, 800 weights; fallback system-ui, sans-serif)
**Mono Font:** JetBrains Mono (for code and structured data, if used)

**Character:** Poppins brings geometric authority to headings without softness. Inter handles the full body and label vocabulary; its legibility at 14px under high density is the reason it's here. This is a functional pairing: no serif, no display contrast, no editorial warmth. Industrial and direct.

### Hierarchy
- **Display** (Poppins, 700, 36px, 1.2 line-height, -0.01em): Page titles. Used at the top of full-page views only.
- **Headline** (Poppins, 700, 24px, 1.2, -0.01em): Section headings, modal titles.
- **Title** (Poppins, 700, 20px, 1.2): Card headings, subsection labels.
- **Body** (Inter, 400, 14px, 1.5): All prose content, list text, table cells. Line length capped at 65–75ch for readable columns.
- **Label** (Inter, 600, 12px, 1.2, 0.05em tracking, uppercase): Form labels, badge text, sidebar section titles. Uppercase reserved for ≤4-word identifiers.

### Named Rules
**The Single Family Rule.** Inter carries the entire UI vocabulary outside of headings. Don't introduce a third family. If a third is needed for data (monospaced numbers), use the mono stack; that is the only permitted third family.

**The Fixed Scale Rule.** No fluid clamp sizing in product UI. The app is viewed at consistent viewport sizes by logged-in users; a clamp that shrinks the page title in a sidebar serves no one. Fixed rem at each hierarchy level.

## 4. Elevation

Depth in this system is tonal, not shadow-based. The five Panel layers (Deep → Base → Surface → Elevated → Hover) are the elevation vocabulary. At rest, every surface is flat; no drop-shadows on cards, containers, or sidebars. Shadows appear only as state feedback: hover glow on buttons, focus ring on inputs, and subtle lift on interactive cards.

### Shadow Vocabulary
- **Focus Ring** (`0 0 0 3px rgba(255,202,0,0.25)`): Input and button keyboard focus. Gold-tinted; consistent with the Conductor color.
- **Button Hover Glow** (`0 4px 16px rgba(255,202,0,0.25)`): Primary button hover. Implies energy without implying depth.
- **Card Lift** (`0 4px 12px rgba(0,0,0,0.4)`): Clickable cards on hover. Signals interactivity.
- **Modal Shadow** (`0 8px 32px rgba(0,0,0,0.5)`): Overlays only. The heaviest shadow in the system; reserved for elements that float above all content.

### Named Rules
**The Flat-By-Default Rule.** All surfaces are flat at rest. A shadow on a static container is wrong. If you're tempted to add a shadow to make something feel "more important", increase its surface layer instead (move from `bg-surface` to `bg-elevated`).

## 5. Components

### Buttons
- **Shape:** Softly rounded (8px). Not pill, not sharp. Precise and approachable.
- **Primary:** Conductor Gold gradient (`#FFCA00` → `#E0B200`), Panel Deep text (`#1F212C`), `10px 20px` padding. Gold glow (`0 2px 8px rgba(255,202,0,0.25)`) at rest; stronger glow on hover. Scale `0.97` on active press.
- **Secondary:** Panel Elevated background, default text, 1px border (`rgba(255,255,255,0.08)`). Hover shifts to Panel Hover background.
- **Ghost:** Transparent, secondary text. Hover adds Panel Hover background. Use for low-priority actions alongside a primary.
- **Danger:** Red gradient (`#EF4444` → `#DC2626`), white text. Destructive actions only.
- **Size variants:** `btn-sm` (6px 12px, 12px text), `btn-xs` (4px 10px, 11px text), `btn-lg` (14px 28px, 16px text), `btn-icon` (40×40px, square).

### Cards / Containers
- **Corner Style:** Gently rounded (16px). Large enough to feel modern; not pill-shaped.
- **Background:** Panel Surface (`#2A2C38`), 1px border (`rgba(255,255,255,0.08)`).
- **Shadow Strategy:** Flat at rest; Card Lift shadow on interactive/clickable cards (hover only).
- **Internal Padding:** 24px (`--sp-lg`).
- **Glass variant:** `backdrop-filter: blur(16px)` on `rgba(42,44,56,0.65)` background. Reserved for overlaying content (modals, login cards). Not a default card style.

### Inputs / Fields
- **Style:** Panel Elevated background, 1px border at rest, 8px radius.
- **Focus:** Gold border (`#FFCA00`) + gold glow ring (`0 0 0 3px rgba(255,202,0,0.25)`). Unmistakable, consistent across all input types.
- **Placeholder:** Text Muted (`#768492`). Meets 4.5:1 contrast on Panel Elevated.
- **Error:** Danger border + small error text in `#EF4444` below the field.
- **Labels:** Uppercase Inter 600 12px, 0.05em tracking, Text Secondary color.

### Badges / Status Chips
- **Shape:** Full pill radius. Short, scannable status identifiers.
- **Variants:** Primary (gold-tinted), Success (green-tinted), Warning (amber-tinted), Danger (red-tinted), Accent (blue-tinted). Each uses a translucent tinted background with a matching 1px border.
- **Text:** Uppercase Inter 600 11px, 0.04em tracking. Always ≤3 words.

### Navigation (Sidebar)
- **Structure:** 260px fixed sidebar on desktop, bottom nav on mobile (≤768px).
- **Logo area:** Top of sidebar, logo image at 49px height.
- **Section titles:** Text Muted uppercase Inter 600 11px. Organizational labels, not interactive.
- **Nav links:** Panel Hover background on hover; Conductor Gold text + gold-tinted background on active. Left layout with emoji icon + label.
- **User footer:** Avatar initials + name + role at bottom. Tap/click triggers logout.

### Signature Component: Status Badge System
Role-coded, pill-shaped status identifiers used across sites, tasks, timesheets, and contracts. Each semantic state has a committed color: active/completed (green), pending (amber), overdue/rejected (red), draft (gold). The badge system is the primary way role-specific data is scannable at a glance in dense list views.

## 6. Do's and Don'ts

### Do:
- **Do** use Conductor Gold on primary action buttons, active nav states, and focus rings only. One use per interaction zone.
- **Do** use the five surface layers (Deep → Base → Surface → Elevated → Hover) to express depth. Raise a container's layer before adding a shadow.
- **Do** keep all heading copy in Poppins and all UI copy in Inter. No exceptions.
- **Do** use full-pill badges for status labels. Keep badge copy uppercase and ≤3 words.
- **Do** make touch targets 44px minimum on interactive elements. Field workers use this on phones.
- **Do** provide both Romanian and English strings for every user-facing label via the i18n system.
- **Do** use the semantic shadow vocabulary exactly: Focus Ring on inputs, Button Hover Glow on primary buttons, Modal Shadow on overlays. No other shadow uses.

### Don't:
- **Don't** use `background-clip: text` gradient text. Conductor Gold is a solid color; its authority comes from restraint, not decoration.
- **Don't** use glassmorphism (`backdrop-filter: blur`) as a default card style. Reserve it for the login surface and overlay contexts only.
- **Don't** add `border-left` greater than 1px as a colored accent stripe on cards or list items. Use background tints or leading status badges instead.
- **Don't** use display fonts (Poppins) in buttons, form labels, table cells, or badges. Inter carries all UI control copy.
- **Don't** put shadows on static containers at rest. The Flat-By-Default Rule is non-negotiable.
- **Don't** use gold as a decorative background fill, text gradient, or section accent. The Conductor Rule: scarcity is the signal.
- **Don't** introduce a fourth font family. The mono stack is the ceiling.
- **Don't** use Conductor Gold to color inactive states. Active, selected, and primary-action only.
- **Don't** design modals as the first solution for confirmations or secondary actions. Exhaust inline and progressive alternatives first.
