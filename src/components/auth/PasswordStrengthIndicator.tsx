import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The AWS Cognito password policy, mirrored as testable rules. Each rule's
 * label is a LangContext dictionary key (resolved bilingually); typing `key`
 * against `keyof Dict` keeps it in lockstep with i18n.ts.
 */
const RULES: { test: (pwd: string) => boolean; key: keyof Dict }[] = [
  { test: (p) => p.length >= 8, key: "auth_pw_req_length" },
  { test: (p) => /[a-z]/.test(p), key: "auth_pw_req_lower" },
  { test: (p) => /[A-Z]/.test(p), key: "auth_pw_req_upper" },
  { test: (p) => /[0-9]/.test(p), key: "auth_pw_req_number" },
  { test: (p) => /[^a-zA-Z0-9]/.test(p), key: "auth_pw_req_special" },
];

// Use arbitrary hsl(var(--token)) values — the cat-/risk- tokens are NOT mapped
// as Tailwind colors in this app (only available as arbitrary values, like the
// DS Badge does). bg-muted IS mapped, so empty segments use it.
const BAR_COLORS = [
  "bg-[hsl(var(--risk-high))]",
  "bg-[hsl(var(--risk-high))]",
  "bg-[hsl(var(--risk-medium))]",
  "bg-[hsl(var(--cat-actuation))]",
  "bg-[hsl(var(--cat-actuation))]",
];

/**
 * PasswordStrengthIndicator — a strength meter + per-rule checklist, driven by
 * the same Cognito policy used in the zod schemas. Adapts the POS component to
 * FireCode's LangContext + DS tokens (risk/cat color tokens, no hardcoded hex).
 */
export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { tr } = useLang();

  const { score, results } = useMemo(() => {
    const results = RULES.map((r) => ({ ...r, valid: r.test(password) }));
    return { score: results.filter((r) => r.valid).length, results };
  }, [password]);

  const strengthLabel =
    score <= 2 ? tr.auth_pw_weak : score === 3 ? tr.auth_pw_fair : score === 4 ? tr.auth_pw_good : tr.auth_pw_strong;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="t-label">{tr.auth_pw_strength}</span>
        <span className="text-xs text-muted-foreground">{strengthLabel}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 rounded-full transition-colors", i < score ? BAR_COLORS[score - 1] : "bg-muted")}
          />
        ))}
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {results.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-xs">
            {r.valid ? (
              <Check className="h-3.5 w-3.5 text-cat-actuation shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={r.valid ? "text-foreground" : "text-muted-foreground"}>{tr[r.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
