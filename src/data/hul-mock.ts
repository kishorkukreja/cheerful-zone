// HUL-flavoured mock data for IDIE prototype.
// Shared across Cockpit, Indents, Lane Detail, Stock Analyser.

export type Bucket = {
  name: "ATP" | "QC Stock" | "Reserved" | "Production Req.";
  available: number;
  consumed: number;
  eligible: boolean;
};

export type Lane = {
  id: string;
  factory: string;
  factoryCode: string;
  dc: string;
  dcCode: string;
  region: string;
  cbu: string;
  cbuCode: string;
  pack: string;
  nrApo: number;
  orderLoss: number;
  allocation: number;
  pdq: number;
  buckets: Bucket[];
  priorityScore: number;
  /** 0-100, PRD "Lane Criticality" factor — hub importance independent of tier/order-loss. */
  criticality: number;
  customerTier: "A" | "B" | "C";
  transitDays: number;
};

export type Indent = {
  id: string;
  laneId: string;
  factory: string;
  dc: string;
  cbu: string;
  requiredQty: number;
  suggestedSource: Bucket["name"];
  justification: string;
  status: "Pending" | "Approved" | "Submitted" | "Rejected";
  createdAt: string;
};

export type NodeItem = {
  id: string;
  name: string;
  city: string;
  type: "Factory" | "DC";
  stockPct: number;
  qcPending: number;
  coverageDays: number;
  x: number; // % position on map
  y: number;
};

// Utility
const dm = (d: number, m: number) => Math.max(0, d - m);

