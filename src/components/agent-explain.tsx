import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Explainability affordance shown next to any agent-generated recommendation. */
export function AgentExplain({
  agent,
  rationale,
  consequence,
  align = "start",
}: {
  agent: string;
  rationale: string;
  consequence: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-3xs font-semibold text-primary hover:underline shrink-0"
          aria-label="Why did the agent recommend this?"
        >
          <Sparkles className="w-3.5 h-3.5" /> Why?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align={align}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-3xs uppercase tracking-wider font-bold text-muted-foreground">
            {agent}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Reasoning
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">{rationale}</p>
        </div>
        <div>
          <div className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Consequence &amp; impact
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">{consequence}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
