import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PackageCheck, Truck, Database, FileCode2, ArrowUpRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

type ShipmentsSearch = { highlight?: string };

export const Route = createFileRoute("/shipments")({
  validateSearch: (search: Record<string, unknown>): ShipmentsSearch => ({
    highlight: typeof search.highlight === "string" ? search.highlight : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Crafted Shipments · IDIE" },
      {
        name: "description",
        content:
          "Every Stock Transfer shipment crafted by the agentic shipment optimization workflow, from staging through ERP creation to transit approval.",
      },
    ],
  }),
  component: CraftedShipments,
});

function fmtInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function CraftedShipments() {
  const { highlight } = Route.useSearch();
  const { craftedShipments } = useAppStore();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (highlight && rowRefs.current[highlight]) {
      rowRefs.current[highlight]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  const totalTrucksSaved = craftedShipments.reduce(
    (s, c) => s + Math.max(0, c.trucksBaseline - c.trucksOptimized),
    0,
  );
  const totalCostSaved = craftedShipments.reduce((s, c) => s + c.costSaved, 0);
  const avgUplift = craftedShipments.length
    ? Math.round(
        craftedShipments.reduce((s, c) => s + (c.fillRateAfterPct - c.fillRateBeforePct), 0) /
          craftedShipments.length,
      )
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Agentic Automation · Output"
        title="Crafted Shipments"
        subtitle="Every Stock Transfer shipment produced by the agentic workflow — staged, posted to ERP via IDoc/XML, and released through transit approval."
        actions={
          <Link to="/agentic">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> Open agentic workflow
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Shipments crafted",
            value: craftedShipments.length,
            icon: PackageCheck,
            tone: "text-primary",
          },
          { label: "Trucks saved", value: totalTrucksSaved, icon: Truck, tone: "text-success" },
          {
            label: "Cost saved",
            value: fmtInr(totalCostSaved),
            icon: Database,
            tone: "text-secondary-fixed-dim",
          },
          {
            label: "Avg fill rate uplift",
            value: `+${avgUplift} pts`,
            icon: Sparkles,
            tone: "text-tertiary",
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

      <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-semibold">Stock Transfer shipments</h2>
          <p className="text-xs text-muted-foreground">
            {craftedShipments.length} shipment{craftedShipments.length === 1 ? "" : "s"} created via
            the agentic workflow, newest first.
          </p>
        </div>

        {craftedShipments.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No shipments crafted yet.{" "}
            <Link to="/agentic" className="text-primary hover:underline">
              Run the agentic workflow
            </Link>{" "}
            to create one.
          </div>
        )}

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-3xs uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-semibold">Shipment</th>
                <th className="px-3 py-2 text-left font-semibold">Lane</th>
                <th className="px-3 py-2 text-right font-semibold">Trucks</th>
                <th className="px-3 py-2 text-right font-semibold">Fill rate</th>
                <th className="px-3 py-2 text-right font-semibold">Cost saved</th>
                <th className="px-3 py-2 text-left font-semibold">ERP document</th>
                <th className="px-3 py-2 text-left font-semibold">Timeline</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {craftedShipments.map((c) => {
                const isHighlighted = c.id === highlight;
                return (
                  <tr
                    key={c.id}
                    ref={(el) => {
                      rowRefs.current[c.id] = el;
                    }}
                    className={`hover:bg-surface-container-low align-top transition-colors ${
                      isHighlighted ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-data-mono font-semibold">{c.id}</div>
                      <div className="text-3xs text-muted-foreground">{c.cbu}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold leading-tight">
                        {c.factoryCode} → {c.dcCode}
                      </div>
                      <div className="text-3xs text-muted-foreground">
                        {c.factory} → {c.dc}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-data-mono">
                      {c.trucksBaseline} → {c.trucksOptimized}
                    </td>
                    <td className="px-3 py-3 text-right font-data-mono">
                      {c.fillRateBeforePct}% →{" "}
                      <span className="font-semibold">{c.fillRateAfterPct}%</span>
                    </td>
                    <td className="px-3 py-3 text-right font-data-mono text-success font-semibold">
                      {fmtInr(c.costSaved)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1 text-xs font-data-mono">
                        <FileCode2 className="w-3 h-3 text-muted-foreground" /> {c.stoNumber}
                      </div>
                      <div className="text-3xs text-muted-foreground font-data-mono">
                        {c.idocNumber}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-3xs text-muted-foreground">
                      <div>Staged {c.stagedAt}</div>
                      <div>STO {c.stoCreatedAt}</div>
                      <div>Approved {c.approvedAt}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="success" className="uppercase inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> In Transit
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-outline-variant">
          {craftedShipments.map((c) => {
            const isHighlighted = c.id === highlight;
            return (
              <div
                key={c.id}
                className={`p-4 ${isHighlighted ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-data-mono font-semibold text-sm">{c.id}</div>
                    <div className="text-3xs text-muted-foreground">{c.cbu}</div>
                  </div>
                  <Badge variant="success" className="uppercase">
                    In Transit
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {c.factoryCode} → {c.dcCode}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <div className="text-3xs text-muted-foreground">Trucks</div>
                    <div className="font-data-mono font-semibold text-sm">
                      {c.trucksBaseline}→{c.trucksOptimized}
                    </div>
                  </div>
                  <div>
                    <div className="text-3xs text-muted-foreground">Fill rate</div>
                    <div className="font-data-mono font-semibold text-sm">
                      {c.fillRateAfterPct}%
                    </div>
                  </div>
                  <div>
                    <div className="text-3xs text-muted-foreground">Saved</div>
                    <div className="font-data-mono font-semibold text-sm text-success">
                      {fmtInr(c.costSaved)}
                    </div>
                  </div>
                </div>
                <div className="text-3xs text-muted-foreground font-data-mono">
                  STO {c.stoNumber} · {c.idocNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
