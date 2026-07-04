import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Why was this filler chosen?",
  "What is the impact on truck fill rate?",
  "How does the STO reach ERP?",
  "What happens at transit approval?",
];

function answer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("filler")) {
    return "The Filler Recommendation Agent matches slow-moving or complementary SKUs from the same factory and destination DC as an open indent. It only suggests stock with no open indent of its own, so it never cannibalises another lane's replenishment.";
  }
  if (q.includes("fill rate") || q.includes("truck") || q.includes("kpi")) {
    return "The Shipment Optimization Agent adds each accepted filler's fill-rate gain to the lane's baseline utilisation, capped at 96%. Higher utilisation per truck means fewer trucks for the same demand — that's where the trucks-saved and cost-saved KPIs come from.";
  }
  if (q.includes("sto") || q.includes("idoc") || q.includes("xml") || q.includes("erp")) {
    return "Once a shipment is staged, the ERP integration step generates an IDoc (or XML, depending on the receiving system) that creates a Stock Transfer Order in SAP ECC. The STO number and IDoc number on the card are what ECC would return for that document.";
  }
  if (q.includes("transit") || q.includes("approval") || q.includes("queue")) {
    return "After the STO is created, the shipment is pushed to the Transit Approval Queue for a final human check before release. Approving it here mirrors approving the Stock Transfer shipment in ECC — it then shows up in Crafted Shipments.";
  }
  if (q.includes("stag")) {
    return "Staging writes the optimized shipment — indent plus accepted fillers plus truck plan — to a holding location before anything is sent to ERP, so it can be reviewed or rolled back before the STO is created.";
  }
  return "This workspace mocks the agentic shipment optimization flow end to end: manual indents are enriched with agent-recommended fillers, grouped into optimized truck loads, staged, then pushed to ERP as a Stock Transfer Order and released via the transit approval queue. Ask me about any step and I'll explain the reasoning behind it.";
}

export function AgentCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, I'm the IDIE Copilot. Ask me why an agent made a recommendation, or how a shipment moves from indent to STO.",
    },
  ]);
  const [draft, setDraft] = useState("");

  const ask = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: answer(text) }]);
    setDraft("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 w-14 h-14 bg-tertiary text-on-tertiary rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 z-40"
        aria-label="Ask Copilot"
      >
        <Bot className="w-6 h-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="p-5 pb-3 text-left">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> IDIE Copilot
            </SheetTitle>
            <SheetDescription>
              Ask about any agent recommendation or workflow step.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-surface-container-low text-foreground mr-auto"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-5 pt-3 border-t border-outline-variant space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="text-3xs px-2 py-1 rounded-full border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(draft)}
                placeholder="Ask a question…"
              />
              <Button size="icon" onClick={() => ask(draft)} aria-label="Send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
