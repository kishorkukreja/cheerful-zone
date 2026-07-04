import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  PackagePlus,
  Clock,
  Factory,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  lanes,
  getLaneById,
  demandSignal,
  plannedCoverage,
  shortage,
  dispatchCalc,
  recommendation,
  computePriorityScore,
  type Lane,
} from "@/data/hul-mock";
import { useAppStore, approveDispatch, raiseIndent, auditEventsForLane } from "@/store/app-store";

export const Route = createFileRoute("/lanes/$laneId")({
  loader: ({ params }) => {
    const lane = getLaneById(params.laneId);
    if (!lane) throw notFound();
    return { lane };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.lane.cbu} · ${loaderData.lane.dcCode} · Lane Detail`
          : "Lane Detail · IDIE",
      },
      {
        name: "description",
        content:
          "Mitigation waterfall, demand signal decomposition and coverage timeline for a Factory-to-DC lane.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-2">Lane not found</h1>
      <Link to="/" className="text-primary hover:underline">
        Return to cockpit
      </Link>
    </div>
  ),
  component: LaneDetail,
});

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

function LaneDetail() {
  const { lane } = Route.useLoaderData() as { lane: Lane };
  const navigate = useNavigate();
  const { weights, dispatched, indents, auditEvents: events } = useAppStore();
  const s = shortage(lane);
  const d = dispatchCalc(lane);
  const rec = recommendation(lane);
  const ds = demandSignal(lane);
  const cov = plannedCoverage(lane);
  const isDispatched = !!dispatched[lane.id];
  const existingIndent = indents.find((i) => i.laneId === lane.id && i.status !== "Rejected");

  const rankedIds = [...lanes]
    .sort((a, b) => computePriorityScore(b, weights) - computePriorityScore(a, weights))
    .map((l) => l.id);
  const rank = rankedIds.indexOf(lane.id) + 1;

  const laneAudit = auditEventsForLane(events, lane.id);

  // Sparkline mock
  const actual = [82, 76, 74, 70, 68, 65, 60, 55, 48, 42, 38, 30, 24, 18];
  const plan = [80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54];
  const projected = [22, 26, 30, 28, 32, 38, 46, 52, 58, 62, 66, 68, 70, 72];

  const maxBucket = Math.max(...lane.buckets.map((b) => b.available));

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Cockpit
      </Link>
      <div className="text-xs text-on-surface-variant mb-1">
        Ranked <span className="font-semibold font-data-mono">#{rank}</span> of {lanes.length} in
        today's priority queue
        {existingIndent && (
          <>
            {" · "}
            <Link
              to="/indents"
              search={{ highlight: existingIndent.id }}
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View indent {existingIndent.id} <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
          </>
        )}
      </div>
      <PageHeader
        eyebrow={`Lane ${lane.id}`}
        title={lane.cbu}
        subtitle={`${lane.pack} · Tier ${lane.customerTier} customer · ${lane.transitDays}-day transit`}
        actions={
          <>
            {rec === "Dispatch" &&
              (isDispatched ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-on-success-container bg-success-container px-3 py-2 rounded-md font-semibold">
                  <Check className="w-4 h-4" /> Dispatch approved
                </span>
              ) : (
                <Button
                  onClick={() => {
                    approveDispatch(lane, d);
                    toast.success(`Dispatch approved · ${fmt(d)} units to ${lane.dcCode}`);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve dispatch
                </Button>
              ))}
            {rec === "Raise Indent" &&
              (existingIndent ? (
                <Link to="/indents" search={{ highlight: existingIndent.id }}>
                  <Button variant="outline">
                    <PackagePlus className="w-4 h-4 mr-2" /> View indent
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => {
                    const qty = Math.max(0, s - d);
                    const id = raiseIndent(lane, qty);
                    navigate({ to: "/indents", search: { highlight: id } });
                  }}
                >
                  <PackagePlus className="w-4 h-4 mr-2" /> Raise indent
                </Button>
              ))}
            <Button
              variant="outline"
              onClick={() => toast.info("Reschedule is a visual preview in this prototype")}
            >
              <Clock className="w-4 h-4 mr-2" /> Reschedule
            </Button>
          </>
        }
      />

      {/* Lane header */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-outline-variant rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="text-3xs uppercase tracking-wider text-muted-foreground font-semibold">
              Origin factory
            </div>
            <div className="font-semibold">{lane.factory}</div>
            <div className="text-xs text-muted-foreground font-data-mono">{lane.factoryCode}</div>
          </div>
        </div>
        <div className="bg-card border border-outline-variant rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary grid place-items-center">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-3xs uppercase tracking-wider text-muted-foreground font-semibold">
              Destination DC
            </div>
            <div className="font-semibold">{lane.dc}</div>
            <div className="text-xs text-muted-foreground font-data-mono">
              {lane.dcCode} · {lane.region}
            </div>
          </div>
        </div>
        <div className="bg-card border border-outline-variant rounded-xl p-4">
          <div className="text-3xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Recommendation
          </div>
          <div className="flex items-center gap-2">
            {rec === "Dispatch" && <Badge variant="success">Dispatch {fmt(d)}</Badge>}
            {rec === "Raise Indent" && <Badge variant="destructive">Raise Indent</Badge>}
            {rec === "Watch" && <Badge variant="secondary">Watch</Badge>}
            <span className="text-xs text-muted-foreground">
              Priority score {computePriorityScore(lane, weights)}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall */}
        <section className="lg:col-span-8 bg-card border border-outline-variant rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold">Mitigation Waterfall</h2>
              <p className="text-xs text-muted-foreground">
                ATP → QC Stock → Reserved → Production Requirement (per PRD §7.3)
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xs uppercase tracking-wider text-muted-foreground">
                Shortage
              </div>
              <div className="text-2xl font-bold text-destructive font-data-mono">{fmt(s)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {lane.buckets.map((b) => {
              const availPct = (b.available / maxBucket) * 100;
              const consPct = (b.consumed / b.available) * 100 || 0;
              return (
                <div key={b.name}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{b.name}</span>
                      {!b.eligible && (
                        <Badge variant="outline" className="text-3xs h-5">
                          Requires override
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-data-mono font-semibold text-foreground">
                        {fmt(b.consumed)}
                      </span>{" "}
                      / {fmt(b.available)} consumed
                    </div>
                  </div>
                  <div
                    className="h-6 rounded-md bg-surface-container relative overflow-hidden"
                    style={{ width: `${availPct}%`, minWidth: "20%" }}
                  >
                    <div
                      className={`h-full ${b.eligible ? "bg-primary" : "bg-secondary-fixed-dim"}`}
                      style={{ width: `${consPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-outline-variant grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xs uppercase text-muted-foreground font-semibold">
                Demand signal
              </div>
              <div className="text-lg font-bold font-data-mono">{fmt(ds)}</div>
            </div>
            <div>
              <div className="text-3xs uppercase text-muted-foreground font-semibold">
                Planned coverage
              </div>
              <div className="text-lg font-bold font-data-mono">{fmt(cov)}</div>
            </div>
            <div>
              <div className="text-3xs uppercase text-muted-foreground font-semibold">
                Dispatch calc.
              </div>
              <div className="text-lg font-bold font-data-mono text-primary">{fmt(d)}</div>
            </div>
          </div>
        </section>

        {/* Demand breakdown */}
        <section className="lg:col-span-4 bg-card border border-outline-variant rounded-xl p-5">
          <h2 className="font-semibold mb-3">Demand Signal Breakdown</h2>
          <div className="space-y-3 text-sm">
            <BreakdownRow
              label="NR APO"
              value={lane.nrApo}
              max={ds}
              tone="primary"
              dominant={lane.nrApo >= lane.orderLoss}
            />
            <BreakdownRow
              label="Order Loss"
              value={lane.orderLoss}
              max={ds}
              tone="destructive"
              dominant={lane.orderLoss > lane.nrApo}
            />
            <div className="border-t border-outline-variant pt-3">
              <div className="text-xs text-muted-foreground">
                Engine uses{" "}
                <span className="font-semibold text-foreground">MAX(NR APO, Order Loss)</span> as
                the demand signal. Right now{" "}
                <span className="font-semibold">
                  {lane.orderLoss > lane.nrApo ? "Order Loss" : "NR APO"}
                </span>{" "}
                dominates.
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Allocation</span>
              <span className="font-data-mono font-semibold">{fmt(lane.allocation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PDQ</span>
              <span className="font-data-mono font-semibold">{fmt(lane.pdq)}</span>
            </div>
          </div>
        </section>

        {/* Coverage timeline */}
        <section className="lg:col-span-12 bg-card border border-outline-variant rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Coverage Timeline</h2>
              <p className="text-xs text-muted-foreground">
                Trailing 14 days actual vs plan · next 14 days projected
              </p>
            </div>
            <div className="flex gap-3 text-3xs">
              <LegendDot color="bg-primary" label="Actual" />
              <LegendDot color="bg-muted-foreground" label="Plan" />
              <LegendDot color="bg-tertiary" label="Projected" />
            </div>
          </div>
          <Sparkline actual={actual} plan={plan} projected={projected} />
        </section>

        {/* Audit trail */}
        <section className="lg:col-span-12 bg-card border border-outline-variant rounded-xl p-5">
          <h2 className="font-semibold mb-1">Audit Trail</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Events for this lane, plus system-wide engine runs.
          </p>
          <ol className="relative border-l border-outline-variant ml-2 space-y-4">
            {laneAudit.map((e, i) => (
              <li key={i} className="pl-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary" />
                <div className="text-xs text-muted-foreground">{e.at}</div>
                <div className="text-sm">
                  <span className="font-semibold">{e.actor}</span> — {e.event}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  max,
  tone,
  dominant,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "destructive";
  dominant: boolean;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className={dominant ? "font-semibold" : ""}>{label}</span>
        <span className="font-data-mono font-semibold">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full ${tone === "primary" ? "bg-primary" : "bg-destructive"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Sparkline({
  actual,
  plan,
  projected,
}: {
  actual: number[];
  plan: number[];
  projected: number[];
}) {
  const w = 900;
  const h = 180;
  const all = [...actual, ...plan, ...projected];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const total = actual.length + projected.length;
  const step = w / (total - 1);
  const scaleY = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 20) - 10;

  const path = (arr: number[], offset: number) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${(i + offset) * step} ${scaleY(v)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        <line
          x1={actual.length * step}
          y1="0"
          x2={actual.length * step}
          y2={h}
          stroke="var(--color-outline-variant)"
          strokeDasharray="3 3"
        />
        <path
          d={path(plan, 0)}
          stroke="var(--color-muted-foreground)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 3"
        />
        <path d={path(actual, 0)} stroke="var(--color-primary)" strokeWidth="2.5" fill="none" />
        <path
          d={path(projected, actual.length - 1)}
          stroke="var(--color-tertiary)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="1 0"
        />
      </svg>
    </div>
  );
}
