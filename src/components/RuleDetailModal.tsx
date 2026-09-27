import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@pacific-code-labs/sokol-design-system";
import type { RuleDTO } from "@/services/sokolApi";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LangContext";
import { fmt } from "@/lib/chrome-i18n";

interface Props {
  rule: RuleDTO | null;
  onClose: () => void;
}

function riskClass(level: string) {
  return level === "alto"
    ? "bg-[hsl(var(--risk-high)/0.15)] text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high)/0.4)]"
    : level === "medio"
    ? "bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.4)]"
    : "bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.4)]";
}

const SECTIONS = [
  { id: "tech",    labelKey: "rule_sec_tech",    key: "technical_requirements"    },
  { id: "install", labelKey: "rule_sec_install", key: "installation_requirements" },
  { id: "inspect", labelKey: "rule_sec_inspect", key: "inspection_requirements"   },
  { id: "risks",   labelKey: "rule_sec_risks",   key: "failure_risks"             },
] as const;

export function RuleDetailModal({ rule, onClose }: Props) {
  const { tr } = useLang();
  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
        {rule && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold leading-snug pr-6">
                {rule.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {rule.standard}
                </span>
                {rule.applies_to.map((a) => (
                  <span
                    key={a}
                    className="rounded border border-border bg-secondary/30 px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </DialogHeader>

            <div className={cn("flex items-start gap-3 rounded-md border p-3 text-sm", riskClass(rule.risk.level))}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-semibold">{fmt(tr.risk_level_heading, { level: tr[`risk_level_${rule.risk.level}`] ?? rule.risk.level })}</div>
                <div className="mt-0.5 text-xs opacity-90">{rule.risk.impact}</div>
                <div className="mt-0.5 text-xs opacity-75">{rule.risk.consequence}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>

            <Tabs defaultValue="tech" className="mt-1">
              <TabsList className="w-full grid grid-cols-4 h-auto">
                {SECTIONS.map((s) => (
                  <TabsTrigger key={s.id} value={s.id} className="text-xs py-1.5 whitespace-normal leading-tight">
                    {tr[s.labelKey]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {SECTIONS.map((s) => (
                <TabsContent key={s.id} value={s.id} className="mt-3">
                  <ul className="space-y-2">
                    {rule[s.key].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
