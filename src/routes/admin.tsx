import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Search, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { lanes, computePriorityScore } from "@/data/hul-mock";
import { useAppStore, setWeights as commitWeights } from "@/store/app-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console · IDIE" },
      {
        name: "description",
        content:
          "Configure bucket eligibility, priority weights, lane master and integrations for the dispatch engine.",
      },
    ],
  }),
  component: AdminConsole,
});

const buckets = [
  { name: "ATP", rule: "Always consumable", defaultOn: true, tone: "text-success" },
  { name: "QC Stock", rule: "Consume post-release only", defaultOn: true, tone: "text-primary" },
  { name: "Reserved", rule: "Requires planner override", defaultOn: false, tone: "text-tertiary" },
  {
    name: "Production Req.",
    rule: "Consume only after buckets 1–3",
    defaultOn: true,
    tone: "text-secondary-fixed-dim",
  },
];

const users = [
  { name: "Priya Sharma", email: "priya.s@hul.co.in", role: "Supply Planner" },
  { name: "Rajiv Menon", email: "rajiv.m@hul.co.in", role: "DC Planner" },
  { name: "Anita Rao", email: "anita.r@hul.co.in", role: "SC Manager" },
  { name: "Vikram Singh", email: "vikram.s@hul.co.in", role: "Dispatch Coordinator" },
  { name: "Nikhil Bansal", email: "nikhil.b@hul.co.in", role: "Admin" },
];

const integrations = [
  { name: "APO", desc: "Net Requirement, Allocation, PDQ", status: "Connected", last: "2 min ago" },
  {
    name: "ERP (SAP S/4)",
    desc: "ATP, QC, Reserved stock",
    status: "Connected",
    last: "1 min ago",
  },
  { name: "OMS", desc: "Customer order loss feed", status: "Connected", last: "6 min ago" },
  { name: "WMS", desc: "DC inbound visibility", status: "Degraded", last: "18 min ago" },
  { name: "TMS", desc: "Transport lead time", status: "Connected", last: "4 min ago" },
  { name: "MDM", desc: "Lane & CBU masters", status: "Connected", last: "1 hr ago" },
];

