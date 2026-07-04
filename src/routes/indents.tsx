import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, X, Send, Pencil, ArrowUpRight, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { type Indent } from "@/data/hul-mock";
import {
  useAppStore,
  setIndentStatus,
  updateIndentQty,
  bulkApproveIndents,
} from "@/store/app-store";

type IndentsSearch = {
  highlight?: string;
  laneId?: string;
  dc?: string;
  factory?: string;
};

export const Route = createFileRoute("/indents")({
  validateSearch: (search: Record<string, unknown>): IndentsSearch => ({
    highlight: typeof search.highlight === "string" ? search.highlight : undefined,
    laneId: typeof search.laneId === "string" ? search.laneId : undefined,
    dc: typeof search.dc === "string" ? search.dc : undefined,
    factory: typeof search.factory === "string" ? search.factory : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Manual Indent Worklist · IDIE" },
      {
        name: "description",
        content:
          "Engine-recommended manual indents for Factory-to-DC replenishment. Approve, modify or submit to ERP.",
      },
    ],
  }),
  component: IndentWorklist,
});

const statusVariant: Record<Indent["status"], "warning" | "success" | "default" | "destructive"> = {
  Pending: "warning",
  Approved: "success",
  Submitted: "default",
  Rejected: "destructive",
};

function IndentWorklist() {
  const { highlight, laneId, dc, factory } = Route.useSearch();
  const { indents: rows, compact } = useAppStore();
  const cellY = compact ? "py-1.5" : "py-3";
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState(0);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (highlight && rowRefs.current[highlight]) {
      rowRefs.current[highlight]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  const activeFilter = laneId
    ? { kind: "lane" as const, value: laneId }
    : dc
      ? { kind: "dc" as const, value: dc }
      : factory
        ? { kind: "factory" as const, value: factory }
        : null;

  const visible = rows.filter((r) => {
    if (laneId) return r.laneId === laneId;
    if (dc) return r.dc === dc;
    if (factory) return r.factory === factory;
    return true;
  });

  const counts = {
    pending: rows.filter((r) => r.status === "Pending").length,
    approved: rows.filter((r) => r.status === "Approved").length,
    submitted: rows.filter((r) => r.status === "Submitted").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
  };

  const bulkApprove = () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return toast.info("No indents selected");
    bulkApproveIndents(ids);
    setSelected({});
    toast.success(`Approved ${ids.length} indents`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Phase 1 · MVP"
        title="Manual Indent Worklist"
        subtitle="Recommendations raised by IDIE when Dispatch Calc. falls short of net requirement. Every indent links back to its lane and waterfall."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={bulkApprove}>
              <Check className="w-4 h-4 mr-2" /> Bulk approve selected
            </Button>
            <Button size="sm" onClick={() => toast.success("Worklist synced to ERP queue")}>
              <Send className="w-4 h-4 mr-2" /> Submit all approved
            </Button>
          </>
        }
      />

      {activeFilter && (
        <div className="flex items-center justify-between bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2 mb-4 text-xs">
          <span>
            Filtered to{" "}
            {activeFilter.kind === "lane" ? "lane" : activeFilter.kind === "dc" ? "DC" : "factory"}{" "}
            <span className="font-data-mono font-semibold">{activeFilter.value}</span>
          </span>
          <Link
            to="/indents"
            className="inline-flex items-center gap-1 hover:underline font-semibold"
          >
            Clear filter <XCircle className="w-3 h-3" />
          </Link>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending", value: counts.pending, tone: "text-tertiary" },
          { label: "Approved today", value: counts.approved, tone: "text-success" },
          { label: "Submitted today", value: counts.submitted, tone: "text-primary" },
          { label: "Rejected today", value: counts.rejected, tone: "text-destructive" },
        ].map((k, i) => (
          <div
            key={k.label}
            className={`bg-card border border-outline-variant rounded-xl ${compact ? "p-3" : "p-4"} transition-[padding] duration-200 ease-in-out animate-in fade-in slide-in-from-bottom-1 fill-mode-both`}
            style={{ animationDuration: "300ms", animationDelay: `${i * 50}ms` }}
          >
            <div className="text-3xs uppercase tracking-wider font-semibold text-on-surface-variant">
              {k.label}
            </div>
            <div className={`text-2xl font-bold mt-1 font-data-mono ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </section>

      <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-semibold">Recommended indents</h2>
          <p className="text-xs text-muted-foreground">
            {visible.length} suggestion{visible.length === 1 ? "" : "s"} across HUL factories ·
            Reserved-stock use requires override.
          </p>
        </div>

        {visible.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No indents match this filter right now.{" "}
            <Link to="/indents" className="text-primary hover:underline">
              Clear filter
            </Link>
          </div>
        )}

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-3xs uppercase tracking-wider">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2 text-left font-semibold">Indent</th>
                <th className="px-3 py-2 text-left font-semibold">Lane</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-left font-semibold">Source bucket</th>
                <th className="px-3 py-2 text-left font-semibold">Justification</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((r) => {
                const isHighlighted = r.id === highlight;
                return (
                  <tr
                    key={r.id}
                    ref={(el) => {
                      rowRefs.current[r.id] = el;
                    }}
                    className={`hover:bg-surface-container-low align-top transition-colors ${
                      isHighlighted ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""
                    }`}
                  >
                    <td className={`px-3 ${cellY}`}>
                      <Checkbox
                        checked={!!selected[r.id]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [r.id]: !!v }))}
                        disabled={r.status !== "Pending"}
                      />
                    </td>
                    <td className={`px-3 ${cellY}`}>
                      <div className="font-data-mono font-semibold">{r.id}</div>
                      <div className="text-3xs text-muted-foreground">{r.createdAt}</div>
                    </td>
                    <td className={`px-3 ${cellY}`}>
                      <div className="font-semibold leading-tight">{r.cbu}</div>
                      <div className="text-3xs text-muted-foreground">
                        {r.factory} → {r.dc}
                      </div>
                      <Link
                        to="/lanes/$laneId"
                        params={{ laneId: r.laneId }}
                        className="text-3xs text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
                      >
                        View lane <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    </td>
                    <td className={`px-3 ${cellY} text-right font-data-mono`}>
                      {editing === r.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number"
                            value={draftQty}
                            onChange={(e) => setDraftQty(Number(e.target.value))}
                            className="h-7 w-24 text-right font-data-mono"
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => {
                              updateIndentQty(r.id, draftQty);
                              setEditing(null);
                              toast.success(
                                `Quantity updated to ${draftQty.toLocaleString("en-IN")}`,
                              );
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          {r.requiredQty.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 ${cellY}`}>
                      <Badge variant="outline" className="font-normal">
                        {r.suggestedSource}
                      </Badge>
                    </td>
                    <td className={`px-3 ${cellY} max-w-xs`}>
                      <span className="text-xs text-on-surface-variant">{r.justification}</span>
                    </td>
                    <td className={`px-3 ${cellY}`}>
                      <Badge variant={statusVariant[r.status]} className="uppercase">
                        {r.status}
                      </Badge>
                    </td>
                    <td className={`px-3 ${cellY}`}>
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "Pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-3xs"
                              onClick={() => {
                                setEditing(r.id);
                                setDraftQty(r.requiredQty);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-3xs"
                              onClick={() => {
                                setIndentStatus(r.id, "Approved");
                                toast.success(`${r.id} approved`);
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-3xs text-destructive hover:text-destructive"
                              onClick={() => {
                                setIndentStatus(r.id, "Rejected");
                                toast.success(`${r.id} rejected`);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {r.status === "Approved" && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-3xs"
                            onClick={() => {
                              setIndentStatus(r.id, "Submitted");
                              toast.success(`${r.id} submitted to ERP`);
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" /> Submit
                          </Button>
                        )}
                        {(r.status === "Submitted" || r.status === "Rejected") && (
                          <span className="text-3xs text-muted-foreground pr-2">—</span>
                        )}
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
          {visible.map((r) => {
            const isHighlighted = r.id === highlight;
            return (
              <div
                key={r.id}
                className={`p-4 ${isHighlighted ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-data-mono font-semibold text-sm">{r.id}</div>
                    <div className="text-3xs text-muted-foreground">{r.createdAt}</div>
                  </div>
                  <Badge variant={statusVariant[r.status]} className="uppercase">
                    {r.status}
                  </Badge>
                </div>
                <div className="font-semibold leading-tight">{r.cbu}</div>
                <div className="text-3xs text-muted-foreground mb-1">
                  {r.factory} → {r.dc}
                </div>
                <Link
                  to="/lanes/$laneId"
                  params={{ laneId: r.laneId }}
                  className="text-3xs text-primary hover:underline inline-flex items-center gap-0.5 mb-2"
                >
                  View lane <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold font-data-mono">
                    {r.requiredQty.toLocaleString("en-IN")} units
                  </span>
                  <Badge variant="outline" className="font-normal">
                    {r.suggestedSource}
                  </Badge>
                </div>
                <p className="text-xs text-on-surface-variant mb-3">{r.justification}</p>
                {r.status === "Pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIndentStatus(r.id, "Approved");
                        toast.success(`${r.id} approved`);
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => {
                        setIndentStatus(r.id, "Rejected");
                        toast.success(`${r.id} rejected`);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {r.status === "Approved" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIndentStatus(r.id, "Submitted");
                      toast.success(`${r.id} submitted to ERP`);
                    }}
                  >
                    <Send className="w-3 h-3 mr-1" /> Submit
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
