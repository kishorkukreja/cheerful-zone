import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Filter,
  Download,
  AlertTriangle,
  PackageCheck,
  Truck,
  Gauge,
  ShoppingCart,
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
} from "@/data/hul-mock";

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

function DispatchCockpit() {
  const ranked = [...lanes].sort((a, b) => b.priorityScore - a.priorityScore);

  const kpis = [
    {
      label: "Lanes at Risk",
      value: ranked.filter((l) => shortage(l) > 0).length,
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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Morning Worklist · 06:00 IST"
        title="Dispatch Cockpit"
        subtitle="Engine-ranked lanes across HUL factories. Approve dispatch or raise an indent — every recommendation is explained by the mitigation waterfall."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" /> Filter view
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Recommendations exported to CSV")}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-card border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-28"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                {k.label}
              </span>
              <k.icon className={`w-4 h-4 ${k.tone}`} />
            </div>
            <div>
              <div className="text-2xl font-bold font-data-mono leading-none">
                {k.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{k.unit}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Queue */}
        <section className="lg:col-span-9 bg-card border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base">Priority Queue</h2>
              <p className="text-xs text-muted-foreground">
                {ranked.length} lanes evaluated · sorted by engine priority score
              </p>
            </div>
            <div className="flex text-[11px] gap-1">
              {["All", "North", "West", "South", "East"].map((r, i) => (
                <button
                  key={r}
                  className={`px-2.5 py-1 rounded-md border ${
                    i === 0
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
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
                  return (
                    <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-3 font-data-mono text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold leading-tight">{l.cbu}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {l.factoryCode} → {l.dcCode} · Tier {l.customerTier} · {l.pack}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-data-mono">
                        {fmt(demandSignal(l))}
                        <div className="text-[10px] text-muted-foreground">
                          {l.orderLoss > l.nrApo ? "Order loss" : "NR APO"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-data-mono">
                        {fmt(plannedCoverage(l))}
                        <div className="text-[10px] text-muted-foreground">Alloc + PDQ</div>
                      </td>
                      <td className="px-3 py-3 text-right font-data-mono">
                        <span className={s > 0 ? "text-destructive font-semibold" : ""}>
                          {fmt(s)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-data-mono">
                        <span className={d > 0 ? "text-primary font-semibold" : ""}>
                          {fmt(d)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {rec === "Dispatch" && (
                          <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                            Dispatch
                          </Badge>
                        )}
                        {rec === "Raise Indent" && (
                          <Badge variant="destructive">Raise Indent</Badge>
                        )}
                        {rec === "Watch" && <Badge variant="secondary">Watch</Badge>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {rec === "Dispatch" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() =>
                                toast.success(`Dispatch approved · ${l.cbuCode}`, {
                                  description: `${fmt(d)} units queued for ${l.dcCode}`,
                                })
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {rec === "Raise Indent" && (
                            <Link to="/indents">
                              <Button size="sm" className="h-7 text-[11px]">
                                Indent
                              </Button>
                            </Link>
                          )}
                          <Link
                            to="/lanes/$laneId"
                            params={{ laneId: l.id }}
                            className="text-primary hover:underline text-[11px] inline-flex items-center"
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
        </section>

        {/* Right rail */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-card border border-outline-variant rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Why this ranking?</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Priority score blends four PRD factors. Weights are configurable in Admin.
            </p>
            <ul className="space-y-2 text-xs">
              {[
                { label: "Customer Order Loss impact", w: 40 },
                { label: "Days of Cover risk", w: 25 },
                { label: "Customer Tier (A/B/C)", w: 20 },
                { label: "Lane Criticality", w: 15 },
              ].map((f) => (
                <li key={f.label}>
                  <div className="flex justify-between mb-1">
                    <span>{f.label}</span>
                    <span className="font-data-mono font-semibold">{f.w}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${f.w}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
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
                <span className="text-emerald-600 font-semibold">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reco acceptance · 7d</span>
                <span className="font-semibold">78%</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
              Pilot KPI
            </div>
            <div className="text-2xl font-bold">−18%</div>
            <div className="text-xs text-on-surface-variant">
              Order loss reduction on pilot lanes vs 30-day baseline
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
