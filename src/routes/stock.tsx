import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Timer,
  ClipboardCheck,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { nodes, lanes, shortage, dispatchCalc, type Lane } from "@/data/hul-mock";
import { useAppStore, raiseIndent } from "@/store/app-store";

function matchLane(cbuLabel: string): Lane | undefined {
  return lanes.find((l) => cbuLabel.includes(l.cbu));
}

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock Analyser · IDIE" },
      {
        name: "description",
        content:
          "Global inventory health: multi-node stock monitoring, ageing profile and coverage risks across HUL factories and DCs.",
      },
    ],
  }),
  component: StockAnalyser,
});

function StockAnalyser() {
  const navigate = useNavigate();
  const factories = nodes.filter((n) => n.type === "Factory");
  const dcs = nodes.filter((n) => n.type === "DC");

  const goToNodeIndents = (n: (typeof nodes)[number]) => {
    navigate({
      to: "/indents",
      search: n.type === "DC" ? { dc: n.name } : { factory: n.name },
    });
  };

  const goToCbuIndent = (cbuLabel: string) => {
    const lane = matchLane(cbuLabel);
    if (!lane) return toast.info("No lane mapped to this CBU in the prototype");
    const s = shortage(lane);
    const d = dispatchCalc(lane);
    if (s <= 0) return toast.info(`${lane.cbu} has no active shortage right now`);
    const id = raiseIndent(lane, Math.max(0, s - d));
    navigate({ to: "/indents", search: { highlight: id } });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Global Inventory Health"
        title="Stock Analyser"
        subtitle="Real-time multi-node stock monitoring and shortage prediction across HUL supply network."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" /> Filter view
            </Button>
            <Button size="sm" onClick={() => toast.success("Stock report exported")}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Valuation"
          value="₹1,428 Cr"
          icon={IndianRupee}
          tone="text-primary"
          delta={
            <span className="text-success flex items-center text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> +2.4% vs PW
            </span>
          }
        />
        <KpiCard
          label="Avg Coverage"
          value="18.4 Days"
          icon={Timer}
          tone="text-tertiary"
          delta={
            <span className="text-destructive flex items-center text-xs">
              <TrendingDown className="w-3 h-3 mr-1" /> −1.2 days risk
            </span>
          }
        />
        <KpiCard
          label="QC Hold"
          value="1,242 units"
          icon={ClipboardCheck}
          tone="text-secondary-fixed-dim"
          delta={
            <span className="text-muted-foreground flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim mr-2" /> 4 nodes impacted
            </span>
          }
        />
        <KpiCard
          label="Critical SKUs"
          value="12 SKU"
          valueTone="text-destructive"
          icon={AlertTriangle}
          tone="text-destructive"
          delta={
            <span className="text-on-surface-variant flex items-center text-xs">
              Immediate action required
            </span>
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Node network */}
          <div className="bg-card border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-semibold">Multi-Node Network — HUL India</h3>
              <div className="flex bg-surface-container p-1 rounded-lg">
                <button className="px-3 py-1 bg-card text-primary rounded-md text-xs font-semibold shadow-sm">
                  FACTORY
                </button>
                <button className="px-3 py-1 text-muted-foreground text-xs hover:bg-surface-container-high rounded-md">
                  DC / HUB
                </button>
              </div>
            </div>
            <div
              className="relative h-[400px] bg-surface-container-low overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(var(--color-outline-variant) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {/* Faint quadrant labels give geographic orientation without a literal map image */}
              <span className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
                North
              </span>
              <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
                West
              </span>
              <span className="absolute bottom-3 right-4 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
                South
              </span>
              <span className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
                East
              </span>
              {nodes.map((n) => {
                const critical = n.stockPct < 35;
                const okay = n.stockPct >= 60;
                const dot =
                  n.type === "Factory"
                    ? "bg-primary"
                    : critical
                      ? "bg-destructive"
                      : okay
                        ? "bg-success"
                        : "bg-tertiary";
                return (
                  <div
                    key={n.id}
                    className="absolute group cursor-pointer"
                    style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  >
                    <div className="relative">
                      <div className={`w-3.5 h-3.5 rounded-full ${dot} ring-4 ring-card`} />
                      <div className="absolute top-5 left-0 bg-card border border-outline-variant rounded-xl shadow-lg p-3 w-56 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {n.type} · {n.id}
                        </div>
                        <div className="font-bold mb-1">{n.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{n.city}</div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Stock level</span>
                          <span className={`font-bold ${critical ? "text-destructive" : ""}`}>
                            {n.stockPct}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${critical ? "bg-destructive" : okay ? "bg-success" : "bg-tertiary"}`}
                            style={{ width: `${n.stockPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                          <span>Cover · {n.coverageDays}d</span>
                          <span>QC · {n.qcPending}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node breakdown */}
          <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Inventory Node Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  {factories.length} factories · {dcs.length} DCs
                </p>
              </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-semibold">Node</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Availability</th>
                    <th className="px-4 py-3 text-right font-semibold">QC Pending</th>
                    <th className="px-4 py-3 text-right font-semibold">Coverage</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {nodes.map((n) => {
                    const critical = n.stockPct < 35;
                    const okay = n.stockPct >= 60;
                    return (
                      <tr key={n.id} className="hover:bg-surface-container-low">
                        <td className="px-4 py-3">
                          <div className="font-bold">{n.name}</div>
                          <div className="text-[11px] text-muted-foreground">{n.city}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              n.type === "Factory"
                                ? "bg-secondary-container text-on-secondary-container"
                                : "bg-outline-variant text-on-surface-variant"
                            }`}
                          >
                            {n.type === "Factory" ? "Factory" : "Warehouse"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-28 bg-surface-container h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${critical ? "bg-destructive" : okay ? "bg-success" : "bg-tertiary"}`}
                              style={{ width: `${n.stockPct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {n.stockPct}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-data-mono">
                          {n.qcPending.toLocaleString("en-IN")} u
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${critical ? "text-destructive" : ""}`}>
                            {n.coverageDays}d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="text-primary hover:underline text-xs"
                            onClick={() =>
                              critical
                                ? goToNodeIndents(n)
                                : toast.info(
                                    `${n.name} · ${n.stockPct}% stock, ${n.coverageDays}d cover`,
                                  )
                            }
                          >
                            {critical ? "Indent" : "Details"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list cards */}
            <div className="md:hidden divide-y divide-outline-variant">
              {nodes.map((n) => {
                const critical = n.stockPct < 35;
                const okay = n.stockPct >= 60;
                return (
                  <div key={n.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold">{n.name}</div>
                        <div className="text-[11px] text-muted-foreground">{n.city}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                          n.type === "Factory"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {n.type === "Factory" ? "Factory" : "Warehouse"}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full ${critical ? "bg-destructive" : okay ? "bg-success" : "bg-tertiary"}`}
                        style={{ width: `${n.stockPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>{n.stockPct}% available</span>
                      <span>QC {n.qcPending.toLocaleString("en-IN")}u</span>
                      <span className={critical ? "text-destructive font-bold" : ""}>
                        {n.coverageDays}d cover
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        critical
                          ? goToNodeIndents(n)
                          : toast.info(`${n.name} · ${n.stockPct}% stock, ${n.coverageDays}d cover`)
                      }
                    >
                      {critical ? "Indent" : "Details"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Donut */}
          <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Overall Stock Health</h3>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="var(--color-surface-container)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="var(--color-primary)"
                  strokeDasharray="65 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="var(--color-secondary-fixed-dim)"
                  strokeDasharray="20 100"
                  strokeDashoffset="-65"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="var(--color-destructive)"
                  strokeDasharray="15 100"
                  strokeDashoffset="-85"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-bold">78%</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Optimal
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <LegendRow color="bg-primary" label="Healthy" value="65%" />
              <LegendRow color="bg-secondary-fixed-dim" label="Slow moving" value="20%" />
              <LegendRow color="bg-destructive" label="Critical shortage" value="15%" />
            </div>
          </div>

          {/* Ageing */}
          <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Stock Ageing</h3>
              <span className="text-[10px] font-bold text-primary uppercase">Daily view</span>
            </div>
            <div className="space-y-4">
              <AgeRow label="0–30 days" units="12.5k" pct={75} tone="bg-primary" />
              <AgeRow label="31–60 days" units="4.2k" pct={35} tone="bg-secondary-fixed-dim" />
              <AgeRow
                label="60+ days (obsolete risk)"
                units="1.1k"
                pct={12}
                tone="bg-tertiary"
                muted
              />
            </div>
          </div>

          {/* Coverage risks */}
          <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-destructive">Coverage Risks (CBU)</h3>
            <div className="space-y-4">
              <RiskRow
                name="Surf Excel Matic 2kg"
                days={2}
                tone="destructive"
                inv={240}
                demand={2100}
                avail={10}
                inTransit={15}
                shortage={75}
                onIndent={() => goToCbuIndent("Surf Excel Matic 2kg")}
              />
              <RiskRow
                name="Rin Advanced Bar"
                days={9}
                tone="secondary"
                inv={1800}
                demand={2400}
                avail={45}
                inTransit={35}
                shortage={20}
                onIndent={() => goToCbuIndent("Rin Advanced Bar")}
              />
              <RiskRow
                name="Horlicks Classic 500g"
                days={6}
                tone="destructive"
                inv={620}
                demand={1500}
                avail={30}
                inTransit={20}
                shortage={50}
                onIndent={() => goToCbuIndent("Horlicks Classic 500g")}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate({ to: "/" })}
            >
              View all lanes in Cockpit
            </Button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => toast.info("Manual stock adjustment opened")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        aria-label="Manual stock adjustment"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueTone,
  icon: Icon,
  tone,
  delta,
}: {
  label: string;
  value: string;
  valueTone?: string;
  icon: typeof Filter;
  tone: string;
  delta: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      <div>
        <div className={`text-2xl font-bold ${valueTone ?? ""}`}>{value}</div>
        <div className="mt-1">{delta}</div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function AgeRow({
  label,
  units,
  pct,
  tone,
  muted,
}: {
  label: string;
  units: string;
  pct: number;
  tone: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className={`flex justify-between text-xs mb-1 ${muted ? "text-tertiary" : ""}`}>
        <span>{label}</span>
        <span className="font-bold">{units} units</span>
      </div>
      <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RiskRow({
  name,
  days,
  tone,
  inv,
  demand,
  avail,
  inTransit,
  shortage,
  onIndent,
}: {
  name: string;
  days: number;
  tone: "destructive" | "secondary";
  inv: number;
  demand: number;
  avail: number;
  inTransit: number;
  shortage: number;
  onIndent?: () => void;
}) {
  const border =
    tone === "destructive"
      ? "border-destructive bg-destructive/5"
      : "border-secondary-fixed-dim bg-surface-container-low";
  const daysColor = tone === "destructive" ? "text-destructive" : "text-secondary-fixed-dim";
  return (
    <div className={`p-3 rounded-lg border-l-4 ${border}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-sm">{name}</div>
        <span className={`font-bold text-[10px] uppercase ${daysColor}`}>{days} days left</span>
      </div>
      <div className="flex h-3 gap-0.5 rounded-sm overflow-hidden mb-2">
        <div className="bg-success" style={{ width: `${avail}%` }} title="Available" />
        <div
          className="bg-secondary-container"
          style={{ width: `${inTransit}%` }}
          title="In transit"
        />
        <div className="bg-destructive" style={{ width: `${shortage}%` }} title="Shortage" />
      </div>
      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
        <span>Inv: {inv.toLocaleString("en-IN")}</span>
        <span>Demand: {demand.toLocaleString("en-IN")}</span>
        {onIndent && (
          <button onClick={onIndent} className="text-primary font-bold uppercase hover:underline">
            Indent →
          </button>
        )}
      </div>
    </div>
  );
}
