// Lightweight client store shared across screens so an action taken on one
// screen (approve a dispatch, raise an indent, tune priority weights) is
// visible everywhere else — audit trail, KPIs, worklists — without a backend.
// Persisted to localStorage so the story survives a refresh during a demo.
import { useSyncExternalStore } from "react";
import {
  indents as seedIndents,
  auditEvents as seedAudit,
  DEFAULT_WEIGHTS,
  type Indent,
  type AuditEvent,
  type Lane,
  type PriorityWeights,
} from "@/data/hul-mock";
import {
  seedFillerRecommendations,
  seedCraftedShipments,
  laneShipmentBaseline,
  SHIPMENT_STAGE_ORDER,
  type FillerRecommendation,
  type ShipmentPlan,
  type CraftedShipment,
} from "@/data/agentic-mock";

type DispatchRecord = { qty: number; at: string };

type State = {
  indents: Indent[];
  auditEvents: AuditEvent[];
  weights: PriorityWeights;
  compact: boolean;
  dispatched: Record<string, DispatchRecord>;
  fillerRecs: FillerRecommendation[];
  shipmentPlans: ShipmentPlan[];
  craftedShipments: CraftedShipment[];
};

const STORAGE_KEY = "idie-store-v1";

const SEED: State = {
  indents: seedIndents,
  auditEvents: seedAudit,
  weights: DEFAULT_WEIGHTS,
  compact: false,
  dispatched: {},
  fillerRecs: seedFillerRecommendations,
  shipmentPlans: [],
  craftedShipments: seedCraftedShipments,
};

let state: State = SEED;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) — degrade to in-memory only
  }
}

let hydrated = false;
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...SEED, ...(JSON.parse(raw) as Partial<State>) };
      emit();
    }
  } catch {
    // ignore malformed storage
  }
}

function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
  persist();
}

function subscribe(cb: () => void) {
  ensureHydrated();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SEED;
}

export function useAppStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

function logEvent(s: State, laneId: string | null, actor: string, event: string): AuditEvent[] {
  return [{ at: "Just now", actor, event, laneId }, ...s.auditEvents];
}

export function setWeights(weights: PriorityWeights) {
  setState({ weights });
}

export function setCompact(compact: boolean) {
  setState({ compact });
}

export function approveDispatch(lane: Lane, qty: number) {
  setState((s) => ({
    dispatched: { ...s.dispatched, [lane.id]: { qty, at: "Just now" } },
    auditEvents: logEvent(
      s,
      lane.id,
      "Priya S.",
      `Approved dispatch of ${fmt(qty)} units · ${lane.cbu} → ${lane.dcCode}`,
    ),
  }));
}

/** Returns the pending indent id for this lane, creating one if none exists. */
export function raiseIndent(lane: Lane, qty: number): string {
  const existing = state.indents.find((i) => i.laneId === lane.id && i.status === "Pending");
  if (existing) return existing.id;

  const id = `IND-24-${Math.floor(1000 + Math.random() * 9000)}`;
  const newIndent: Indent = {
    id,
    laneId: lane.id,
    factory: lane.factory,
    dc: lane.dc,
    cbu: lane.cbu,
    requiredQty: Math.max(0, qty),
    suggestedSource: "Production Req.",
    justification: `Raised from Dispatch Cockpit · ${fmt(qty)} unit shortfall exceeds eligible stock.`,
    status: "Pending",
    createdAt: "Just now",
  };
  setState((s) => ({
    indents: [newIndent, ...s.indents],
    auditEvents: logEvent(
      s,
      lane.id,
      "IDIE Engine",
      `Indent ${id} raised for ${lane.cbu} · ${fmt(qty)} units`,
    ),
  }));
  return id;
}

export function setIndentStatus(id: string, status: Indent["status"]) {
  const indent = state.indents.find((i) => i.id === id);
  setState((s) => ({
    indents: s.indents.map((i) => (i.id === id ? { ...i, status } : i)),
    auditEvents: indent
      ? logEvent(s, indent.laneId, "Priya S.", `${status} indent ${id} (${indent.cbu})`)
      : s.auditEvents,
  }));
}

export function updateIndentQty(id: string, qty: number) {
  setState((s) => ({
    indents: s.indents.map((i) => (i.id === id ? { ...i, requiredQty: qty } : i)),
  }));
}

export function bulkApproveIndents(ids: string[]) {
  if (ids.length === 0) return;
  setState((s) => ({
    indents: s.indents.map((i) => (ids.includes(i.id) ? { ...i, status: "Approved" } : i)),
    auditEvents: logEvent(s, null, "Priya S.", `Bulk-approved ${ids.length} indents`),
  }));
}

export function auditEventsForLane(events: AuditEvent[], laneId: string) {
  return events.filter((e) => e.laneId === laneId || e.laneId === null);
}

// ---- Agentic Shipment Optimization workflow ----

export function setFillerStatus(id: string, status: FillerRecommendation["status"]) {
  setState((s) => {
    const fr = s.fillerRecs.find((f) => f.id === id);
    if (!fr) return {};
    return {
      fillerRecs: s.fillerRecs.map((f) => (f.id === id ? { ...f, status } : f)),
      auditEvents: logEvent(
        s,
        fr.laneId,
        "Priya S.",
        `${status} filler suggestion · ${fr.filler.name} (${fmt(fr.suggestedQty)} units)`,
      ),
    };
  });
}

