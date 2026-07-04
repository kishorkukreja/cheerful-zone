// Mock data for the Agentic Shipment Optimization workflow prototype.
// Story: manual indents → filler agent → shipment optimization agent →
// staging → ERP (IDoc/XML) → transit approval → crafted STO shipment.
// Ties back into the same lanes/indents used by the Cockpit and Indents pages.

export type FillerSku = {
  id: string;
  name: string;
  code: string;
  pack: string;
  category: "Slow-moving" | "Filler / Overflow" | "Complementary";
  factory: string;
  factoryCode: string;
};

export const fillerCatalog: FillerSku[] = [
  {
    id: "FIL-001",
    name: "Pears Soft & Fresh",
    code: "PRS-125",
    pack: "125 g soap × 6",
    category: "Slow-moving",
    factory: "Haridwar Plant",
    factoryCode: "HRD-01",
  },
  {
    id: "FIL-002",
    name: "Wheel Active Blue",
    code: "WHL-1KG",
    pack: "1 kg pouch",
    category: "Filler / Overflow",
    factory: "Dapada Plant",
    factoryCode: "DPD-02",
  },
  {
    id: "FIL-003",
    name: "Red Label Tea",
    code: "RLB-250",
    pack: "250 g pack × 12",
    category: "Complementary",
    factory: "Sumerpur Plant",
    factoryCode: "SMP-03",
  },
  {
    id: "FIL-004",
    name: "Boost Health Drink",
    code: "BST-500",
    pack: "500 g jar",
    category: "Slow-moving",
    factory: "Sumerpur Plant",
    factoryCode: "SMP-03",
  },
];

export type FillerRecommendation = {
  id: string;
  indentId: string;
  laneId: string;
  filler: FillerSku;
  suggestedQty: number;
  /** Percentage points this filler adds to truck fill rate once loaded. */
  fillRateGainPct: number;
  rationale: string;
  consequence: string;
  status: "Suggested" | "Accepted" | "Rejected";
};

export const seedFillerRecommendations: FillerRecommendation[] = [
  {
    id: "FR-9001",
    indentId: "IND-24-0781",
    laneId: "HRD-DEL-SURF",
    filler: fillerCatalog[0],
    suggestedQty: 1800,
    fillRateGainPct: 14,
    rationale:
      "Same origin factory (HRD-01) and destination DC (DC-DEL) as the Surf Excel indent. Pears has 42 days of cover and no open indent of its own — safe to co-load without cannibalising its replenishment.",
    consequence:
      "Truck utilisation rises ~68% → 82%. No impact to Pears' own dispatch plan; draws 1,800 units from ATP stock ageing 31–60 days, reducing obsolescence risk.",
    status: "Suggested",
  },
  {
    id: "FR-9002",
    indentId: "IND-24-0782",
    laneId: "DPD-MUM-RIN",
    filler: fillerCatalog[1],
    suggestedQty: 2600,
    fillRateGainPct: 11,
    rationale:
      "Wheel Active Blue ships from the same Dapada plant to Mumbai West DC. DC-MUM is below 45% stock — topping it up now avoids a second part-load truck next week.",
    consequence:
      "Truck utilisation rises ~71% → 82%. Pulls forward 2,600 units of a DC-MUM replenishment already on next week's plan — no new indent required.",
    status: "Suggested",
  },
  {
    id: "FR-9003",
    indentId: "IND-24-0783",
    laneId: "SMP-MUM-HORL",
    filler: fillerCatalog[2],
    suggestedQty: 3400,
    fillRateGainPct: 9,
    rationale:
      "Red Label Tea shares the Sumerpur → Mumbai West lane with Horlicks Classic. Tea has surplus QC-released stock and a standing DC order for next cycle.",
    consequence:
      "Truck utilisation rises ~74% → 83%. Uses QC-released stock only (no Reserved-bucket override needed).",
    status: "Suggested",
  },
  {
    id: "FR-9004",
    indentId: "IND-24-0783",
    laneId: "SMP-MUM-HORL",
    filler: fillerCatalog[3],
    suggestedQty: 1200,
    fillRateGainPct: 5,
    rationale:
      "Boost is a slow-moving SKU at Sumerpur (58 days cover) and fits the residual 700 kg of headroom left after the Red Label Tea filler.",
    consequence:
      "Adds a further 5 pts of fill rate on the same truck, taking utilisation to 88%. Reduces Boost's ageing-stock exposure at the plant.",
    status: "Suggested",
  },
];