export const lanes: Lane[] = [
  {
    id: "HRD-DEL-SURF",
    factory: "Haridwar Plant",
    factoryCode: "HRD-01",
    dc: "Delhi NCR DC",
    dcCode: "DC-DEL",
    region: "North",
    cbu: "Surf Excel Matic",
    cbuCode: "SEM-2KG",
    pack: "2 kg pouch",
    nrApo: 8200,
    orderLoss: 12400,
    allocation: 4200,
    pdq: 3000,
    buckets: [
      { name: "ATP", available: 1200, consumed: 1200, eligible: true },
      { name: "QC Stock", available: 900, consumed: 600, eligible: true },
      { name: "Reserved", available: 900, consumed: 0, eligible: false },
      { name: "Production Req.", available: 2000, consumed: 320, eligible: true },
    ],
    priorityScore: 96,
    criticality: 95,
    customerTier: "A",
    transitDays: 2,
  },
  {
    id: "DPD-MUM-RIN",
    factory: "Dapada Plant",
    factoryCode: "DPD-02",
    dc: "Mumbai West DC",
    dcCode: "DC-MUM",
    region: "West",
    cbu: "Rin Advanced Bar",
    cbuCode: "RIN-250",
    pack: "250 g bar × 4",
    nrApo: 15200,
    orderLoss: 9800,
    allocation: 9000,
    pdq: 4000,
    buckets: [
      { name: "ATP", available: 900, consumed: 900, eligible: true },
      { name: "QC Stock", available: 300, consumed: 300, eligible: true },
      { name: "Reserved", available: 1500, consumed: 0, eligible: false },
      { name: "Production Req.", available: 500, consumed: 0, eligible: true },
    ],
    priorityScore: 88,
    criticality: 85,
    customerTier: "A",
    transitDays: 1,
  },
  {
    id: "SMP-KOL-LIFE",
    factory: "Sumerpur Plant",
    factoryCode: "SMP-03",
    dc: "Kolkata East DC",
    dcCode: "DC-KOL",
    region: "East",
    cbu: "Lifebuoy Total 10",
    cbuCode: "LB-125",
    pack: "125 g soap × 4",
    nrApo: 6400,
    orderLoss: 3200,
    allocation: 5000,
    pdq: 2200,
    buckets: [
      { name: "ATP", available: 1200, consumed: 0, eligible: true },
      { name: "QC Stock", available: 400, consumed: 0, eligible: true },
      { name: "Reserved", available: 300, consumed: 0, eligible: false },
      { name: "Production Req.", available: 2000, consumed: 0, eligible: true },
    ],
    priorityScore: 42,
    criticality: 55,
    customerTier: "B",
    transitDays: 3,
  },
  {
    id: "PDY-CHN-DOVE",
    factory: "Puducherry Plant",
    factoryCode: "PDY-04",
    dc: "Chennai South DC",
    dcCode: "DC-CHN",
    region: "South",
    cbu: "Dove Cream Beauty",
    cbuCode: "DV-100",
    pack: "100 g soap × 3",
    nrApo: 4800,
    orderLoss: 7200,
    allocation: 3200,
    pdq: 1400,
    buckets: [
      { name: "ATP", available: 1600, consumed: 1600, eligible: true },
      { name: "QC Stock", available: 900, consumed: 900, eligible: true },
      { name: "Reserved", available: 400, consumed: 100, eligible: true },
      { name: "Production Req.", available: 2500, consumed: 0, eligible: true },
    ],
    priorityScore: 81,
    criticality: 80,
    customerTier: "A",
    transitDays: 2,
  },
  {
    id: "HRD-BLR-BRU",
    factory: "Haridwar Plant",
    factoryCode: "HRD-01",
    dc: "Bengaluru DC",
    dcCode: "DC-BLR",
    region: "South",
    cbu: "Bru Instant Coffee",
    cbuCode: "BRU-100",
    pack: "100 g jar",
    nrApo: 3800,
    orderLoss: 5100,
    allocation: 2000,
    pdq: 1200,
    buckets: [
      { name: "ATP", available: 900, consumed: 900, eligible: true },
      { name: "QC Stock", available: 300, consumed: 300, eligible: true },
      { name: "Reserved", available: 200, consumed: 0, eligible: false },
      { name: "Production Req.", available: 1800, consumed: 700, eligible: true },
    ],
    priorityScore: 74,
    criticality: 60,
    customerTier: "B",
    transitDays: 4,
  },
  {
    id: "DPD-DEL-VIM",
    factory: "Dapada Plant",
    factoryCode: "DPD-02",
    dc: "Delhi NCR DC",
    dcCode: "DC-DEL",
    region: "North",
    cbu: "Vim Dishwash Bar",
    cbuCode: "VIM-300",
    pack: "300 g bar",
    nrApo: 5600,
    orderLoss: 2100,
    allocation: 4200,
    pdq: 2000,
    buckets: [
      { name: "ATP", available: 400, consumed: 0, eligible: true },
      { name: "QC Stock", available: 150, consumed: 0, eligible: true },
      { name: "Reserved", available: 100, consumed: 0, eligible: false },
      { name: "Production Req.", available: 1200, consumed: 0, eligible: true },
    ],
    priorityScore: 28,
    criticality: 40,
    customerTier: "C",
    transitDays: 2,
  },
  {
    id: "SMP-MUM-HORL",
    factory: "Sumerpur Plant",
    factoryCode: "SMP-03",
    dc: "Mumbai West DC",
    dcCode: "DC-MUM",
    region: "West",
    cbu: "Horlicks Classic",
    cbuCode: "HOR-500",
    pack: "500 g refill",
    nrApo: 7200,
    orderLoss: 9600,
    allocation: 3800,
    pdq: 1800,
    buckets: [
      { name: "ATP", available: 2100, consumed: 2100, eligible: true },
      { name: "QC Stock", available: 700, consumed: 500, eligible: true },
      { name: "Reserved", available: 600, consumed: 0, eligible: false },
      { name: "Production Req.", available: 3400, consumed: 400, eligible: true },
    ],
    priorityScore: 90,
    criticality: 88,
    customerTier: "A",
    transitDays: 3,
  },
  {
    id: "PDY-BLR-KISS",
    factory: "Puducherry Plant",
    factoryCode: "PDY-04",
    dc: "Bengaluru DC",
    dcCode: "DC-BLR",
    region: "South",
    cbu: "Kissan Mixed Fruit Jam",
    cbuCode: "KIS-500",
    pack: "500 g jar",
    nrApo: 2400,
    orderLoss: 1200,
    allocation: 2000,
    pdq: 900,
    buckets: [
      { name: "ATP", available: 800, consumed: 0, eligible: true },
      { name: "QC Stock", available: 300, consumed: 0, eligible: true },
      { name: "Reserved", available: 100, consumed: 0, eligible: false },
      { name: "Production Req.", available: 900, consumed: 0, eligible: true },
    ],
    priorityScore: 18,
    criticality: 35,
    customerTier: "C",
    transitDays: 2,
  },
];