/** Groups accepted filler recommendations by lane into optimized shipment plans. */
export function runShipmentOptimization() {
  setState((s) => {
    const acceptedByLane = new Map<string, FillerRecommendation[]>();
    for (const fr of s.fillerRecs) {
      if (fr.status !== "Accepted") continue;
      const list = acceptedByLane.get(fr.laneId) ?? [];
      list.push(fr);
      acceptedByLane.set(fr.laneId, list);
    }
    const laneIds = [...acceptedByLane.keys()].filter((id) => laneShipmentBaseline[id]);
    if (laneIds.length === 0) return {};

    const newPlans: ShipmentPlan[] = laneIds.map((laneId) => {
      const base = laneShipmentBaseline[laneId];
      const accepted = acceptedByLane.get(laneId)!;
      const gain = accepted.reduce((sum, fr) => sum + fr.fillRateGainPct, 0);
      const fillRateAfterPct = Math.min(96, base.fillRateBeforePct + gain);
      const trucksOptimized = Math.max(
        1,
        Math.round(base.trucksBaseline * (base.fillRateBeforePct / fillRateAfterPct)),
      );
      const existing = s.shipmentPlans.find((p) => p.laneId === laneId);
      return {
        ...base,
        id: existing?.id ?? `SHP-${Math.floor(4000 + Math.random() * 900)}`,
        fillerRecIds: accepted.map((f) => f.id),
        fillRateAfterPct,
        trucksOptimized,
        costSaved: Math.max(0, base.trucksBaseline - trucksOptimized) * base.costPerTruck,
        stage: existing?.stage ?? "Optimized",
        createdAt: existing?.createdAt ?? "Just now",
        stagedAt: existing?.stagedAt,
        stoNumber: existing?.stoNumber,
        idocNumber: existing?.idocNumber,
        stoCreatedAt: existing?.stoCreatedAt,
        approvedAt: existing?.approvedAt,
      };
    });

    const kept = s.shipmentPlans.filter((p) => !laneIds.includes(p.laneId));
    const avgUplift = Math.round(
      newPlans.reduce((sum, p) => sum + (p.fillRateAfterPct - p.fillRateBeforePct), 0) /
        newPlans.length,
    );
    return {
      shipmentPlans: [...newPlans, ...kept],
      auditEvents: logEvent(
        s,
        null,
        "Shipment Optimizer Agent",
        `Optimized ${newPlans.length} shipment${newPlans.length === 1 ? "" : "s"} · avg truck fill rate +${avgUplift} pts`,
      ),
    };
  });
}

function toCraftedShipment(plan: ShipmentPlan): CraftedShipment {
  return {
    id: `CS-${plan.id.replace("SHP-", "")}`,
    shipmentPlanId: plan.id,
    laneId: plan.laneId,
    cbu: plan.cbu,
    factory: plan.factory,
    factoryCode: plan.factoryCode,
    dc: plan.dc,
    dcCode: plan.dcCode,
    trucksBaseline: plan.trucksBaseline,
    trucksOptimized: plan.trucksOptimized,
    fillRateBeforePct: plan.fillRateBeforePct,
    fillRateAfterPct: plan.fillRateAfterPct,
    costSaved: plan.costSaved,
    stoNumber: plan.stoNumber ?? "—",
    idocNumber: plan.idocNumber ?? "—",
    stagedAt: plan.stagedAt ?? "Just now",
    stoCreatedAt: plan.stoCreatedAt ?? "Just now",
    approvedAt: "Just now",
  };
}

const STAGE_ACTORS: Record<ShipmentPlan["stage"], string> = {
  Optimized: "Shipment Optimizer Agent",
  Staged: "Staging Service",
  "STO Created": "ERP Integration (IDoc)",
  "Pending Transit Approval": "Shipment Optimizer Agent",
  "Approved · In Transit": "Transit Approval Queue",
};

/** Advances a shipment plan one step through its ERP lifecycle. */
export function advanceShipmentPlan(id: string) {
  setState((s) => {
    const plan = s.shipmentPlans.find((p) => p.id === id);
    if (!plan) return {};
    const idx = SHIPMENT_STAGE_ORDER.indexOf(plan.stage);
    const next = SHIPMENT_STAGE_ORDER[idx + 1];
    if (!next) return {};

    const updated: ShipmentPlan = { ...plan, stage: next };
    if (next === "Staged") updated.stagedAt = "Just now";
    if (next === "STO Created") {
      updated.stoNumber = `45${Math.floor(100000 + Math.random() * 900000)}`;
      updated.idocNumber = `IDOC${Math.floor(1000000 + Math.random() * 9000000)}`;
      updated.stoCreatedAt = "Just now";
    }
    if (next === "Approved · In Transit") updated.approvedAt = "Just now";

    const messages: Record<ShipmentPlan["stage"], string> = {
      Optimized: "",
      Staged: `Shipment ${plan.id} written to staging · ${plan.cbu} (${plan.factoryCode} → ${plan.dcCode})`,
      "STO Created": `STO ${updated.stoNumber} created in ERP via ${updated.idocNumber} for ${plan.id}`,
      "Pending Transit Approval": `${plan.id} pushed to Transit Approval Queue`,
      "Approved · In Transit": `${plan.id} approved · Stock Transfer shipment created in ECC`,
    };

    return {
      shipmentPlans: s.shipmentPlans.map((p) => (p.id === id ? updated : p)),
      craftedShipments:
        next === "Approved · In Transit"
          ? [toCraftedShipment(updated), ...s.craftedShipments]
          : s.craftedShipments,
      auditEvents: logEvent(s, plan.laneId, STAGE_ACTORS[next], messages[next]),
    };
  });
}
