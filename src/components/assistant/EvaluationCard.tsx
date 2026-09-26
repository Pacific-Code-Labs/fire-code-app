import { AlertTriangle, BookOpen, Check, Globe, ListChecks, MapPin } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import type { CrContextItem, EvaluateResponse } from "@/services/fireCodeApi";

interface Props { data: EvaluateResponse; }

/**
 * FCR-043: contextCr is now CrContextItem[] but older backends (and the
 * project-created path) may still send string[]. Normalize either shape so the
 * card renders consistently.
 */
function toContextItems(raw: EvaluateResponse["contextCr"]): CrContextItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) =>
    typeof c === "string"
      ? { topic: "", detail: c }
      : (c as CrContextItem)
  );
}

export function EvaluationCard({ data }: Props) {
  const { lang, tr } = useLang();
  const hasContent = data.matchedRules?.length > 0 || data.foundryUsed;
  if (!hasContent) return null;

  const contextItems = toContextItems(data.contextCr);

  // Order (FCR-114): applicable standards → requirements → CR context (titled) →
  // risk → references LAST.
  return (
    <div className="space-y-2">
      {data.matchedRules?.length > 0 && (
        <div className="rounded-md border border-border bg-background/40 p-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-accent">
            <MapPin className="h-3.5 w-3.5" /> {tr.crLabel}
          </div>
          <ul className="mt-1.5 space-y-1 text-muted-foreground">
            {data.matchedRules.map((r) => (
              <li key={r.id}>• {r.title} — <span className="opacity-80">{r.description.slice(0, 80)}…</span></li>
            ))}
          </ul>
        </div>
      )}

      {data.foundryUsed && data.requirements?.length > 0 && (
        <div className="rounded-md border border-border bg-background/30 p-2 text-xs">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-accent">
            <ListChecks className="h-3.5 w-3.5" /> {tr.requirements}:
          </div>
          <ul className="space-y-1">
            {data.requirements.map((req, ri) => (
              <li key={ri} className="flex gap-2 leading-relaxed">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.foundryUsed && contextItems.length > 0 && (
        <div className="rounded-md border border-border bg-background/20 p-2 text-xs">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-accent">
            <Globe className="h-3.5 w-3.5" /> {tr.crContextTitle}:
          </div>
          <ul className="space-y-1 text-muted-foreground">
            {contextItems.map((ctx, ci) => (
              <li key={ci} className="flex gap-2 leading-relaxed">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden>•</span>
                <span>
                  {ctx.topic && <span className="font-semibold text-foreground/80">{ctx.topic}: </span>}
                  {ctx.detail}
                  {(ctx.authority || ctx.reference) && (
                    <span className="ml-1 opacity-70">
                      ({[ctx.authority, ctx.reference].filter(Boolean).join(" · ")})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!data.foundryUsed && (
        <p className="text-[11px] italic text-muted-foreground">
          {tr.eval_ai_unavailable}
        </p>
      )}

      {data.risk === "alto" && (
        <div className="flex items-start gap-2 rounded-md border border-[hsl(var(--risk-high)/0.4)] bg-[hsl(var(--risk-high)/0.1)] p-2 text-xs text-[hsl(var(--risk-high))]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{tr.riskWarning}:</strong>{" "}
            {tr.eval_high_risk_note}
          </span>
        </div>
      )}

      {/* References LAST (FCR-114). */}
      {data.foundryUsed && data.reference?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="font-semibold">{tr.refLabel}:</span>
          {data.reference.map((r) => (
            <span key={r} className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">{r}</span>
          ))}
        </div>
      )}
    </div>
  );
}
