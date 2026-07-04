import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Filter,
  Download,
  AlertTriangle,
  PackageCheck,
  Truck,
  Gauge,
  ShoppingCart,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  lanes,
  demandSignal,
  plannedCoverage,
  shortage,
  dispatchCalc,
  recommendation,
  computePriorityScore,
  type Lane,
} from "@/data/hul-mock";
import { useAppStore, approveDispatch, raiseIndent } from "@/store/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dispatch Cockpit · IDIE" },
      {
        name: "description",
        content:
          "Prioritized morning worklist of Factory-to-DC lanes with shortages, dispatch recommendations and indent triggers.",
      },
    ],
  }),
  component: DispatchCockpit,
});

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

const REGIONS = ["All", "North", "West", "South", "East"];
// Mock trailing order-loss trend (% of baseline order loss still unresolved) — feeds the impact panel.
const ORDER_LOSS_TREND = [30, 28, 26, 24, 21, 19, 18];

function DispatchCockpit() {
  const navigate = useNavigate();
  const { weights, dispatched, indents, compact } = useAppStore();
  const [region, setRegion] = useState("All");
  const cellY = compact ? "py-1.5" : "py-3";
  const kpiH = compact ? "h-20" : "h-28";
  const kpiP = compact ? "p-3" : "p-4";

  const scored = lanes.map((l) => ({ lane: l, score: computePriorityScore(l, weights) }));
  const ranked = scored
    .filter(({ lane }) => region === "All" || lane.region === region)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.lane);

  const dispatchedToday = Object.values(dispatched).reduce((s, d) => s + d.qty, 0);
  const indentsToday = indents.filter((i) => i.createdAt === "Just now").length;
  const maxTrend = Math.max(...ORDER_LOSS_TREND);

  const kpis = [
    {
      label: "Lanes at Risk",
      value: ranked.filter((l) => shortage(l) > 0 && !dispatched[l.id]).length,
      unit: "of " + ranked.length,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
    {
      label: "Total Shortage",
      value: fmt(ranked.reduce((s, l) => s + shortage(l), 0)),
      unit: "units",
      icon: Gauge,
      tone: "text-tertiary",
    },
    {
      label: "Dispatch-Ready",
      value: fmt(ranked.reduce((s, l) => s + dispatchCalc(l), 0)),
      unit: "units",
      icon: Truck,
      tone: "text-primary",
    },
    {
      label: "Indents Recommended",
      value: ranked.filter((l) => recommendation(l) === "Raise Indent").length,
      unit: "actions",
      icon: PackageCheck,
      tone: "text-secondary-fixed-dim",
    },
    {
      label: "Order Loss · 24h",
      value: fmt(ranked.reduce((s, l) => s + l.orderLoss, 0)),
      unit: "units",
      icon: ShoppingCart,
      tone: "text-destructive",
    },
  ];

  const handleApprove = (l: Lane, qty: number) => {
    approveDispatch(l, qty);
    toast.success(`Dispatch approved · ${l.cbuCode}`, {
      description: `${fmt(qty)} units queued for ${l.dcCode}`,
    });
  };

  const handleIndent = (l: Lane) => {
    const qty = Math.max(0, shortage(l) - dispatchCalc(l));
    const id = raiseIndent(l, qty);
    navigate({ to: "/indents", search: { highlight: id } });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Morning Worklist · 06:00 IST"
        title="Dispatch Cockpit"
        subtitle="Engine-ranked lanes across HUL factories. Approve dispatch or raise an indent — every recommendation is explained by the mitigation waterfall."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Filter panel is a visual preview in this prototype")}
            >
              <Filter className="w-4 h-4 mr-2" /> Filter view
            </Button>
            <Button size="sm" onClick={() => toast.success("Recommendations exported to CSV")}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={`bg-card border border-outline-variant rounded-xl ${kpiP} flex flex-col justify-between ${kpiH} transition-[height,padding] duration-200 ease-in-out animate-in fade-in slide-in-from-bottom-1 fill-mode-both`}
            style={{ animationDuration: "300ms", animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xs uppercase tracking-wider font-semibold text-on-surface-variant">
                {k.label}
              </span>
              <k.icon className={`w-4 h-4 ${k.tone}`} />
            </div>
            <div>
              <div className="text-2xl font-bold font-data-mono leading-none">{k.value}</div>
              <div className="text-3xs text-muted-foreground mt-1">{k.unit}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Queue */}
        <section className="lg:col-span-9 bg-card border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-base">Priority Queue</h2>
              <p className="text-xs text-muted-foreground">
                {ranked.length} lanes evaluated · sorted by engine priority score
              </p>
            </div>
            <div className="flex text-3xs gap-1">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-2.5 py-1 rounded-md border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    region === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-3xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left font-semibold w-10">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Lane</th>
                  <th className="px-3 py-2 text-right font-semibold">Demand</th>
                  <th className="px-3 py-2 text-right font-semibold">Coverage</th>
                  <th className="px-3 py-2 text-right font-semibold">Shortage</th>
                  <th className="px-3 py-2 text-right font-semibold">Dispatch Calc.</th>
                  <th className="px-3 py-2 text-left font-semibold">Action</th>
                  <th className="px-3 py-2 text-right font-semibold">Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {ranked.map((l, i) => {
                  const rec = recommendation(l);
                  const s = shortage(l);
                  const d = dispatchCalc(l);
                  const isDispatched = !!dispatched[l.id];
                  const existingIndent = indents.find(
                    (ind) => ind.laneId === l.id && ind.status !== "Rejected",
                  );
                  return (
                    <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                      <td className={`px-3 ${cellY} font-data-mono text-muted-foreground`}>
                        {i + 1}
                      </td>
                      <td className={`px-3 ${cellY}`}>
                        <div className="font-semibold leading-tight">{l.cbu}</div>
                        <div className="text-3xs text-muted-foreground">
                          {l.factoryCode} → {l.dcCode} · Tier {l.customerTier} · {l.pack}
                        </div>
                      </td>
                      <td className={`px-3 ${cellY} text-right font-data-mono`}>
                        {fmt(demandSignal(l))}
                        <div className="text-3xs text-muted-foreground">
                          {l.orderLoss > l.nrApo ? "Order loss" : "NR APO"}
                        </div>
                      </td>
                      <td className={`px-3 ${cellY} text-right font-data-mono`}>
                        {fmt(plannedCoverage(l))}
                        <div className="text-3xs text-muted-foreground">Alloc + PDQ</div>
                      </td>
                      <td className={`px-3 ${cellY} text-right font-data-mono`}>
                        <span className={s > 0 ? "text-destructive font-semibold" : ""}>
                          {fmt(s)}
                        </span>
                      </td>
                      <td className={`px-3 ${cellY} text-right font-data-mono`}>
                        <span className={d > 0 ? "text-primary font-semibold" : ""}>{fmt(d)}</span>
                      </td>
                      <td className={`px-3 ${cellY}`}>
                        {rec === "Dispatch" && <Badge variant="success">Dispatch</Badge>}
                        {rec === "Raise Indent" && (
                          <Badge variant="destructive">Raise Indent</Badge>
                        )}
                        {rec === "Watch" && <Badge variant="secondary">Watch</Badge>}
                      </td>
                      <td className={`px-3 ${cellY}`}>
                        <div className="flex items-center justify-end gap-1">
                          {rec === "Dispatch" &&
                            (isDispatched ? (
                              <span className="inline-flex items-center gap-1 text-3xs text-on-success-container bg-success-container px-2 py-1 rounded-md font-semibold">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-3xs"
                                onClick={() => handleApprove(l, d)}
                              >
                                Approve
                              </Button>
                            ))}
                          {rec === "Raise Indent" &&
                            (existingIndent ? (
                              <Link
                                to="/indents"
                                search={{ highlight: existingIndent.id }}
                                className="text-3xs font-semibold text-primary hover:underline"
                              >
                                View indent
                              </Link>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-3xs"
                                onClick={() => handleIndent(l)}
                              >
                                Indent
                              </Button>
                            ))}
                          <Link
                            to="/lanes/$laneId"
                            params={{ laneId: l.id }}
                            className="text-primary hover:underline text-3xs inline-flex items-center"
                          >
                            Details <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list cards */}
          <div className="md:hidden divide-y divide-outline-variant">
            {ranked.map((l, i) => {
              const rec = recommendation(l);
              const s = shortage(l);
              const d = dispatchCalc(l);
              const isDispatched = !!dispatched[l.id];
              const existingIndent = indents.find(
                (ind) => ind.laneId === l.id && ind.status !== "Rejected",
              );
              return (
                <div key={l.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-3xs text-muted-foreground font-data-mono">#{i + 1}</div>
                      <div className="font-semibold leading-tight">{l.cbu}</div>
                      <div className="text-3xs text-muted-foreground">
                        {l.factoryCode} → {l.dcCode} · Tier {l.customerTier}
                      </div>
                    </div>
                    {rec === "Dispatch" && <Badge variant="success">Dispatch</Badge>}
                    {rec === "Raise Indent" && <Badge variant="destructive">Raise Indent</Badge>}
                    {rec === "Watch" && <Badge variant="secondary">Watch</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <div className="text-3xs text-muted-foreground">Demand</div>
                      <div className="font-data-mono font-semibold text-sm">
                        {fmt(demandSignal(l))}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-muted-foreground">Shortage</div>
                      <div
                        className={`font-data-mono font-semibold text-sm ${s > 0 ? "text-destructive" : ""}`}
                      >
                        {fmt(s)}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-muted-foreground">Dispatch Calc.</div>
                      <div className="font-data-mono font-semibold text-sm text-primary">
                        {fmt(d)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec === "Dispatch" &&
                      (isDispatched ? (
                        <span className="inline-flex items-center gap-1 text-xs text-on-success-container bg-success-container px-2 py-1.5 rounded-md font-semibold flex-1 justify-center">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleApprove(l, d)}
                        >
                          Approve
                        </Button>
                      ))}
                    {rec === "Raise Indent" &&
                      (existingIndent ? (
                        <Link
                          to="/indents"
                          search={{ highlight: existingIndent.id }}
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View indent
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" className="flex-1" onClick={() => handleIndent(l)}>
                          Indent
                        </Button>
                      ))}
                    <Link to="/lanes/$laneId" params={{ laneId: l.id }} className="flex-1">
                      <Button size="sm" variant="ghost" className="w-full">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right rail */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-card border border-outline-variant rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Why this ranking?</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Priority score blends four PRD factors, live-tuned in Admin. Weights currently
              applied:
            </p>
            <ul className="space-y-2 text-xs">
              {[
                { label: "Customer Order Loss impact", w: weights.orderLoss },
                { label: "Days of Cover risk", w: weights.cover },
                { label: "Customer Tier (A/B/C)", w: weights.tier },
                { label: "Lane Criticality", w: weights.criticality },
              ].map((f) => (
                <li key={f.label}>
                  <div className="flex justify-between mb-1">
                    <span>{f.label}</span>
                    <span className="font-data-mono font-semibold">{f.w}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${f.w}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/admin" className="text-3xs text-primary hover:underline mt-3 inline-block">
              Tune weights in Admin →
            </Link>
          </div>

          <div className="bg-card border border-outline-variant rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">SLA</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine run</span>
                <span className="font-data-mono">03:12 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data freshness</span>
                <span className="text-success font-semibold">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reco acceptance · 7d</span>
                <span className="font-semibold">78%</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-3xs uppercase tracking-wider text-primary font-bold">
                Today's Impact
              </div>
              <span className="text-3xs text-muted-foreground">live</span>
            </div>
            <div className="text-2xl font-bold">−18%</div>
            <div className="text-xs text-on-surface-variant mb-3">
              Order loss reduction on pilot lanes vs 30-day baseline
            </div>
            <div className="flex items-end gap-1 h-9 mb-3" aria-hidden>
              {ORDER_LOSS_TREND.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/30 rounded-sm first:bg-primary/20 last:bg-primary"
                  style={{ height: `${(v / maxTrend) * 100}%` }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-primary/20">
              <div>
                <div className="font-data-mono font-bold text-base">{fmt(dispatchedToday)}</div>
                <div className="text-muted-foreground">Units dispatched today</div>
              </div>
              <div>
                <div className="font-data-mono font-bold text-base">{indentsToday}</div>
                <div className="text-muted-foreground">Indents raised today</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