function AdminConsole() {
  const { weights: appliedWeights } = useAppStore();
  const [bucketState, setBucketState] = useState(buckets.map((b) => b.defaultOn));
  const [weights, setWeights] = useState(appliedWeights);
  const [laneQuery, setLaneQuery] = useState("");

  const filteredLanes = lanes.filter(
    (l) =>
      l.factory.toLowerCase().includes(laneQuery.toLowerCase()) ||
      l.dc.toLowerCase().includes(laneQuery.toLowerCase()) ||
      l.cbu.toLowerCase().includes(laneQuery.toLowerCase()),
  );

  const total = weights.orderLoss + weights.cover + weights.tier + weights.criticality;
  const isDirty = JSON.stringify(weights) !== JSON.stringify(appliedWeights);

  const saveChanges = () => {
    commitWeights(weights);
    toast.success("Configuration saved — Dispatch Cockpit ranking updated");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Configuration"
        title="Admin Console"
        subtitle="Configure engine behaviour without code. Priority weight changes apply to the Cockpit ranking as soon as you save."
        actions={
          <Button onClick={saveChanges} disabled={!isDirty || total !== 100}>
            <Save className="w-4 h-4 mr-2" /> Save changes{isDirty ? " ●" : ""}
          </Button>
        }
      />

      <Tabs defaultValue="buckets" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6 w-full md:w-fit">
          <TabsTrigger value="buckets">Bucket Eligibility</TabsTrigger>
          <TabsTrigger value="weights">Priority Weights</TabsTrigger>
          <TabsTrigger value="lanes">Lane Master</TabsTrigger>
          <TabsTrigger value="users">Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Buckets */}
        <TabsContent value="buckets">
          <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant">
              <h3 className="font-semibold">Mitigation waterfall — consumption rules</h3>
              <p className="text-xs text-muted-foreground">
                Toggle whether each bucket is consumable by default when the engine runs Dispatch
                Calc.
              </p>
            </div>
            <div className="divide-y divide-outline-variant">
              {buckets.map((b, i) => (
                <div key={b.name} className="p-4 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-surface-container-low grid place-items-center ${b.tone} font-bold`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.rule}</div>
                  </div>
                  <select className="border border-outline-variant rounded-md px-2 py-1 text-xs bg-card">
                    <option>FIFO</option>
                    <option>LIFO</option>
                    <option>Custom</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Consumable</span>
                    <Switch
                      checked={bucketState[i]}
                      onCheckedChange={(v) =>
                        setBucketState((s) => s.map((x, j) => (i === j ? v : x)))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Weights */}
        <TabsContent value="weights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-outline-variant rounded-xl p-5">
              <h3 className="font-semibold mb-1">Priority score weights</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Total:{" "}
                <span
                  className={
                    total === 100 ? "text-success font-semibold" : "text-destructive font-semibold"
                  }
                >
                  {total}%
                </span>{" "}
                (must equal 100%)
              </p>
              <div className="space-y-5">
                <WeightSlider
                  label="Customer Order Loss impact"
                  value={weights.orderLoss}
                  onChange={(v) => setWeights({ ...weights, orderLoss: v })}
                />
                <WeightSlider
                  label="Days of Cover risk"
                  value={weights.cover}
                  onChange={(v) => setWeights({ ...weights, cover: v })}
                />
                <WeightSlider
                  label="Customer Tier (A/B/C)"
                  value={weights.tier}
                  onChange={(v) => setWeights({ ...weights, tier: v })}
                />
                <WeightSlider
                  label="Lane Criticality"
                  value={weights.criticality}
                  onChange={(v) => setWeights({ ...weights, criticality: v })}
                />
              </div>
            </div>
            <div className="bg-card border border-outline-variant rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Live ranking preview</h3>
                {isDirty && (
                  <span className="text-3xs uppercase font-bold text-tertiary">Unsaved</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Top 5 lanes recomputed live as you move the sliders — this is the exact formula the
                Cockpit uses once saved.
              </p>
              <ol className="space-y-2">
                {[...lanes]
                  .sort(
                    (a, b) => computePriorityScore(b, weights) - computePriorityScore(a, weights),
                  )
                  .slice(0, 5)
                  .map((l, i) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold grid place-items-center">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-sm">{l.cbu}</div>
                          <div className="text-3xs text-muted-foreground">
                            {l.factoryCode} → {l.dcCode}
                          </div>
                        </div>
                      </div>
                      <span className="font-data-mono font-bold text-primary">
                        {computePriorityScore(l, weights)}
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        </TabsContent>

        {/* Lane master */}
        <TabsContent value="lanes">
          <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search factory, DC or CBU…"
                  className="pl-9"
                  value={laneQuery}
                  onChange={(e) => setLaneQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                Add lane
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-3xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-left font-semibold">Lane ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Factory</th>
                    <th className="px-4 py-2 text-left font-semibold">DC</th>
                    <th className="px-4 py-2 text-left font-semibold">CBU</th>
                    <th className="px-4 py-2 text-right font-semibold">Transit</th>
                    <th className="px-4 py-2 text-right font-semibold">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredLanes.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-data-mono text-xs">{l.id}</td>
                      <td className="px-4 py-3">{l.factory}</td>
                      <td className="px-4 py-3">{l.dc}</td>
                      <td className="px-4 py-3">{l.cbu}</td>
                      <td className="px-4 py-3 text-right font-data-mono">{l.transitDays}d</td>
                      <td className="px-4 py-3 text-right">
                        <Switch defaultChecked />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Users &amp; Roles</h3>
                <p className="text-xs text-muted-foreground">
                  {users.length} active users · role changes propagate via SSO within 5 min
                </p>
              </div>
              <Button variant="outline" size="sm">
                Invite user
              </Button>
            </div>
            <div className="divide-y divide-outline-variant">
              {users.map((u) => (
                <div key={u.email} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-bold">
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Badge variant="outline">{u.role}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((i) => {
              const ok = i.status === "Connected";
              return (
                <div key={i.name} className="bg-card border border-outline-variant rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.desc}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-3xs font-bold uppercase ${ok ? "text-success" : "text-tertiary"}`}
                    >
                      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {i.status}
                    </span>
                  </div>
                  <div className="text-3xs text-muted-foreground mt-4 flex justify-between">
                    <span>Last sync: {i.last}</span>
                    <button
                      className="text-primary hover:underline"
                      onClick={() => toast.success(`${i.name} sync triggered`)}
                    >
                      Sync now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className="font-data-mono font-bold">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={0} max={100} step={5} />
    </div>
  );
}
