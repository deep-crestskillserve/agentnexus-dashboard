# ClawBuddy — "Million-Dollar SaaS" Visual Overhaul

A single-phase visual + interaction upgrade. No backend, no data model changes — all data stays mock/local. Every module gets the same glass + glow + motion language.

---

## 1. New App Shell: Collapsible Sidebar + Upgraded Topbar

Replace the current top-tab navigation in `src/routes/index.tsx` with a true SaaS layout.

```text
┌───────────┬──────────────────────────────────────────┐
│           │  Topbar: search · status · notifs · user │
│  Sidebar  ├──────────────────────────────────────────┤
│  (glass)  │                                          │
│           │   Page content (Command Deck, etc.)      │
│           │                                          │
└───────────┴──────────────────────────────────────────┘
```

**Sidebar** (`src/components/clawbuddy/AppSidebar.tsx`, built on shadcn `sidebar`):
- Collapsible (`collapsible="icon"`), w-[var(--sidebar-width)] fix applied.
- Brand block top: paw emoji in gradient tile + "ClawBuddy" wordmark with emerald gradient.
- Nav groups:
  - **Workspace**: Command Deck, Task Board, Agents, Meetings, Council, AI Log
  - **System**: Integrations (mock), Billing (mock), Settings (mock)
- Active route gets emerald left-border accent + glow background.
- Footer: workspace switcher pill ("Acme · Pro plan") with avatar stack.

**Topbar** (`src/components/clawbuddy/Topbar.tsx`, replaces current Header):
- Left: `SidebarTrigger` + breadcrumb ("Workspace / Command Deck").
- Center: command-palette-style search input (⌘K hint), glass background, focus ring glow.
- Right cluster:
  - System health pill (live pulse, "All systems nominal · 47ms")
  - Notifications bell with red dot + dropdown of mock alerts
  - Theme toggle (visual only)
  - User avatar dropdown (mock profile, plan badge, sign out)
- Sticky, blurred, subtle bottom border that glows emerald on scroll.

Routes stay one page; sidebar nav switches the active tab via local state, preserving framer-motion transitions.

---

## 2. Design System Upgrades (`src/styles.css`)

Layer richer tokens on top of the existing emerald/cyan palette:

- New gradients: `--gradient-emerald`, `--gradient-cyan`, `--gradient-aurora` (emerald → cyan → violet for hero accents).
- New shadows: `--shadow-glass`, `--shadow-glow-emerald`, `--shadow-glow-cyan`, `--shadow-elevated`.
- Surface tokens: `--surface-1/2/3` for layered glass depth.
- New utilities:
  - `glass-card-elevated` — stronger blur (24px), inner highlight border, layered shadow.
  - `glow-hover` — transition that lifts + emerald shadow on hover.
  - `border-gradient` — animated conic-gradient border for "premium" cards.
  - `shimmer` — moving sheen across surface (used on metric cards, primary CTAs).
  - `noise-overlay` — subtle SVG grain on body for texture.
- Keyframes: `aurora-shift`, `shimmer`, `float`, `glow-pulse`, `border-spin`.
- Body background: layered radial gradients + faint grid pattern + grain.

All values defined as semantic tokens — no raw hex in components.

---

## 3. Module-by-Module Polish

**Command Deck**
- Metric cards: gradient border on hover, shimmer sweep, mini sparkline (recharts area, mock data) in each card.
- New "System pulse" strip: 4 live mini-graphs (CPU, queue, latency, errors) animating with mock interval data.
- Activity feed: avatar ring glow per agent, hover row reveals quick-action buttons.

**Task Board**
- Columns get glass-elevated style, column header with count chip + glow on drag-over.
- Cards: priority left-accent bar, hover lift, dragging state with emerald ring + shadow.
- Add filter bar (search + assignee multi-select + priority chips) — pure client filter.

**Agents**
- Cards: aurora border on hover, animated avatar halo for active agents, capacity progress ring.
- New "Performance" mini-chart (last 7 days, mock) on the back of each card via flip animation.

**Meetings**
- Wrap charts in glass-elevated containers, add gradient legend chips.
- New top stat row: total meetings, avg duration, action items, sentiment score (mock).
- Meeting list rows: hover glow, expandable transcript preview.

**Council**
- Session cards: aurora border for "in progress", animated thinking dots for active debaters.
- Vote tally bars with gradient fills + count-up animation.

**AI Log**
- Filter chips become glowing toggles.
- Log rows: monospace with severity left-accent + hover row highlight.
- New top mini-chart: events/minute sparkline.

---

## 4. Global Motion Pass

- Page/tab transitions: keep framer-motion, add subtle scale (0.99 → 1) + blur fade.
- Stagger children in every list/grid (`staggerChildren: 0.04`).
- Hover language (consistent everywhere): `y: -2`, shadow grows, emerald ring appears.
- Buttons: primary uses gradient bg + shimmer on hover; secondary uses glass + glow ring.
- Loading states (mock): skeleton with shimmer.

---

## 5. New Mock Features Bundled In

Pure presentation, all local state:
1. **Command palette (⌘K)** — searchable list of agents/tasks/actions, opens from topbar.
2. **Notifications dropdown** — 5 mock alerts with timestamps + "mark all read".
3. **User menu** — profile card, plan badge, theme toggle, sign out (visual).
4. **Workspace switcher** — sidebar footer dropdown with 3 mock workspaces.
5. **Integrations page** — grid of glass cards for Slack/Linear/GitHub/Notion (mock connect toggles).
6. **Billing page** — current plan card + usage meters + invoice list (mock).
7. **Settings page** — profile, appearance, notifications tabs (mock forms).

---

## 6. Technical Section

**Files to add**
- `src/components/clawbuddy/AppSidebar.tsx`
- `src/components/clawbuddy/Topbar.tsx`
- `src/components/clawbuddy/CommandPalette.tsx`
- `src/components/clawbuddy/NotificationsMenu.tsx`
- `src/components/clawbuddy/UserMenu.tsx`
- `src/components/clawbuddy/Sparkline.tsx` (reusable mini recharts area)
- `src/components/clawbuddy/Integrations.tsx`
- `src/components/clawbuddy/Billing.tsx`
- `src/components/clawbuddy/Settings.tsx`
- `src/components/clawbuddy/mockExtras.ts` (notifications, workspaces, integrations, invoices)

**Files to edit**
- `src/styles.css` — new tokens, utilities, keyframes, body texture.
- `src/routes/index.tsx` — wrap in `SidebarProvider`, mount `AppSidebar` + `Topbar`, keep tab state.
- `src/routes/__root.tsx` — no functional change beyond ensuring fonts/links intact.
- `src/components/clawbuddy/Header.tsx` — deleted (replaced by Topbar).
- Each module component — apply new utilities (`glass-card-elevated`, `glow-hover`), add sparklines/filters where listed.

**Conventions**
- Only semantic tokens in components (no raw `#hex` outside `styles.css`).
- All animation via existing `framer-motion` (already installed).
- Sparklines via existing `recharts`.
- Sidebar widths use `w-[var(--sidebar-width)]` (v4 fix).
- No new packages required.

**Out of scope**
- No backend, auth, or persistence.
- No route splitting — sidebar drives in-page tab state.
- No data-shape changes to existing `data.ts` (only `mockExtras.ts` added).
