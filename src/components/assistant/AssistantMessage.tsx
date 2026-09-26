import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LangContext";
import { getDemoScenarios, type DemoScenario } from "@/lib/demoScenarios";
import { localizedPath } from "@/lib/paths";

interface Props {
  text: string;
  /** Public demo → append the "get the full evaluation" CTA + follow-up chips. */
  demo?: boolean;
  /** Tap handler for follow-up chips — applies a grounded scenario. */
  onPick?: (scenario: DemoScenario) => void;
}

/**
 * Parse a plain-text agent message into a lead paragraph + list items. The agent
 * commonly emits inline bullet glyphs (•) or newline list markers (-, *, 1)) —
 * turn them into a styled list so a `message` reply reads as structured guidance
 * instead of a wall of text.
 */
function parseMessage(text: string): { lead: string; items: string[] } {
  const t = (text ?? "").trim();
  const hasList = /[•·●]/.test(t) || /(^|\n)\s*(?:[-*]|\d+[.)])\s+/.test(t);
  if (!hasList) return { lead: t, items: [] };
  const tokens = t
    .split(/\s*[•·●]\s*|\n+\s*(?:[-*]|\d+[.)])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length < 2) return { lead: t, items: [] };
  const [lead, ...items] = tokens;
  return { lead, items };
}

export function AssistantMessage({ text, demo, onPick }: Props) {
  const { lang, tr } = useLang();
  const { lead, items } = parseMessage(text);

  // Two grounded follow-up scenarios (restaurant + CR requirements).
  const scenarios = getDemoScenarios(tr);
  const followups = [scenarios[0], scenarios[3]];

  return (
    <div className="space-y-3">
      {lead && <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead}</p>}

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}

      {demo && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-3">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>{tr.demoCtaQuestion}</span>
          </p>
          <Button asChild size="sm" className="mt-2.5 h-8">
            <Link to={localizedPath(lang, "/register")}>
              {tr.demoCtaButton}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {demo && onPick && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {tr.demoFollowupLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {followups.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => onPick(f)}
                className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs transition hover:border-primary/40 hover:bg-primary/5"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
