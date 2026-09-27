import { useState } from "react";
import { AlertTriangle, Bell, Radio, Siren, Droplets } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import type { RuleGroupDTO, RuleDTO } from "@/services/sokolApi";
import { RuleDetailModal } from "@/components/RuleDetailModal";
import { cn } from "@/lib/utils";

type CategoryKey = "iniciacion" | "notificacion" | "monitoreo" | "accionamiento";

const meta: Record<CategoryKey, { icon: typeof Bell; cls: string }> = {
  iniciacion:    { icon: Siren,    cls: "cat-initiation"   },
  notificacion:  { icon: Bell,     cls: "cat-notification" },
  monitoreo:     { icon: Radio,    cls: "cat-monitoring"   },
  accionamiento: { icon: Droplets, cls: "cat-actuation"    },
};


function riskBadge(level: string, tr: Record<string, string>) {
  const label = tr[`risk_level_${level}`] ?? level;
  const cls = level === "alto"
    ? "bg-[hsl(var(--risk-high)/0.15)] text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high)/0.4)]"
    : level === "medio"
    ? "bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.4)]"
    : "bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.4)]";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cls)}>
      <AlertTriangle className="h-3 w-3" /> {label}
    </span>
  );
}

export function CategoryCard({ group }: { group: RuleGroupDTO }) {
  const { tr } = useLang();
  const [selectedRule, setSelectedRule] = useState<RuleDTO | null>(null);

  const catKey = group.type as CategoryKey;
  const m = meta[catKey] ?? meta.iniciacion;
  const Icon = m.icon;
  const catLabel = tr[`cat_${catKey}`] ?? group.type;
  const desc = tr[(group.type + "Desc") as keyof typeof tr] as string ?? group.description;

  return (
    <>
      <div className={cn("panel overflow-hidden", `border-${m.cls}/30`)}>
        <div className={cn("flex items-center justify-between border-b px-4 py-3", `border-${m.cls}/30 bg-${m.cls}/10`)}>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", `bg-${m.cls}/10`)}>
              <Icon className={cn("h-5 w-5", `text-${m.cls}`)} />
            </div>
            <div>
              <div className={cn("text-sm font-semibold", `text-${m.cls}`)}>{catLabel}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{group.quantity} {tr.items}</span>
        </div>
        <ul className="divide-y divide-border">
          {group.rules.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">{tr.noResults}</li>
          )}
          {group.rules.map((r) => (
            <li
              key={r.id}
              onClick={() => setSelectedRule(r)}
              className="cursor-pointer px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {riskBadge(r.risk.level, tr)}
                  <span className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {r.standard}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <RuleDetailModal rule={selectedRule} onClose={() => setSelectedRule(null)} />
    </>
  );
}
