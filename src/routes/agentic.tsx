import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardList,
  Sparkles,
  Bot,
  Truck,
  Database,
  Server,
  Check,
  X,
  ArrowRight,
  ArrowUpRight,
  FileCode2,
  ChevronDown,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentExplain } from "@/components/agent-explain";
import {
  laneShipmentBaseline,
  fillerRecsForLane,
  SHIPMENT_STAGE_ORDER,
  type ShipmentPlan,
  type ShipmentStage,
} from "@/data/agentic-mock";
import {
  useAppStore,
  setFillerStatus,
  runShipmentOptimization,
  advanceShipmentPlan,
} from "@/store/app-store";

export const Route = createFileRoute("/agentic")({
  head: () => ({
    meta: [
      { title: "Agentic Shipment Optimization · IDIE" },
      {
        name: "description",
        content:
          "End-to-end agentic workflow: manual indents enriched with filler recommendations, optimized into truck-fill-efficient shipments, staged and pushed to ERP as Stock Transfer Orders.",
      },
    ],
  }),
  component: AgenticWorkflow,
});

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}
function fmtInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const LANE_IDS = Object.keys(laneShipmentBaseline);

const STAGE_STEP_LABEL: Record<ShipmentStage, string> = {
  Optimized: "Optimized",
  Staged: "Staged",
  "STO Created": "STO Created",
  "Pending Transit Approval": "Transit Approval",
  "Approved · In Transit": "Approved",
};

const NEXT_ACTION_LABEL: Record<ShipmentStage, string> = {
  Optimized: "Push to staging",
  Staged: "Create STO in ERP (IDoc/XML)",
  "STO Created": "Push to Transit Approval Queue",
  "Pending Transit Approval": "Approve in ECC → create shipment",
  "Approved · In Transit": "",
};