// Derived fields
export function demandSignal(l: Lane) {
  return Math.max(l.nrApo, l.orderLoss);
}
export function plannedCoverage(l: Lane) {
  return l.allocation + l.pdq;
}
export function shortage(l: Lane) {
  return dm(demandSignal(l), plannedCoverage(l));
}
export function dispatchCalc(l: Lane) {
  const eligibleStock = l.buckets.filter((b) => b.eligible).reduce((s, b) => s + b.available, 0);
  return Math.min(shortage(l), eligibleStock);
}
export function recommendation(l: Lane): "Dispatch" | "Raise Indent" | "Watch" {
  const s = shortage(l);
  if (s === 0) return "Watch";
  if (dispatchCalc(l) >= s * 0.8) return "Dispatch";
  return "Raise Indent";
}

// Priority scoring engine (PRD §7) — same formula backs both the Cockpit
// ranking and the Admin "live ranking preview", so tuning weights in Admin
// has a real, visible effect instead of a decorative slider.
export type PriorityWeights = {
  orderLoss: number;
  cover: number;
  tier: number;
  criticality: number;
};

export const DEFAULT_WEIGHTS: PriorityWeights = {
  orderLoss: 40,
  cover: 25,
  tier: 20,
  criticality: 15,
};

const tierScore: Record<Lane["customerTier"], number> = { A: 100, B: 60, C: 30 };

