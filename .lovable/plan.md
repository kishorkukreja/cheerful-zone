# Plan: Intelligent Dispatch & Indent Engine (IDIE) Prototype

Static, presentational multi-screen prototype seeded with HUL-flavoured mock data (factories: Haridwar, Dapada, Sumerpur, Puducherry; DCs: Delhi, Mumbai, Kolkata, Chennai, Bengaluru; CBUs: Surf Excel, Rin, Vim, Lifebuoy, Dove, Lux, Bru, Horlicks, Kissan, Knorr).

No backend, no auth. All data lives in `src/data/hul-mock.ts` and is consumed by every screen so lane IDs / CBU codes stay consistent across drill-downs.

## Navigation shell

- Persistent left `Sidebar` (shadcn `collapsible="icon"`) with a `SidebarTrigger` in the top header. Sidebar items:
  1. Dispatch Cockpit — `/` (initial screen)
  2. Manual Indent Worklist — `/indents`
  3. Lane Detail Analysis — `/lanes/$laneId` (sidebar links to a default lane; also reachable from Cockpit rows)
  4. Stock Analyser — `/stock`
  5. Admin Console — `/admin`
- Top header shows page title, global date-stamp ("Engine run: today 06:00 IST"), and a user chip ("Priya · Supply Planner").
- Mobile: sidebar becomes offcanvas; header keeps the trigger.

## Screens

### 1. Dispatch Cockpit (`/` — initial screen)
Planner's morning worklist implementing the PRD's decision engine surface.
- KPI strip: Lanes at risk, Total shortage units, Dispatch-ready units, Indents recommended, Order-loss last 24h.
- Priority table of Factory → DC → CBU lanes with columns: Rank, Lane, Demand Signal (max of NR APO / Order Loss), Planned Coverage (Alloc + PDQ), Shortage, Dispatch Calc., Recommended Action badge (Dispatch / Raise Indent / Watch), CTA buttons (Approve, Modify, Raise Indent → routes to `/indents`, Details → routes to `/lanes/$laneId`).
- Filters (visual only): Region, Factory, DC, CBU family, Priority tier.
- Right rail: "Why this ranking" explainer with the priority weighting from PRD §7.

### 2. Manual Indent Worklist (`/indents`)
- Table of engine-recommended indents with columns: Indent ID, Factory, DC, CBU, Required Qty, Justification (compact waterfall summary), Suggested source bucket, Status (Pending / Approved / Submitted / Rejected).
- Row actions: Approve, Modify Qty (inline input, visual), Submit to ERP (toast), Reject.
- Header stats: Pending count, Approved today, Submitted today, Rejected today.
- Empty-state and "Bulk approve selected" affordance.

### 3. Lane Detail Analysis (`/lanes/$laneId`)
Deep dive for a single Factory × DC × CBU lane.
- Lane header: origin factory, destination DC, CBU (with HUL pack), transit lead time.
- Mitigation Waterfall visualisation: bars for ATP → QC Stock → Reserved → Production Requirement, showing consumed vs available per bucket (PRD §7 Step 3).
- Coverage timeline: last 14 days actual vs plan sparkline + next 14 days projected coverage.
- Demand signal breakdown card (NR APO vs Order Loss, which one dominates and why).
- Recommendation summary card with Approve / Raise Indent buttons.
- Audit trail list (mock entries).

### 4. Stock Analyser (`/stock`)
Rebuild of the provided "Global Inventory Health" HTML, restyled with our tokens and localised to HUL nodes (factories + DCs listed above). Keeps the mockup's structure: header + Filter/Export, 4 KPI cards, Multi-Node Network map card (hotlinked map bg + hover tooltips on HUL nodes), Inventory Node Breakdown table, Overall Stock Health donut, Stock Ageing bars, Coverage Risks (CBU) panel, FAB.

### 5. Admin Console (`/admin`)
Configuration surface referenced in PRD §12.
- Tabs: Bucket Eligibility, Priority Weights, Lane Master, Users & Roles, Integrations.
- Bucket Eligibility: toggle rows for ATP / QC / Reserved / Production with "Consumable by default?" switches and consumption-rule dropdowns.
- Priority Weights: sliders for the PRD ranking factors (Order Loss impact, Days of Cover, Customer Tier, Lane Criticality) with a live "example ranking" preview.
- Lane Master: searchable table of Factory→DC lanes with active/inactive toggles.
- Users & Roles: mock user list with role chips (Planner, DC Planner, SC Manager, Admin, Dispatch Coordinator).
- Integrations: cards for APO, ERP, WMS, TMS, OMS with green/red status dots and "Last sync" timestamps.
- All controls are visual; a top-right "Save changes" button fires a toast.

## Technical structure

- Routes (TanStack file-based):
  - `src/routes/__root.tsx` — inject `SidebarProvider`, `AppSidebar`, header shell, Google Material Symbols stylesheet link, real meta.
  - `src/routes/index.tsx` — Dispatch Cockpit (replaces placeholder).
  - `src/routes/indents.tsx`
  - `src/routes/lanes.$laneId.tsx`
  - `src/routes/stock.tsx`
  - `src/routes/admin.tsx`
- Components in `src/components/`:
  - `app-sidebar.tsx`, `app-header.tsx`
  - `cockpit/` — `KpiStrip`, `LaneQueueTable`, `RankingExplainer`
  - `indents/` — `IndentTable`, `IndentStats`
  - `lane/` — `LaneHeader`, `MitigationWaterfall`, `CoverageTimeline`, `DemandSignalCard`, `AuditTrail`
  - `stock/` — `KpiGrid`, `NodeNetworkMap`, `NodeBreakdownTable`, `StockHealthDonut`, `StockAgeing`, `CoverageRisks`, `QuickAdjustFab`
  - `admin/` — one component per tab
- Data: `src/data/hul-mock.ts` exports `lanes`, `indents`, `nodes`, `cbuMaster`, `auditEvents`. Helpers `getLaneById`, `getIndentsForLane`.
- Styling: extend `src/styles.css` with the Material-3-flavoured tokens the mockup uses (surface-container tiers, on-surface-variant, tertiary, error-container, outline-variant, glass-card utility) mapped onto the existing oklch palette; convert `font-headline-*` / `text-label-*` classes from the mockup to standard Tailwind size/weight utilities.
- Icons: `material-symbols-outlined` via CDN link in root head (matches the mockup); lucide icons for sidebar.
- Toasts: reuse existing shadcn `sonner`.

## Out of scope (per PRD non-goals)

Real integrations, autonomous execution, ML forecasting, filler/FTL logic, persistence. All actions are simulated with toasts and local state.