export type LaneShipmentBaseline = {
  laneId: string;
  factory: string;
  factoryCode: string;
  dc: string;
  dcCode: string;
  cbu: string;
  fillRateBeforePct: number;
  trucksBaseline: number;
  costPerTruck: number;
};

export const laneShipmentBaseline: Record<string, LaneShipmentBaseline> = {
  "HRD-DEL-SURF": {
    laneId: "HRD-DEL-SURF",
    factory: "Haridwar Plant",
    factoryCode: "HRD-01",
    dc: "Delhi NCR DC",
    dcCode: "DC-DEL",
    cbu: "Surf Excel Matic",
    fillRateBeforePct: 68,
    trucksBaseline: 4,
    costPerTruck: 18500,
  },
  "DPD-MUM-RIN": {
    laneId: "DPD-MUM-RIN",
    factory: "Dapada Plant",
    factoryCode: "DPD-02",
    dc: "Mumbai West DC",
    dcCode: "DC-MUM",
    cbu: "Rin Advanced Bar",
    fillRateBeforePct: 71,
    trucksBaseline: 5,
    costPerTruck: 21000,
  },
  "SMP-MUM-HORL": {
    laneId: "SMP-MUM-HORL",
    factory: "Sumerpur Plant",
    factoryCode: "SMP-03",
    dc: "Mumbai West DC",
    dcCode: "DC-MUM",
    cbu: "Horlicks Classic",
    fillRateBeforePct: 74,
    trucksBaseline: 3,
    costPerTruck: 21000,
  },
};

export const SHIPMENT_STAGE_ORDER = [
  "Optimized",
  "Staged",
  "STO Created",
  "Pending Transit Approval",
  "Approved · In Transit",
] as const;

export type ShipmentStage = (typeof SHIPMENT_STAGE_ORDER)[number];

export type ShipmentPlan = LaneShipmentBaseline & {
  id: string;
  fillerRecIds: string[];
  fillRateAfterPct: number;
  trucksOptimized: number;
  costSaved: number;
  stage: ShipmentStage;
  createdAt: string;
  stagedAt?: string;
  stoNumber?: string;
  idocNumber?: string;
  stoCreatedAt?: string;
  approvedAt?: string;
};

export type CraftedShipment = {
  id: string;
  shipmentPlanId: string;
  laneId: string;
  cbu: string;
  factory: string;
  factoryCode: string;
  dc: string;
  dcCode: string;
  trucksBaseline: number;
  trucksOptimized: number;
  fillRateBeforePct: number;
  fillRateAfterPct: number;
  costSaved: number;
  stoNumber: string;
  idocNumber: string;
  stagedAt: string;
  stoCreatedAt: string;
  approvedAt: string;
};

// A couple of already-completed shipments so the Crafted Shipments page has
// history on first visit, before the user runs the live workflow.
export const seedCraftedShipments: CraftedShipment[] = [
  {
    id: "CS-7001",
    shipmentPlanId: "SHP-7001",
    laneId: "PDY-CHN-DOVE",
    cbu: "Dove Cream Beauty",
    factory: "Puducherry Plant",
    factoryCode: "PDY-04",
    dc: "Chennai South DC",
    dcCode: "DC-CHN",
    trucksBaseline: 3,
    trucksOptimized: 2,
    fillRateBeforePct: 63,
    fillRateAfterPct: 91,
    costSaved: 17400,
    stoNumber: "4500128341",
    idocNumber: "IDOC5820147",
    stagedAt: "Yesterday 21:10",
    stoCreatedAt: "Yesterday 21:14",
    approvedAt: "Yesterday 22:02",
  },
  {
    id: "CS-7002",
    shipmentPlanId: "SHP-7002",
    laneId: "HRD-BLR-BRU",
    cbu: "Bru Instant Coffee",
    factory: "Haridwar Plant",
    factoryCode: "HRD-01",
    dc: "Bengaluru DC",
    dcCode: "DC-BLR",
    trucksBaseline: 4,
    trucksOptimized: 3,
    fillRateBeforePct: 70,
    fillRateAfterPct: 89,
    costSaved: 19200,
    stoNumber: "4500128296",
    idocNumber: "IDOC5820098",
    stagedAt: "2 days ago 14:40",
    stoCreatedAt: "2 days ago 14:45",
    approvedAt: "2 days ago 16:20",
  },
];

export function fillerRecsForLane(recs: FillerRecommendation[], laneId: string) {
  return recs.filter((r) => r.laneId === laneId);
}