export function computePriorityScore(l: Lane, weights: PriorityWeights = DEFAULT_WEIGHTS) {
  const maxOrderLoss = Math.max(...lanes.map((x) => x.orderLoss));
  const orderLossNorm = (l.orderLoss / maxOrderLoss) * 100;
  const ds = demandSignal(l);
  const coverNorm = ds > 0 ? (shortage(l) / ds) * 100 : 0;
  const tierNorm = tierScore[l.customerTier];
  const criticalityNorm = l.criticality;
  const totalWeight = weights.orderLoss + weights.cover + weights.tier + weights.criticality || 100;
  const score =
    (orderLossNorm * weights.orderLoss +
      coverNorm * weights.cover +
      tierNorm * weights.tier +
      criticalityNorm * weights.criticality) /
    totalWeight;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export const indents: Indent[] = [
  {
    id: "IND-24-0781",
    laneId: "HRD-DEL-SURF",
    factory: "Haridwar Plant",
    dc: "Delhi NCR DC",
    cbu: "Surf Excel Matic",
    requiredQty: 4000,
    suggestedSource: "Production Req.",
    justification: "ATP+QC insufficient. Order loss 12.4k units, 2-day cover risk.",
    status: "Pending",
    createdAt: "Today 06:12",
  },
  {
    id: "IND-24-0782",
    laneId: "DPD-MUM-RIN",
    factory: "Dapada Plant",
    dc: "Mumbai West DC",
    cbu: "Rin Advanced Bar",
    requiredQty: 5800,
    suggestedSource: "Production Req.",
    justification: "PDQ 4.0k vs shortage 5.8k. Tier-A lane, MT customer.",
    status: "Pending",
    createdAt: "Today 06:12",
  },
  {
    id: "IND-24-0783",
    laneId: "SMP-MUM-HORL",
    factory: "Sumerpur Plant",
    dc: "Mumbai West DC",
    cbu: "Horlicks Classic",
    requiredQty: 3200,
    suggestedSource: "Reserved",
    justification: "Override reserved bucket — festive spike, order loss 9.6k.",
    status: "Approved",
    createdAt: "Today 05:48",
  },
  {
    id: "IND-24-0784",
    laneId: "PDY-CHN-DOVE",
    factory: "Puducherry Plant",
    dc: "Chennai South DC",
    cbu: "Dove Cream Beauty",
    requiredQty: 2100,
    suggestedSource: "Production Req.",
    justification: "Order loss 7.2k dominates. Tier-A DC.",
    status: "Submitted",
    createdAt: "Today 05:30",
  },
  {
    id: "IND-24-0785",
    laneId: "HRD-BLR-BRU",
    factory: "Haridwar Plant",
    dc: "Bengaluru DC",
    cbu: "Bru Instant Coffee",
    requiredQty: 1800,
    suggestedSource: "Production Req.",
    justification: "Coverage < 5 days across BLR DC.",
    status: "Rejected",
    createdAt: "Yesterday 18:22",
  },
];

export const nodes: NodeItem[] = [
  {
    id: "HRD-01",
    name: "Haridwar Plant",
    city: "Haridwar",
    type: "Factory",
    stockPct: 84,
    qcPending: 320,
    coverageDays: 22,
    x: 38,
    y: 18,
  },
  {
    id: "DPD-02",
    name: "Dapada Plant",
    city: "Dapada",
    type: "Factory",
    stockPct: 72,
    qcPending: 180,
    coverageDays: 16,
    x: 26,
    y: 46,
  },
  {
    id: "SMP-03",
    name: "Sumerpur Plant",
    city: "Sumerpur",
    type: "Factory",
    stockPct: 58,
    qcPending: 240,
    coverageDays: 14,
    x: 28,
    y: 34,
  },
  {
    id: "PDY-04",
    name: "Puducherry Plant",
    city: "Puducherry",
    type: "Factory",
    stockPct: 66,
    qcPending: 210,
    coverageDays: 12,
    x: 44,
    y: 78,
  },
  {
    id: "DC-DEL",
    name: "Delhi NCR DC",
    city: "New Delhi",
    type: "DC",
    stockPct: 22,
    qcPending: 90,
    coverageDays: 3,
    x: 46,
    y: 22,
  },
  {
    id: "DC-MUM",
    name: "Mumbai West DC",
    city: "Mumbai",
    type: "DC",
    stockPct: 41,
    qcPending: 60,
    coverageDays: 6,
    x: 28,
    y: 50,
  },
  {
    id: "DC-KOL",
    name: "Kolkata East DC",
    city: "Kolkata",
    type: "DC",
    stockPct: 74,
    qcPending: 40,
    coverageDays: 18,
    x: 70,
    y: 40,
  },
  {
    id: "DC-CHN",
    name: "Chennai South DC",
    city: "Chennai",
    type: "DC",
    stockPct: 33,
    qcPending: 82,
    coverageDays: 5,
    x: 52,
    y: 74,
  },
  {
    id: "DC-BLR",
    name: "Bengaluru DC",
    city: "Bengaluru",
    type: "DC",
    stockPct: 48,
    qcPending: 130,
    coverageDays: 8,
    x: 46,
    y: 70,
  },
];

export function getLaneById(id: string): Lane | undefined {
  return lanes.find((l) => l.id === id);
}

export type AuditEvent = {
  at: string;
  actor: string;
  event: string;
  /** null = system-wide event, shown on every lane's trail */
  laneId: string | null;
};

export const auditEvents: AuditEvent[] = [
  {
    at: "Today 06:12",
    actor: "IDIE Engine",
    event: "Recommendation generated: Raise Indent (4,000 units)",
    laneId: "HRD-DEL-SURF",
  },
  {
    at: "Today 06:08",
    actor: "APO Sync",
    event: "NR APO refreshed for 412 lanes",
    laneId: null,
  },
  {
    at: "Today 05:55",
    actor: "OMS Feed",
    event: "Order loss updated: +2,100 units in 3h window",
    laneId: "HRD-DEL-SURF",
  },
  {
    at: "Yesterday 18:40",
    actor: "Priya S.",
    event: "Approved indent IND-24-0776 (Surf Excel · Delhi)",
    laneId: "HRD-DEL-SURF",
  },
  {
    at: "Yesterday 18:22",
    actor: "Priya S.",
    event: "Rejected indent IND-24-0785 with note: 'DC replan pending'",
    laneId: "HRD-BLR-BRU",
  },
];
