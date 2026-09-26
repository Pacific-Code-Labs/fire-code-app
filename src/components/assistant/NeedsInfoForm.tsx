import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/contexts/LangContext";
import { cn } from "@/lib/utils";
import type { NeedsInfoData } from "@/lib/assistantResponse";

interface Props {
  data: NeedsInfoData;
  /** `summary` = localized "label value; …"; `answers` = per-key as-text values. */
  onSubmit: (summary: string, answers: Record<string, string>) => void;
  /** Optional heading; pass "" to hide it (used for one-at-a-time questions). */
  title?: string;
  /** Optional override for the submit button label. */
  submitLabel?: string;
}

type AnswerValue = string | string[];

/**
 * FCR-101 / FCR-114: renders the structured clarifying questions as a dynamic
 * form. Each question picks its control by `type`:
 *   - text / number → <Input>
 *   - select        → single-choice pill group (one option)
 *   - multi_select  → multi-choice pill group (many options)
 * On submit it builds a localized "label value" summary and hands it to the
 * caller (ChatPanel), which resends it so the agent now has the context.
 */
export function NeedsInfoForm({ data, onSubmit, title, submitLabel }: Props) {
  const { tr } = useLang();
  const questions = data.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);

  const setText = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));
  const setSingle = (k: string, v: string) =>
    setAnswers((a) => ({ ...a, [k]: a[k] === v ? "" : v }));
  const toggleMulti = (k: string, v: string) =>
    setAnswers((a) => {
      const cur = Array.isArray(a[k]) ? (a[k] as string[]) : [];
      return { ...a, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const valueOf = (k: string): AnswerValue => answers[k] ?? "";
  const asText = (v: AnswerValue) => (Array.isArray(v) ? v.join(", ") : v).trim();

  const missingRequired = questions.some(
    (q) => q.required !== false && asText(valueOf(q.key)).length === 0,
  );

  const submit = () => {
    const map: Record<string, string> = {};
    const filled = questions
      .map((q) => {
        const v = asText(valueOf(q.key));
        if (v) map[q.key] = v;
        return v ? `${q.label} ${v}` : null;
      })
      .filter((x): x is string => x !== null);
    if (filled.length === 0) return;
    setSubmitted(true);
    onSubmit(filled.join("; "), map);
  };

  const heading = title ?? tr.needsInfoTitle;

  return (
    <div className="space-y-3">
      {heading && <p className="text-sm font-medium">{heading}</p>}

      <div className="space-y-3">
        {questions.map((q) => {
          const v = valueOf(q.key);
          const hasOptions = (q.options?.length ?? 0) > 0;
          const isMulti = q.type === "multi_select";
          const isSelect = q.type === "select" || (hasOptions && !isMulti);

          return (
            <div key={q.key} className="space-y-1.5">
              <label className="block text-sm leading-relaxed">{q.label}</label>

              {hasOptions && (isSelect || isMulti) ? (
                <div className="flex flex-wrap gap-1.5">
                  {q.options!.map((o) => {
                    const selected = isMulti
                      ? Array.isArray(v) && v.includes(o)
                      : v === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        disabled={submitted}
                        onClick={() => (isMulti ? toggleMulti(q.key, o) : setSingle(q.key, o))}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition disabled:opacity-60",
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
                        )}
                      >
                        {selected && <Check className="h-3 w-3 text-primary" aria-hidden />}
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  type={q.type === "number" ? "number" : "text"}
                  value={typeof v === "string" ? v : ""}
                  placeholder={q.hint ?? ""}
                  disabled={submitted}
                  onChange={(e) => setText(q.key, e.target.value)}
                  className="bg-input/60"
                />
              )}
            </div>
          );
        })}
      </div>

      <Button size="sm" disabled={submitted || missingRequired} onClick={submit}>
        {submitLabel ?? tr.needsInfoSubmit}
      </Button>
    </div>
  );
}
