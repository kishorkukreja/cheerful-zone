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

type DispatchRecord = { qty: number; at: string };

type State = {
  indents: Indent[];
  auditEvents: AuditEvent[];
  weights: PriorityWeights;
  compact: boolean;
  dispatched: Record<string, DispatchRecord>;
};

const STORAGE_KEY = "idie-store-v1";

const SEED: State = {
  indents: seedIndents,
  auditEvents: seedAudit,
  weights: DEFAULT_WEIGHTS,
  compact: false,
  dispatched: {},
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
