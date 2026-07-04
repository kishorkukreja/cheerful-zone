import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Send, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { indents as seed, type Indent } from "@/data/hul-mock";

export const Route = createFileRoute("/indents")({
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

const statusStyles: Record<Indent["status"], string> = {
  Pending: "bg-amber-100 text-amber-800 border border-amber-200",
  Approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Submitted: "bg-primary/10 text-primary border border-primary/30",
  Rejected: "bg-red-100 text-red-800 border border-red-200",
};

function IndentWorklist() {
  const [rows, setRows] = useState<Indent[]>(seed);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState(0);

  const counts = {
    pending: rows.filter((r) => r.status === "Pending").length,
    approved: rows.filter((r) => r.status === "Approved").length,
    submitted: rows.filter((r) => r.status === "Submitted").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
  };

  const setStatus = (id: string, status: Indent["status"], msg: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(msg);
  };

  const bulkApprove = () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return toast.info("No indents selected");
    setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status: "Approved" } : r)));
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

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending", value: counts.pending, tone: "text-amber-600" },
          { label: "Approved today", value: counts.approved, tone: "text-emerald-600" },
          { label: "Submitted today", value: counts.submitted, tone: "text-primary" },
          { label: "Rejected today", value: counts.rejected, tone: "text-destructive" },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-card border border-outline-variant rounded-xl p-4"
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
              {k.label}
            </div>
            <div className={`text-3xl font-bold mt-1 font-data-mono ${k.tone}`}>
              {k.value}
            </div>
          </div>
        ))}
      </section>

      <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-semibold">Recommended indents</h2>
          <p className="text-xs text-muted-foreground">
            {rows.length} suggestions across HUL factories · Reserved-stock use requires override.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
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
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low align-top">
                  <td className="px-3 py-3">
                    <Checkbox
                      checked={!!selected[r.id]}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({ ...s, [r.id]: !!v }))
                      }
                      disabled={r.status !== "Pending"}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-data-mono font-semibold">{r.id}</div>
                    <div className="text-[11px] text-muted-foreground">{r.createdAt}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold leading-tight">{r.cbu}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.factory} → {r.dc}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-data-mono">
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
                            setRows((rs) =>
                              rs.map((x) =>
                                x.id === r.id ? { ...x, requiredQty: draftQty } : x,
                              ),
                            );
                            setEditing(null);
                            toast.success(`Quantity updated to ${draftQty.toLocaleString("en-IN")}`);
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
                  <td className="px-3 py-3">
                    <Badge variant="outline" className="font-normal">
                      {r.suggestedSource}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <span className="text-xs text-on-surface-variant">
                      {r.justification}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyles[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => {
                              setEditing(r.id);
                              setDraftQty(r.requiredQty);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              setStatus(r.id, "Approved", `${r.id} approved`)
                            }
                          >
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                            onClick={() =>
                              setStatus(r.id, "Rejected", `${r.id} rejected`)
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {r.status === "Approved" && (
                        <Button
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() =>
                            setStatus(r.id, "Submitted", `${r.id} submitted to ERP`)
                          }
                        >
                          <Send className="w-3 h-3 mr-1" /> Submit
                        </Button>
                      )}
                      {(r.status === "Submitted" || r.status === "Rejected") && (
                        <span className="text-[11px] text-muted-foreground pr-2">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