function AgenticWorkflow() {
  const { indents, fillerRecs, shipmentPlans, craftedShipments } = useAppStore();

  const scopedIndents = indents.filter((i) => LANE_IDS.includes(i.laneId));
  const scopedFillers = fillerRecs.filter((f) => LANE_IDS.includes(f.laneId));
  const reviewedFillers = scopedFillers.filter((f) => f.status !== "Suggested");
  const acceptedFillers = scopedFillers.filter((f) => f.status === "Accepted");

  const anyOptimized = shipmentPlans.length > 0;
  const anyStaged = shipmentPlans.some((p) => SHIPMENT_STAGE_ORDER.indexOf(p.stage) >= 1);
  const anySTO = shipmentPlans.some((p) => SHIPMENT_STAGE_ORDER.indexOf(p.stage) >= 2);

  const pipeline = [
    { label: "Manual Indents", icon: ClipboardList, done: scopedIndents.length > 0 },
    {
      label: "Filler Agent",
      icon: Sparkles,
      done: scopedFillers.length > 0 && reviewedFillers.length === scopedFillers.length,
    },
    { label: "Shipment Optimizer", icon: Truck, done: anyOptimized },
    { label: "Staging", icon: Database, done: anyStaged },
    { label: "ERP · STO", icon: Server, done: anySTO },
  ];

  const totalTrucksSaved = shipmentPlans.reduce(
    (s, p) => s + Math.max(0, p.trucksBaseline - p.trucksOptimized),
    0,
  );
  const totalCostSaved = shipmentPlans.reduce((s, p) => s + p.costSaved, 0);
  const avgUplift = shipmentPlans.length
    ? Math.round(
        shipmentPlans.reduce((s, p) => s + (p.fillRateAfterPct - p.fillRateBeforePct), 0) /
          shipmentPlans.length,
      )
    : 0;

  const handleAccept = (id: string, name: string) => {
    setFillerStatus(id, "Accepted");
    toast.success(`Filler accepted · ${name}`);
  };
  const handleReject = (id: string, name: string) => {
    setFillerStatus(id, "Rejected");
    toast.info(`Filler rejected · ${name}`);
  };

  const handleOptimize = () => {
    if (acceptedFillers.length === 0) {
      toast.info("Accept at least one filler recommendation before optimizing shipments");
      return;
    }
    runShipmentOptimization();
    toast.success("Shipment Optimizer Agent ran", {
      description: `${acceptedFillers.length} accepted filler(s) grouped into optimized truck loads`,
    });
  };

  const handleAdvance = (plan: ShipmentPlan) => {
    advanceShipmentPlan(plan.id);
    const idx = SHIPMENT_STAGE_ORDER.indexOf(plan.stage);
    const next = SHIPMENT_STAGE_ORDER[idx + 1];
    if (next === "Approved · In Transit") {
      toast.success(`${plan.id} approved · Stock Transfer shipment created`, {
        description: `${plan.cbu} · ${plan.factoryCode} → ${plan.dcCode}`,
      });
    } else if (next) {
      toast.success(`${plan.id} → ${STAGE_STEP_LABEL[next]}`);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Preview · Agentic Automation"
        title="Agentic Shipment Optimization"
        subtitle="Manual indents are enriched by a filler agent, optimized into high-fill-rate truck loads by a second agent, staged, and pushed to ERP as Stock Transfer Orders — every step explainable."
        actions={
          <Link to="/shipments">
            <Button variant="outline" size="sm">
              <PackageCheck className="w-4 h-4 mr-2" /> View crafted shipments
            </Button>
          </Link>
        }
      />

      {/* Pipeline stepper */}
      <div className="bg-card border border-outline-variant rounded-xl p-4 md:p-5 mb-6 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {pipeline.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 w-28">
                <div
                  className={`w-10 h-10 rounded-full grid place-items-center border-2 transition-colors ${
                    step.done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-surface-container-low border-outline-variant text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-4.5 h-4.5" />
                </div>
                <span
                  className={`text-3xs text-center font-semibold leading-tight ${step.done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight className="w-4 h-4 text-outline-variant shrink-0 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Fillers reviewed",
            value: `${reviewedFillers.length}/${scopedFillers.length}`,
            icon: Sparkles,
            tone: "text-primary",
          },
          {
            label: "Shipments optimized",
            value: shipmentPlans.length,
            icon: Truck,
            tone: "text-tertiary",
          },
          { label: "Trucks saved", value: totalTrucksSaved, icon: Database, tone: "text-success" },
          {
            label: "Cost saved today",
            value: fmtInr(totalCostSaved),
            icon: Server,
            tone: "text-secondary-fixed-dim",
          },
        ].map((k, i) => (
          <div
            key={k.label}
            className="bg-card border border-outline-variant rounded-xl p-4 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
            style={{ animationDuration: "300ms", animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-3xs uppercase tracking-wider font-semibold text-on-surface-variant">
                {k.label}
              </span>
              <k.icon className={`w-4 h-4 ${k.tone}`} />
            </div>
            <div className="text-2xl font-bold font-data-mono">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Stage 1: Manual indents */}
      <section className="bg-card border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container grid place-items-center shrink-0">
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-semibold">1 · Manual Indents</h2>
            <p className="text-xs text-muted-foreground">
              The planner worklist feeding this run — same indents shown on the Indents page.
            </p>
          </div>
        </div>
        <div className="divide-y divide-outline-variant">
          {scopedIndents.map((ind) => (
            <div key={ind.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-sm">{ind.cbu}</div>
                <div className="text-3xs text-muted-foreground font-data-mono">
                  {ind.id} · {ind.factory} → {ind.dc}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-data-mono text-sm font-semibold">
                  {fmt(ind.requiredQty)} units
                </span>
                <Badge
                  variant={
                    ind.status === "Approved"
                      ? "success"
                      : ind.status === "Rejected"
                        ? "destructive"
                        : ind.status === "Submitted"
                          ? "default"
                          : "warning"
                  }
                  className="uppercase"
                >
                  {ind.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stage 2: Filler agent */}
      <section className="bg-card border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">2 · Filler Recommendation Agent</h2>
            <p className="text-xs text-muted-foreground">
              Mixes each manual indent with slow-moving or complementary SKUs from the same factory
              → DC lane to raise truck utilisation before shipment optimization.
            </p>
          </div>
        </div>
        <div className="divide-y divide-outline-variant">
          {LANE_IDS.map((laneId) => {
            const base = laneShipmentBaseline[laneId];
            const recs = fillerRecsForLane(fillerRecs, laneId);
            if (recs.length === 0) return null;
            return (
              <div key={laneId} className="p-4">
                <div className="text-xs font-semibold mb-3">
                  {base.cbu}{" "}
                  <span className="text-muted-foreground font-normal">
                    · {base.factoryCode} → {base.dcCode}
                  </span>
                </div>
                <div className="space-y-3">
                  {recs.map((fr) => (
                    <div
                      key={fr.id}
                      className="flex items-center justify-between gap-3 flex-wrap bg-surface-container-low rounded-lg p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{fr.filler.name}</span>
                          <Badge variant="outline" className="font-normal text-3xs">
                            {fr.filler.category}
                          </Badge>
                          <AgentExplain
                            agent="Filler Recommendation Agent"
                            rationale={fr.rationale}
                            consequence={fr.consequence}
                          />
                        </div>
                        <div className="text-3xs text-muted-foreground mt-0.5">
                          {fr.filler.pack} · {fmt(fr.suggestedQty)} units suggested · +
                          {fr.fillRateGainPct} pts fill rate
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {fr.status === "Suggested" ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-3xs"
                              onClick={() => handleAccept(fr.id, fr.filler.name)}
                            >
                              <Check className="w-3 h-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-3xs text-destructive hover:text-destructive"
                              onClick={() => handleReject(fr.id, fr.filler.name)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant={fr.status === "Accepted" ? "success" : "destructive"}>
                            {fr.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stage 3-5: Shipment optimizer + staging + ERP */}
      <section className="bg-card border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-tertiary/10 text-tertiary grid place-items-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-semibold">3 · Shipment Optimization Agent</h2>
              <p className="text-xs text-muted-foreground">
                Groups accepted fillers with their indent into one truck load, then walks each
                shipment through staging and ERP.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleOptimize}>
            <Truck className="w-4 h-4 mr-2" /> Run optimization
          </Button>
        </div>

        {shipmentPlans.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Accept filler recommendations above, then run the optimizer to build truck-fill plans.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {shipmentPlans.map((plan) => (
              <ShipmentPlanCard key={plan.id} plan={plan} onAdvance={handleAdvance} />
            ))}
          </div>
        )}
      </section>

      {avgUplift > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-3xs uppercase tracking-wider text-primary font-bold mb-1">
              Agent-enabled impact
            </div>
            <div className="text-sm text-on-surface-variant">
              Avg truck fill rate uplift{" "}
              <span className="font-bold text-foreground">+{avgUplift} pts</span> ·{" "}
              {totalTrucksSaved} truck{totalTrucksSaved === 1 ? "" : "s"} saved ·{" "}
              {fmtInr(totalCostSaved)} saved today
            </div>
          </div>
          <Link
            to="/shipments"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            {craftedShipments.length} crafted shipment{craftedShipments.length === 1 ? "" : "s"}{" "}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ShipmentPlanCard({
  plan,
  onAdvance,
}: {
  plan: ShipmentPlan;
  onAdvance: (plan: ShipmentPlan) => void;
}) {
  const [showPayload, setShowPayload] = useState(false);
  const stageIdx = SHIPMENT_STAGE_ORDER.indexOf(plan.stage);
  const trucksSaved = Math.max(0, plan.trucksBaseline - plan.trucksOptimized);
  const rationale = `Combines the ${plan.cbu} indent with ${plan.fillerRecIds.length} accepted filler SKU(s) on the ${plan.factoryCode} → ${plan.dcCode} lane. Same-lane co-loading lets one truck carry both without adding transit risk or lead time.`;
  const consequence = `Truck fill rate ${plan.fillRateBeforePct}% → ${plan.fillRateAfterPct}%. Trucks required drop from ${plan.trucksBaseline} to ${plan.trucksOptimized}, saving ${fmtInr(plan.costSaved)} today.`;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{plan.cbu}</span>
            <Badge variant="outline" className="font-data-mono text-3xs">
              {plan.id}
            </Badge>
            <AgentExplain
              agent="Shipment Optimization Agent"
              rationale={rationale}
              consequence={consequence}
            />
          </div>
          <div className="text-3xs text-muted-foreground mt-0.5">
            {plan.factoryCode} → {plan.dcCode}
          </div>
        </div>
        <Badge variant={plan.stage === "Approved · In Transit" ? "success" : "secondary"}>
          {plan.stage}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-3xs text-muted-foreground mb-1">
            <span>Truck fill rate</span>
            <span className="font-semibold text-foreground">
              {plan.fillRateBeforePct}% → {plan.fillRateAfterPct}%
            </span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden relative">
            <div
              className="h-full bg-primary absolute inset-y-0 left-0"
              style={{ width: `${plan.fillRateAfterPct}%` }}
            />
            <div
              className="h-full w-px bg-foreground/40 absolute inset-y-0"
              style={{ left: `${plan.fillRateBeforePct}%` }}
              title={`Baseline ${plan.fillRateBeforePct}%`}
            />
          </div>
        </div>
        <div>
          <div className="text-3xs text-muted-foreground">Trucks (before → after)</div>
          <div className="font-data-mono font-bold text-sm">
            {plan.trucksBaseline} → {plan.trucksOptimized}{" "}
            {trucksSaved > 0 && <span className="text-success">(−{trucksSaved})</span>}
          </div>
        </div>
        <div>
          <div className="text-3xs text-muted-foreground">Cost saved</div>
          <div className="font-data-mono font-bold text-sm text-success">
            {fmtInr(plan.costSaved)}
          </div>
        </div>
      </div>

      {/* Lifecycle mini-stepper */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {SHIPMENT_STAGE_ORDER.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${i <= stageIdx ? "bg-primary" : "bg-outline-variant"}`}
            />
            <span
              className={`text-3xs ${i <= stageIdx ? "text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              {STAGE_STEP_LABEL[stage]}
            </span>
            {i < SHIPMENT_STAGE_ORDER.length - 1 && <span className="text-outline-variant">—</span>}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {plan.stage !== "Approved · In Transit" ? (
          <Button size="sm" onClick={() => onAdvance(plan)}>
            {NEXT_ACTION_LABEL[plan.stage]}
          </Button>
        ) : (
          <Link to="/shipments" search={{ highlight: `CS-${plan.id.replace("SHP-", "")}` }}>
            <Button size="sm" variant="outline">
              View in Crafted Shipments <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        )}
        {plan.idocNumber && (
          <button
            type="button"
            onClick={() => setShowPayload((v) => !v)}
            className="inline-flex items-center gap-1 text-3xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            IDoc {plan.idocNumber} · STO {plan.stoNumber}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPayload ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {showPayload && plan.idocNumber && (
        <pre className="mt-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 text-3xs font-data-mono overflow-x-auto whitespace-pre-wrap">
          {`IDOC: ${plan.idocNumber}
Message Type: SHP_STO_CREATE
STO Number: ${plan.stoNumber}
Sending Plant: ${plan.factoryCode}   Receiving Plant/DC: ${plan.dcCode}
Material: ${plan.cbu}
Optimized load: ${plan.fillRateAfterPct}% truck fill · ${plan.trucksOptimized} truck(s)
Status: 53 (Application document posted in ECC)`}
        </pre>
      )}
    </div>
  );
}
